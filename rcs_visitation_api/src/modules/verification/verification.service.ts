import { prisma } from '../../config/prisma';
import { ScanQrDto } from './verification.schema';

export class VerificationService {

  // Officer scans QR code at prison gate
  async scanQrCode(dto: ScanQrDto) {
    const request = await prisma.visitRequest.findFirst({
      where: { qrCode: dto.qrCode },
      include: {
        visitorProfile: {
          include: {
            user: {
              select: {
                firstName: true, lastName: true, nationalId: true,
                phone: true, profilePhoto: true, status: true,
              },
            },
          },
        },
        prisoner: {
          select: {
            firstName: true, lastName: true, prisonerNumber: true,
            cellBlock: true, prison: { select: { name: true, code: true } },
          },
        },
        schedule: { select: { startTime: true, endTime: true, label: true } },
        visitLog:  { select: { id: true, actualCheckinTime: true } },
      },
    });

    if (!request) {
      return { valid: false, reason: 'QR code not found or invalid', request: null };
    }

    // Check QR expiry
    if (request.qrCodeExpiresAt && request.qrCodeExpiresAt < new Date()) {
      return { valid: false, reason: 'QR code has expired', request: null };
    }

    // Check request status
    if (request.status === 'CANCELLED') {
      return { valid: false, reason: 'This visit request has been cancelled', request };
    }
    if (request.status === 'REJECTED') {
      return { valid: false, reason: `Visit was rejected: ${request.rejectionReason}`, request };
    }
    if (request.status === 'COMPLETED') {
      return { valid: false, reason: 'This visit has already been completed', request };
    }
    if (request.status === 'NO_SHOW' || request.status === 'EXPIRED') {
      return { valid: false, reason: 'This visit slot has expired', request };
    }
    if (request.status === 'CHECKED_IN') {
      return { valid: false, reason: 'Visitor is already checked in', request };
    }
    if (request.status !== 'APPROVED') {
      return { valid: false, reason: 'Visit request is not approved', request };
    }

    // Check visitor is not banned
    if (request.visitorProfile.isBanned) {
      return { valid: false, reason: `Visitor is banned: ${request.visitorProfile.bannedReason}`, request };
    }

    // Check schedule time window (allow 15 min early, up to end time)
    const now = new Date();
    const windowStart = new Date(request.schedule.startTime);
    windowStart.setMinutes(windowStart.getMinutes() - 15); // 15 min early grace
    if (now < windowStart) {
      return { valid: false, reason: `Visit slot opens at ${request.schedule.startTime.toISOString()}`, request };
    }
    if (now > request.schedule.endTime) {
      return { valid: false, reason: 'Visit slot time has passed', request };
    }

    return {
      valid: true,
      reason: 'Visitor is authorised to enter',
      request,
      visitRequestId: request.id,
    };
  }

  // Get verification status for a specific visit request
  async getVisitStatus(visitRequestId: string) {
    const request = await prisma.visitRequest.findUniqueOrThrow({
      where: { id: visitRequestId },
      select: {
        id: true, referenceNumber: true, status: true,
        qrCode: true, qrCodeExpiresAt: true,
        checkedInAt: true, checkedOutAt: true, actualDurationMins: true,
        visitorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
        prisoner: { select: { firstName: true, lastName: true, prisonerNumber: true } },
        schedule:  { select: { startTime: true, endTime: true, label: true } },
        visitLog:  { select: { id: true, incidentType: true, incidentFlagged: true, durationMinutes: true } },
      },
    });

    return {
      ...request,
      // Never expose QR code string in status check
      qrCode: request.qrCode ? '***HIDDEN***' : null,
      isExpired: request.qrCodeExpiresAt ? request.qrCodeExpiresAt < new Date() : false,
    };
  }
}

export const verificationService = new VerificationService();
