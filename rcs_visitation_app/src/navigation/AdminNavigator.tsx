import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AdminDashboardScreen } from '@screens/admin/AdminDashboardScreen';
import { UsersScreen }          from '@screens/admin/UsersScreen';
import { CreateOfficerScreen }  from '@screens/admin/CreateOfficerScreen';
import { CreateAdminScreen }    from '@screens/admin/CreateAdminScreen';
import { PrisonersScreen }      from '@screens/admin/PrisonersScreen';
import { PrisonerDetailScreen } from '@screens/admin/PrisonerDetailScreen';
import { PrisonerFormScreen }   from '@screens/admin/PrisonerFormScreen';
import { SchedulesScreen }      from '@screens/admin/SchedulesScreen';
import { ScheduleFormScreen }   from '@screens/admin/ScheduleFormScreen';
import { ReportsScreen }          from '@screens/admin/ReportsScreen';
import { SubmittedReportsScreen } from '@screens/admin/SubmittedReportsScreen';
import { RequestReportScreen }    from '@screens/admin/RequestReportScreen';
import { ReportViewerScreen }     from '@screens/shared/ReportViewerScreen';
import { NotificationsScreen }  from '@screens/shared/NotificationsScreen';
import { NotificationDetailScreen } from '@screens/shared/NotificationDetailScreen';
import { ProfileScreen }        from '@screens/shared/ProfileScreen';
import { HelpSupportScreen }    from '@screens/shared/HelpSupportScreen';
import { AboutScreen }          from '@screens/shared/AboutScreen';
import { EditProfileScreen }         from '@screens/shared/EditProfileScreen';
import { ChangePasswordScreen }      from '@screens/shared/ChangePasswordScreen';
import { NotificationSettingsScreen } from '@screens/shared/NotificationSettingsScreen';
import { PrivacySecurityScreen }     from '@screens/shared/PrivacySecurityScreen';
import { COLORS } from '@constants';
import { useNotificationStore } from '@stores/notificationStore';
import type { AdminTabParamList, AdminStackParamList } from './types';

const Tab   = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

const AdminTabs: React.FC = () => {
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
            Dashboard:     ['home', 'home-outline'],
            Users:         ['people', 'people-outline'],
            Notifications: ['notifications', 'notifications-outline'],
            Profile:       ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipsis-horizontal', 'ellipsis-horizontal-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Users"     component={UsersScreen}          options={{ title: 'Users' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{
        title: 'Alerts',
        tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
        tabBarBadgeStyle: { backgroundColor: COLORS.accent, color: COLORS.black, fontSize: 10, fontWeight: '800' },
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const AdminNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminTabs"      component={AdminTabs} />
    <Stack.Screen name="CreateOfficer"  component={CreateOfficerScreen} />
    <Stack.Screen name="CreateAdmin"    component={CreateAdminScreen} />
    <Stack.Screen name="Prisoners"      component={PrisonersScreen} />
    <Stack.Screen name="PrisonerDetail" component={PrisonerDetailScreen} />
    <Stack.Screen name="PrisonerForm"   component={PrisonerFormScreen} />
    <Stack.Screen name="Schedules"      component={SchedulesScreen} />
    <Stack.Screen name="ScheduleForm"   component={ScheduleFormScreen} />
    <Stack.Screen name="Reports"          component={ReportsScreen} />
    <Stack.Screen name="SubmittedReports" component={SubmittedReportsScreen} />
    <Stack.Screen name="RequestReport"    component={RequestReportScreen} />
    <Stack.Screen name="ReportViewer"     component={ReportViewerScreen} />
    <Stack.Screen name="Notifications"  component={NotificationsScreen} />
    <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
    <Stack.Screen name="Profile"        component={ProfileScreen} />
    <Stack.Screen name="Help"           component={HelpSupportScreen} />
    <Stack.Screen name="About"          component={AboutScreen} />
    <Stack.Screen name="EditProfile"          component={EditProfileScreen} />
    <Stack.Screen name="ChangePassword"       component={ChangePasswordScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="PrivacySecurity"      component={PrivacySecurityScreen} />
  </Stack.Navigator>
);
