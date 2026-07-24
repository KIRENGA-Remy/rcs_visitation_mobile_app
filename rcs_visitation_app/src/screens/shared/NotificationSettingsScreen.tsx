import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StatusBar, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '@components/common/Card';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { useTranslation } from '@hooks/useTranslation';

const STORAGE_KEY = 'rcs_notification_prefs';

type Prefs = {
  visitStatus: boolean;   // approved / rejected
  reminders: boolean;     // upcoming visit reminders
  checkInOut: boolean;    // checked-in / completed
  systemAlerts: boolean;  // contact request decisions, broadcasts
};

const DEFAULT_PREFS: Prefs = { visitStatus: true, reminders: true, checkInOut: true, systemAlerts: true };

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      setLoaded(true);
    });
  }, []);

  const toggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const rows: { key: keyof Prefs; icon: string; label: string; desc: string }[] = [
    { key: 'visitStatus', icon: 'checkmark-circle-outline', label: 'Visit Status Updates', desc: 'When a request is approved or rejected' },
    { key: 'reminders',   icon: 'time-outline',             label: 'Visit Reminders',      desc: 'Reminders before an approved visit' },
    { key: 'checkInOut',  icon: 'log-in-outline',            label: 'Check-in / Check-out', desc: 'When a visit is checked in or completed' },
    { key: 'systemAlerts',icon: 'megaphone-outline',         label: 'System Alerts',        desc: 'Contact request decisions and announcements' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title={t('notif_settings')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16, lineHeight: 19 }}>
          Choose which categories you want to see highlighted in your notifications list on this device.
        </Text>

        <Card variant="elevated">
          {loaded && rows.map((row, idx) => (
            <View
              key={row.key}
              style={{
                flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
                borderBottomWidth: idx < rows.length - 1 ? 1 : 0, borderBottomColor: COLORS.border,
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 10, backgroundColor: `${COLORS.primary}10`,
                alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <Ionicons name={row.icon as any} size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>{row.label}</Text>
                <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{row.desc}</Text>
              </View>
              <Switch
                value={prefs[row.key]}
                onValueChange={() => toggle(row.key)}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
              />
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
};
