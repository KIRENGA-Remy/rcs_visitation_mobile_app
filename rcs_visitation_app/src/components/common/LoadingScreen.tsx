import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { COLORS } from '@constants';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{ marginTop: 12, color: COLORS.textMuted, fontSize: 14 }}>{message}</Text>
  </View>
);
