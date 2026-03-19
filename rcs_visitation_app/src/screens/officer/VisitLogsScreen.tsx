import React, { useState } from 'react';
import {
  View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@components/common/Card';
import { StatusBadge } from '@components/common/StatusBadge';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS, INCIDENT_LABELS } from '@constants';
import { visitLogsApi } from '@api/visitLogs';
import { formatDateTime, formatDuration } from '@utils';

export const VisitLogsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [...QUERY_KEYS.VISIT_LOGS, { flaggedOnly }],
    queryFn:  () => visitLogsApi.list({ flagged: flaggedOnly || undefined, limit: 50 }),
    staleTime: 30 * 1000,
  });

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Visit Logs"
        subtitle="Completed visit records"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            onPress={() => setFlaggedOnly(!flaggedOnly)}
            style={{
              backgroundColor: flaggedOnly ? COLORS.error : 'rgba(255,255,255,0.2)',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="flag" size={14} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>
              {flaggedOnly ? 'All' : 'Flagged'}
            </Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingScreen />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No visit logs"
              description={flaggedOnly ? 'No flagged incidents found' : 'No completed visits yet'}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {}}
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.07,
                shadowRadius: 6,
                elevation: 2,
                borderLeftWidth: 4,
                borderLeftColor: item.incidentFlagged ? COLORS.error : COLORS.success,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                    {(item as any).visitRequest?.visitorProfile?.user?.firstName}{' '}
                    {(item as any).visitRequest?.visitorProfile?.user?.lastName}
                  </Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                    Visited: {(item as any).visitRequest?.prisoner?.firstName}{' '}
                    {(item as any).visitRequest?.prisoner?.lastName}
                  </Text>
                </View>
                {item.incidentFlagged && (
                  <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 6 }}>
                    <Ionicons name="flag" size={16} color={COLORS.error} />
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="enter-outline" size={13} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                    {formatDateTime(item.actualCheckinTime)}
                  </Text>
                </View>
                {item.durationMinutes && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="timer-outline" size={13} color={COLORS.textMuted} />
                    <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                      {formatDuration(item.durationMinutes)}
                    </Text>
                  </View>
                )}
              </View>

              {item.incidentType !== 'NONE' && (
                <View style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Ionicons name="warning-outline" size={14} color={COLORS.error} />
                  <Text style={{ fontSize: 12, color: COLORS.error, fontWeight: '600' }}>
                    {INCIDENT_LABELS[item.incidentType]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};
