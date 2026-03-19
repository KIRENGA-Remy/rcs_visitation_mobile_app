import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OfficerDashboardScreen } from '@screens/officer/OfficerDashboardScreen';
import { PendingRequestsScreen }  from '@screens/officer/PendingRequestsScreen';
import { ReviewRequestScreen }    from '@screens/officer/ReviewRequestScreen';
import { ScanQRScreen }           from '@screens/officer/ScanQRScreen';
import { CheckInScreen }          from '@screens/officer/CheckInScreen';
import { CheckOutScreen }         from '@screens/officer/CheckOutScreen';
import { VisitLogsScreen }        from '@screens/officer/VisitLogsScreen';
import { NotificationsScreen }    from '@screens/shared/NotificationsScreen';
import { ProfileScreen }          from '@screens/shared/ProfileScreen';
import type { OfficerStackParamList } from './types';

const Stack = createNativeStackNavigator<OfficerStackParamList>();

export const OfficerNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OfficerDashboard" component={OfficerDashboardScreen} />
    <Stack.Screen name="PendingRequests"  component={PendingRequestsScreen} />
    <Stack.Screen name="ReviewRequest"    component={ReviewRequestScreen} />
    <Stack.Screen name="ScanQR"           component={ScanQRScreen} />
    <Stack.Screen name="CheckIn"          component={CheckInScreen} />
    <Stack.Screen name="CheckOut"         component={CheckOutScreen} />
    <Stack.Screen name="VisitLogs"        component={VisitLogsScreen} />
    <Stack.Screen name="Notifications"    component={NotificationsScreen} />
    <Stack.Screen name="Profile"          component={ProfileScreen} />
  </Stack.Navigator>
);
