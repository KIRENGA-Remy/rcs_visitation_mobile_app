import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, StatusBar, Animated, TouchableOpacity, AccessibilityInfo
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { LanguageSwitcher } from '@components/common/LanguageSwitcher';
import { COLORS } from '@constants';
import { useLogin } from '@hooks/useAuth';
import { useTranslation } from '@hooks/useTranslation';
import { extractApiError } from '@utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { t }                     = useTranslation();
  const { mutate: login, isPending } = useLogin();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const schema = yup.object({
    emailOrPhone: yup.string().required(t('required')),
    password:     yup.string().required(t('required')),
  });

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { emailOrPhone: '', password: '' },
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const onSubmit = (data: any) => {
    login(data, {
      onError: (err) => Toast.show({
        type: 'error',
        text1: t('login_failed'),
        text2: extractApiError(err),
      }),
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{
            width: 64, height: 64, borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Ionicons name="shield-checkmark" size={34} color={COLORS.white} />
          </View>
          <LanguageSwitcher />
        </View>
        <Text
          style={{ color: COLORS.white, fontSize: 26, fontWeight: '800', marginBottom: 4 }}
          accessibilityRole="header"
        >
          {t('sign_in_title')}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{t('sign_in_sub')}</Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.white }}
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 24, marginTop: 8 }}>
            {t('sign_in')}
          </Text>

          <Controller control={control} name="emailOrPhone" render={({ field: { onChange, value } }) => (
            <Input
              label={t('email_or_phone')}
              placeholder="+250788... or name@example.com"
              value={value}
              onChangeText={onChange}
              leftIcon="person-outline"
              error={errors.emailOrPhone?.message}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel={t('email_or_phone')}
              accessibilityHint="Enter your email address or phone number"
            />
          )} />

          <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
            <Input
              label={t('password')}
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              leftIcon="lock-closed-outline"
              secureTextEntry
              error={errors.password?.message}
              accessibilityLabel={t('password')}
            />
          )} />

          <Button
            title={t('sign_in')}
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            style={{ marginTop: 8, marginBottom: 20 }}
            size="lg"
            accessibilityLabel={t('sign_in')}
            accessibilityRole="button"
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={{ alignItems: 'center', paddingVertical: 8 }}
            accessibilityRole="button"
          >
            <Text style={{ color: COLORS.textMuted, fontSize: 15 }}>
              {t('no_account')}{'  '}
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{t('register')}</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
