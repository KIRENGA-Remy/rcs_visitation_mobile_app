import React from 'react';
import { View, Text, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import { NavigationContainer }    from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { RootNavigator }       from '@navigation/RootNavigator';
import { OfflineBanner }       from '@components/common/OfflineBanner';
import { usePushNotifications }from '@hooks/usePushNotifications';
import { useAutoLogout }       from '@hooks/useAutoLogout';
import { COLORS }              from '@constants';

// ── React Query client — optimised for mobile ────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                  2,
      retryDelay:             (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime:              30_000,
      gcTime:                 5 * 60 * 1000,
      refetchOnWindowFocus:   false,
      refetchOnReconnect:     true,   // refetch when network comes back
    },
    mutations: {
      retry: 0,
    },
  },
});

const TOAST_STYLES: Record<string, { bg: string; accent: string; icon: string }> = {
  success: { bg: COLORS.white, accent: COLORS.success, icon: 'checkmark-circle' },
  error:   { bg: COLORS.white, accent: COLORS.error,   icon: 'alert-circle' },
  info:    { bg: COLORS.white, accent: COLORS.info,    icon: 'information-circle' },
};

const ToastBody: React.FC<{ type: string; text1?: string; text2?: string }> = ({ type, text1, text2 }) => {
  const style = TOAST_STYLES[type] ?? TOAST_STYLES.info;
  return (
    <View style={{
      width: '92%', backgroundColor: style.bg, borderRadius: 14,
      borderLeftWidth: 4, borderLeftColor: style.accent,
      paddingVertical: 12, paddingHorizontal: 14,
      flexDirection: 'row', gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
    }}>
      <Ionicons name={style.icon as any} size={20} color={style.accent} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        {!!text1 && (
          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: text1 ? 2 : 0, lineHeight: 18 }}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
};

const toastConfig = {
  success: ({ text1, text2 }: any) => <ToastBody type="success" text1={text1} text2={text2} />,
  error:   ({ text1, text2 }: any) => <ToastBody type="error"   text1={text1} text2={text2} />,
  info:    ({ text1, text2 }: any) => <ToastBody type="info"    text1={text1} text2={text2} />,
};

// ── Inner component so hooks can run inside providers ─────────────────────
const AppInner: React.FC = () => {
  usePushNotifications(); // register channels + listeners
  const { registerActivity } = useAutoLogout(); // enforce idle-based session timeout

  return (
    <View style={{ flex: 1 }} onTouchStart={registerActivity}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
        translucent={Platform.OS === 'android'}
      />
      <RootNavigator />
      <OfflineBanner />
      <Toast
        config={toastConfig}
        position="top"
        topOffset={Platform.OS === 'android' ? 40 : 56}
        visibilityTime={4500}
      />
    </View>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <AppInner />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
