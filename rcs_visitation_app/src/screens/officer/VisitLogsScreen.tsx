import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StatusBar, RefreshControl, TouchableOpacity, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS, INCIDENT_LABELS } from '@constants';
import { visitLogsApi } from '@api/visitLogs';
import { formatDate, formatDateTime, formatTime, formatDuration } from '@utils';

const QUALITY_META: Record<string, { label: string; color: string; icon: string }> = {
  NORMAL:    { label: 'Normal',    color: COLORS.success, icon: 'happy-outline' },
  TENSE:     { label: 'Tense',     color: COLORS.warning, icon: 'alert-outline' },
  EMOTIONAL: { label: 'Emotional', color: COLORS.info,    icon: 'heart-outline' },
};

export const VisitLogsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [...QUERY_KEYS.VISIT_LOGS, { flaggedOnly }],
    queryFn:  () => visitLogsApi.list({ flagged: flaggedOnly || undefined, limit: 50 }),
    staleTime: 30 * 1000,
  });

  const logs = data?.data ?? [];
  const flaggedCount = useMemo(() => logs.filter((l: any) => l.incidentFlagged).length, [logs]);
  const avgDuration = useMemo(() => {
    const withDuration = logs.filter((l: any) => l.durationMinutes);
    if (!withDuration.length) return 0;
    return Math.round(withDuration.reduce((sum: number, l: any) => sum + l.durationMinutes, 0) / withDuration.length);
  }, [logs]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Visit Logs"
        subtitle="Check-in and check-out records"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            onPress={() => setFlaggedOnly(!flaggedOnly)}
            style={{
              backgroundColor: flaggedOnly ? COLORS.error : 'rgba(255,255,255,0.2)',
              borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
              flexDirection: 'row', alignItems: 'center', gap: 4,
            }}
          >
            <Ionicons name="flag" size={14} color={COLORS.white} />
            <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: '600' }}>
              {flaggedOnly ? 'All' : 'Flagged'}
            </Text>
          </TouchableOpacity>
        }
      />

      {isLoading ? <LoadingScreen /> : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
          ListHeaderComponent={
            logs.length === 0 ? null : (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>{logs.length}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Total Records</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: flaggedCount > 0 ? COLORS.error : COLORS.text }}>{flaggedCount}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Flagged</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>{avgDuration ? formatDuration(avgDuration) : '—'}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Avg Duration</Text>
                </View>
              </View>
            )
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No visit logs"
              description={flaggedOnly ? 'No flagged incidents found' : 'No completed visits yet'}
            />
          }
          renderItem={({ item }) => {
            const visitor = (item as any).visitRequest?.visitorProfile?.user;
            const prisoner = (item as any).visitRequest?.prisoner;
            const prison = (item as any).visitRequest?.schedule?.prison;
            const quality = QUALITY_META[(item as any).visitQuality] ?? null;
            const dateObj = new Date(item.actualCheckinTime);

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedLog(item)}
                style={{
                  backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
                  marginBottom: 10, flexDirection: 'row', gap: 12,
                  borderWidth: 1, borderColor: COLORS.border,
                }}
              >
                <View style={{
                  width: 52, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: item.incidentFlagged ? `${COLORS.error}0D` : `${COLORS.primary}0D`,
                  borderRadius: 12, paddingVertical: 10,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: item.incidentFlagged ? COLORS.error : COLORS.primary, letterSpacing: 0.5 }}>
                    {dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: item.incidentFlagged ? COLORS.error : COLORS.primary, marginTop: 1 }}>
                    {dateObj.getDate()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }} numberOfLines={1}>
                        {visitor?.firstName} {visitor?.lastName}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1 }} numberOfLines={1}>
                        Visited {prisoner?.firstName} {prisoner?.lastName} · {prison?.name ?? '—'}
                      </Text>
                    </View>
                    {item.incidentFlagged && (
                      <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 6 }}>
                        <Ionicons name="flag" size={14} color={COLORS.error} />
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="enter-outline" size={13} color={COLORS.textMuted} />
                      <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{formatTime(item.actualCheckinTime)}</Text>
                    </View>
                    {item.durationMinutes ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="timer-outline" size={13} color={COLORS.textMuted} />
                        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{formatDuration(item.durationMinutes)}</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="ellipse" size={7} color={COLORS.warning} />
                        <Text style={{ fontSize: 12, color: COLORS.warning, fontWeight: '600' }}>Still checked in</Text>
                      </View>
                    )}
                    {quality && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name={quality.icon as any} size={13} color={quality.color} />
                        <Text style={{ fontSize: 12, color: quality.color, fontWeight: '600' }}>{quality.label}</Text>
                      </View>
                    )}
                  </View>

                  {item.incidentType !== 'NONE' && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border,
                    }}>
                      <Ionicons name="warning-outline" size={13} color={COLORS.error} />
                      <Text style={{ fontSize: 12, color: COLORS.error, fontWeight: '600' }}>
                        {INCIDENT_LABELS[item.incidentType]}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Full detail — tapping a log card used to do nothing at all */}
      <Modal visible={!!selectedLog} transparent animationType="slide" onRequestClose={() => setSelectedLog(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>Visit Record</Text>
              <TouchableOpacity onPress={() => setSelectedLog(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedLog && (
              <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
                <DetailRow icon="person-outline" label="Visitor"
                  value={`${selectedLog.visitRequest?.visitorProfile?.user?.firstName ?? ''} ${selectedLog.visitRequest?.visitorProfile?.user?.lastName ?? ''}`} />
                <DetailRow icon="body-outline" label="Prisoner"
                  value={`${selectedLog.visitRequest?.prisoner?.firstName ?? ''} ${selectedLog.visitRequest?.prisoner?.lastName ?? ''} (#${selectedLog.visitRequest?.prisoner?.prisonerNumber ?? '—'})`} />
                <DetailRow icon="business-outline" label="Prison" value={selectedLog.visitRequest?.schedule?.prison?.name ?? '—'} />
                <DetailRow icon="log-in-outline" label="Checked In" value={formatDateTime(selectedLog.actualCheckinTime)} />
                <DetailRow icon="log-out-outline" label="Checked Out"
                  value={selectedLog.actualCheckoutTime ? formatDateTime(selectedLog.actualCheckoutTime) : 'Still checked in'} />
                {selectedLog.durationMinutes && (
                  <DetailRow icon="timer-outline" label="Duration" value={formatDuration(selectedLog.durationMinutes)} />
                )}
                <DetailRow icon="people-outline" label="Present"
                  value={`${selectedLog.actualAdultsPresent} adult(s), ${selectedLog.actualChildrenPresent} child(ren)`} />
                {selectedLog.visitQuality && (
                  <DetailRow icon="happy-outline" label="Visit Quality" value={QUALITY_META[selectedLog.visitQuality]?.label ?? selectedLog.visitQuality} />
                )}
                <DetailRow icon="person-circle-outline" label="Conducted By"
                  value={`${selectedLog.conductedBy?.firstName ?? ''} ${selectedLog.conductedBy?.lastName ?? ''}`} />

                {selectedLog.incidentType !== 'NONE' && (
                  <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 8 }}>
                    <Text style={{ color: COLORS.error, fontWeight: '700', fontSize: 13, marginBottom: 4 }}>
                      Incident: {INCIDENT_LABELS[selectedLog.incidentType]}
                    </Text>
                    {selectedLog.incidentNotes && (
                      <Text style={{ color: '#991B1B', fontSize: 13 }}>{selectedLog.incidentNotes}</Text>
                    )}
                  </View>
                )}
                {selectedLog.itemsConfiscated && (
                  <DetailRow icon="alert-circle-outline" label="Confiscated" value={selectedLog.itemsConfiscated} />
                )}
                {selectedLog.officerNotes && (
                  <DetailRow icon="document-text-outline" label="Officer Notes" value={selectedLog.officerNotes} />
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 }}>
    <Ionicons name={icon as any} size={16} color={COLORS.textMuted} style={{ marginTop: 2 }} />
    <Text style={{ fontSize: 13, color: COLORS.textMuted, width: 100 }}>{label}</Text>
    <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 }}>{value}</Text>
  </View>
);
