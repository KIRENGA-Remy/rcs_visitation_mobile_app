import React, { useState, useMemo } from 'react';
import {
  View, Text, SectionList, StatusBar, RefreshControl, TouchableOpacity, Modal, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, INCIDENT_LABELS } from '@constants';
import { visitLogsApi } from '@api/visitLogs';
import { formatDate, formatDateTime, formatTime, formatDuration } from '@utils';

const QUALITY_META: Record<string, { label: string; color: string; icon: string }> = {
  NORMAL:    { label: 'Normal',    color: COLORS.success, icon: 'happy-outline' },
  TENSE:     { label: 'Tense',     color: COLORS.warning, icon: 'alert-outline' },
  EMOTIONAL: { label: 'Emotional', color: COLORS.info,    icon: 'heart-outline' },
};

const OUTCOME_META: Record<string, { label: string; color: string; icon: string }> = {
  COMPLETED:  { label: 'Completed',    color: COLORS.success, icon: 'checkmark-circle' },
  CHECKED_IN: { label: 'Ongoing',      color: COLORS.info,    icon: 'timer' },
  EXPIRED:    { label: 'No Show',      color: COLORS.textMuted, icon: 'close-circle-outline' },
  NO_SHOW:    { label: 'No Show',      color: COLORS.textMuted, icon: 'close-circle-outline' },
  APPROVED:   { label: 'Awaiting Visit', color: COLORS.warning, icon: 'time-outline' },
};

/**
 * Grouped by the actual visit schedule — every visitor's outcome for that
 * slot (who checked in, who completed, who never showed up at all) sits
 * together under it, which is the whole point: a schedule's real history,
 * not just a flat list of completed check-ins. A no-show never has a
 * VisitLog row at all (that only gets created on actual check-in), so
 * this reads from /visit-logs/by-schedule — a dedicated endpoint that
 * pulls every APPROVED-or-beyond request per schedule, not just ones with
 * logs — rather than the old /visit-logs list, which structurally could
 * never show a no-show no matter how it was displayed.
 */
export const VisitLogsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedVisit, setSelectedVisit] = useState<any>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['visit-logs', 'by-schedule'],
    queryFn:  () => visitLogsApi.getGroupedHistory({ limit: 50 }),
    staleTime: 30 * 1000,
  });

  const schedules = data?.data ?? [];

  const { sections, totalVisits, completedCount, noShowCount } = useMemo(() => {
    let total = 0, completed = 0, noShow = 0;
    const secs = schedules.map((sch: any) => {
      const visits = (sch.visitRequests ?? []).map((r: any) => {
        total++;
        if (r.status === 'COMPLETED') completed++;
        if (r.status === 'EXPIRED' || r.status === 'NO_SHOW') noShow++;
        return r;
      });
      return {
        title: `${sch.label ?? 'Visit Slot'} · ${formatDate(sch.startTime)}`,
        subtitle: `${sch.prison?.name ?? '—'} · ${formatTime(sch.startTime)}–${formatTime(sch.endTime)}`,
        data: visits,
      };
    }).filter((s: any) => s.data.length > 0);
    return { sections: secs, totalVisits: total, completedCount: completed, noShowCount: noShow };
  }, [schedules]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Visit Logs"
        subtitle="Every visit, grouped by schedule"
        onBack={() => navigation.goBack()}
      />

      {isLoading ? <LoadingScreen /> : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 80, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            totalVisits === 0 ? null : (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>{totalVisits}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Total Visits</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.success }}>{completedCount}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Completed</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: noShowCount > 0 ? COLORS.error : COLORS.text }}>{noShowCount}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>No Shows</Text>
                </View>
              </View>
            )
          }
          ListEmptyComponent={
            <EmptyState icon="document-text-outline" title="No visit history yet" description="Check-ins, completions, and no-shows will appear here, grouped by schedule." />
          }
          renderSectionHeader={({ section }) => (
            <View style={{ marginTop: 18, marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>{section.title}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1 }}>{section.subtitle}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const visitor = item.visitorProfile?.user;
            const prisoner = item.prisoner;
            const log = item.visitLog;
            const outcome = OUTCOME_META[item.status] ?? { label: item.status, color: COLORS.textMuted, icon: 'help-circle-outline' };
            const flagged = log?.incidentFlagged;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedVisit(item)}
                style={{
                  backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
                  marginBottom: 10, flexDirection: 'row', gap: 12,
                  borderWidth: flagged ? 1.5 : 1, borderColor: flagged ? COLORS.error : COLORS.border,
                }}
              >
                <View style={{
                  width: 46, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: `${outcome.color}12`, borderRadius: 12, paddingVertical: 10,
                }}>
                  <Ionicons name={outcome.icon as any} size={22} color={outcome.color} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }} numberOfLines={1}>
                        {visitor?.firstName ?? '—'} {visitor?.lastName ?? ''}
                      </Text>
                      <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1 }} numberOfLines={1}>
                        Visiting {prisoner?.firstName} {prisoner?.lastName}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: `${outcome.color}15`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: outcome.color }}>{outcome.label}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="people-outline" size={13} color={COLORS.textMuted} />
                      <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
                        {log ? `${log.actualAdultsPresent} adult(s), ${log.actualChildrenPresent} child(ren)` : `${item.numberOfAdults} adult(s) requested`}
                      </Text>
                    </View>
                    {log?.actualCheckinTime && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="enter-outline" size={13} color={COLORS.textMuted} />
                        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{formatTime(log.actualCheckinTime)}</Text>
                      </View>
                    )}
                    {log?.durationMinutes && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="timer-outline" size={13} color={COLORS.textMuted} />
                        <Text style={{ fontSize: 12, color: COLORS.textMuted }}>{formatDuration(log.durationMinutes)}</Text>
                      </View>
                    )}
                  </View>

                  {flagged && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                      <Ionicons name="warning-outline" size={13} color={COLORS.error} />
                      <Text style={{ fontSize: 12, color: COLORS.error, fontWeight: '600' }}>{INCIDENT_LABELS[log.incidentType]}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Full detail */}
      <Modal visible={!!selectedVisit} transparent animationType="slide" onRequestClose={() => setSelectedVisit(null)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.overlay }}>
          <View style={{ backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>Visit Detail</Text>
              <TouchableOpacity onPress={() => setSelectedVisit(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
            {selectedVisit && (() => {
              const v = selectedVisit;
              const log = v.visitLog;
              const outcome = OUTCOME_META[v.status] ?? { label: v.status, color: COLORS.textMuted, icon: 'help-circle-outline' };
              return (
                <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
                  <View style={{
                    alignSelf: 'flex-start', backgroundColor: `${outcome.color}15`, borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 14,
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: outcome.color }}>{outcome.label}</Text>
                  </View>

                  <DetailRow icon="person-outline" label="Visitor"
                    value={`${v.visitorProfile?.user?.firstName ?? ''} ${v.visitorProfile?.user?.lastName ?? ''}`} />
                  <DetailRow icon="call-outline" label="Phone" value={v.visitorProfile?.user?.phone ?? '—'} />
                  <DetailRow icon="body-outline" label="Prisoner"
                    value={`${v.prisoner?.firstName ?? ''} ${v.prisoner?.lastName ?? ''} (#${v.prisoner?.prisonerNumber ?? '—'})`} />
                  <DetailRow icon="people-outline" label="Requested" value={`${v.numberOfAdults} adult(s), ${v.numberOfChildren} child(ren)`} />

                  {log ? (
                    <>
                      <DetailRow icon="log-in-outline" label="Checked In" value={formatDateTime(log.actualCheckinTime)} />
                      <DetailRow icon="log-out-outline" label="Checked Out"
                        value={log.actualCheckoutTime ? formatDateTime(log.actualCheckoutTime) : 'Still checked in'} />
                      {log.durationMinutes && <DetailRow icon="timer-outline" label="Duration" value={formatDuration(log.durationMinutes)} />}
                      <DetailRow icon="people-outline" label="Actually Present" value={`${log.actualAdultsPresent} adult(s), ${log.actualChildrenPresent} child(ren)`} />
                      {log.visitQuality && <DetailRow icon="happy-outline" label="Visit Quality" value={QUALITY_META[log.visitQuality]?.label ?? log.visitQuality} />}
                      <DetailRow icon="person-circle-outline" label="Checked In By"
                        value={`${log.conductedBy?.firstName ?? ''} ${log.conductedBy?.lastName ?? ''}`} />
                      {log.incidentType !== 'NONE' && (
                        <View style={{ backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, marginTop: 8, marginBottom: 8 }}>
                          <Text style={{ color: COLORS.error, fontWeight: '700', fontSize: 13, marginBottom: 4 }}>
                            Incident: {INCIDENT_LABELS[log.incidentType]}
                          </Text>
                          {log.incidentNotes && <Text style={{ color: '#991B1B', fontSize: 13 }}>{log.incidentNotes}</Text>}
                        </View>
                      )}
                      {log.itemsConfiscated && <DetailRow icon="alert-circle-outline" label="Confiscated" value={log.itemsConfiscated} />}
                      {log.officerNotes && <DetailRow icon="document-text-outline" label="Officer Notes" value={log.officerNotes} />}
                    </>
                  ) : (
                    <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginTop: 8 }}>
                      <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center' }}>
                        This visitor was approved but never checked in — the scheduled visit ended without them arriving. No check-in details exist for this visit.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              );
            })()}
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
