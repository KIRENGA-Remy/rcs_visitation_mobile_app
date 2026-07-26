import React, { useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StatusBar, TouchableOpacity, RefreshControl, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { VisitRequestCard } from '@components/common/VisitRequestCard';
import { VisitRequestSkeleton, StatCardSkeleton } from '@components/common/Skeleton';
import { EmptyState } from '@components/common/EmptyState';
import { Avatar } from '@components/common/Avatar';
import { COLORS, QUERY_KEYS } from '@constants';
import { useAuthStore } from '@stores/authStore';
import { useNotificationStore } from '@stores/notificationStore';
import { useTranslation } from '@hooks/useTranslation';
import { useLogout } from '@hooks/useAuth';
import { reportsApi } from '@api/reports';
import { visitRequestsApi } from '@api/visitRequests';

export const OfficerDashboardScreen: React.FC = () => {
  const navigation    = useNavigation<any>();
  const { user }      = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { t }         = useTranslation();
  const { mutate: logout } = useLogout();

  const handleLogout = useCallback(() => {
    Alert.alert(t('sign_out'), t('sign_out_confirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('sign_out'),
        style: 'destructive',
        onPress: () => logout(undefined, {
          onSuccess: () => Toast.show({ type: 'success', text1: t('success') }),
        }),
      },
    ]);
  }, [t, logout]);

  const { data: overview, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: QUERY_KEYS.OVERVIEW,
    queryFn:  reportsApi.overview,
    staleTime: 60 * 1000,
  });

  const { data: pendingData, isLoading: requestsLoading, refetch: refetchReqs, isRefetching } = useQuery({
    queryKey: ['visit-requests', 'prison-pending'],
    queryFn:  () => visitRequestsApi.byPrison('', { status: 'PENDING', limit: 5 }),
    staleTime: 30 * 1000,
  });

  const refresh = useCallback(() => { refetchStats(); refetchReqs(); }, []);

  const statCards = useMemo(() => [
    { label: 'Contact Requests',     value: overview?.pendingContactRequests ?? 0,    icon: 'person-add',   color: COLORS.accent  },
    { label: t('pending_requests'),  value: overview?.visitRequests?.pending ?? 0,    icon: 'time',          color: COLORS.warning },
    { label: t('APPROVED'),          value: overview?.visitRequests?.approvedToday ?? 0, icon: 'checkmark-circle', color: COLORS.success },
    { label: t('today_checkins'),    value: overview?.todayCheckins ?? 0,             icon: 'enter',         color: COLORS.primary },
  ], [overview, t]);

  const quickActions = useMemo(() => [
    { label: t('scan_qr'),     icon: 'qr-code',       screen: 'ScanQR',          color: COLORS.primary },
    { label: 'Contact Requests', icon: 'person-add',  screen: 'ContactRequests', color: COLORS.accent },
    { label: t('check_out'),   icon: 'exit',           screen: 'PendingRequests', params: { initialTab: 'CHECKED_IN' }, color: COLORS.info },
    { label: t('visit_logs'), icon: 'document-text',  screen: 'VisitLogs',       color: COLORS.success },
    { label: 'My Reports',    icon: 'folder-open',     screen: 'MyReports',       color: COLORS.info },
    { label: 'Visit Schedules', icon: 'calendar',      screen: 'Schedules',       color: COLORS.warning },
    { label: t('profile'),    icon: 'person-circle',  screen: 'Profile',         color: COLORS.textMuted },
  ], [t]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={{ paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('profile')}
          >
            <Avatar firstName={user?.firstName ?? ''} lastName={user?.lastName ?? ''} photoUrl={user?.profilePhoto} size={42} />
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{t('officer_dashboard')}</Text>
              <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '800' }}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={{ position: 'relative', padding: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('notifications')}
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
            {/* Officers handle sensitive records — logout must be a single,
               always-visible tap from the dashboard, same as every other role. */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{ padding: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('sign_out')}
            >
              <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats grid */}
        {statsLoading
          ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[1,2,3,4,5].map(i => (
                <View key={i} style={{ width: '47%', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, height: 88 }} />
              ))}
            </View>
          : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {statCards.map((s) => (
                <View key={s.label} style={{
                  width: '47%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 12, padding: 14,
                }}>
                  <Ionicons name={s.icon as any} size={20} color={COLORS.white} />
                  <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: '800', marginTop: 6 }}>
                    {s.value}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
        }
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refresh} tintColor={COLORS.primary} />
        }
      >
        {/* Quick actions */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => navigation.navigate(a.screen, (a as any).params)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              style={{
                width: '31%',
                backgroundColor: COLORS.white,
                borderRadius: 14, padding: 12,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
              }}
            >
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: `${a.color}15`,
                alignItems: 'center', justifyContent: 'center', marginBottom: 6,
              }}>
                <Ionicons name={a.icon as any} size={20} color={a.color} />
              </View>
              <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.text, textAlign: 'center' }}>
                {a.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending requests */}
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 14,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
            {t('pending_requests')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PendingRequests')}>
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '600' }}>
              {t('see_all')} →
            </Text>
          </TouchableOpacity>
        </View>

        {requestsLoading
          ? [1,2].map(i => <VisitRequestSkeleton key={i} />)
          : (pendingData?.data ?? []).length === 0
            ? (
              <View style={{
                alignItems: 'center', padding: 24,
                backgroundColor: COLORS.white, borderRadius: 14,
              }}>
                <Ionicons name="checkmark-done-circle" size={40} color={COLORS.success} />
                <Text style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 8 }}>
                  No pending requests
                </Text>
              </View>
            )
            : (pendingData?.data ?? []).map((req) => (
                <VisitRequestCard
                  key={req.id}
                  request={req}
                  showVisitor
                  onPress={() => navigation.navigate('ReviewRequest', { id: req.id })}
                />
              ))
        }
      </ScrollView>
    </View>
  );
};
