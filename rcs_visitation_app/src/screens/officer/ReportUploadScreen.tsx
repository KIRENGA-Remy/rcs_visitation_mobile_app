import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { FileTypeBadge } from '@components/common/FileTypeBadge';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { officerReportsApi, PickedDocument } from '@api/officerReports';
import { usersApi } from '@api/users';
import { extractApiError } from '@utils';
import type { OfficerStackParamList } from '@navigation/types';

type Mode = 'upload' | 'link';

const EXT_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
};

/**
 * Requires expo-document-picker: npx expo install expo-document-picker
 *
 * Two ways to submit a report:
 *  - Upload: pick a file, backend relays it straight to Cloudinary.
 *  - Link: officer already has the document hosted somewhere (their own
 *    Cloudinary account, Google Drive, etc.) and pastes the URL directly.
 *
 * Who receives it, in priority order:
 *  1. Fulfilling a specific request (route.params.reportRequestId set) —
 *     goes straight to whoever asked for it, no picker needed.
 *  2. Self-initiated — officer picks one admin, or leaves it as "All Admins".
 */
export const ReportUploadScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<OfficerStackParamList, 'ReportUpload'>>();
  const qc = useQueryClient();
  const isFulfillingRequest = !!route.params?.reportRequestId;

  const [mode, setMode] = useState<Mode>('upload');
  const [title, setTitle] = useState(route.params?.presetTitle ?? '');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<PickedDocument | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkFileName, setLinkFileName] = useState('');
  const [sentToAdminId, setSentToAdminId] = useState<string | null>(null); // null = all admins
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: adminsData } = useQuery({
    queryKey: ['users', 'admins-list'],
    queryFn: () => usersApi.list({ role: 'ADMIN', limit: 100 }),
    enabled: !isFulfillingRequest,
  });

  const linkMimeGuess = linkFileName.includes('.')
    ? (EXT_TO_MIME[linkFileName.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream')
    : 'application/octet-stream';

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
          {
            title: title.trim(), description: description || undefined,
            reportRequestId: route.params?.reportRequestId,
            sentToAdminId: sentToAdminId ?? undefined,
          },
          file!
        );
      } else {
        await officerReportsApi.createFromUrl({
          title: title.trim(),
          description: description || undefined,
          reportRequestId: route.params?.reportRequestId,
          sentToAdminId: sentToAdminId ?? undefined,
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
      <ScreenHeader title="Submit Report" onBack={() => navigation.goBack()} />

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
          file ? (
            // Selected-file card — a real file chip (badge + name + size),
            // not the same dropzone with different text swapped in.
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 20,
              borderWidth: 1, borderColor: COLORS.border,
            }}>
              <FileTypeBadge mimeType={file.mimeType} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 14 }} numberOfLines={1}>{file.name}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Ready to submit</Text>
              </View>
              <TouchableOpacity onPress={() => setFile(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={22} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickFile}
              disabled={picking}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.border,
                borderRadius: 14, padding: 18, marginBottom: 20, backgroundColor: COLORS.white,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 10, backgroundColor: `${COLORS.primary}12`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="cloud-upload-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>
                  {picking ? 'Opening picker…' : 'Select a document'}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                  PDF, Word, Excel, text, or image · max 15MB
                </Text>
              </View>
            </TouchableOpacity>
          )
        ) : (
          <View style={{ marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
              <Text style={{ flex: 1, fontSize: 12, color: '#1E40AF' }}>
                Already have this uploaded somewhere (Cloudinary, Google Drive, etc.)? Paste the link instead of uploading again.
              </Text>
            </View>
            <Input label="Document Link *" value={linkUrl} onChangeText={setLinkUrl} leftIcon="link-outline" placeholder="https://..." autoCapitalize="none" keyboardType="url" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <FileTypeBadge mimeType={linkMimeGuess} size="sm" />
              <View style={{ flex: 1 }}>
                <Input label="File Name *" value={linkFileName} onChangeText={setLinkFileName} leftIcon="document-outline" placeholder="e.g. visit-report-march.pdf" />
              </View>
            </View>
          </View>
        )}

        <Input label="Title *" value={title} onChangeText={setTitle} leftIcon="document-text-outline" placeholder='e.g. "Report of visit done on 12/03/2026"' />
        <Input label="Description (optional)" value={description} onChangeText={setDescription} leftIcon="create-outline" multiline style={{ height: 90 }} />

        {!isFulfillingRequest && (
          <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Send To</Text>
            <View style={{ gap: 8, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setSentToAdminId(null)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10,
                  backgroundColor: sentToAdminId === null ? `${COLORS.primary}12` : COLORS.white,
                  borderWidth: 1.5, borderColor: sentToAdminId === null ? COLORS.primary : COLORS.border,
                }}
              >
                <Ionicons name="people" size={18} color={sentToAdminId === null ? COLORS.primary : COLORS.textMuted} />
                <Text style={{ fontWeight: '600', color: sentToAdminId === null ? COLORS.primary : COLORS.text }}>All Admins</Text>
              </TouchableOpacity>
              {adminsData?.data?.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => setSentToAdminId(a.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10,
                    backgroundColor: sentToAdminId === a.id ? `${COLORS.primary}12` : COLORS.white,
                    borderWidth: 1.5, borderColor: sentToAdminId === a.id ? COLORS.primary : COLORS.border,
                  }}
                >
                  <Ionicons name="person" size={18} color={sentToAdminId === a.id ? COLORS.primary : COLORS.textMuted} />
                  <Text style={{ fontWeight: '600', color: sentToAdminId === a.id ? COLORS.primary : COLORS.text }}>
                    {a.firstName} {a.lastName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Button title="Submit Report" onPress={handleSubmit} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
};
