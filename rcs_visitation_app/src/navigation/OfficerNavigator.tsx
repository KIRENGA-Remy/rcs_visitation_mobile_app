import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { OfficerDashboardScreen } from '@screens/officer/OfficerDashboardScreen';
import { PendingRequestsScreen }  from '@screens/officer/PendingRequestsScreen';
import { ContactRequestsScreen }  from '@screens/officer/ContactRequestsScreen';
import { MyReportsScreen }        from '@screens/officer/MyReportsScreen';
import { ReportUploadScreen }     from '@screens/officer/ReportUploadScreen';
import { SchedulesScreen }        from '@screens/admin/SchedulesScreen';
import { ScheduleFormScreen }     from '@screens/admin/ScheduleFormScreen';
import { ReportViewerScreen }     from '@screens/shared/ReportViewerScreen';
import { ReviewRequestScreen }    from '@screens/officer/ReviewRequestScreen';
import { ScanQRScreen }           from '@screens/officer/ScanQRScreen';
import { CheckInScreen }          from '@screens/officer/CheckInScreen';
import { CheckOutScreen }         from '@screens/officer/CheckOutScreen';
import { VisitLogsScreen }        from '@screens/officer/VisitLogsScreen';
import { NotificationsScreen }    from '@screens/shared/NotificationsScreen';
import { NotificationDetailScreen } from '@screens/shared/NotificationDetailScreen';
import { ProfileScreen }          from '@screens/shared/ProfileScreen';
import { HelpSupportScreen }      from '@screens/shared/HelpSupportScreen';
import { AboutScreen }            from '@screens/shared/AboutScreen';
import { EditProfileScreen }         from '@screens/shared/EditProfileScreen';
import { ChangePasswordScreen }      from '@screens/shared/ChangePasswordScreen';
import { NotificationSettingsScreen } from '@screens/shared/NotificationSettingsScreen';
import { PrivacySecurityScreen }     from '@screens/shared/PrivacySecurityScreen';
import { COLORS } from '@constants';
import { useNotificationStore } from '@stores/notificationStore';
import type { OfficerTabParamList, OfficerStackParamList } from './types';

const Tab   = createBottomTabNavigator<OfficerTabParamList>();
const Stack = createNativeStackNavigator<OfficerStackParamList>();

const OfficerTabs: React.FC = () => {
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
            Dashboard:       ['home', 'home-outline'],
            PendingRequests: ['list', 'list-outline'],
            Notifications:   ['notifications', 'notifications-outline'],
            Profile:         ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['ellipsis-horizontal', 'ellipsis-horizontal-outline'];
          return <Ionicons name={(focused ? active : inactive) as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard"       component={OfficerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="PendingRequests" component={PendingRequestsScreen}  options={{ title: 'Requests' }} />
      <Tab.Screen name="Notifications"   component={NotificationsScreen}    options={{
        title: 'Alerts',
        tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
        tabBarBadgeStyle: { backgroundColor: COLORS.accent, color: COLORS.black, fontSize: 10, fontWeight: '800' },
      }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const OfficerNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OfficerTabs"      component={OfficerTabs} />
    <Stack.Screen name="ContactRequests"  component={ContactRequestsScreen} />
    <Stack.Screen name="MyReports"        component={MyReportsScreen} />
    <Stack.Screen name="ReportUpload"     component={ReportUploadScreen} />
    <Stack.Screen name="Schedules"        component={SchedulesScreen} />
    <Stack.Screen name="ScheduleForm"     component={ScheduleFormScreen} />
    <Stack.Screen name="ReportViewer"     component={ReportViewerScreen} />
    <Stack.Screen name="ReviewRequest"    component={ReviewRequestScreen} />
    <Stack.Screen name="ScanQR"           component={ScanQRScreen} />
    <Stack.Screen name="CheckIn"          component={CheckInScreen} />
    <Stack.Screen name="CheckOut"         component={CheckOutScreen} />
    <Stack.Screen name="VisitLogs"        component={VisitLogsScreen} />
    <Stack.Screen name="Notifications"    component={NotificationsScreen} />
    <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
    <Stack.Screen name="Profile"          component={ProfileScreen} />
    <Stack.Screen name="Help"             component={HelpSupportScreen} />
    <Stack.Screen name="About"            component={AboutScreen} />
    <Stack.Screen name="EditProfile"          component={EditProfileScreen} />
    <Stack.Screen name="ChangePassword"       component={ChangePasswordScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="PrivacySecurity"      component={PrivacySecurityScreen} />
  </Stack.Navigator>
);
