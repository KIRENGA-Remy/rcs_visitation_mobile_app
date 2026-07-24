import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OfficerDashboardScreen } from '@screens/officer/OfficerDashboardScreen';
import { PendingRequestsScreen }  from '@screens/officer/PendingRequestsScreen';
import { ContactRequestsScreen }  from '@screens/officer/ContactRequestsScreen';
import { ReviewRequestScreen }    from '@screens/officer/ReviewRequestScreen';
import { ScanQRScreen }           from '@screens/officer/ScanQRScreen';
import { CheckInScreen }          from '@screens/officer/CheckInScreen';
import { CheckOutScreen }         from '@screens/officer/CheckOutScreen';
import { VisitLogsScreen }        from '@screens/officer/VisitLogsScreen';
import { NotificationsScreen }    from '@screens/shared/NotificationsScreen';
import { ProfileScreen }          from '@screens/shared/ProfileScreen';
import { HelpSupportScreen }      from '@screens/shared/HelpSupportScreen';
import { AboutScreen }            from '@screens/shared/AboutScreen';
import { EditProfileScreen }         from '@screens/shared/EditProfileScreen';
import { ChangePasswordScreen }      from '@screens/shared/ChangePasswordScreen';
import { NotificationSettingsScreen } from '@screens/shared/NotificationSettingsScreen';
import { PrivacySecurityScreen }     from '@screens/shared/PrivacySecurityScreen';
import type { OfficerStackParamList } from './types';

const Stack = createNativeStackNavigator<OfficerStackParamList>();

export const OfficerNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OfficerDashboard" component={OfficerDashboardScreen} />
    <Stack.Screen name="PendingRequests"  component={PendingRequestsScreen} />
    <Stack.Screen name="ContactRequests"  component={ContactRequestsScreen} />
    <Stack.Screen name="ReviewRequest"    component={ReviewRequestScreen} />
    <Stack.Screen name="ScanQR"           component={ScanQRScreen} />
    <Stack.Screen name="CheckIn"          component={CheckInScreen} />
    <Stack.Screen name="CheckOut"         component={CheckOutScreen} />
    <Stack.Screen name="VisitLogs"        component={VisitLogsScreen} />
    <Stack.Screen name="Notifications"    component={NotificationsScreen} />
    <Stack.Screen name="Profile"          component={ProfileScreen} />
    <Stack.Screen name="Help"             component={HelpSupportScreen} />
    <Stack.Screen name="About"            component={AboutScreen} />
    <Stack.Screen name="EditProfile"          component={EditProfileScreen} />
    <Stack.Screen name="ChangePassword"       component={ChangePasswordScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="PrivacySecurity"      component={PrivacySecurityScreen} />
  </Stack.Navigator>
);
