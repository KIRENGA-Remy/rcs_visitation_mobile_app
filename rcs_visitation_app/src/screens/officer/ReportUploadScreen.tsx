import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { officerReportsApi, PickedDocument } from '@api/officerReports';
import { extractApiError } from '@utils';
import type { OfficerStackParamList } from '@navigation/types';

type Mode = 'upload' | 'link';

/**
 * Requires expo-document-picker: npx expo install expo-document-picker
 * Supports PDF, Word, Excel, plain text, JPEG, PNG — matching the backend's
 * allowed MIME types (report-upload.middleware.ts).
 *
 * Two ways to submit a report:
 *  - Upload: pick a file, backend relays it straight to Cloudinary.
 *  - Link: officer already has the document hosted somewhere (their own
 *    Cloudinary account, Google Drive, etc.) and pastes the URL directly —
 *    no file ever passes through this app.
 */
export const ReportUploadScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<OfficerStackParamList, 'ReportUpload'>>();
  const qc = useQueryClient();

  const [mode, setMode] = useState<Mode>('upload');
  const [title, setTitle] = useState(route.params?.presetTitle ?? '');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<PickedDocument | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkFileName, setLinkFileName] = useState('');
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePickFile = async () => {
    setPicking(true);
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain', 'image/jpeg', 'image/png',
        ],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream' });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Document picker unavailable',
        text2: 'Run "npx expo install expo-document-picker" and rebuild.',
      });
    } finally {
      setPicking(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Title is required' });
      return;
    }
    if (mode === 'upload' && !file) {
      Toast.show({ type: 'error', text1: 'Select a file to upload' });
      return;
    }
    if (mode === 'link' && (!linkUrl.trim() || !linkFileName.trim())) {
      Toast.show({ type: 'error', text1: 'Paste the link and give the file a name' });
      return;
    }

    setSaving(true);
    try {
      if (mode === 'upload') {
        await officerReportsApi.create(
          { title: title.trim(), description: description || undefined, reportRequestId: route.params?.reportRequestId },
          file!
        );
      } else {
        await officerReportsApi.createFromUrl({
          title: title.trim(),
          description: description || undefined,
          reportRequestId: route.params?.reportRequestId,
          fileUrl: linkUrl.trim(),
          fileName: linkFileName.trim(),
        });
      }
      qc.invalidateQueries({ queryKey: ['officer-reports', 'my'] });
      qc.invalidateQueries({ queryKey: ['report-requests', 'my'] });
      Toast.show({ type: 'success', text1: 'Report submitted' });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Submission failed', text2: extractApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="Upload Report" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* Mode toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border }}>
          {(['upload', 'link'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center',
                backgroundColor: mode === m ? COLORS.primary : 'transparent',
              }}
            >
              <Text style={{ fontWeight: '700', fontSize: 13, color: mode === m ? COLORS.white : COLORS.textMuted }}>
                {m === 'upload' ? 'Upload File' : 'Paste Link'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'upload' ? (
          <TouchableOpacity
            onPress={handlePickFile}
            disabled={picking}
            style={{
              borderWidth: 2, borderStyle: 'dashed', borderColor: file ? COLORS.primary : COLORS.border,
              borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 20,
              backgroundColor: file ? `${COLORS.primary}08` : COLORS.white,
            }}
          >
            <Ionicons name={file ? 'document-attach' : 'cloud-upload-outline'} size={32} color={file ? COLORS.primary : COLORS.textMuted} />
            <Text style={{ marginTop: 8, fontSize: 13, fontWeight: '600', color: file ? COLORS.primary : COLORS.textMuted, textAlign: 'center' }}>
              {picking ? 'Opening picker…' : file ? file.name : 'Tap to select a document'}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 11, color: COLORS.textLight }}>
              PDF, Word, Excel, text, or image — max 15MB
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
              <Text style={{ flex: 1, fontSize: 12, color: '#1E40AF' }}>
                Already have this uploaded somewhere (Cloudinary, Google Drive, etc.)? Paste the link instead of uploading again.
              </Text>
            </View>
            <Input label="Document Link *" value={linkUrl} onChangeText={setLinkUrl} leftIcon="link-outline" placeholder="https://..." autoCapitalize="none" keyboardType="url" />
            <Input label="File Name *" value={linkFileName} onChangeText={setLinkFileName} leftIcon="document-outline" placeholder="e.g. visit-report-march.pdf" />
          </View>
        )}

        <Input label="Title *" value={title} onChangeText={setTitle} leftIcon="document-text-outline" placeholder='e.g. "Report of visit done on 12/03/2026"' />
        <Input label="Description (optional)" value={description} onChangeText={setDescription} leftIcon="create-outline" multiline style={{ height: 90 }} />

        <Button title="Submit Report" onPress={handleSubmit} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
};
