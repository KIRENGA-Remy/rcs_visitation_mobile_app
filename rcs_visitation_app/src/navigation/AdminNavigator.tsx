import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminDashboardScreen } from '@screens/admin/AdminDashboardScreen';
import { UsersScreen }          from '@screens/admin/UsersScreen';
import { PrisonersScreen }      from '@screens/admin/PrisonersScreen';
import { SchedulesScreen }      from '@screens/admin/SchedulesScreen';
import { ReportsScreen }        from '@screens/admin/ReportsScreen';
import { VisitLogsScreen }      from '@screens/officer/VisitLogsScreen';
import { NotificationsScreen }  from '@screens/shared/NotificationsScreen';
import { ProfileScreen }        from '@screens/shared/ProfileScreen';
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="Users"          component={UsersScreen} />
    <Stack.Screen name="Prisoners"      component={PrisonersScreen} />
    <Stack.Screen name="Schedules"      component={SchedulesScreen} />
    <Stack.Screen name="Reports"        component={ReportsScreen} />
    <Stack.Screen name="AdminLogs"      component={VisitLogsScreen} />
    <Stack.Screen name="Notifications"  component={NotificationsScreen} />
    <Stack.Screen name="Profile"        component={ProfileScreen} />
  </Stack.Navigator>
);
