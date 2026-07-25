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
    queryFn:  () => schedulesApi.listForAdmin({ limit: 50 }),
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

  const handleReopen = async (scheduleId: string) => {
    try {
      await schedulesApi.reopen(scheduleId);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SCHEDULES });
      Toast.show({ type: 'success', text1: 'Schedule reopened' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: extractApiError(err) });
    }
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
          renderItem={({ item }) => {
            const dateObj = new Date(item.startTime);
            const day     = dateObj.getDate();
            const month   = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const isPast  = new Date(item.endTime) < new Date();
            const capacityRatio = item.maxCapacity > 0 ? item.currentBookings / item.maxCapacity : 0;
            const capacityColor = capacityRatio >= 1 ? COLORS.error : capacityRatio >= 0.7 ? COLORS.warning : COLORS.success;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ScheduleForm', { id: item.id })}
                style={{
                  backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
                  marginBottom: 10, flexDirection: 'row', gap: 12,
                  borderWidth: 1, borderColor: COLORS.border,
                  opacity: isPast ? 0.65 : 1,
                }}
              >
                {/* Calendar-day chip — a real, functional date reference
                    instead of a purely decorative colour stripe. */}
                <View style={{
                  width: 52, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${COLORS.primary}0D`, borderRadius: 12, paddingVertical: 10,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 0.5 }}>{month}</Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.primary, marginTop: 1 }}>{day}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }} numberOfLines={1}>
                        {item.label ?? VISIT_TYPE_LABELS[item.visitType]}
                      </Text>
                      <Text style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                        {item.prison?.name} · {formatTime(item.startTime)}–{formatTime(item.endTime)}
                      </Text>
                    </View>
                    <StatusBadge status={item.status} size="sm" />
                  </View>

                  {/* Capacity as an actual proportion, not just a number pair */}
                  <View style={{ marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 11, color: COLORS.textMuted }}>
                        {item.currentBookings} of {item.maxCapacity} booked
                      </Text>
                      <Text style={{ fontSize: 11, color: capacityColor, fontWeight: '700' }}>
                        {Math.round(capacityRatio * 100)}%
                      </Text>
                    </View>
                    <View style={{ height: 4, borderRadius: 2, backgroundColor: COLORS.border, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%', width: `${Math.min(capacityRatio, 1) * 100}%`,
                        backgroundColor: capacityColor, borderRadius: 2,
                      }} />
                    </View>
                  </View>

                  {item.status === 'OPEN' && (
                    <TouchableOpacity
                      onPress={() => handleCancel(item.id)}
                      style={{ marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                    >
                      <Ionicons name="close-circle-outline" size={14} color={COLORS.error} />
                      <Text style={{ color: COLORS.error, fontSize: 12, fontWeight: '600' }}>Cancel slot</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === 'CANCELLED' && (
                    <TouchableOpacity
                      onPress={() => handleReopen(item.id)}
                      style={{ marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5 }}
                    >
                      <Ionicons name="refresh-outline" size={14} color={COLORS.success} />
                      <Text style={{ color: COLORS.success, fontSize: 12, fontWeight: '600' }}>Reopen slot</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* FAB — create a new schedule */}
      <TouchableOpacity
        onPress={() => navigation.navigate('ScheduleForm', {})}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Create new schedule"
        style={{
          position: 'absolute', bottom: 24, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};
