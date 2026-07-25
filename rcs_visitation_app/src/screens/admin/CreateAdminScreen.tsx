import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { Card } from '@components/common/Card';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS, QUERY_KEYS } from '@constants';
import { usersApi } from '@api/users';
import { extractApiError } from '@utils';

/**
 * Deliberately a SEPARATE screen from CreateOfficerScreen — not the same
 * form with a role toggle. Two independent code paths, front-to-back
 * (schema, service, route, and screen), so there's no shared "role" field
 * anywhere that a misclick or bug could set wrong. See user.schema.ts on
 * the backend for the full reasoning.
 */
export const CreateAdminScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [saving, setSaving] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      Toast.show({ type: 'error', text1: 'Name, email, and phone are required' });
      return;
    }
    setSaving(true);
    setFallbackOtp(null);
    try {
      const result = await usersApi.createAdmin({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        nationalId: nationalId || undefined,
      });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS });

      if (result.emailSent) {
        Toast.show({ type: 'success', text1: 'Admin account created', text2: 'Setup code emailed to them.' });
        navigation.goBack();
      } else {
        setFallbackOtp(result.setupOtp ?? null);
        Toast.show({ type: 'error', text1: 'Admin created, but the email failed to send' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Could not create admin', text2: extractApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title="New Admin Account" subtitle="They'll set their own password via email" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Card variant="outlined" style={{ borderColor: COLORS.warning, backgroundColor: '#FFFBEB', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons name="shield-outline" size={20} color={COLORS.warning} />
            <Text style={{ flex: 1, color: '#92400E', fontSize: 12, lineHeight: 17 }}>
              This grants full administrative access — the same level you have. Only create an
              admin account for someone who genuinely needs it.
            </Text>
          </View>
        </Card>

        {fallbackOtp && (
          <Card variant="outlined" style={{ borderColor: COLORS.warning, backgroundColor: '#FFFBEB', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 13, marginBottom: 4 }}>
                  Email delivery failed
                </Text>
                <Text style={{ color: '#92400E', fontSize: 12, marginBottom: 8 }}>
                  Give this code to them directly. It expires in 30 minutes.
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

        <Button title="Create Admin Account" onPress={handleCreate} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
};
