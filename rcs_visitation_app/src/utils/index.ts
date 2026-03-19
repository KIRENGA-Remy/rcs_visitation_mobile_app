import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';

export const formatDate = (d: string | Date): string => {
  try { return format(new Date(d), 'EEE, MMM d, yyyy'); }
  catch { return '—'; }
};

export const formatTime = (d: string | Date): string => {
  try { return format(new Date(d), 'h:mm a'); }
  catch { return '—'; }
};

export const formatDateTime = (d: string | Date): string => {
  try { return format(new Date(d), 'MMM d, yyyy · h:mm a'); }
  catch { return '—'; }
};

export const formatSmartDate = (d: string | Date): string => {
  try {
    const date = new Date(d);
    if (isToday(date))     return `Today ${format(date, 'h:mm a')}`;
    if (isTomorrow(date))  return `Tomorrow ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Yesterday ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  } catch { return '—'; }
};

export const timeAgo = (d: string | Date): string => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return '—'; }
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const getInitials = (firstName: string, lastName: string): string => {
  const f = firstName?.[0]?.toUpperCase() ?? '';
  const l = lastName?.[0]?.toUpperCase() ?? '';
  return `${f}${l}` || 'U';
};

export const getFullName = (firstName: string, lastName: string): string =>
  `${firstName ?? ''} ${lastName ?? ''}`.trim();

export const avatarColor = (name: string): string => {
  const colors = ['#1F5D3A','#D4AF37','#3B82F6','#8B5CF6','#EF4444','#F59E0B','#10B981','#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const truncate = (s: string, n = 80): string =>
  s?.length > n ? `${s.slice(0, n)}…` : s ?? '';

export const extractApiError = (err: any): string => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return 'Something went wrong. Please try again.';
};

export const isPast = (d: string | Date): boolean => new Date(d) < new Date();

export const capitalize = (s: string): string =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

export const formatRefNumber = (ref: string): string =>
  ref?.toUpperCase().slice(0, 12) ?? '—';
