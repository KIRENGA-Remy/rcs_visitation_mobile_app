import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@constants';
import { useAuthStore } from '@stores/authStore';
import type { UserRole } from '@types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Guards UI sections so they only render for permitted roles.
 * Use in addition to navigation-level guards (which already exist in navigators).
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children, fallback }) => {
  const { user } = useAuthStore();
  if (!user || !allowedRoles.includes(user.role)) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
};

/** Full-screen unauthorised block */
export const UnauthorisedScreen: React.FC = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, backgroundColor: COLORS.white }}>
    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
      <Ionicons name="lock-closed" size={36} color={COLORS.error} />
    </View>
    <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 10 }}>
      Access Denied
    </Text>
    <Text style={{ color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 }}>
      You do not have permission to view this screen.
    </Text>
  </View>
);
