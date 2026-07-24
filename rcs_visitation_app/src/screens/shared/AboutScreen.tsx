import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@components/common/Card';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { useTranslation } from '@hooks/useTranslation';

const APP_VERSION = '1.0.0';

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title={t('about')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 20, backgroundColor: `${COLORS.primary}15`,
            alignItems: 'center', justifyContent: 'center', marginBottom: 12,
          }}>
            <Ionicons name="shield-checkmark" size={36} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>RCS Visitation</Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>Version {APP_VERSION}</Text>
        </View>

        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
            Our Mission
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 20 }}>
            RCS Visitation digitises prison visit scheduling for Rwanda Correctional Service facilities —
            replacing manual, paper-based visit logging and in-person queuing with a structured
            request, approval, and check-in flow for visitors, officers, and administrators.
          </Text>
        </Card>

        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
            What This App Does
          </Text>
          {[
            { icon: 'person-add-outline', text: 'Request approval to visit a prisoner' },
            { icon: 'calendar-outline',    text: 'Book a visit against an available time slot' },
            { icon: 'qr-code-outline',     text: 'Generate a QR code for gate check-in' },
            { icon: 'notifications-outline', text: 'Notify you when a request is approved or rejected' },
          ].map((row) => (
            <View key={row.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Ionicons name={row.icon as any} size={18} color={COLORS.primary} />
              <Text style={{ fontSize: 13, color: COLORS.text, flex: 1 }}>{row.text}</Text>
            </View>
          ))}
        </Card>

        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
            Data & Privacy
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 20 }}>
            Your National ID is used solely to verify your identity before a visit. Visit records,
            documents, and personal information are only visible to authorised prison officers and
            administrators reviewing your requests.
          </Text>
        </Card>

        {/* <Text
          onPress={() => Linking.openURL('https://www.gov.rw')}
          style={{ fontSize: 12, color: COLORS.primary, textAlign: 'center', marginTop: 8 }}
        >
          Rwanda Correctional Service — gov.rw
        </Text> */}
      </ScrollView>
    </View>
  );
};
