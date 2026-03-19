import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  backgroundColor?: string;
  light?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title, subtitle, onBack, rightElement,
  backgroundColor = COLORS.primary, light = true,
}) => {
  const insets = useSafeAreaInsets();
  const textColor = light ? COLORS.white : COLORS.text;

  return (
    <View style={{
      backgroundColor,
      paddingTop: insets.top + 12,
      paddingBottom: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{title}</Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: light ? 'rgba(255,255,255,0.75)' : COLORS.textMuted, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
};
