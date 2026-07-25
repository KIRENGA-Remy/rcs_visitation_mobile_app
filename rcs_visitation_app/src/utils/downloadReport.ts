import { Linking } from 'react-native';

/**
 * Cloudinary lets you force a real download (Content-Disposition:
 * attachment) instead of an inline browser view by inserting the
 * `fl_attachment` flag right after `/upload/` in the delivery URL — no
 * separate backend endpoint needed. Only rewrites actual Cloudinary URLs;
 * a pasted external link (Google Drive, etc.) is returned unchanged since
 * we can't assume its structure supports the same trick.
 */
const toForcedDownloadUrl = (fileUrl: string): string => {
  if (!fileUrl.includes('res.cloudinary.com') || !fileUrl.includes('/upload/')) {
    return fileUrl;
  }
  return fileUrl.replace('/upload/', '/upload/fl_attachment/');
};

/**
 * Opens a report's raw URL directly (used by simple "open" actions outside
 * the full in-app viewer — see ReportViewerScreen for the richer preview
 * experience with Google Docs rendering for PDF/Word/Excel).
 */
export const openReportFile = async (fileUrl: string): Promise<void> => {
  const canOpen = await Linking.canOpenURL(fileUrl);
  if (!canOpen) throw new Error('No app available to open this file type.');
  await Linking.openURL(fileUrl);
};

/**
 * Forces an actual save-to-device instead of an inline preview — a plain
 * openURL on a PDF often just opens it inline in the browser rather than
 * downloading it, which doesn't satisfy "download" as its own capability.
 */
export const downloadReportFile = async (fileUrl: string): Promise<void> => {
  const url = toForcedDownloadUrl(fileUrl);
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) throw new Error('No app available to download this file.');
  await Linking.openURL(url);
};
