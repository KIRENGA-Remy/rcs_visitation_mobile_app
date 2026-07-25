import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';

/**
 * Cloudinary free tier (no credit card required) replaces local disk
 * storage for both officer report documents and profile photos — a real
 * CDN URL instead of files sitting on the server's own disk (reports) or
 * base64 blobs bloating the database (photos).
 *
 * Sign up at cloudinary.com, then from the dashboard set in .env:
 *   CLOUDINARY_CLOUD_NAME=...
 *   CLOUDINARY_API_KEY=...
 *   CLOUDINARY_API_SECRET=...
 */

let configured = false;

const ensureConfigured = () => {
  if (configured) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error(
      'Cloudinary is not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, ' +
      'and CLOUDINARY_API_SECRET in .env (see cloudinary.com dashboard).'
    );
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  configured = true;
};

export interface CloudinaryUploadResult {
  url: string;         // secure_url — what gets stored and served back to the client
  publicId: string;    // needed to delete this asset later
}

export const cloudinaryService = {
  /**
   * Uploads an in-memory file buffer (from multer's memoryStorage — nothing
   * ever touches local disk). `resourceType` must be explicit: 'image' for
   * photos, 'raw' for everything else (PDF, Word, Excel, plain text).
   * Cloudinary's 'auto' detection is unreliable for non-image documents —
   * it can misclassify a PDF or .docx and silently store it in a way that
   * later breaks delivery/viewing, so this service never uses 'auto'.
   * `folder` keeps uploads organised in the Cloudinary media library.
   */
  async uploadBuffer(buffer: Buffer, folder: string, resourceType: 'image' | 'raw'): Promise<CloudinaryUploadResult> {
    ensureConfigured();
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: resourceType },
        (err, result) => {
          if (err || !result) { reject(err ?? new Error('Cloudinary upload failed')); return; }
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      );
      stream.end(buffer);
    });
  },

  /** Best-effort delete — used when replacing/removing an asset we uploaded ourselves. */
  async deleteAsset(publicId: string, resourceType: 'image' | 'raw'): Promise<void> {
    ensureConfigured();
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch {
      // Non-fatal — an orphaned Cloudinary asset is a minor cleanup issue,
      // not worth failing the caller's actual operation over.
    }
  },
};
