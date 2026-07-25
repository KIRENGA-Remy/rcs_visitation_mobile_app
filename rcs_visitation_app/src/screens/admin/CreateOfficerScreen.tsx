import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { usersApi } from '@api/users';
import { prisonsApi } from '@api/prisons';
import { extractApiError } from '@utils';

/**
 * Admin creates a Prison Officer account with no password of its own — an
 * emailed one-time code (via free Gmail SMTP delivery, see
 * shared/services/email.service.ts on the backend) lets the officer set
 * their own password the first time they open the app. If email delivery
 * fails for any reason, the response includes the raw code so the admin
 * has a fallback way to give it to the officer directly.
 */
export const CreateOfficerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [prisonId, setPrisonId] = useState('');
  const [saving, setSaving] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);

  const { data: prisonsData } = useQuery({
    queryKey: ['prisons', 'all'],
    queryFn: () => prisonsApi.list({ limit: 100 }),
  });

  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      Toast.show({ type: 'error', text1: 'Name, email, and phone are required' });
      return;
    }
    setSaving(true);
    setFallbackOtp(null);
    try {
      const result = await usersApi.createOfficer({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        nationalId: nationalId || undefined,
        assignedPrisonId: prisonId || undefined,
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS });

      if (result.emailSent) {
        Toast.show({ type: 'success', text1: 'Officer created', text2: 'Setup code emailed to them.' });
        navigation.goBack();
      } else {
        // Email delivery failed — keep the admin on this screen with the
        // code visible so the account isn't left unreachable.
        setFallbackOtp(result.setupOtp ?? null);
        Toast.show({ type: 'error', text1: 'Officer created, but the email failed to send' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Could not create officer', text2: extractApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="New Officer Account" subtitle="They'll set their own password via email" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {fallbackOtp && (
          <Card variant="outlined" style={{ borderColor: COLORS.warning, backgroundColor: '#FFFBEB', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 13, marginBottom: 4 }}>
                  Email delivery failed
                </Text>
                <Text style={{ color: '#92400E', fontSize: 12, marginBottom: 8 }}>
                  Give this code to the officer directly (e.g. by phone). It expires in 30 minutes.
                </Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.text, letterSpacing: 4 }}>
                  {fallbackOtp}
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Input label="First Name *" value={firstName} onChangeText={setFirstName} leftIcon="person-outline" />
        <Input label="Last Name *" value={lastName} onChangeText={setLastName} leftIcon="person-outline" />
        <Input label="Email *" value={email} onChangeText={setEmail} leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" hint="Their setup code will be sent here" />
        <Input label="Phone *" value={phone} onChangeText={setPhone} leftIcon="call-outline" keyboardType="phone-pad" />
        <Input label="National ID" value={nationalId} onChangeText={setNationalId} leftIcon="card-outline" />

        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Assign Facility (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {prisonsData?.data?.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setPrisonId(prisonId === p.id ? '' : p.id)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                  backgroundColor: prisonId === p.id ? COLORS.primary : COLORS.white,
                  borderWidth: 1.5, borderColor: prisonId === p.id ? COLORS.primary : COLORS.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: prisonId === p.id ? COLORS.white : COLORS.text }}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Button title="Create Officer Account" onPress={handleCreate} loading={saving} />
      </ScrollView>
    </View>
  );
};
