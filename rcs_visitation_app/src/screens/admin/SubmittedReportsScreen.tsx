import React, { useState } from 'react';
import { View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { FileTypeBadge } from '@components/common/FileTypeBadge';
import { COLORS } from '@constants';
import { officerReportsApi } from '@api/officerReports';
import { downloadReportFile } from '@utils/downloadReport';
import { formatDate } from '@utils';

export const SubmittedReportsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['officer-reports', 'all'],
    queryFn: () => officerReportsApi.listAll({ limit: 50 }),
  });

  const handleDownload = async (fileUrl: string) => {
    setDownloadingId(fileUrl);
    try {
      await downloadReportFile(fileUrl);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Could not download file', text2: err.message });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="Submitted Reports" subtitle={`${data?.data?.length ?? 0} reports`} onBack={() => navigation.goBack()} />

      {isLoading ? <LoadingScreen /> : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="No reports submitted yet" />}
          renderItem={({ item }) => {
            const sentToLabel = item.reportRequest
              ? `Fulfills: ${item.reportRequest.title}`
              : item.sentToAdmin
                ? `Sent to ${item.sentToAdmin.firstName} ${item.sentToAdmin.lastName}`
                : 'Sent to all admins';

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ReportViewer', { fileUrl: item.fileUrl, fileName: item.fileName, fileMimeType: item.fileMimeType })}
                style={{
                  backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
                  marginBottom: 10, flexDirection: 'row', gap: 12,
                  borderWidth: 1, borderColor: COLORS.border,
                }}
              >
                <FileTypeBadge mimeType={item.fileMimeType} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 15 }} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                    {item.officer?.firstName} {item.officer?.lastName} · {formatDate(item.createdAt)}
                  </Text>
                  <Text style={{ color: COLORS.info, fontSize: 11, marginTop: 4, fontWeight: '600' }} numberOfLines={1}>
                    {sentToLabel}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 18, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="eye-outline" size={15} color={COLORS.primary} />
                      <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>View</Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation(); handleDownload(item.fileUrl); }}
                      disabled={downloadingId === item.fileUrl}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <Ionicons name="download-outline" size={15} color={COLORS.textMuted} />
                      <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '600' }}>
                        {downloadingId === item.fileUrl ? 'Downloading…' : 'Download'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('RequestReport')}
        activeOpacity={0.85}
        style={{
          position: 'absolute', bottom: 24, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
        }}
      >
        <Ionicons name="mail-outline" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};
