import React, { useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@components/common/Avatar';
import { VisitRequestCard } from '@components/common/VisitRequestCard';
import { EmptyState } from '@components/common/EmptyState';
import { VisitRequestSkeleton } from '@components/common/Skeleton';
import { COLORS, QUERY_KEYS } from '@constants';
import { useAuthStore } from '@stores/authStore';
import { useNotificationStore } from '@stores/notificationStore';
import { useTranslation } from '@hooks/useTranslation';
import { visitRequestsApi } from '@api/visitRequests';
import { formatDate } from '@utils';
import { scheduleVisitReminder } from '@hooks/usePushNotifications';

export const VisitorHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, language } = useAuthStore();
  const { unreadCount }    = useNotificationStore();
  const { t }              = useTranslation();

  const { data: requestsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [...QUERY_KEYS.MY_REQUESTS, { limit: 5 }],
    queryFn:  () => visitRequestsApi.myRequests({ limit: 5 }),
    staleTime: 30 * 1000,
  });

  // Memoised to avoid recalculating on every render
  const activeRequest = useMemo(
    () => requestsData?.data?.find(r => ['PENDING','APPROVED','CHECKED_IN'].includes(r.status)),
    [requestsData?.data]
  );

  const stats = useMemo(() => [
    { label: t('my_requests'), value: requestsData?.data?.length ?? 0,                                icon: 'checkmark-done', color: COLORS.success },
    { label: t('PENDING'),     value: requestsData?.data?.filter(r => r.status === 'PENDING').length ?? 0, icon: 'time',      color: COLORS.warning },
    { label: t('APPROVED'),    value: requestsData?.data?.filter(r => r.status === 'APPROVED').length ?? 0, icon: 'checkmark-circle', color: COLORS.primary },
  ], [requestsData?.data, language]);

  const quickActions = useMemo(() => [
    { label: t('book_visit'), icon: 'add-circle', color: COLORS.primary, screen: 'BookVisit' },
    { label: t('my_requests'),icon: 'list',       color: COLORS.info,    screen: 'MyRequests' },
    { label: t('profile'),    icon: 'person',     color: COLORS.accent,  screen: 'Profile' },
  ], [language]);

  const handleNavPress = useCallback((screen: string) => navigation.navigate(screen), [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={{ paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar firstName={user?.firstName ?? ''} lastName={user?.lastName ?? ''} size={44} />
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{t('welcome_back')}</Text>
              <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleNavPress('Notifications')}
            style={{ position: 'relative', padding: 8 }}
            accessibilityLabel={`${t('notifications')} ${unreadCount > 0 ? `${unreadCount} unread` : ''}`}
            accessibilityRole="button"
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.white} />
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute', top: 4, right: 4,
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: COLORS.accent,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: COLORS.black, fontSize: 10, fontWeight: '800' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          {stats.map((s) => (
            <View key={s.label} style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 12, padding: 12, alignItems: 'center',
            }}>
              <Ionicons name={s.icon as any} size={20} color={COLORS.white} />
              <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '800', marginTop: 4 }}>{s.value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2, textAlign: 'center' }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />}
      >
        {/* Active visit banner */}
        {activeRequest && (
          <TouchableOpacity
            onPress={() => handleNavPress('RequestDetail')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={activeRequest.status === 'APPROVED' ? [COLORS.primary, COLORS.primaryLight] : ['#F59E0B','#D97706']}
              style={{
                borderRadius: 16, padding: 16, marginBottom: 20,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: 'rgba(255,255,255,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons
                  name={activeRequest.status === 'APPROVED' ? 'qr-code' : 'time'}
                  size={22}
                  color={COLORS.white}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 15 }}>
                  {activeRequest.status === 'APPROVED' ? t('active_visit') : t('pending_visit')}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                  {activeRequest.schedule?.startTime ? formatDate(activeRequest.schedule.startTime) : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick actions */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 14 }}>
          {t('quick_actions')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => handleNavPress(a.screen)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={{
                flex: 1,
                backgroundColor: COLORS.white,
                borderRadius: 14, padding: 16,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: `${a.color}15`,
                alignItems: 'center', justifyContent: 'center', marginBottom: 8,
              }}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' }}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent requests */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>{t('recent_requests')}</Text>
          <TouchableOpacity onPress={() => handleNavPress('MyRequests')}>
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>{t('see_all')} →</Text>
          </TouchableOpacity>
        </View>

        {isLoading
          ? [1,2,3].map(i => <VisitRequestSkeleton key={i} />)
          : requestsData?.data?.length === 0
            ? <EmptyState
                icon="calendar-outline"
                title={t('no_requests')}
                description="Book your first visit to get started."
                actionLabel={t('book_visit')}
                onAction={() => handleNavPress('BookVisit')}
              />
            : requestsData?.data?.map((req) => (
                <VisitRequestCard
                  key={req.id}
                  request={req}
                  onPress={() => navigation.navigate('RequestDetail', { id: req.id })}
                />
              ))
        }
      </ScrollView>
    </View>
  );
};
