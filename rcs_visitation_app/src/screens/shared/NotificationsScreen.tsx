import React, { useCallback } from 'react';
import {
  View, FlatList, StatusBar, RefreshControl, TouchableOpacity, Text
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NotificationCard } from '@components/common/NotificationCard';
import { LoadingScreen } from '@components/common/LoadingScreen';
import { EmptyState } from '@components/common/EmptyState';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { Skeleton } from '@components/common/Skeleton';
import { COLORS } from '@constants';
import { useNotifications, useMarkAllRead } from '@hooks/useNotifications';
import { useTranslation } from '@hooks/useTranslation';
import { notificationsApi } from '@api/notifications';

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
  const { t }                    = useTranslation();
  const { data, isLoading, refetch, isRefetching } = useNotifications();
  const { mutate: markAllRead }  = useMarkAllRead();

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      refetch();
    } catch {}
  }, [refetch]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader
        title={t('notifications')}
        onBack={() => navigation.goBack()}
        rightElement={
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
              <NotificationCard
                notification={item}
                onPress={() => handleMarkRead(item.id)}
              />
            )}
          />
        )
      }
    </View>
  );
};
