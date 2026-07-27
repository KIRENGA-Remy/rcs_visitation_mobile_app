import React from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { notificationsApi } from '@api/notifications';
import { formatDateTime, extractApiError } from '@utils';

const NOTIF_ICONS: Record<string, string> = {
  VISIT_APPROVED:       'checkmark-circle',
  VISIT_REJECTED:       'close-circle',
  VISIT_REMINDER:       'alarm',
  VISIT_CANCELLED:      'close-circle-outline',
  VISIT_CHECKED_IN:     'enter',
  VISIT_COMPLETED:      'ribbon',
  PRISONER_TRANSFERRED: 'swap-horizontal',
  SLOT_OPENING:         'calendar',
  SCHEDULE_CHANGED:     'calendar-outline',
  REPORT_REQUESTED:     'document-text-outline',
  REPORT_SUBMITTED:     'document-attach-outline',
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
  SCHEDULE_CHANGED: '#1F5D3A',
  REPORT_REQUESTED: '#F59E0B',
  REPORT_SUBMITTED: '#10B981',
  SYSTEM_ALERT:     '#EF4444',
};

const NOTIF_LABELS: Record<string, string> = {
  VISIT_APPROVED: 'Visit Approved', VISIT_REJECTED: 'Visit Rejected',
  VISIT_REMINDER: 'Reminder', VISIT_CANCELLED: 'Visit Cancelled',
  VISIT_CHECKED_IN: 'Checked In', VISIT_COMPLETED: 'Visit Completed',
  PRISONER_TRANSFERRED: 'Prisoner Transferred', SLOT_OPENING: 'New Slot',
  SCHEDULE_CHANGED: 'Schedule Change', REPORT_REQUESTED: 'Report Requested',
  REPORT_SUBMITTED: 'Report Submitted', SYSTEM_ALERT: 'Alert',
};

/**
 * Full, untruncated view of a single notification — the list view
 * (NotificationCard) necessarily clips the body to 2 lines to keep the
 * list scannable; this screen is where the whole message actually gets
 * read, since a long approval/rejection/report message was previously
 * only ever visible cut off with "…".
 */
export const NotificationDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: { notification: any } }, 'params'>>();
  const qc = useQueryClient();
  const notification = route.params.notification;

  const icon  = NOTIF_ICONS[notification.type] ?? 'notifications-outline';
  const color = NOTIF_COLORS[notification.type] ?? COLORS.primary;
  const label = NOTIF_LABELS[notification.type] ?? 'Notification';

  const handleDelete = () => {
    Alert.alert('Delete Notification', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await notificationsApi.delete(notification.id);
            qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
            navigation.goBack();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: extractApiError(err) });
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title="Notification"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{
          backgroundColor: COLORS.white, borderRadius: 20, padding: 24,
          borderWidth: 1, borderColor: COLORS.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{
              width: 52, height: 52, borderRadius: 26, backgroundColor: `${color}18`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={icon as any} size={26} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                {label}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                {formatDateTime(notification.createdAt)}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12, lineHeight: 25 }}>
            {notification.title}
          </Text>

          {/* The full message, no numberOfLines truncation anywhere here —
             this is the whole point of this screen existing. */}
          <Text style={{ fontSize: 15, color: COLORS.text, lineHeight: 23 }}>
            {notification.body}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};
