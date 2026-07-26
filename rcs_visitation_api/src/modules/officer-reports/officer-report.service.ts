import { prisma } from '../../config/prisma';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';
import { notificationService } from '../notifications/notification.service';
import { cloudinaryService } from '../../shared/services/cloudinary.service';
import {
  CreateReportRequestDto, UpdateOfficerReportDto, CreateOfficerReportMetaDto, CreateOfficerReportFromUrlDto,
} from './officer-report.schema';

/**
 * Used only for the paste-a-URL path, where we never receive real bytes to
 * inspect — a reasonable guess from the file extension for display
 * purposes (e.g. which icon to show), not a guarantee.
 */
const guessMimeTypeFromFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png',
  };
  return map[ext ?? ''] ?? 'application/octet-stream';
};

class OfficerReportService {
  // ── Admin: request a report from one officer, or broadcast to all ───────
  async createRequest(dto: CreateReportRequestDto, requestedByUserId: string) {
    const request = await prisma.reportRequest.create({
      data: {
        requestedByUserId,
        targetOfficerId: dto.targetOfficerId ?? null,
        title: dto.title,
        message: dto.message,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    const targets = dto.targetOfficerId
      ? [dto.targetOfficerId]
      : (await prisma.user.findMany({ where: { role: 'PRISON_OFFICER' }, select: { id: true } })).map(o => o.id);

    const deadlineText = dto.dueDate
      ? ` Due by ${new Date(dto.dueDate).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
        })}.`
      : '';

    await Promise.allSettled(
      targets.map((officerId) =>
        notificationService.send({
          userId: officerId,
          type: 'REPORT_REQUESTED',
          title: 'Report Requested',
          body: (dto.message ? `"${dto.title}" — ${dto.message}` : `"${dto.title}" has been requested from you.`) + deadlineText,
        })
      )
    );

    return request;
  }

  async getRequests(query: { status?: string; page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.status) where.status = query.status;

    const [requests, total] = await Promise.all([
      prisma.reportRequest.findMany({
        where, skip, take: limit,
        include: {
          requestedBy: { select: { firstName: true, lastName: true } },
          targetOfficer: { select: { firstName: true, lastName: true } },
          reports: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reportRequest.count({ where }),
    ]);
    return { requests, pagination: buildPagination(page, limit, total) };
  }

  /** Officer: requests addressed to them specifically, or broadcast to all officers. */
  async getMyRequests(officerId: string, query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const where = { OR: [{ targetOfficerId: officerId }, { targetOfficerId: null }] };

    const [requests, total] = await Promise.all([
      prisma.reportRequest.findMany({
        where, skip, take: limit,
        include: { requestedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.reportRequest.count({ where }),
    ]);
    return { requests, pagination: buildPagination(page, limit, total) };
  }

  // ── Officer: create/upload a report ──────────────────────────────────────
  async createReport(officerId: string, meta: CreateOfficerReportMetaDto, file: Express.Multer.File) {
    const isImage = file.mimetype.startsWith('image/');
    const upload = await cloudinaryService.uploadBuffer(file.buffer, 'officer-reports', isImage ? 'image' : 'raw');
    const sentToAdminId = meta.sentToAdminId || undefined; // normalise "" from multipart to undefined

    const report = await prisma.officerReport.create({
      data: {
        officerId,
        title: meta.title,
        description: meta.description,
        visitLogId: meta.visitLogId,
        reportRequestId: meta.reportRequestId,
        sentToAdminId: meta.reportRequestId ? undefined : sentToAdminId,
        fileName: file.originalname,
        fileUrl: upload.url,
        cloudinaryPublicId: upload.publicId,
        fileMimeType: file.mimetype,
        fileSizeBytes: file.size,
      },
    });

    await this.notifyReportSubmitted(report.id, meta.reportRequestId, sentToAdminId);
    return report;
  }

  /**
   * Alternative to uploading through the app — the officer already has the
   * document hosted somewhere (their own Cloudinary account, Drive, etc.)
   * and just pastes the link. We don't own that asset, so
   * cloudinaryPublicId stays null (nothing for us to delete later) and
   * fileMimeType/fileSizeBytes are best-effort guesses since we never
   * receive the actual bytes.
   */
  async createReportFromUrl(officerId: string, dto: CreateOfficerReportFromUrlDto) {
    const sentToAdminId = dto.sentToAdminId ?? undefined;

    const report = await prisma.officerReport.create({
      data: {
        officerId,
        title: dto.title,
        description: dto.description,
        visitLogId: dto.visitLogId,
        reportRequestId: dto.reportRequestId,
        sentToAdminId: dto.reportRequestId ? undefined : sentToAdminId,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        cloudinaryPublicId: null,
        fileMimeType: guessMimeTypeFromFileName(dto.fileName),
        fileSizeBytes: 0, // unknown — we never received the bytes
      },
    });

    await this.notifyReportSubmitted(report.id, dto.reportRequestId, sentToAdminId);
    return report;
  }

  /**
   * Three cases, in priority order:
   *  1. Fulfilling a specific ReportRequest — notify whoever made that
   *     request, and mark it FULFILLED.
   *  2. Self-initiated, but the officer picked one specific admin — notify
   *     only that admin.
   *  3. Self-initiated, no admin picked — broadcast to every admin, since
   *     there's no formal "officer reports to admin X" hierarchy modelled
   *     in this schema (unlike officer→prison assignment).
   */
  private async notifyReportSubmitted(reportId: string, reportRequestId?: string, sentToAdminId?: string) {
    const report = await prisma.officerReport.findUnique({
      where: { id: reportId },
      include: { officer: { select: { firstName: true, lastName: true } } },
    });
    if (!report) return;
    const officerName = `${report.officer.firstName} ${report.officer.lastName}`;

    if (reportRequestId) {
      const request = await prisma.reportRequest.update({
        where: { id: reportRequestId },
        data: { status: 'FULFILLED' },
      });
      try {
        await notificationService.send({
          userId: request.requestedByUserId,
          type: 'REPORT_SUBMITTED',
          title: 'Report Submitted',
          body: `${officerName} submitted a report for "${request.title}".`,
        });
      } catch { /* non-fatal — the submission itself already succeeded */ }
      return;
    }

    const recipientIds = sentToAdminId
      ? [sentToAdminId]
      : (await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })).map(a => a.id);

    await Promise.allSettled(
      recipientIds.map((adminId) =>
        notificationService.send({
          userId: adminId,
          type: 'REPORT_SUBMITTED',
          title: 'New Report Submitted',
          body: `${officerName} sent a report: "${report.title}".`,
        })
      )
    );
  }

  async getById(id: string) {
    return prisma.officerReport.findUniqueOrThrow({
      where: { id },
      include: {
        officer: { select: { firstName: true, lastName: true, email: true } },
        reportRequest: { select: { title: true, requestedByUserId: true } },
        sentToAdmin: { select: { firstName: true, lastName: true } },
      },
    });
  }

  /** Officer: their own reports only. */
  async getMyReports(officerId: string, query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const [reports, total] = await Promise.all([
      prisma.officerReport.findMany({
        where: { officerId }, skip, take: limit,
        include: {
          reportRequest: { select: { title: true } },
          sentToAdmin: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.officerReport.count({ where: { officerId } }),
    ]);
    return { reports, pagination: buildPagination(page, limit, total) };
  }

  /** Admin: every submitted report, optionally filtered to one officer. */
  /**
   * Admin: every report actually visible to THEM — not a blanket "every
   * report ever submitted". Previously this had no scoping at all, meaning
   * any admin could see a report an officer had deliberately sent to a
   * different, specific admin. Visibility rules:
   *   - Broadcast (no specific request, sentToAdminId null) — everyone sees it.
   *   - Sent to a specific admin (sentToAdminId set) — only that admin sees it.
   *   - Fulfilling a specific ReportRequest — only the admin who made that
   *     request sees it (sentToAdminId is always null in this case; the
   *     "who it's for" comes from the request itself).
   */
  async getAllReports(query: { officerId?: string; page?: unknown; limit?: unknown }, requestingAdminId: string) {
    const { page, limit, skip } = parsePagination(query);
    const visibilityFilter = {
      OR: [
        { reportRequestId: null, sentToAdminId: null },
        { reportRequestId: null, sentToAdminId: requestingAdminId },
        { reportRequestId: { not: null }, reportRequest: { requestedByUserId: requestingAdminId } },
      ],
    };
    const where: any = query.officerId
      ? { AND: [{ officerId: query.officerId }, visibilityFilter] }
      : visibilityFilter;

    const [reports, total] = await Promise.all([
      prisma.officerReport.findMany({
        where, skip, take: limit,
        include: {
          officer: { select: { firstName: true, lastName: true } },
          reportRequest: { select: { title: true } },
          sentToAdmin: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.officerReport.count({ where }),
    ]);
    return { reports, pagination: buildPagination(page, limit, total) };
  }

  async update(id: string, officerId: string, dto: UpdateOfficerReportDto) {
    const report = await prisma.officerReport.findUniqueOrThrow({ where: { id } });
    if (report.officerId !== officerId) throw new Error('You can only edit your own reports');
    return prisma.officerReport.update({ where: { id }, data: dto });
  }

  async delete(id: string, officerId: string) {
    const report = await prisma.officerReport.findUniqueOrThrow({ where: { id } });
    if (report.officerId !== officerId) throw new Error('You can only delete your own reports');

    // Only clean up on Cloudinary if we actually uploaded this asset
    // ourselves (cloudinaryPublicId is null for a pasted external link,
    // since we don't own that asset and have no business deleting it).
    if (report.cloudinaryPublicId) {
      const resourceType = report.fileMimeType.startsWith('image/') ? 'image' : 'raw';
      await cloudinaryService.deleteAsset(report.cloudinaryPublicId, resourceType);
    }

    return prisma.officerReport.delete({ where: { id } });
  }
}

export const officerReportService = new OfficerReportService();
