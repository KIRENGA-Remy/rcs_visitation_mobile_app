import React, { useState } from 'react';
import {
  View, Text, ScrollView, StatusBar, TouchableOpacity, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { Card } from '@components/common/Card';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { reportsApi } from '@api/reports';
import { formatDuration } from '@utils';

export const ReportsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const { data: overview, isLoading: overviewLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.OVERVIEW,
    queryFn:  reportsApi.overview,
    staleTime: 60 * 1000,
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: QUERY_KEYS.DAILY_VISITS,
    queryFn:  () => reportsApi.dailyVisits({}),
    staleTime: 5 * 60 * 1000,
  });

  const { data: peakData } = useQuery({
    queryKey: QUERY_KEYS.PEAK_HOURS,
    queryFn:  () => reportsApi.peakHours({}),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activityData } = useQuery({
    queryKey: QUERY_KEYS.PRISONER_ACTIVITY,
    queryFn:  () => reportsApi.prisonerActivity({ limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  const last7Days = dailyData?.slice(-7) ?? [];
  const maxVisits = Math.max(...last7Days.map(d => d.totalVisits), 1);
  const top5Peak  = [...(peakData ?? [])].sort((a, b) => b.visitCount - a.visitCount).slice(0, 5);

  if (overviewLoading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="Reports & Analytics" subtitle="Platform insights" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
      >
        {/* Summary cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Visits', value: overview?.visitRequests?.total ?? 0, icon: 'calendar', color: COLORS.primary },
            { label: 'Today Check-ins', value: overview?.todayCheckins ?? 0, icon: 'enter', color: COLORS.success },
            { label: 'Incidents', value: overview?.flaggedIncidents ?? 0, icon: 'alert-circle', color: COLORS.error },
          ].map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${s.color}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Daily visits bar chart (custom, no library needed) */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>
            Daily Visits — Last 7 Days
          </Text>
          {last7Days.length === 0 ? (
            <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 }}>No data available</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120, paddingTop: 8 }}>
              {last7Days.map((day) => {
                const barHeight = maxVisits > 0 ? (day.totalVisits / maxVisits) * 90 : 4;
                const dayLabel  = new Date(day.date).toLocaleDateString('en', { weekday: 'short' });
                return (
                  <View key={day.date} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: '700' }}>
                      {day.totalVisits > 0 ? day.totalVisits : ''}
                    </Text>
                    <LinearGradient
                      colors={[COLORS.primaryLight, COLORS.primary]}
                      style={{ width: '100%', height: Math.max(barHeight, 4), borderRadius: 4 }}
                    />
                    <Text style={{ fontSize: 10, color: COLORS.textMuted }}>{dayLabel}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* Peak hours */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>
            Peak Visit Hours
          </Text>
          {top5Peak.length === 0 ? (
            <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 12 }}>No data</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {top5Peak.map((h, idx) => {
                const pct = top5Peak[0].visitCount > 0 ? (h.visitCount / top5Peak[0].visitCount) * 100 : 0;
                return (
                  <View key={h.hour}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text }}>{h.label}</Text>
                      <Text style={{ fontSize: 13, color: COLORS.textMuted }}>{h.visitCount} visits</Text>
                    </View>
                    <View style={{ height: 8, backgroundColor: COLORS.surface, borderRadius: 4 }}>
                      <View style={{
                        height: 8, borderRadius: 4, width: `${pct}%`,
                        backgroundColor: idx === 0 ? COLORS.accent : COLORS.primary,
                      }} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* Prisoner activity */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>
            Most Visited Prisoners
          </Text>
          {(activityData ?? []).length === 0 ? (
            <Text style={{ color: COLORS.textMuted, textAlign: 'center', paddingVertical: 12 }}>No data</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {(activityData ?? []).map((a, idx) => (
                <View key={a.prisonerId} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: idx === 0 ? COLORS.accent : COLORS.surface,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: idx === 0 ? COLORS.black : COLORS.textMuted }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 14 }}>
                      {a.prisoner.firstName} {a.prisoner.lastName}
                    </Text>
                    <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>
                      #{a.prisoner.prisonerNumber} · {a.prisoner.prison.name}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: `${COLORS.primary}15`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontWeight: '800', color: COLORS.primary, fontSize: 14 }}>{a.visitCount}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
};
