import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import { NavigationContainer }    from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { RootNavigator }       from '@navigation/RootNavigator';
import { OfflineBanner }       from '@components/common/OfflineBanner';
import { usePushNotifications }from '@hooks/usePushNotifications';
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

// ── Toast config — styled with RCS theme ─────────────────────────────────
const toastConfig = {
  success: ({ text1, text2 }: any) => null,
  error:   ({ text1, text2 }: any) => null,
  info:    ({ text1, text2 }: any) => null,
};

// ── Inner component so hooks can run inside providers ─────────────────────
const AppInner: React.FC = () => {
  usePushNotifications(); // register channels + listeners
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
        translucent={Platform.OS === 'android'}
      />
      <RootNavigator />
      <OfflineBanner />
      <Toast
        position="top"
        topOffset={Platform.OS === 'android' ? 40 : 56}
        visibilityTime={3500}
      />
    </>
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
