import React from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card } from '@components/common/Card';
import { ScreenHeader } from '@components/common/ScreenHeader';
import { COLORS } from '@constants';
import { useTranslation } from '@hooks/useTranslation';

export const PrivacySecurityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const confirmDeleteRequest = () => {
    Alert.alert(
      'Request Account Deletion',
      'Account deletion must be confirmed by an administrator to preserve visit audit records required by RCS policy. Contact support to start this process.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Email Support', onPress: () => Linking.openURL('mailto:support@rcsvisitation.rw?subject=Account%20Deletion%20Request') },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScreenHeader title={t('privacy')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
            What We Store
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 20 }}>
            Your name, phone number, National ID, and visit history are stored to verify your identity
            and process visit requests. Your password is never stored in plain text — only a secure,
            one-way hash.
          </Text>
        </Card>

        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
            Who Can See Your Information
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 20 }}>
            Only prison officers and administrators reviewing your visit or contact requests can see your
            identity details. Other visitors never see your personal information.
          </Text>
        </Card>

        <Card variant="elevated" style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
            Account Security
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ChangePassword')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}
          >
            <Ionicons name="key-outline" size={18} color={COLORS.primary} />
            <Text style={{ fontSize: 13, color: COLORS.text, flex: 1 }}>Change your password</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 4 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
            <Ionicons name="phone-portrait-outline" size={18} color={COLORS.textMuted} />
            <Text style={{ fontSize: 13, color: COLORS.textMuted, flex: 1 }}>
              Sessions automatically expire after a period of inactivity, and can be ended at any time from the dashboard.
            </Text>
          </View>
        </Card>

        <TouchableOpacity onPress={confirmDeleteRequest} style={{ marginTop: 8 }}>
          <Text style={{ fontSize: 13, color: COLORS.error, textAlign: 'center', fontWeight: '600' }}>
            Request Account Deletion
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};
