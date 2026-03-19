import React, { useState } from 'react';
import {
  View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { StatusBadge } from '@components/common/StatusBadge';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS, VISIT_TYPE_LABELS } from '@constants';
import { schedulesApi } from '@api/schedules';
import { formatDate, formatTime, extractApiError } from '@utils';

export const SchedulesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.SCHEDULES,
    queryFn:  () => schedulesApi.list({ limit: 50 }),
    staleTime: 30 * 1000,
  });

  const handleCancel = (scheduleId: string) => {
    Alert.alert(
      'Cancel Schedule',
      'This will cancel the time slot and all pending/approved requests in it.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Slot',
          style: 'destructive',
          onPress: async () => {
            try {
              await schedulesApi.cancel(scheduleId);
              qc.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULES });
              Toast.show({ type: 'success', text1: 'Schedule cancelled' });
            } catch (err: any) {
              Toast.show({ type: 'error', text1: extractApiError(err) });
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Visit Schedules"
        subtitle="Manage visiting time slots"
        onBack={() => navigation.goBack()}
      />

      {isLoading ? <LoadingScreen /> : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
          ListEmptyComponent={<EmptyState icon="calendar-outline" title="No schedules found" description="No visit time slots have been created yet." />}
          renderItem={({ item }) => (
            <View style={{
              backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
              marginBottom: 10, shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
              borderLeftWidth: 4,
              borderLeftColor: item.status === 'OPEN' ? COLORS.success : item.status === 'FULL' ? COLORS.warning : COLORS.error,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                    {item.label ?? 'Visit Slot'}
                  </Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 2 }}>
                    {item.prison?.name}
                  </Text>
                </View>
                <StatusBadge status={item.status} size="sm" />
              </View>

              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 13, color: COLORS.textMuted }}>{formatDate(item.startTime)}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time-outline" size={13} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
                    {formatTime(item.startTime)} – {formatTime(item.endTime)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="people-outline" size={13} color={COLORS.textMuted} />
                  <Text style={{ fontSize: 13, color: COLORS.textMuted }}>
                    {item.currentBookings} / {item.maxCapacity} booked
                    · {VISIT_TYPE_LABELS[item.visitType]}
                  </Text>
                </View>
              </View>

              {item.status === 'OPEN' && (
                <TouchableOpacity
                  onPress={() => handleCancel(item.id)}
                  style={{
                    marginTop: 12, paddingVertical: 8, borderRadius: 8,
                    backgroundColor: '#FEF2F2', alignItems: 'center',
                    flexDirection: 'row', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                  <Text style={{ color: COLORS.error, fontSize: 13, fontWeight: '600' }}>Cancel This Slot</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};
