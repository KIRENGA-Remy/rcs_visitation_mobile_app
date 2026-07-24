import React, { useState } from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { authApi } from '@api/auth';
import { useTranslation } from '@hooks/useTranslation';
import { extractApiError } from '@utils';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
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

  const handleSubmit = async () => {
    if (!currentPassword) {
      Toast.show({ type: 'error', text1: 'Current password is required' });
      return;
    }
    if (!validate()) return;

    setSaving(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      Toast.show({ type: 'success', text1: 'Password changed', text2: 'Use your new password next time you sign in.' });
      navigation.goBack();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Could not change password', text2: extractApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title={t('change_password')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20, lineHeight: 19 }}>
          Choose a new password with at least 8 characters, including one uppercase letter and one number.
        </Text>

        <Input
          label="Current Password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          leftIcon="lock-closed-outline"
        />
        <Input
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          leftIcon="key-outline"
          error={errors.newPassword}
        />
        <Input
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          leftIcon="key-outline"
          error={errors.confirmPassword}
        />

        <Button title="Change Password" onPress={handleSubmit} loading={saving} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
};
