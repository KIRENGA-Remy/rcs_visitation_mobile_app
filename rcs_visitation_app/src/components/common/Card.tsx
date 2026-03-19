import React from 'react';
import { View, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '@constants';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated', padding = 16 }) => {
  const styles: Record<string, ViewStyle> = {
    default:  { backgroundColor: COLORS.white, borderRadius: RADIUS.lg },
    elevated: {
      backgroundColor: COLORS.white,
      borderRadius: RADIUS.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    outlined: {
      backgroundColor: COLORS.white,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    flat: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg },
  };

  return (
    <View style={[styles[variant], { padding }, style]}>
      {children}
    </View>
  );
};
