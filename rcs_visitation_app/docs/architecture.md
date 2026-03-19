```markdown
# RCS Visitation Mobile App - Architecture
# Expo SDK 54 + React Native + TypeScript

## Project Folder Structure
rcs_visitation_app/
│
├── .expo/ ← Auto-generated Expo files
├── .expo-shared/ ← Expo shared config
│
├── assets/
│ ├── fonts/ ← Custom fonts
│ ├── images/ ← PNG, SVG assets
│ │ ├── icons/ ← App icons
│ │ ├── illustrations/ ← Empty states, onboarding
│ │ └── logo/ ← RCS logo variants
│ └── animations/ ← Lottie files
│
├── src/
│ ├── app/ ← App entry
│ │ ├── layout.tsx ← Root layout (Expo Router)
│ │ ├── index.tsx ← Home screen entry
│ │ └── +not-found.tsx ← 404 screen
│ │
│ ├── config/
│ │ ├── env.ts ← Environment variables (EXPO_PUBLIC*)
│ │ ├── api.ts ← Axios instance with interceptors
│ │ ├── queryClient.ts ← React Query client config
│ │ ├── navigation.ts ← Navigation linking config
│ │ └── constants.ts ← App constants (colors, storage keys)
│ │
│ ├── modules/ ← Feature-based modules
│ │ │
│ │ ├── auth/
│ │ │ ├── screens/
│ │ │ │ ├── LoginScreen.tsx
│ │ │ │ ├── RegisterScreen.tsx
│ │ │ │ ├── ForgotPasswordScreen.tsx
│ │ │ │ └── WelcomeScreen.tsx
│ │ │ ├── hooks/
│ │ │ │ ├── useAuth.ts ← Auth state (Zustand)
│ │ │ │ ├── useLogin.ts ← Login mutation
│ │ │ │ └── useRegister.ts ← Register mutation
│ │ │ ├── components/
│ │ │ │ ├── AuthForm.tsx
│ │ │ │ └── BiometricPrompt.tsx
│ │ │ ├── services/
│ │ │ │ └── authApi.ts ← API calls
│ │ │ └── types/
│ │ │ └── auth.types.ts
│ │ │
│ │ ├── home/
│ │ │ ├── screens/
│ │ │ │ ├── HomeScreen.tsx ← Visitor home
│ │ │ │ ├── OfficerDashboard.tsx
│ │ │ │ └── AdminDashboard.tsx
│ │ │ ├── components/
│ │ │ │ ├── UpcomingVisitCard.tsx
│ │ │ │ ├── StatsWidget.tsx
│ │ │ │ └── QuickActions.tsx
│ │ │ └── hooks/
│ │ │ └── useDashboard.ts
│ │ │
│ │ ├── prisons/
│ │ │ ├── screens/
│ │ │ │ ├── PrisonListScreen.tsx
│ │ │ │ ├── PrisonDetailScreen.tsx
│ │ │ │ └── PrisonMapScreen.tsx
│ │ │ ├── components/
│ │ │ │ ├── PrisonCard.tsx
│ │ │ │ ├── PrisonFilter.tsx
│ │ │ │ └── ScheduleCalendar.tsx
│ │ │ ├── hooks/
│ │ │ │ ├── usePrisons.ts
│ │ │ │ └── usePrisonDetail.ts
│ │ │ └── services/
│ │ │ └── prisonApi.ts
│ │ │
│ │ ├── prisoners/
│ │ │ ├── screens/
│ │ │ │ ├── PrisonerSearchScreen.tsx
│ │ │ │ └── PrisonerProfileScreen.tsx
│ │ │ ├── components/
│ │ │ │ ├── PrisonerCard.tsx
│ │ │ │ └── SearchBar.tsx
│ │ │ ├── hooks/
│ │ │ │ └── usePrisoners.ts
│ │ │ └── services/
│ │ │ └── prisonerApi.ts
│ │ │
│ │ ├── bookings/
│ │ │ ├── screens/
│ │ │ │ ├── BookingFlow/
│ │ │ │ │ ├── SelectPrisonScreen.tsx
│ │ │ │ │ ├── SelectPrisonerScreen.tsx
│ │ │ │ │ ├── SelectDateTimeScreen.tsx
│ │ │ │ │ ├── ReviewBookingScreen.tsx
│ │ │ │ │ └── ConfirmationScreen.tsx
│ │ │ │ ├── MyBookingsScreen.tsx
│ │ │ │ └── BookingDetailScreen.tsx
│ │ │ ├── components/
│ │ │ │ ├── BookingCard.tsx
│ │ │ │ ├── TimeSlotPicker.tsx
│ │ │ │ └── StatusBadge.tsx
│ │ │ ├── hooks/
│ │ │ │ ├── useBookings.ts
│ │ │ │ ├── useBookingRequest.ts
│ │ │ │ └── useBookingFlow.ts ← Zustand store for flow state
│ │ │ └── services/
│ │ │ └── bookingApi.ts
│ │ │
│ │ ├── qr/
│ │ │ ├── screens/
│ │ │ │ ├── QRCodeScreen.tsx ← Display QR
│ │ │ │ └── QRScannerScreen.tsx ← Scan QR (officer)
│ │ │ ├── hooks/
│ │ │ │ ├── useQRGenerator.ts
│ │ │ │ └── useQRScanner.ts
│ │ │ └── components/
│ │ │ └── QRCodeView.tsx
│ │ │
│ │ ├── officer/
│ │ │ ├── screens/
│ │ │ │ ├── PendingApprovalsScreen.tsx
│ │ │ │ ├── CheckInScreen.tsx
│ │ │ │ ├── VisitLogScreen.tsx
│ │ │ │ └── IncidentReportScreen.tsx
│ │ │ ├── components/
│ │ │ │ ├── ApprovalCard.tsx
│ │ │ │ └── VisitorDetailModal.tsx
│ │ │ └── hooks/
│ │ │ ├── useApprovals.ts
│ │ │ └── useCheckIn.ts
│ │ │
│ │ ├── admin/
│ │ │ ├── screens/
│ │ │ │ ├── AnalyticsScreen.tsx
│ │ │ │ ├── ManagePrisonsScreen.tsx
│ │ │ │ ├── ManagePrisonersScreen.tsx
│ │ │ │ └── ManageUsersScreen.tsx
│ │ │ ├── components/
│ │ │ │ ├── AnalyticsChart.tsx
│ │ │ │ └── DataTable.tsx
│ │ │ └── hooks/
│ │ │ └── useAnalytics.ts
│ │ │
│ │ ├── notifications/
│ │ │ ├── screens/
│ │ │ │ └── NotificationsScreen.tsx
│ │ │ ├── hooks/
│ │ │ │ ├── useNotifications.ts ← Expo notifications setup
│ │ │ │ └── usePushToken.ts
│ │ │ └── services/
│ │ │ └── notificationService.ts
│ │ │
│ │ └── profile/
│ │ ├── screens/
│ │ │ ├── ProfileScreen.tsx
│ │ │ ├── EditProfileScreen.tsx
│ │ │ └── SettingsScreen.tsx
│ │ ├── components/
│ │ │ └── ProfileHeader.tsx
│ │ └── hooks/
│ │ └── useProfile.ts
│ │
│ ├── navigation/
│ │ ├── types/
│ │ │ └── navigation.types.ts ← Param lists for all navigators
│ │ ├── RootNavigator.tsx ← Root stack
│ │ ├── AuthNavigator.tsx
│ │ ├── VisitorNavigator.tsx ← Bottom tabs + drawer
│ │ ├── OfficerNavigator.tsx
│ │ ├── AdminNavigator.tsx
│ │ └── linking.ts ← Deep linking config
│ │
│ ├── shared/
│ │ ├── components/
│ │ │ ├── ui/
│ │ │ │ ├── Button.tsx ← Reusable with variants
│ │ │ │ ├── Input.tsx ← Form input with validation
│ │ │ │ ├── Card.tsx
│ │ │ │ ├── Badge.tsx
│ │ │ │ ├── LoadingSpinner.tsx
│ │ │ │ ├── EmptyState.tsx
│ │ │ │ ├── ErrorBoundary.tsx
│ │ │ │ └── Toast.tsx
│ │ │ └── layout/
│ │ │ ├── ScreenWrapper.tsx
│ │ │ ├── Header.tsx
│ │ │ └── BottomSheet.tsx
│ │ │
│ │ ├── hooks/
│ │ │ ├── useTheme.ts ← Theme toggle (light/dark)
│ │ │ ├── useDebounce.ts
│ │ │ ├── useRefresh.ts ← Pull to refresh
│ │ │ └── useOfflineQueue.ts
│ │ │
│ │ ├── utils/
│ │ │ ├── storage.ts ← AsyncStorage wrapper
│ │ │ ├── dateFormatter.ts
│ │ │ ├── validation.ts ← Shared Yup schemas
│ │ │ ├── permissions.ts ← Camera, notifications
│ │ │ └── errorHandler.ts
│ │ │
│ │ ├── store/
│ │ │ ├── authStore.ts ← Zustand auth state
│ │ │ ├── themeStore.ts ← Theme preference
│ │ │ ├── offlineStore.ts ← Offline queue
│ │ │ └── uiStore.ts ← Loading, modal states
│ │ │
│ │ └── constants/
│ │ ├── colors.ts ← RCS brand colors
│ │ ├── roles.ts ← User roles
│ │ ├── status.ts ← Visit status enum
│ │ └── storageKeys.ts
│ │
│ ├── services/
│ │ ├── api/
│ │ │ ├── client.ts ← Axios config
│ │ │ ├── interceptors.ts ← Auth, logging
│ │ │ └── endpoints.ts ← API route constants
│ │ └── offline/
│ │ └── syncService.ts ← Offline sync logic
│ │
│ └── types/
│ ├── api.types.ts ← API response types
│ ├── models.types.ts ← Domain models
│ └── forms.types.ts ← Form schemas
│
├── .env ← Environment variables
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── app.json ← Expo config
├── babel.config.js
├── jest.config.js ← Jest setup
├── metro.config.js
├── package.json
├── tailwind.config.js ← NativeWind config
└── tsconfig.json