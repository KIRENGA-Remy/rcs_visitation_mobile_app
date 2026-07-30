import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants';
import { formatTime } from '@utils';
import type { VisitRequest } from '@types';

/** MM:SS (or HH:MM:SS once past an hour) countdown, positive while there's
 * time left, switches to a plain "overdue" state once it's passed. */
const useCountdown = (targetIso?: string) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!targetIso) return { label: '—', overdue: false };
  const diffMs = new Date(targetIso).getTime() - now;
  const overdue = diffMs <= 0;
  const abs = Math.abs(diffMs);
  const totalSeconds = Math.floor(abs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const label = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return { label, overdue };
};

/**
 * A visit that's currently checked in — shows a real, ticking countdown to
 * the scheduled end time rather than a static status badge, since the
 * whole point of this card is to make it obvious at a glance how much time
 * is left before the officer needs to act. Once the schedule's end time
 * passes, this switches to a clear overdue state (the backend also fires a
 * VISIT_OVERDUE notification the first time this happens — see
 * visit-request.service.ts's notifyOverdueCheckouts).
 */
export const OngoingVisitCard: React.FC<{ request: VisitRequest; onPress: () => void }> = ({ request, onPress }) => {
  const { label, overdue } = useCountdown(request.schedule?.endTime);

  const visitorName = request.visitorProfile?.user
    ? `${request.visitorProfile.user.firstName} ${request.visitorProfile.user.lastName}` : '—';
  const prisonerName = request.prisoner
    ? `${request.prisoner.firstName} ${request.prisoner.lastName}` : '—';

  const accent = overdue ? COLORS.error : COLORS.info;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
        marginBottom: 10, flexDirection: 'row', gap: 12,
        borderWidth: overdue ? 1.5 : 1, borderColor: overdue ? COLORS.error : COLORS.border,
      }}
    >
      {/* Countdown chip — replaces the calendar-day chip used elsewhere,
         since the day isn't the useful information here; the remaining
         time is. */}
      <View style={{
        width: 68, alignItems: 'center', justifyContent: 'center',
        backgroundColor: `${accent}0D`, borderRadius: 12, paddingVertical: 8,
      }}>
        <Ionicons name={overdue ? 'alert-circle' : 'timer-outline'} size={16} color={accent} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: accent, marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
          {label}
        </Text>
        <Text style={{ fontSize: 9, fontWeight: '700', color: accent, letterSpacing: 0.3, marginTop: 1 }}>
          {overdue ? 'OVERDUE' : 'LEFT'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: accent, letterSpacing: 0.3 }}>
            {overdue ? 'VISIT ENDED — CHECK OUT NOW' : 'CHECKED IN'}
          </Text>
        </View>
        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }} numberOfLines={1}>
          {visitorName}
        </Text>
        <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1 }} numberOfLines={1}>
          Visiting {prisonerName}
          {request.schedule?.endTime ? ` · ends ${formatTime(request.schedule.endTime)}` : ''}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: accent, marginRight: 4 }}>
            {overdue ? 'Check out' : 'Tap to check out early'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={accent} />
        </View>
      </View>
    </TouchableOpacity>
  );
};
