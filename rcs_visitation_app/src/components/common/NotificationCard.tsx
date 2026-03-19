import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants';
import { timeAgo } from '@utils';
import type { Notification } from '@types';

const NOTIF_ICONS: Record<string, string> = {
  VISIT_APPROVED:       'checkmark-circle',
  VISIT_REJECTED:       'close-circle',
  VISIT_REMINDER:       'alarm',
  VISIT_CANCELLED:      'close-circle-outline',
  VISIT_CHECKED_IN:     'enter',
  VISIT_COMPLETED:      'ribbon',
  PRISONER_TRANSFERRED: 'swap-horizontal',
  SLOT_OPENING:         'calendar',
  SYSTEM_ALERT:         'alert-circle',
};

const NOTIF_COLORS: Record<string, string> = {
  VISIT_APPROVED:   '#10B981',
  VISIT_REJECTED:   '#EF4444',
  VISIT_REMINDER:   '#F59E0B',
  VISIT_CANCELLED:  '#6B7280',
  VISIT_CHECKED_IN: '#3B82F6',
  VISIT_COMPLETED:  '#10B981',
  PRISONER_TRANSFERRED: '#8B5CF6',
  SLOT_OPENING:     '#1F5D3A',
  SYSTEM_ALERT:     '#EF4444',
};

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onPress }) => {
  const icon = NOTIF_ICONS[notification.type] ?? 'notifications-outline';
  const color = NOTIF_COLORS[notification.type] ?? COLORS.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: notification.isRead ? COLORS.white : `${COLORS.primary}08`,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        borderWidth: notification.isRead ? 0 : 1,
        borderColor: notification.isRead ? 'transparent' : `${COLORS.primary}20`,
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: `${color}20`,
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: notification.isRead ? '600' : '700', color: COLORS.text, flex: 1 }}>
            {notification.title}
          </Text>
          {!notification.isRead && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginLeft: 8 }} />
          )}
        </View>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 18 }} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 6 }}>
          {timeAgo(notification.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
