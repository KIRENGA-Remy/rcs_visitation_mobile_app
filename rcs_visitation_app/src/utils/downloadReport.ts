import { API_BASE_URL, STORAGE_KEYS } from '@constants';
import { getSecure } from '@utils/secureStorage';

/**
 * Downloads an officer report through the authenticated /officer-reports/:id/download
 * endpoint and opens it in whatever native viewer the device has installed
 * (PDF viewer, Word, Photos, etc.) via the OS share/open sheet.
 *
 * Can't just Linking.openURL() the download URL directly — that endpoint
 * requires a Bearer token, which a plain browser/webview navigation can't
 * attach. Requires expo-file-system + expo-sharing:
 *   npx expo install expo-file-system expo-sharing
 */
export const downloadAndOpenReport = async (reportId: string, fileName: string): Promise<void> => {
  // expo-file-system's main export was rewritten (SDK 54+) to a class-based
  // File/Directory/Paths API. The classic cacheDirectory + downloadAsync
  // functions this code needs still exist, but only under the /legacy
  // subpath now — importing the top-level module doesn't have them anymore.
  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');

  const token = await getSecure(STORAGE_KEYS.ACCESS_TOKEN);
  if (!token) throw new Error('You must be signed in to download this file.');

  const localUri = `${FileSystem.cacheDirectory}${fileName}`;
  const downloadUrl = `${API_BASE_URL}/officer-reports/${reportId}/download`;

  const { uri, status } = await FileSystem.downloadAsync(downloadUrl, localUri, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (status !== 200) {
    throw new Error(`Download failed (status ${status})`);
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri);
  } else {
    throw new Error('Opening files is not supported on this device.');
  }
};
