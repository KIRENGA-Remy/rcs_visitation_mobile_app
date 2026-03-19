import Constants from 'expo-constants';

export const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) ??
  'http://192.168.1.100:3000/api/v1';

export const COLORS = {
  primary:      '#1F5D3A',
  primaryDark:  '#174D30',
  primaryLight: '#2E7D52',
  accent:       '#D4AF37',
  accentLight:  '#E5C55A',
  accentDark:   '#B8942A',
  white:        '#FFFFFF',
  black:        '#000000',
  text:         '#111827',
  textMuted:    '#6B7280',
  textLight:    '#9CA3AF',
  surface:      '#F8F9FA',
  surfaceAlt:   '#F1F5F9',
  border:       '#E5E7EB',
  success:      '#10B981',
  warning:      '#F59E0B',
  error:        '#EF4444',
  info:         '#3B82F6',
  overlay:      'rgba(0,0,0,0.5)',
} as const;

export const FONTS = {
  regular:   'System',
  medium:    'System',
  semibold:  'System',
  bold:      'System',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm:   6,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING:    { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  APPROVED:   { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  REJECTED:   { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  CANCELLED:  { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  CHECKED_IN: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  COMPLETED:  { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  NO_SHOW:    { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  EXPIRED:    { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  OPEN:       { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  FULL:       { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  ACTIVE:     { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  RESTRICTED: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  SUSPENDED:  { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
};

export const VISIT_TYPE_LABELS: Record<string, string> = {
  REGULAR:  'Regular Visit',
  LEGAL:    'Legal Visit',
  MEDICAL:  'Medical Visit',
  OFFICIAL: 'Official Visit',
};

export const INCIDENT_LABELS: Record<string, string> = {
  NONE:         'No Incident',
  CONTRABAND:   'Contraband Found',
  BEHAVIOUR:    'Disruptive Behaviour',
  OVERSTAY:     'Overstay',
  UNAUTHORIZED: 'Unauthorized Entry',
  OTHER:        'Other',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN:   'rcs_access_token',
  REFRESH_TOKEN:  'rcs_refresh_token',
  USER:           'rcs_user',
} as const;

export const QUERY_KEYS = {
  ME:               ['auth', 'me'],
  PRISONS:          ['prisons'],
  PRISON:           (id: string) => ['prisons', id],
  PRISONERS:        ['prisoners'],
  PRISONER:         (id: string) => ['prisoners', id],
  SCHEDULES:        ['schedules'],
  MY_REQUESTS:      ['visit-requests', 'my'],
  VISIT_REQUEST:    (id: string) => ['visit-requests', id],
  PRISON_REQUESTS:  (prisonId: string) => ['visit-requests', 'prison', prisonId],
  VISIT_LOGS:       ['visit-logs'],
  VISIT_LOG:        (id: string) => ['visit-logs', id],
  NOTIFICATIONS:    ['notifications'],
  UNREAD_COUNT:     ['notifications', 'unread'],
  MY_VISITOR:       ['visitors', 'me'],
  OVERVIEW:         ['reports', 'overview'],
  DAILY_VISITS:     ['reports', 'daily'],
  PEAK_HOURS:       ['reports', 'peak'],
  PRISONER_ACTIVITY:['reports', 'activity'],
  USERS:            ['users'],
} as const;
