import fs from 'fs';
import { prisma } from '../../config/prisma';
import { parsePagination } from '../../shared/utils/pagination';
import { buildPagination } from '../../shared/utils/apiResponse';
import { notificationService } from '../notifications/notification.service';
import {
  CreateReportRequestDto, UpdateOfficerReportDto, CreateOfficerReportMetaDto,
} from './officer-report.schema';

class OfficerReportService {
  // ── Admin: request a report from one officer, or broadcast to all ───────
  async createRequest(dto: CreateReportRequestDto, requestedByUserId: string) {
    const request = await prisma.reportRequest.create({
      data: {
        requestedByUserId,
        targetOfficerId: dto.targetOfficerId ?? null,
        title: dto.title,
        message: dto.message,
      },
    });

    const targets = dto.targetOfficerId
      ? [dto.targetOfficerId]
      : (await prisma.user.findMany({ where: { role: 'PRISON_OFFICER' }, select: { id: true } })).map(o => o.id);

    await Promise.allSettled(
      targets.map((officerId) =>
        notificationService.send({
          userId: officerId,
          type: 'REPORT_REQUESTED',
          title: 'Report Requested',
          body: dto.message ? `"${dto.title}" — ${dto.message}` : `"${dto.title}" has been requested from you.`,
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
    const report = await prisma.officerReport.create({
      data: {
        officerId,
        title: meta.title,
        description: meta.description,
        visitLogId: meta.visitLogId,
        reportRequestId: meta.reportRequestId,
        fileName: file.originalname,
        filePath: file.path,
        fileMimeType: file.mimetype,
        fileSizeBytes: file.size,
      },
    });

    if (meta.reportRequestId) {
      const request = await prisma.reportRequest.update({
        where: { id: meta.reportRequestId },
        data: { status: 'FULFILLED' },
      });
      try {
        await notificationService.send({
          userId: request.requestedByUserId,
          type: 'REPORT_SUBMITTED',
          title: 'Report Submitted',
          body: `A report has been submitted for "${request.title}".`,
        });
      } catch { /* non-fatal — the submission itself already succeeded */ }
    }

    return report;
  }

  async getById(id: string) {
    return prisma.officerReport.findUniqueOrThrow({
      where: { id },
      include: {
        officer: { select: { firstName: true, lastName: true, email: true } },
        reportRequest: { select: { title: true } },
      },
    });
  }

  /** Officer: their own reports only. */
  async getMyReports(officerId: string, query: { page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const [reports, total] = await Promise.all([
      prisma.officerReport.findMany({
        where: { officerId }, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.officerReport.count({ where: { officerId } }),
    ]);
    return { reports, pagination: buildPagination(page, limit, total) };
  }

  /** Admin: every submitted report, optionally filtered to one officer. */
  async getAllReports(query: { officerId?: string; page?: unknown; limit?: unknown }) {
    const { page, limit, skip } = parsePagination(query);
    const where: any = {};
    if (query.officerId) where.officerId = query.officerId;

    const [reports, total] = await Promise.all([
      prisma.officerReport.findMany({
        where, skip, take: limit,
        include: { officer: { select: { firstName: true, lastName: true } } },
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

    // Best-effort file cleanup — a failed unlink shouldn't block the DB delete
    try { fs.unlinkSync(report.filePath); } catch { /* file may already be gone */ }

    return prisma.officerReport.delete({ where: { id } });
  }
}

export const officerReportService = new OfficerReportService();
