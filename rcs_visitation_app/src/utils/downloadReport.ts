import { Linking } from 'react-native';

/**
 * Opens a report file directly — now that files live on Cloudinary (a real
 * public CDN URL) rather than behind our own authenticated download route,
 * there's no need to download-with-headers and no dependency on
 * expo-file-system's fragile, version-specific API at all (that dependency
 * was the actual root cause of the earlier bundling crash). The device's
 * default handler (browser, PDF viewer, etc.) opens the URL directly.
 */
export const openReportFile = async (fileUrl: string): Promise<void> => {
  const canOpen = await Linking.canOpenURL(fileUrl);
  if (!canOpen) {
    throw new Error('No app available to open this file type.');
  }
  await Linking.openURL(fileUrl);
};
