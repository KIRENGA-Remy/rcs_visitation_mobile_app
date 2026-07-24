import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore }       from '@stores/authStore';
import { useNotificationStore } from '@stores/notificationStore';
import { notificationsApi }   from '@api/notifications';
import { SplashScreen }       from '@screens/auth/SplashScreen';
import { AuthNavigator }      from './AuthNavigator';
import { VisitorNavigator }   from './VisitorNavigator';
import { OfficerNavigator }   from './OfficerNavigator';
import { AdminNavigator }     from './AdminNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, isHydrated, hydrate } = useAuthStore();
  const { setUnreadCount }            = useNotificationStore();

  useEffect(() => {
    hydrate();
  }, []);

  // Poll unread count when logged in
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const count = await notificationsApi.unreadCount();
        setUnreadCount(count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  if (!isHydrated) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user.role === 'ADMIN' ? (
        <Stack.Screen name="Admin" component={AdminNavigator} />
      ) : user.role === 'PRISON_OFFICER' ? (
        <Stack.Screen name="Officer" component={OfficerNavigator} />
      ) : (
        <Stack.Screen name="Visitor" component={VisitorNavigator} />
      )}
    </Stack.Navigator>
  );
};
