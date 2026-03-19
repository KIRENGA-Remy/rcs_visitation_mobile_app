import React from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, StatusBar, TouchableOpacity
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
import { useRegister } from '@hooks/useAuth';
import { useTranslation } from '@hooks/useTranslation';
import { extractApiError } from '@utils';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@navigation/types';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'> };

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { t }                        = useTranslation();
  const { mutate: register, isPending } = useRegister();

  const schema = yup.object({
    firstName:       yup.string().min(2, t('min_2_chars')).required(t('required')),
    lastName:        yup.string().min(2, t('min_2_chars')).required(t('required')),
    email:           yup.string().email(t('invalid_email')).required(t('required')),
    phone:           yup.string().matches(/^\+?[0-9]{10,15}$/, t('invalid_phone')).required(t('required')),
    nationalId:      yup.string().optional(),
    password:        yup.string()
      .min(8,                       t('password_min'))
      .matches(/[A-Z]/,             t('password_upper'))
      .matches(/[0-9]/,             t('password_number'))
      .required(t('required')),
    confirmPassword: yup.string()
      .oneOf([yup.ref('password')], t('passwords_match'))
      .required(t('required')),
  });

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '',
      phone: '', nationalId: '', password: '', confirmPassword: '',
    },
  });

  const onSubmit = (data: any) => {
    const { confirmPassword, ...dto } = data;
    register(
      { ...dto, role: 'VISITOR' as any },
      {
        onError: (err) => Toast.show({
          type:  'error',
          text1: t('reg_failed'),
          text2: extractApiError(err),
        }),
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        style={{ paddingTop: 50, paddingBottom: 24, paddingHorizontal: 24 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <LanguageSwitcher />
        </View>
        <Text
          style={{ color: COLORS.white, fontSize: 24, fontWeight: '800' }}
          accessibilityRole="header"
        >
          {t('register_title')}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
          {t('register_sub')}
        </Text>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.white }}
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="firstName" render={({ field: { onChange, value } }) => (
              <Input
                label={t('first_name')}
                placeholder="Jean"
                value={value}
                onChangeText={onChange}
                leftIcon="person-outline"
                error={errors.firstName?.message}
                accessibilityLabel={t('first_name')}
              />
            )} />
          </View>
          <View style={{ flex: 1 }}>
            <Controller control={control} name="lastName" render={({ field: { onChange, value } }) => (
              <Input
                label={t('last_name')}
                placeholder="Mugisha"
                value={value}
                onChangeText={onChange}
                error={errors.lastName?.message}
                accessibilityLabel={t('last_name')}
              />
            )} />
          </View>
        </View>

        <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
          <Input
            label={t('email')}
            placeholder="your@email.rw"
            value={value}
            onChangeText={onChange}
            leftIcon="mail-outline"
            error={errors.email?.message}
            autoCapitalize="none"
            keyboardType="email-address"
            accessibilityLabel={t('email')}
          />
        )} />

        <Controller control={control} name="phone" render={({ field: { onChange, value } }) => (
          <Input
            label={t('phone')}
            placeholder="+250788000000"
            value={value}
            onChangeText={onChange}
            leftIcon="call-outline"
            error={errors.phone?.message}
            keyboardType="phone-pad"
            accessibilityLabel={t('phone')}
          />
        )} />

        <Controller control={control} name="nationalId" render={({ field: { onChange, value } }) => (
          <Input
            label={`${t('national_id')} (${t('cancel').toLowerCase()})`}
            placeholder="1XXXX..."
            value={value ?? ''}
            onChangeText={onChange}
            leftIcon="card-outline"
            error={errors.nationalId?.message}
            keyboardType="number-pad"
            accessibilityLabel={t('national_id')}
          />
        )} />

        <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
          <Input
            label={t('password')}
            placeholder="Min 8 chars, uppercase & number"
            value={value}
            onChangeText={onChange}
            leftIcon="lock-closed-outline"
            secureTextEntry
            error={errors.password?.message}
            accessibilityLabel={t('password')}
          />
        )} />

        <Controller control={control} name="confirmPassword" render={({ field: { onChange, value } }) => (
          <Input
            label={t('confirm_password')}
            placeholder="••••••••"
            value={value}
            onChangeText={onChange}
            leftIcon="lock-closed-outline"
            secureTextEntry
            error={errors.confirmPassword?.message}
            accessibilityLabel={t('confirm_password')}
          />
        )} />

        <Button
          title={t('register_title')}
          onPress={handleSubmit(onSubmit)}
          loading={isPending}
          size="lg"
          style={{ marginTop: 8, marginBottom: 20 }}
          accessibilityLabel={t('register')}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ alignItems: 'center', paddingVertical: 8 }}
          accessibilityRole="button"
        >
          <Text style={{ color: COLORS.textMuted, fontSize: 15 }}>
            {t('have_account')}{'  '}
            <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{t('sign_in')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
