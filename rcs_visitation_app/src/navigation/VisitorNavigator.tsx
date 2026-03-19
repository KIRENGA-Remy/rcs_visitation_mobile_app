import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { VisitorHomeScreen }     from '@screens/visitor/HomeScreen';
import { MyRequestsScreen }      from '@screens/visitor/MyRequestsScreen';
import { RequestDetailScreen }   from '@screens/visitor/RequestDetailScreen';
import { BookVisitScreen }       from '@screens/visitor/BookVisitScreen';
import { NotificationsScreen }   from '@screens/shared/NotificationsScreen';
import { ProfileScreen }         from '@screens/shared/ProfileScreen';
import { COLORS } from '@constants';
import { useNotificationStore }  from '@stores/notificationStore';
import type { VisitorTabParamList, VisitorStackParamList } from './types';

const Tab   = createBottomTabNavigator<VisitorTabParamList>();
const Stack = createNativeStackNavigator<VisitorStackParamList>();

const VisitorTabs: React.FC = () => {
  const { unreadCount } = useNotificationStore();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, [string, string]> = {
            Home:          ['home',          'home-outline'],
            MyRequests:    ['list',          'list-outline'],
            Notifications: ['notifications', 'notifications-outline'],
            Profile:       ['person',        'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipsis-horizontal', 'ellipsis-horizontal-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"          component={VisitorHomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="MyRequests"    component={MyRequestsScreen}  options={{ title: 'Requests' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{
        title: 'Alerts',
        tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
        tabBarBadgeStyle: { backgroundColor: COLORS.accent, color: COLORS.black, fontSize: 10, fontWeight: '800' },
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const VisitorNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VisitorTabs"    component={VisitorTabs} />
    <Stack.Screen name="BookVisit"      component={BookVisitScreen} />
    <Stack.Screen name="RequestDetail"  component={RequestDetailScreen} />
    <Stack.Screen name="Notifications"  component={NotificationsScreen} />
    <Stack.Screen name="Profile"        component={ProfileScreen} />
  </Stack.Navigator>
);
