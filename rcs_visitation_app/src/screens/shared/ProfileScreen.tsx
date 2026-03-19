import React from 'react';
import {
  View, Text, ScrollView, StatusBar, TouchableOpacity, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Card } from '@components/common/Card';
import { Avatar } from '@components/common/Avatar';
import { StatusBadge } from '@components/common/StatusBadge';
import { Button } from '@components/common/Button';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { COLORS } from '@constants';
import { useAuthStore } from '@stores/authStore';
import { useLogout } from '@hooks/useAuth';
import { useTranslation } from '@hooks/useTranslation';
import { formatDate } from '@utils';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user }   = useAuthStore();
  const { mutate: logout, isPending } = useLogout();
  const { t }      = useTranslation();

  const handleLogout = () => {
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
  };

  const menuItems = [
    { icon: 'person-outline',            label: t('edit_profile'),   onPress: () => {} },
    { icon: 'lock-closed-outline',       label: t('change_password'),onPress: () => {} },
    { icon: 'notifications-outline',     label: t('notif_settings'), onPress: () => {} },
    { icon: 'shield-checkmark-outline',  label: t('privacy'),        onPress: () => {} },
    { icon: 'help-circle-outline',       label: t('help'),           onPress: () => {} },
    { icon: 'information-circle-outline',label: t('about'),          onPress: () => {} },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={{ paddingTop: 52, paddingBottom: 32, paddingHorizontal: 20, alignItems: 'center' }}
      >
        <Avatar firstName={user?.firstName ?? ''} lastName={user?.lastName ?? ''} size={72} photoUrl={user?.profilePhoto} />
        <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '800', marginTop: 12 }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>{user?.email}</Text>
        <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
          <StatusBadge status={user?.role ?? ''} label={user?.role?.replace('_', ' ')} />
          <StatusBadge status={user?.status ?? ''} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

        {/* Language selector */}
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{t('language')}</Text>
            <LanguageSwitcher />
          </View>
        </Card>

        {/* Account info */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('account_info')}
          </Text>
          <View style={{ gap: 12 }}>
            {[
              { icon: 'call-outline',    label: 'Phone',       value: user?.phone ?? '—' },
              { icon: 'card-outline',    label: 'National ID', value: user?.nationalId ?? 'Not provided' },
              { icon: 'calendar-outline',label: 'Member Since',value: user?.createdAt ? formatDate(user.createdAt) : '—' },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name={item.icon as any} size={16} color={COLORS.textMuted} />
                <Text style={{ fontSize: 13, color: COLORS.textMuted, width: 90 }}>{item.label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1 }}>{item.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Menu items */}
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                borderBottomWidth: idx < menuItems.length - 1 ? 1 : 0,
                borderBottomColor: COLORS.border,
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: `${COLORS.primary}10`,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
              </View>
              <Text style={{ flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '500' }}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </Card>

        <Button
          title={t('sign_out')}
          onPress={handleLogout}
          variant="danger"
          loading={isPending}
          leftIcon={<Ionicons name="log-out-outline" size={18} color={COLORS.white} />}
        />

        <Text style={{ textAlign: 'center', color: COLORS.textLight, fontSize: 11, marginTop: 20 }}>
          RCS Visitation v1.0.0 · Rwanda Correctional Service
        </Text>
      </ScrollView>
    </View>
  );
};
