import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, VISIT_TYPE_LABELS } from '@constants';
import { formatDate, formatTime } from '@utils';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '@hooks/useTranslation';
import type { VisitRequest } from '@types';

interface Props {
  request: VisitRequest;
  onPress: () => void;
  showVisitor?: boolean;
}

export const VisitRequestCard: React.FC<Props> = memo(({ request, onPress, showVisitor = false }) => {
  const { t } = useTranslation();

  const prisonerName = request.prisoner
    ? `${request.prisoner.firstName} ${request.prisoner.lastName}`
    : '—';
  const visitorName = request.visitorProfile?.user
    ? `${request.visitorProfile.user.firstName} ${request.visitorProfile.user.lastName}`
    : '—';
  const prisonName    = request.schedule?.prison?.name ?? '—';
  const refNumber     = request.referenceNumber?.toUpperCase().slice(0, 10) ?? '—';
  const statusLabel   = (t as any)(request.status) ?? request.status;

  const scheduleDate = request.schedule?.startTime ? new Date(request.schedule.startTime) : null;
  const day   = scheduleDate?.getDate();
  const month = scheduleDate?.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  // Deliberately NOT auto-completed anywhere in the backend — an officer
  // has to be the one to end a supervised visit (an automated system
  // force-ending it could hide something that's actually still happening,
  // e.g. an unfolding incident). This just makes it impossible to miss
  // that a checked-in visit has run past its scheduled end time.
  const isOverdue = request.status === 'CHECKED_IN'
    && !!request.schedule?.endTime
    && new Date(request.schedule.endTime) < new Date();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Visit request ${refNumber}, status ${statusLabel}`}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        gap: 12,
        borderWidth: isOverdue ? 1.5 : 1,
        borderColor: isOverdue ? COLORS.error : COLORS.border,
      }}
    >
      {/* Calendar-day chip — the same functional date reference used on
          schedule cards, so the two visually related concepts (a slot,
          and a request booked into that slot) read as one design language
          instead of an arbitrary status-colour stripe. */}
      <View style={{
        width: 52, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isOverdue ? `${COLORS.error}0D` : `${COLORS.primary}0D`, borderRadius: 12, paddingVertical: 10,
      }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: isOverdue ? COLORS.error : COLORS.primary, letterSpacing: 0.5 }}>
          {month ?? '—'}
        </Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: isOverdue ? COLORS.error : COLORS.primary, marginTop: 1 }}>
          {day ?? '—'}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        {isOverdue && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            <Ionicons name="alert-circle" size={13} color={COLORS.error} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.error, letterSpacing: 0.3 }}>
              OVERDUE FOR CHECK-OUT
            </Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }} numberOfLines={1}>
              {showVisitor ? visitorName : prisonerName}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1 }} numberOfLines={1}>
              {prisonName}{request.schedule?.startTime ? ` · ${formatTime(request.schedule.startTime)}` : ''}
            </Text>
          </View>
          <StatusBadge status={request.status} label={statusLabel} size="sm" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
          <Text style={{ fontSize: 12, color: COLORS.textMuted }} numberOfLines={1}>
            {showVisitor ? `Visiting ${prisonerName}` : `Visitor: ${visitorName}`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.textMuted }}>
              {VISIT_TYPE_LABELS[request.visitType]} · Ref {refNumber}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );
});
