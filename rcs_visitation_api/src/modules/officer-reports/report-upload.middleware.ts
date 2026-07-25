import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

/**
 * Local disk storage for officer report documents — there's no cloud/object
 * storage configured in this project (consistent with the same pragmatic
 * choice made for profile photos), so files live under uploads/officer-reports/
 * on the server itself and are served back through an authenticated
 * download route (officer-report.routes.ts), never as static public files.
 */
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'officer-reports');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'image/jpeg',
  'image/png',
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB — generous for a scanned/photographed report

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const reportUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, Word, Excel, plain text, JPEG, PNG.`));
      return;
    }
    cb(null, true);
  },
});

export { UPLOAD_DIR };
