import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { COLORS } from '@constants';
import { usersApi } from '@api/users';
import { extractApiError } from '@utils';

/**
 * Public screen (reachable from Login, before any authentication) where an
 * officer whose account was created by an admin enters the one-time code
 * emailed to them and sets their own password for the first time.
 */
export const CompleteSetupScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (newPassword.length < 8) next.newPassword = 'Must be at least 8 characters';
    else if (!/[A-Z]/.test(newPassword)) next.newPassword = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(newPassword)) next.newPassword = 'Must contain a number';
    if (confirmPassword !== newPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleActivate = async () => {
    if (!email.trim() || otp.trim().length !== 6) {
      Toast.show({ type: 'error', text1: 'Enter your email and the 6-digit code' });
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      await usersApi.completeSetup(email.trim().toLowerCase(), otp.trim(), newPassword);
      Toast.show({ type: 'success', text1: 'Account activated', text2: 'You can now sign in with your new password.' });
      navigation.navigate('Login');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Activation failed', text2: extractApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <LinearGradient colors={[COLORS.primaryDark, COLORS.primary]} style={{ paddingTop: 60, paddingBottom: 28, paddingHorizontal: 20 }}>
        <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: '800' }}>Activate Account</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>
          Enter the code emailed to you and choose a password
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Input label="Email" value={email} onChangeText={setEmail} leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" />
        <Input label="6-Digit Code" value={otp} onChangeText={setOtp} leftIcon="key-outline" keyboardType="number-pad" maxLength={6} />
        <Input label="New Password" value={newPassword} onChangeText={setNewPassword} leftIcon="lock-closed-outline" secureTextEntry error={errors.newPassword} />
        <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} leftIcon="lock-closed-outline" secureTextEntry error={errors.confirmPassword} />

        <Button title="Activate Account" onPress={handleActivate} loading={saving} style={{ marginTop: 8 }} />

        <Text
          onPress={() => navigation.navigate('Login')}
          style={{ textAlign: 'center', color: COLORS.primary, fontSize: 13, fontWeight: '600', marginTop: 20 }}
        >
          Back to Sign In
        </Text>
      </ScrollView>
    </View>
  );
};
