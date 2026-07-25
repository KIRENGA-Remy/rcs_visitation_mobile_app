-- RenameColumn
-- Safe whether or not the previous "add_officer_reports" migration has
-- already run against this database — either way, this migration ends the
-- table in the same final state (filePath renamed to fileUrl, holding a
-- Cloudinary URL going forward instead of a local disk path).
ALTER TABLE "officer_reports" RENAME COLUMN "filePath" TO "fileUrl";

-- AlterTable
ALTER TABLE "officer_reports" ADD COLUMN "cloudinaryPublicId" TEXT;
