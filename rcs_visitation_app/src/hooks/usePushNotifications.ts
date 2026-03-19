import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@stores/authStore';
import { useNotificationStore } from '@stores/notificationStore';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export const usePushNotifications = () => {
  const { user }               = useAuthStore();
  const { increment }          = useNotificationStore();
  const notifListener          = useRef<any>();
  const responseListener       = useRef<any>();

  useEffect(() => {
    if (!user) return;

    registerForPushNotifications();

    // Received while app is open
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      increment();
    });

    // User tapped a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      // Navigation handled separately via deep link if needed
    });

    return () => {
      if (notifListener.current)   Notifications.removeNotificationSubscription(notifListener.current);
      if (responseListener.current)Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [user?.id]);

  return null;
};

const registerForPushNotifications = async () => {
  if (!Device.isDevice) return; // Doesn't work in simulator

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rcs-default', {
      name:       'RCS Visitation',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1F5D3A',
      sound:      'default',
    });

    await Notifications.setNotificationChannelAsync('rcs-alerts', {
      name:       'RCS Security Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#EF4444',
      sound:      'default',
    });
  }
};

/** Schedule a local reminder notification (for approved visits) */
export const scheduleVisitReminder = async (
  visitDate: Date,
  prisonerName: string,
  prisonName: string,
  lang: 'en' | 'rw' = 'en'
) => {
  const reminderTime = new Date(visitDate.getTime() - 24 * 60 * 60 * 1000); // 24h before
  if (reminderTime < new Date()) return; // Already passed

  const title = lang === 'rw'
    ? 'Ibutsa ry\'Igusura — Ejo'
    : 'Visit Reminder — Tomorrow';
  const body  = lang === 'rw'
    ? `Ufite igusura rya ${prisonerName} i ${prisonName} ejo.`
    : `You have a visit to ${prisonerName} at ${prisonName} tomorrow.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data:  { type: 'VISIT_REMINDER' },
      sound: 'default',
    },
    trigger: { date: reminderTime },
  });
};
