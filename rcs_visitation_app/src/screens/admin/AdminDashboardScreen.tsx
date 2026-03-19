import React, { useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StatusBar, TouchableOpacity, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { StatCardSkeleton } from '@components/common/Skeleton';
import { Avatar } from '@components/common/Avatar';
import { COLORS, QUERY_KEYS } from '@constants';
import { useAuthStore } from '@stores/authStore';
import { useNotificationStore } from '@stores/notificationStore';
import { useTranslation } from '@hooks/useTranslation';
import { reportsApi } from '@api/reports';

export const AdminDashboardScreen: React.FC = () => {
  const navigation      = useNavigation<any>();
  const { user }        = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { t }           = useTranslation();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.OVERVIEW,
    queryFn:  reportsApi.overview,
    staleTime: 60 * 1000,
  });

  const statCards = useMemo(() => [
    { label: t('total_prisons'),     value: stats?.prisons?.total ?? 0,           icon: 'business',         color: COLORS.primary  },
    { label: t('active_prisoners'),  value: stats?.prisoners?.active ?? 0,         icon: 'people',           color: COLORS.info     },
    { label: t('total_visitors'),    value: stats?.users?.visitors ?? 0,           icon: 'person-add',       color: COLORS.accent   },
    { label: t('today_checkins'),    value: stats?.todayCheckins ?? 0,             icon: 'enter',            color: COLORS.success  },
    { label: t('pending_requests'),  value: stats?.visitRequests?.pending ?? 0,    icon: 'time',             color: COLORS.warning  },
    { label: t('flagged_incidents'), value: stats?.flaggedIncidents ?? 0,          icon: 'alert-circle',     color: COLORS.error    },
  ], [stats, t]);

  const menuItems = useMemo(() => [
    { label: t('manage_users'),     icon: 'people-outline',        screen: 'Users',       color: COLORS.info,    desc: 'View and manage all accounts' },
    { label: t('manage_prisoners'), icon: 'person-outline',        screen: 'Prisoners',   color: COLORS.primary, desc: 'Register and transfer prisoners' },
    { label: t('visit_schedules'),  icon: 'calendar-outline',      screen: 'Schedules',   color: COLORS.accent,  desc: 'Manage visiting time slots' },
    { label: t('reports'),          icon: 'bar-chart-outline',     screen: 'Reports',     color: COLORS.success, desc: 'Analytics and insights' },
    { label: t('visit_logs'),       icon: 'document-text-outline', screen: 'AdminLogs',   color: COLORS.warning, desc: 'Review all visit records' },
    { label: t('notifications'),    icon: 'notifications-outline', screen: 'Notifications', color: COLORS.error, desc: 'Send alerts and broadcasts' },
  ], [t]);

  const handleNavPress = useCallback((screen: string) => navigation.navigate(screen), [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={{ paddingTop: 52, paddingBottom: 28, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar firstName={user?.firstName ?? ''} lastName={user?.lastName ?? ''} size={42} />
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                {t('admin_dashboard')}
              </Text>
              <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: '800' }}>
                {user?.firstName} {user?.lastName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success }} />
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>System Online</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleNavPress('Notifications')}
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
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
        }
      >
        {/* Stats */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 14 }}>
          {t('platform_overview')}
        </Text>

        {isLoading
          ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
              {[1,2,3,4,5,6].map(i => <StatCardSkeleton key={i} />)}
            </View>
          : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
              {statCards.map((s) => (
                <View key={s.label} style={{
                  width: '47%',
                  backgroundColor: COLORS.white,
                  borderRadius: 14, padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
                }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: `${s.color}15`,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                  }}>
                    <Ionicons name={s.icon as any} size={18} color={s.color} />
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text }}>
                    {s.value}
                  </Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
        }

        {/* Management menu */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 14 }}>
          {t('management')}
        </Text>
        <View style={{ gap: 10 }}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => handleNavPress(item.screen)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 14, padding: 16,
                flexDirection: 'row', alignItems: 'center', gap: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: `${item.color}15`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                  {item.desc}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};
