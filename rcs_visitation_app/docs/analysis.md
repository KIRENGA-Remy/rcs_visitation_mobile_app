# RCS Visitation Mobile App - Domain Analysis

## Core User Flows

### Visitor Journey
1. **Registration/Login** → Create account with ID verification
2. **Browse Prisons** → View available prisons and visitation schedules
3. **Select Prisoner** → Search for prisoner by ID/name
4. **Book Visit** → Choose available time slot, submit request
5. **Receive Confirmation** → Get QR code + notification
6. **Visit Day** → Present QR code at entrance, check-in
7. **Post-Visit** → Rate experience, report issues

### Prison Officer Journey
1. **Login** → Secure authentication with role verification
2. **Dashboard** → View pending approvals, today's visits
3. **Manage Requests** → Approve/reject visit requests
4. **Check-in Visitors** → Scan QR codes, verify identity
5. **Log Visits** → Record start/end times, incidents
6. **View Reports** → Daily/weekly visitation statistics

### Admin Journey
1. **System Overview** → Analytics dashboard (peak times, trends)
2. **Manage Prisons** → Add/edit prison details, schedules
3. **Manage Prisoners** → Update prisoner status, transfers
4. **Configure Rules** → Set visitation limits, blackout dates
5. **User Management** → Approve officer accounts, manage roles

## Mobile-Specific Constraints

### Offline Capabilities
- App must cache: prison list, schedules, active visit requests
- Submit requests when online (queue offline actions)
- Store QR codes locally for offline presentation

### Device Features Used
- Camera: QR code scanning for check-in
- Notifications: Push alerts for status changes
- Biometrics: Fingerprint/face ID for quick login
- Location: Optional prison proximity check

### Performance Targets
- Cold start: < 3 seconds
- Screen transitions: < 300ms
- Offline mode: Full functionality for cached data
- Image loading: Progressive with placeholders

## State Management Requirements

### Server State (React Query)
- Visit requests list with real-time status
- Prison and prisoner data
- Schedule availability
- Notification history

### Client State (Zustand)
- Auth session + user profile
- Theme preferences (light/dark mode)
- Offline queue of pending actions
- UI state (selected filters, expanded sections)

### Local Storage (AsyncStorage)
- Auth tokens (encrypted)
- Cached API responses
- User preferences
- Offline action queue

## Navigation Structure
Root Stack
├── Auth Stack
│ ├── Welcome
│ ├── Login
│ ├── Register
│ └── ForgotPassword
│
├── Visitor Stack (Role: VISITOR)
│ ├── Bottom Tabs
│ │ ├── Home (Dashboard)
│ │ ├── Prisons (List/Map)
│ │ ├── Bookings (Active/History)
│ │ ├── QR Code (Digital Pass)
│ │ └── Profile (Settings)
│ └── Drawer (Additional)
│ ├── Notifications
│ ├── Help Center
│ └── About RCS
│
├── Officer Stack (Role: PRISON_OFFICER)
│ ├── Bottom Tabs
│ │ ├── Dashboard (Pending approvals)
│ │ ├── Scanner (QR check-in)
│ │ ├── Today's Visits
│ │ └── Reports
│ └── Drawer
│ ├── Prison Management
│ ├── Prisoner Directory
│ └── Settings
│
└── Admin Stack (Role: ADMIN)
├── Bottom Tabs
│ ├── Analytics Dashboard
│ ├── Prisons Management
│ ├── Prisoners Management
│ └── Users Management
└── Drawer
├── System Config
├── Audit Logs
└── Backup/Restore


## Screen Specifications

### Home Screen (Visitor)
- Upcoming visits card (countdown, QR code shortcut)
- Available prisons nearby (carousel)
- Quick actions: Book visit, scan QR, notifications
- Recent activity feed

### Prison List Screen
- Search/filter prisons (by region, distance)
- Map view toggle
- Each prison card shows: name, address, next available slots
- Click → Prison detail with prisoner search

### Booking Flow
1. Select Prison → 2. Search Prisoner → 3. Choose Date → 
4. Select Time Slot → 5. Review Details → 6. Submit Request → 
7. Confirmation with QR

### Officer Dashboard
- Pending approvals count (badge)
- Today's schedule timeline view
- Recent check-ins
- Quick stats: completed, no-shows, pending

### QR Scanner Screen
- Camera view with guidelines
- Manual entry fallback
- Success/error feedback with haptic
- After scan: visitor details + check-in button

## Notification Types

| Type | Trigger | Action |
| :--- | :--- | :--- |
| Visit Approved | Officer approves request | Opens visit details |
| Visit Rejected | Officer rejects request | Shows reason, rebook option |
| Reminder | 24h before visit | Quick view of QR code |
| Check-in Reminder | 1h before slot | Directions to prison |
| Transfer Alert | Prisoner transferred | Cancel/rebook option |
| Schedule Change | Prison updates times | Reschedule prompt |

## Data Models (Frontend)

```typescript
// Core types matching backend
interface User {
  id: string;
  email: string;
  role: 'VISITOR' | 'PRISON_OFFICER' | 'ADMIN';
  profile: VisitorProfile | OfficerProfile | AdminProfile;
}

interface VisitorProfile {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  verified: boolean;
  relationshipToPrisoner?: string;
}

interface VisitRequest {
  id: string;
  visitorId: string;
  prisonerId: string;
  prisonId: string;
  scheduleId: string;
  date: string;
  timeSlot: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW';
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

interface Prison {
  id: string;
  name: string;
  region: string;
  address: string;
  capacity: number;
  visitingHours: {
    day: string;
    slots: { start: string; end: string; maxVisitors: number; }[];
  }[];
  contactNumber: string;
}

interface Prisoner {
  id: string;
  prisonId: string;
  name: string;
  prisonerNumber: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'RELEASED' | 'RESTRICTED';
  restrictions?: string[];
}