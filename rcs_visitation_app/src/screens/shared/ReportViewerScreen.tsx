import React, { useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { COLORS } from '@constants';
import { downloadReportFile } from '@utils/downloadReport';
import type { OfficerStackParamList } from '@navigation/types';

/**
 * Requires react-native-webview: npx expo install react-native-webview
 *
 * Renders the report inline rather than just kicking the user out to an
 * external browser. Images render directly; everything else (PDF, Word,
 * Excel) is wrapped through Google's docs viewer (docs.google.com/gview) —
 * a free, no-signup way to get consistent cross-platform preview rendering
 * for document formats that neither Android's nor iOS's WebView engine
 * reliably renders natively on their own.
 *
 * Download is a deliberately separate action (top-right) that opens the
 * RAW file URL directly via Linking — the OS's own browser/share sheet
 * handles the actual save-to-device mechanics, which is far more reliable
 * across Expo SDK versions than fighting expo-file-system's API surface.
 */
export const ReportViewerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<OfficerStackParamList, 'ReportViewer'>>();
  const { fileUrl, fileName, fileMimeType } = route.params;

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const isImage = fileMimeType?.startsWith('image/');
  const viewerUrl = isImage ? fileUrl : `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;

  const handleDownload = async () => {
    try {
      await downloadReportFile(fileUrl);
    } catch {
      // Fall back to a plain open if the forced-download URL somehow fails
      Linking.openURL(fileUrl);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1C1E" />

      {/* Custom header — dark, matching a document-viewer convention rather
          than reusing the app's green ScreenHeader, which would look odd
          against document content. */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
        backgroundColor: '#1C1C1E', borderBottomWidth: 1, borderBottomColor: '#2C2C2E',
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text numberOfLines={1} style={{ flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginHorizontal: 12, textAlign: 'center' }}>
          {fileName}
        </Text>
        <TouchableOpacity onPress={handleDownload} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="download-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {failed ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="document-outline" size={48} color="#8E8E93" />
          <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
            Couldn't preview this file
          </Text>
          <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 6, textAlign: 'center' }}>
            You can still download it to view with another app.
          </Text>
          <TouchableOpacity
            onPress={handleDownload}
            style={{
              marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10,
            }}
          >
            <Ionicons name="download-outline" size={18} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontWeight: '700' }}>Download File</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <WebViewLazy url={viewerUrl} onLoadEnd={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true); }} />
          {loading && (
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C1C1E',
            }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{ color: '#8E8E93', fontSize: 13, marginTop: 12 }}>Loading document…</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

/**
 * Lazy-loaded so the rest of the app doesn't hard-fail if
 * react-native-webview hasn't been installed yet — only this screen needs it.
 */
const WebViewLazy: React.FC<{ url: string; onLoadEnd: () => void; onError: () => void }> = ({ url, onLoadEnd, onError }) => {
  const [WebViewComp, setWebViewComp] = useState<any>(null);
  const [importFailed, setImportFailed] = useState(false);

  React.useEffect(() => {
    import('react-native-webview')
      .then((mod) => setWebViewComp(() => mod.WebView))
      .catch(() => setImportFailed(true));
  }, []);

  React.useEffect(() => {
    if (importFailed) onError();
  }, [importFailed]);

  if (!WebViewComp) return null;

  return (
    <WebViewComp
      source={{ uri: url }}
      style={{ flex: 1, backgroundColor: '#1C1C1E' }}
      onLoadEnd={onLoadEnd}
      onError={onError}
      startInLoadingState
    />
  );
};
