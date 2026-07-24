import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@components/common/Card';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { useAuthStore } from '@stores/authStore';
import { useTranslation } from '@hooks/useTranslation';

const VISITOR_FAQS = [
  { q: 'How do I request to visit someone for the first time?',
    a: 'Go to Who I Can Visit and tap the "+" button (or Book a Visit if you have no approved visits yet). Select the prison, search for the prisoner, choose your relationship, and submit. An officer or admin will review it.' },
  { q: 'Why was my visit request rejected?',
    a: 'Open the request in My Requests to see the rejection reason left by the reviewing officer. Common reasons include an unverifiable relationship or a scheduling conflict — you can submit a new request once the issue is resolved.' },
  { q: 'What do I need to bring on visit day?',
    a: 'Bring a valid National ID matching the one on your account, and be ready to show the QR code for your approved visit from the Visit Details screen.' },
  { q: 'How early should I arrive?',
    a: 'You can check in up to 15 minutes before your scheduled slot. Arriving after your slot\'s end time will mark the visit as a no-show.' },
  { q: 'Can I cancel a visit request?',
    a: 'Yes — open the request from My Requests and use the cancel option, if available for its current status.' },
];

const OFFICER_FAQS = [
  { q: 'How do I check a visitor out if I forgot to note them at check-in?',
    a: 'Go to Pending Requests and switch to the "Today" tab — it lists everyone currently checked in at your facility, regardless of which officer checked them in.' },
  { q: 'What happens when I flag an incident at check-out?',
    a: 'It marks the visit log as flagged for review and is included in the facility\'s incident reporting shown to Admins.' },
  { q: 'Where do I review new contact requests?',
    a: 'From your dashboard, tap "Contact Requests" — this is separate from visit request approvals and covers whether a visitor should be linked to a prisoner at all.' },
];

const ADMIN_FAQS = [
  { q: 'How do I transfer a prisoner to another facility?',
    a: 'Open Manage Prisoners, select the prisoner, and use the transfer action. Any pending or approved visit requests for the old facility are automatically cancelled.' },
  { q: 'How do I restrict visits for a prisoner?',
    a: 'From the prisoner\'s profile, use the restrict-visits action with a reason and optional end date.' },
  { q: 'Where do system-wide visit records live?',
    a: 'Visit Logs gives a full audit trail of check-ins, check-outs, and flagged incidents across all facilities.' },
];

export const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = user?.role === 'ADMIN' ? ADMIN_FAQS
    : user?.role === 'PRISON_OFFICER' ? OFFICER_FAQS
    : VISITOR_FAQS;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title={t('help')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Frequently Asked Questions
        </Text>

        {faqs.map((item, idx) => (
          <Card key={item.q} variant="flat" style={{ marginBottom: 10 }}>
            <TouchableOpacity
              onPress={() => setOpenIndex(openIndex === idx ? null : idx)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text, flex: 1, paddingRight: 12 }}>
                {item.q}
              </Text>
              <Ionicons name={openIndex === idx ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
            {openIndex === idx && (
              <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 10, lineHeight: 19 }}>
                {item.a}
              </Text>
            )}
          </Card>
        ))}

        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginTop: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Still Need Help?
        </Text>

        <Card variant="elevated">
          <TouchableOpacity
            onPress={() => Linking.openURL('tel:+250792441050')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
          >
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>Call Support</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>+250 792 441 050</Text>
            </View>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />
          <TouchableOpacity
            onPress={() => Linking.openURL('mailto:gitoliremy@gmail.com')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
          >
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>Email Support</Text>
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}>gitoliremy@gmail.com</Text>
            </View>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
};
