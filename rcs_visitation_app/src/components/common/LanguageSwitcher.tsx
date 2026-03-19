import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants';
import { useAuthStore } from '@stores/authStore';

export const LanguageSwitcher: React.FC<{ style?: any }> = ({ style }) => {
  const { language, setLanguage } = useAuthStore();

  return (
    <View style={[{ flexDirection: 'row', gap: 8, alignItems: 'center' }, style]}>
      <Ionicons name="language-outline" size={16} color={COLORS.textMuted} />
      {(['en', 'rw'] as const).map((lang) => (
        <TouchableOpacity
          key={lang}
          onPress={() => setLanguage(lang)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: language === lang ? COLORS.primary : COLORS.surface,
            borderWidth: 1.5,
            borderColor: language === lang ? COLORS.primary : COLORS.border,
          }}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '700',
            color: language === lang ? COLORS.white : COLORS.textMuted,
            textTransform: 'uppercase',
          }}>
            {lang === 'en' ? 'EN' : 'RW'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
