import multer from 'multer';

/**
 * In-memory storage — the file buffer is uploaded directly to Cloudinary
 * (cloudinary.service.ts) and never written to local disk at all, unlike
 * the original design. Keeps the same allowed-type/size restrictions.
 */
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

export const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, Word, Excel, plain text, JPEG, PNG.`));
      return;
    }
    cb(null, true);
  },
});
