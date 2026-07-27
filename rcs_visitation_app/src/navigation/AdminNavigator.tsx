import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import type { AdminStackParamList } from './types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="Users"          component={UsersScreen} />
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
