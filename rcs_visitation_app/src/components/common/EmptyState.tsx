import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'document-outline', title, description, actionLabel, onAction,
}) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <View style={{
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: `${COLORS.primary}15`,
      alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    }}>
      <Ionicons name={icon as any} size={36} color={COLORS.primary} />
    </View>
    <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 8 }}>
      {title}
    </Text>
    {description && (
      <Text style={{ fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
        {description}
      </Text>
    )}
    {actionLabel && onAction && (
      <Button title={actionLabel} onPress={onAction} size="md" />
    )}
  </View>
);
