import React, { useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StatusBar, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Avatar } from '@components/common/Avatar';
import { VisitRequestCard } from '@components/common/VisitRequestCard';
import { EmptyState } from '@components/common/EmptyState';
import { VisitRequestSkeleton } from '@components/common/Skeleton';
import { COLORS, QUERY_KEYS } from '@constants';
import { useAuthStore } from '@stores/authStore';
import { useNotificationStore } from '@stores/notificationStore';
import { useTranslation } from '@hooks/useTranslation';
import { useLogout } from '@hooks/useAuth';
import { visitRequestsApi } from '@api/visitRequests';
import { formatDate } from '@utils';
import { scheduleVisitReminder } from '@hooks/usePushNotifications';

export const VisitorHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, language } = useAuthStore();
  const { unreadCount }    = useNotificationStore();
  const { t }              = useTranslation();
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

  const { data: requestsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [...QUERY_KEYS.MY_REQUESTS, { limit: 5 }],
    queryFn:  () => visitRequestsApi.myRequests({ limit: 5 }),
    staleTime: 30 * 1000,
  });

  // Real aggregate counts across ALL of the visitor's requests — the stat
  // row previously derived these by filtering only the 5 most recently
  // fetched requests, which undercounted anything beyond that page and
  // never reflected pending contact requests at all (a visitor who'd only
  // submitted a "request to visit" — not yet an actual visit booking — saw
  // every stat sitting at 0 with no indication their submission existed).
  const { data: stats24, refetch: refetchStats } = useQuery({
    queryKey: ['visit-requests', 'my-stats'],
    queryFn: visitRequestsApi.myStats,
    staleTime: 30 * 1000,
  });

  // React Query only refetches on mount or explicit pull-to-refresh by
  // default — it has no way to know a request got approved/rejected on the
  // officer's device while this screen just sat open. Refetching on every
  // focus (not just first mount) means returning to this tab after
  // approving/rejecting elsewhere always shows current numbers, not
  // whatever was cached from before.
  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchStats();
    }, [refetch, refetchStats])
  );

  // Memoised to avoid recalculating on every render
  const activeRequest = useMemo(
    () => requestsData?.data?.find(r => ['PENDING','APPROVED','CHECKED_IN'].includes(r.status)),
    [requestsData?.data]
  );

  const stats = useMemo(() => [
    // Pending = pending visit-request bookings + pending contact requests
    // (requests to be approved to visit someone at all) combined into one
    // "things awaiting review" figure, since both represent the visitor
    // waiting to hear back about something they submitted.
    { label: t('PENDING'),         value: (stats24?.pending ?? 0) + (stats24?.pendingContactRequests ?? 0), icon: 'time',            color: COLORS.warning },
    { label: t('completed_visits'),value: stats24?.completed ?? 0,  icon: 'checkmark-done',   color: COLORS.success },
    { label: t('APPROVED'),        value: stats24?.approved ?? 0,   icon: 'checkmark-circle', color: COLORS.primary },
    { label: t('rejected'),        value: stats24?.rejected ?? 0,   icon: 'close-circle',     color: COLORS.error   },
  ], [stats24, language]);

  const quickActions = useMemo(() => [
    { label: t('book_visit'),   icon: 'add-circle',  color: COLORS.primary, screen: 'BookVisit' },
    { label: t('my_requests'),  icon: 'list',         color: COLORS.info,    screen: 'MyRequests' },
    { label: t('my_contacts'),  icon: 'people',        color: COLORS.accent,  screen: 'Contacts' },
    { label: t('profile'),      icon: 'person',       color: COLORS.accent,  screen: 'Profile' },
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
            <Avatar firstName={user?.firstName ?? ''} lastName={user?.lastName ?? ''} photoUrl={user?.profilePhoto} size={44} />
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{t('welcome_back')}</Text>
              <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '700' }}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
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
            {/* Logout is reachable directly from the dashboard, not just
               buried inside Profile — a quick, deliberate way out at all times. */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{ padding: 8 }}
              accessibilityLabel={t('sign_out')}
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
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
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); refetchStats(); }} tintColor={COLORS.primary} />}
      >
        {/* Upcoming visit — styled like a ticket stub (the actual real-world
            object this represents: an admission ticket to a scheduled
            visit) rather than a generic gradient banner with an icon pill. */}
        {activeRequest && (() => {
          // BUG FIX: this used to only ever distinguish APPROVED from
          // "everything else", so a request that had actually progressed
          // to CHECKED_IN still displayed as "AWAITING APPROVAL" — showing
          // stale/wrong status for a visit that was already underway.
          const statusMeta = {
            PENDING:    { accent: '#D97706',        icon: 'time',            label: 'AWAITING APPROVAL' },
            APPROVED:   { accent: COLORS.primary,    icon: 'checkmark-circle', label: 'APPROVED — READY TO VISIT' },
            CHECKED_IN: { accent: COLORS.info,       icon: 'enter',           label: 'CHECKED IN — ENJOY YOUR VISIT' },
          }[activeRequest.status as 'PENDING' | 'APPROVED' | 'CHECKED_IN']
            ?? { accent: '#D97706', icon: 'time', label: 'AWAITING APPROVAL' };
          const { accent, icon, label } = statusMeta;
          const scheduleDate = activeRequest.schedule?.startTime ? new Date(activeRequest.schedule.startTime) : null;
          const prisonerName = activeRequest.prisoner
            ? `${activeRequest.prisoner.firstName} ${activeRequest.prisoner.lastName}` : '—';

          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('RequestDetail', { id: activeRequest.id })}
              activeOpacity={0.9}
              style={{
                flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16,
                marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
              }}
            >
              {/* Ticket stub */}
              <View style={{ width: 68, backgroundColor: accent, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
                  {scheduleDate?.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() ?? '—'}
                </Text>
                <Text style={{ color: COLORS.white, fontSize: 24, fontWeight: '800', marginTop: 1 }}>
                  {scheduleDate?.getDate() ?? '—'}
                </Text>
              </View>

              {/* Perforated divider — real dashed border, evokes a tear-off ticket edge */}
              <View style={{ borderLeftWidth: 1.5, borderStyle: 'dashed', borderColor: `${accent}55` }} />

              <View style={{ flex: 1, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name={icon as any} size={13} color={accent} />
                  <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 }}>
                    {label}
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }} numberOfLines={1}>
                  Visiting {prisonerName}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }} numberOfLines={1}>
                  {activeRequest.schedule?.prison?.name ?? '—'}
                  {scheduleDate ? ` · ${scheduleDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
                </Text>
              </View>

              <View style={{ justifyContent: 'center', paddingRight: 14 }}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
              </View>
            </TouchableOpacity>
          );
        })()}

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
