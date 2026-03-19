import React from 'react';
import { View, Text } from 'react-native';
import { STATUS_COLORS } from '@constants';

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const colors = STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
  const displayLabel = label ?? status.replace(/_/g, ' ');

  return (
    <View style={{
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: size === 'sm' ? 8 : 12,
      paddingVertical: size === 'sm' ? 2 : 4,
      alignSelf: 'flex-start',
    }}>
      <Text style={{
        color: colors.text,
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: '700',
        letterSpacing: 0.4,
      }}>
        {displayLabel}
      </Text>
    </View>
  );
};
