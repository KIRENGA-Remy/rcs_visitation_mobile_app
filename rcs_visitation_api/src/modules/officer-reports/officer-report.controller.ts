import { Response, NextFunction } from 'express';
import { officerReportService } from './officer-report.service';
import { sendSuccess, sendError } from '../../shared/utils/apiResponse';
import { AuthRequest } from '../../shared/types';

class OfficerReportController {
  // ── Admin: report requests ────────────────────────────────────────────
  async createRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await officerReportService.createRequest(req.body, req.user!.id);
      sendSuccess(res, result, 'Report requested', 201);
    } catch (err) { next(err); }
  }

  async getRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requests, pagination } = await officerReportService.getRequests(req.query as any);
      sendSuccess(res, requests, 'Report requests retrieved', 200, pagination);
    } catch (err) { next(err); }
  }

  async getMyRequests(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { requests, pagination } = await officerReportService.getMyRequests(req.user!.id, req.query as any);
      sendSuccess(res, requests, 'Your report requests', 200, pagination);
    } catch (err) { next(err); }
  }

  // ── Officer: create/manage own reports ────────────────────────────────
  async createReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) { sendError(res, 'A file is required', 422); return; }
      const report = await officerReportService.createReport(req.user!.id, req.body, req.file);
      sendSuccess(res, report, 'Report submitted', 201);
    } catch (err) { next(err); }
  }

  async createReportFromUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await officerReportService.createReportFromUrl(req.user!.id, req.body);
      sendSuccess(res, report, 'Report submitted', 201);
    } catch (err) { next(err); }
  }

  async getMyReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reports, pagination } = await officerReportService.getMyReports(req.user!.id, req.query as any);
      sendSuccess(res, reports, 'Your reports', 200, pagination);
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await officerReportService.update(req.params.id, req.user!.id, req.body);
      sendSuccess(res, report, 'Report updated');
    } catch (err: any) {
      if (err.message?.includes('only edit your own')) { sendError(res, err.message, 403); return; }
      next(err);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await officerReportService.delete(req.params.id, req.user!.id);
      sendSuccess(res, { success: true }, 'Report deleted');
    } catch (err: any) {
      if (err.message?.includes('only delete your own')) { sendError(res, err.message, 403); return; }
      next(err);
    }
  }

  // ── Admin: view/download all reports ──────────────────────────────────
  async getAllReports(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reports, pagination } = await officerReportService.getAllReports(req.query as any);
      sendSuccess(res, reports, 'Reports retrieved', 200, pagination);
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await officerReportService.getById(req.params.id);
      // An officer may only view their own report's metadata; an admin can view any.
      if (req.user!.role !== 'ADMIN' && report.officerId !== req.user!.id) {
        sendError(res, 'You do not have access to this report', 403); return;
      }
      sendSuccess(res, report);
    } catch (err) { next(err); }
  }

  /**
   * Streams the underlying file back to the client. Deliberately NOT a
   * static express.static() mount — that would make every uploaded report
   * publicly downloadable by anyone with the URL. This route re-checks
   * authentication and ownership/role on every request instead.
   */
  /**
   * Now that files live on Cloudinary (a real CDN URL) rather than local
   * disk, there's nothing to stream — just redirect to the actual URL after
   * the same access check as before. Kept as a route (rather than removed
   * entirely) so any existing client still calling this exact path keeps
   * working; new clients can just use the `fileUrl` already present on the
   * report object returned by getById/getAllReports/myReports.
   */
  async download(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await officerReportService.getById(req.params.id);
      if (req.user!.role !== 'ADMIN' && report.officerId !== req.user!.id) {
        sendError(res, 'You do not have access to this report', 403); return;
      }
      res.redirect(report.fileUrl);
    } catch (err) { next(err); }
  }
}

export const officerReportController = new OfficerReportController();
