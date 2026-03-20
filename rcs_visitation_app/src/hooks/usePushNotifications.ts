import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '@stores/authStore';
import { useNotificationStore } from '@stores/notificationStore';
import client from '../api/client'; // adjust to your actual api client import

// ─── Foreground notification behaviour ───────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const usePushNotifications = () => {
  const { user }         = useAuthStore();
  const { increment }    = useNotificationStore();

  // FIX 1: Type as Notifications.EventSubscription (not any)
  const notifListener    = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    // FIX 2: registerForPushNotifications now returns the token
    //        and we save it to the backend
    registerForPushNotifications()
      .then(async (token) => {
        if (!token) return;

        // FIX 4: Save the token to your backend so the server can send pushes
        try {
          await client.patch('/users/push-token', { expoPushToken: token });
        } catch (err) {
          // Non-fatal — app still works, just won't receive remote push
          console.warn('[PushNotifications] Could not save token to backend:', err);
        }
      })
      .catch((err) =>
        console.warn('[PushNotifications] Registration error:', err)
      );

    // Notification received while app is in foreground
    notifListener.current =
      Notifications.addNotificationReceivedListener(() => {
        increment();
      });

    // User tapped a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        console.log('[PushNotifications] Tapped:', data);
        // Add deep-link / navigation logic here if needed
      });

    return () => {
      // FIX 1: .remove() is the correct modern API
      //        Notifications.removeNotificationSubscription() was removed
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);

  return null;
};

// ─── Registration ──────────────────────────────────────────────────────────────
const registerForPushNotifications = async (): Promise<string | null> => {
  // Push tokens only work on real physical devices
  if (!Device.isDevice) {
    console.warn('[PushNotifications] Skipped — not a physical device');
    return null;
  }

  // ── Permissions ──
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[PushNotifications] Permission denied');
    return null;
  }

  // ── Android notification channels ──
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rcs-default', {
      name:             'RCS Visitation',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#1F5D3A',
      sound:            'default',
    });

    await Notifications.setNotificationChannelAsync('rcs-alerts', {
      name:             'RCS Security Alerts',
      importance:       Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor:       '#EF4444',
      sound:            'default',
    });
  }

  // FIX 2 + 3: Get the Expo push token — this was MISSING entirely
  // projectId MUST be passed explicitly in expo-notifications >= 0.28
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.error(
      '[PushNotifications] projectId not found in app.json. ' +
      'Check expo.extra.eas.projectId is set.'
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[PushNotifications] Token obtained:', tokenData.data);
    return tokenData.data;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    // Gracefully handle Expo Go SDK 53+ limitation (non-fatal)
    if (
      message.includes('Expo Go') ||
      message.includes('development build') ||
      message.includes('removed')
    ) {
      console.warn(
        '[PushNotifications] Remote push not supported in Expo Go (SDK 53+). ' +
        'Build a development build to test push notifications: npx eas build --profile development'
      );
      return null;
    }

    console.error('[PushNotifications] getExpoPushTokenAsync failed:', error);
    return null;
  }
};

// ─── Local visit reminder ──────────────────────────────────────────────────────
/** Schedule a local reminder 24h before an approved visit */
export const scheduleVisitReminder = async (
  visitDate:    Date,
  prisonerName: string,
  prisonName:   string,
  lang:         'en' | 'rw' = 'en'
): Promise<void> => {
  const reminderTime = new Date(visitDate.getTime() - 24 * 60 * 60 * 1000);

  if (reminderTime <= new Date()) {
    console.warn('[VisitReminder] Reminder time already passed — skipping');
    return;
  }

  const title =
    lang === 'rw'
      ? "Ibutsa ry'Igusura — Ejo"
      : 'Visit Reminder — Tomorrow';

  const body =
    lang === 'rw'
      ? `Ufite igusura rya ${prisonerName} i ${prisonName} ejo.`
      : `You have a visit to ${prisonerName} at ${prisonName} tomorrow.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data:       { type: 'VISIT_REMINDER' },
      sound:      'default',
      categoryIdentifier: 'rcs-default',
    },
    // FIX 5: Newer SDK requires explicit type field in trigger
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
    },
  });
};

