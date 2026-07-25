import React, { useCallback, useState } from 'react';
import {
  View, FlatList, StatusBar, RefreshControl, TouchableOpacity, Text, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { NotificationCard } from '@components/common/NotificationCard';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { Skeleton } from '@components/common/Skeleton';
import { COLORS, QUERY_KEYS } from '@constants';
import { useNotifications, useMarkAllRead } from '@hooks/useNotifications';
import { useTranslation } from '@hooks/useTranslation';
import { notificationsApi } from '@api/notifications';
import { extractApiError } from '@utils';

const NotificationSkeleton: React.FC = () => (
  <View style={{
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', gap: 12,
  }}>
    <Skeleton width={40} height={40} borderRadius={20} />
    <View style={{ flex: 1, gap: 8 }}>
      <Skeleton width="70%" height={14} />
      <Skeleton width="90%" height={12} />
      <Skeleton width="30%" height={10} />
    </View>
  </View>
);

export const NotificationsScreen: React.FC = () => {
  const navigation               = useNavigation();
  const qc                       = useQueryClient();
  const { t }                    = useTranslation();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const { mutate: markAllRead }  = useMarkAllRead();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      refetch();
    } catch {}
  }, [refetch]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(t('delete_notification'), t('delete_notification_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await notificationsApi.delete(id);
            qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
            refetch();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: extractApiError(err) });
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }, [refetch, qc, t]);

  const handleClearAll = useCallback(() => {
    if (!data?.data?.length) return;
    Alert.alert(
      t('clear_all_notifications'),
      t('clear_all_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear_all'),
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationsApi.deleteAll();
              qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
              refetch();
              Toast.show({ type: 'success', text1: t('all_cleared') });
            } catch (err: any) {
              Toast.show({ type: 'error', text1: extractApiError(err) });
            }
          },
        },
      ]
    );
  }, [refetch, qc, t, data?.data?.length]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title={t('notifications')}
        onBack={() => navigation.goBack()}
        rightElement={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity
              onPress={() => markAllRead()}
              accessibilityRole="button"
              accessibilityLabel={t('mark_all_read')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: '600' }}>
                {t('mark_all_read')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClearAll}
              accessibilityRole="button"
              accessibilityLabel={t('clear_all')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        }
      />

      {isLoading
        ? <View style={{ padding: 16 }}>
            {[1,2,3,4,5].map(i => <NotificationSkeleton key={i} />)}
          </View>
        : (
          <FlatList
            data={data?.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 60, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="notifications-off-outline"
                title={t('no_notifications')}
                description={t('up_to_date')}
              />
            }
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <NotificationCard
                    notification={item}
                    onPress={() => handleMarkRead(item.id)}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('delete_notification')}
                  style={{ padding: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            )}
          />
        )
      }
    </View>
  );
};
