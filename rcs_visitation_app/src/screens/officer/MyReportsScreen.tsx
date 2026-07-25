import React, { useState } from 'react';
import { View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Card } from '@components/common/Card';
import { FileTypeBadge } from '@components/common/FileTypeBadge';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { officerReportsApi } from '@api/officerReports';
import { reportRequestsApi } from '@api/reportRequests';
import { downloadReportFile } from '@utils/downloadReport';
import { extractApiError, formatDate } from '@utils';

type Tab = 'reports' | 'requests';

export const MyReportsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('reports');
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { data: reportsData, isLoading: loadingReports, refetch: refetchReports, isRefetching: refetchingReports } = useQuery({
    queryKey: ['officer-reports', 'my'],
    queryFn: () => officerReportsApi.myReports({ limit: 50 }),
  });

  const { data: requestsData, isLoading: loadingRequests, refetch: refetchRequests, isRefetching: refetchingRequests } = useQuery({
    queryKey: ['report-requests', 'my'],
    queryFn: () => reportRequestsApi.myRequests({ limit: 50 }),
    enabled: tab === 'requests',
  });

  const handleDownload = async (fileUrl: string) => {
    setOpeningId(fileUrl);
    try {
      await downloadReportFile(fileUrl);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Could not download file', text2: err.message });
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Report', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await officerReportsApi.delete(id);
            qc.invalidateQueries({ queryKey: ['officer-reports', 'my'] });
            Toast.show({ type: 'success', text1: 'Report deleted' });
          } catch (err: any) {
            Toast.show({ type: 'error', text1: extractApiError(err) });
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="My Reports" onBack={() => navigation.goBack()} />

      <View style={{ flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 16, paddingTop: 12 }}>
        {(['reports', 'requests'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{ flex: 1, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: tab === t ? COLORS.primary : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontWeight: '700', color: tab === t ? COLORS.primary : COLORS.textMuted }}>
              {t === 'reports' ? 'My Reports' : 'Requests From Admin'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'reports' ? (
        loadingReports ? <LoadingScreen /> : (
          <FlatList
            data={reportsData?.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refetchingReports} onRefresh={refetchReports} tintColor={COLORS.primary} />}
            ListEmptyComponent={<EmptyState icon="document-text-outline" title="No reports yet" description="Upload a report to get started." actionLabel="Upload Report" onAction={() => navigation.navigate('ReportUpload')} />}
            renderItem={({ item }) => {
              const sentToLabel = item.reportRequest
                ? `Fulfills: ${item.reportRequest.title}`
                : item.sentToAdmin
                  ? `Sent to ${item.sentToAdmin.firstName} ${item.sentToAdmin.lastName}`
                  : 'Sent to all admins';

              return (
                <View style={{
                  backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
                  marginBottom: 10, flexDirection: 'row', gap: 12,
                  borderWidth: 1, borderColor: COLORS.border,
                }}>
                  <FileTypeBadge mimeType={item.fileMimeType} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 15 }} numberOfLines={1}>{item.title}</Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                      {item.fileName} · {formatDate(item.createdAt)}
                    </Text>
                    <Text style={{ color: COLORS.info, fontSize: 11, marginTop: 4, fontWeight: '600' }} numberOfLines={1}>
                      {sentToLabel}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 18, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('ReportViewer', { fileUrl: item.fileUrl, fileName: item.fileName, fileMimeType: item.fileMimeType })}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Ionicons name="eye-outline" size={15} color={COLORS.primary} />
                        <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '600' }}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDownload(item.fileUrl)} disabled={openingId === item.fileUrl} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="download-outline" size={15} color={COLORS.textMuted} />
                        <Text style={{ color: COLORS.textMuted, fontSize: 12, fontWeight: '600' }}>
                          {openingId === item.fileUrl ? 'Downloading…' : 'Download'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="trash-outline" size={15} color={COLORS.error} />
                        <Text style={{ color: COLORS.error, fontSize: 12, fontWeight: '600' }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )
      ) : (
        loadingRequests ? <LoadingScreen /> : (
          <FlatList
            data={requestsData?.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refetchingRequests} onRefresh={refetchRequests} tintColor={COLORS.primary} />}
            ListEmptyComponent={<EmptyState icon="mail-open-outline" title="No requests" description="Nothing has been requested from you." />}
            renderItem={({ item }) => (
              <Card variant="elevated" style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 15 }}>{item.title}</Text>
                    {item.message && <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 4 }}>{item.message}</Text>}
                    <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>
                      Requested by {item.requestedBy?.firstName} {item.requestedBy?.lastName} · {formatDate(item.createdAt)}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
                    backgroundColor: item.status === 'FULFILLED' ? '#ECFDF5' : '#FFFBEB',
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: item.status === 'FULFILLED' ? COLORS.success : COLORS.warning }}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                {item.status === 'PENDING' && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ReportUpload', { reportRequestId: item.id, presetTitle: item.title })}
                    style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>Fulfill This Request</Text>
                  </TouchableOpacity>
                )}
              </Card>
            )}
          />
        )
      )}

      {tab === 'reports' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('ReportUpload')}
          activeOpacity={0.85}
          style={{
            position: 'absolute', bottom: 24, right: 20,
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
          }}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};
