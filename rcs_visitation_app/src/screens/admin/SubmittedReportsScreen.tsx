import React, { useState } from 'react';
import { View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Card } from '@components/common/Card';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { officerReportsApi } from '@api/officerReports';
import { openReportFile } from '@utils/downloadReport';
import { formatDate } from '@utils';

const FILE_ICONS: Record<string, string> = {
  'application/pdf': 'document-text',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'grid',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'grid',
  'image/jpeg': 'image', 'image/png': 'image',
};

export const SubmittedReportsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['officer-reports', 'all'],
    queryFn: () => officerReportsApi.listAll({ limit: 50 }),
  });

  const handleOpen = async (fileUrl: string) => {
    setOpeningId(fileUrl);
    try {
      await openReportFile(fileUrl);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Could not open file', text2: err.message });
    } finally {
      setOpeningId(null);
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
          renderItem={({ item }) => (
            <Card variant="elevated" style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 10, backgroundColor: `${COLORS.primary}12`,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name={(FILE_ICONS[item.fileMimeType] ?? 'document') as any} size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 15 }}>{item.title}</Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                    {item.officer?.firstName} {item.officer?.lastName} · {formatDate(item.createdAt)}
                  </Text>
                  {item.reportRequest && (
                    <Text style={{ color: COLORS.info, fontSize: 11, marginTop: 2, fontWeight: '600' }}>
                      Fulfills: {item.reportRequest.title}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleOpen(item.fileUrl)}
                disabled={openingId === item.fileUrl}
                style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Ionicons name="download-outline" size={16} color={COLORS.primary} />
                <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>
                  {openingId === item.fileUrl ? 'Opening…' : 'Open / Download'}
                </Text>
              </TouchableOpacity>
            </Card>
          )}
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
