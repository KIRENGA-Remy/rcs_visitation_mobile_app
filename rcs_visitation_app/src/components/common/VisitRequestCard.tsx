import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, VISIT_TYPE_LABELS } from '@constants';
import { formatDate } from '@utils';
import { StatusBadge } from './StatusBadge';
import { useTranslation } from '@hooks/useTranslation';
import type { VisitRequest } from '@types';

interface Props {
  request: VisitRequest;
  onPress: () => void;
  showVisitor?: boolean;
}

const STATUS_BORDER: Record<string, string> = {
  PENDING:    '#F59E0B',
  APPROVED:   '#10B981',
  REJECTED:   '#EF4444',
  CANCELLED:  '#6B7280',
  CHECKED_IN: '#3B82F6',
  COMPLETED:  '#10B981',
  NO_SHOW:    '#EF4444',
  EXPIRED:    '#6B7280',
};

export const VisitRequestCard: React.FC<Props> = memo(({ request, onPress, showVisitor = false }) => {
  const { t } = useTranslation();

  const prisonerName = request.prisoner
    ? `${request.prisoner.firstName} ${request.prisoner.lastName}`
    : '—';
  const visitorName = request.visitorProfile?.user
    ? `${request.visitorProfile.user.firstName} ${request.visitorProfile.user.lastName}`
    : '—';
  const scheduleDate  = request.schedule?.startTime ? formatDate(request.schedule.startTime) : '—';
  const prisonName    = request.schedule?.prison?.name ?? '—';
  const refNumber     = request.referenceNumber?.toUpperCase().slice(0, 10) ?? '—';
  const statusLabel   = (t as any)(request.status) ?? request.status;
  const borderColor   = STATUS_BORDER[request.status] ?? COLORS.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Visit request ${refNumber}, status ${statusLabel}`}
      style={{
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 }}>
            {showVisitor ? visitorName : prisonerName}
          </Text>
          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>
            Ref: {refNumber}
          </Text>
        </View>
        <StatusBadge status={request.status} label={statusLabel} size="sm" />
      </View>

      <View style={{ gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.textMuted} />
          <Text style={{ fontSize: 13, color: COLORS.textMuted }}>{scheduleDate}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="business-outline" size={13} color={COLORS.textMuted} />
          <Text style={{ fontSize: 13, color: COLORS.textMuted }} numberOfLines={1}>{prisonName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="person-outline" size={13} color={COLORS.textMuted} />
          <Text style={{ fontSize: 13, color: COLORS.textMuted }} numberOfLines={1}>
            {showVisitor ? `Visiting: ${prisonerName}` : `Visitor: ${visitorName}`}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <View style={{
          backgroundColor: `${COLORS.primary}15`,
          borderRadius: 6,
          paddingHorizontal: 8, paddingVertical: 3,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.primary }}>
            {VISIT_TYPE_LABELS[request.visitType]}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
      </View>
    </TouchableOpacity>
  );
});
