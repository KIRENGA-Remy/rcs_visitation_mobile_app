# RCS Visitation Mobile App

A full-stack mobile system for managing prison visitation at Rwanda Correctional Service (RCS) facilities — built to replace manual, paper-based visit logging with a digital request, approval, and check-in/check-out flow.

Built as a personal/self-employed project to explore real-world mobile + backend architecture patterns for a sensitive, role-based operational system.

---

## ✨ Overview

The app supports three distinct user roles, each with a dedicated experience:

- **Visitor** — register, book a visit request against a specific prisoner and schedule, track request status, receive notifications.
- **Prison Officer** — review and approve/reject pending visit requests, scan visitor QR codes to check them in and out, view visit logs.
- **Admin** — manage prisoners, users, visitation schedules, and view reports across facilities.

The mobile app is the client for a live backend API (also included in this repo) with authentication, role-based authorization, and a PostgreSQL data layer.

---

## 🧱 Tech Stack

**Mobile app** (`rcs_visitation_app/`)
- Expo SDK 54 + React Native 0.81
- TypeScript
- React Navigation (native-stack, bottom-tabs, drawer)
- TanStack React Query (server state, caching, retry/backoff)
- Zustand (client state)
- React Hook Form + Yup (form validation)
- Expo Camera / Barcode Scanner (QR check-in/check-out)
- Expo Notifications (push notifications)
- Expo Secure Store (token storage)
- NetInfo (offline/online detection + offline banner)
- NativeWind (Tailwind-style styling)

**Backend API** (`rcs_visitation_api/`)
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT authentication, role-based authorization middleware
- Zod (request validation)
- Helmet, CORS, rate limiting
- Winston (logging), Morgan (HTTP logging)
- Jest (unit, integration, e2e tests)

---

## 📂 Project Structure

```
rcs_visitation_mobile_app/
├── rcs_visitation_app/        # Expo React Native mobile app
│   ├── src/
│   │   ├── api/                # API client + endpoint definitions
│   │   ├── components/         # Shared UI components
│   │   ├── hooks/               # Custom hooks (e.g. push notifications)
│   │   ├── navigation/          # Role-based navigators
│   │   ├── screens/
│   │   │   ├── auth/            # Login, Register, Splash
│   │   │   ├── visitor/         # Home, Book Visit, My Requests
│   │   │   ├── officer/         # Dashboard, Scan QR, Check-in/out, Reviews
│   │   │   ├── admin/           # Dashboard, Prisoners, Schedules, Users, Reports
│   │   │   └── shared/          # Notifications, Profile
│   │   ├── stores/               # Zustand stores
│   │   ├── types/                 # TypeScript types
│   │   └── i18n/                   # Localization
│   └── integration.md            # Notes on wiring the app to the backend
│
└── rcs_visitation_api/         # Express + Prisma backend
    ├── src/
    │   ├── modules/               # Feature modules: auth, prisoners, visit-requests,
    │   │                             visit-logs, schedules, prisons, users, visitors,
    │   │                             notifications, reports, settings, verification
    │   ├── middleware/             # Auth, error handling, validation
    │   └── shared/                  # Shared types and utilities
    └── prisma/                      # Prisma schema and seed data
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL database
- Expo Go app (for testing on a physical device) or an Android/iOS simulator

### 1. Backend setup

```bash
cd rcs_visitation_api
npm install
cp .env.example .env       # fill in your DATABASE_URL, JWT secret, etc.
npm run db:generate
npm run db:migrate
npm run db:seed            # optional: seed sample data
npm run dev
```

The API runs on `http://localhost:3000/api/v1` by default.

### 2. Mobile app setup

```bash
cd rcs_visitation_app
npm install
```

Update `app.json` with your machine's LAN IP so a physical device (via Expo Go) can reach the backend:

```json
"extra": {
  "apiBaseUrl": "http://YOUR_LAN_IP:3000/api/v1"
}
```

> `localhost` will not work from a physical device — see `integration.md` for full backend↔mobile wiring notes, including CORS setup and required API route fixes.

Then start the app:

```bash
npm start
```

Scan the QR code with Expo Go, or press `a` / `i` to launch an Android/iOS simulator.

---

## 🧪 Testing

**Backend:**
```bash
npm test              # all tests
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:coverage
```

**Mobile app:**
```bash
npm test
```

---

## 🔑 Core Features

- Role-based authentication and navigation (Visitor / Officer / Admin)
- Visit request booking against prisoners and time-slot schedules
- Officer approval/rejection workflow for pending requests
- QR-code-based visitor check-in and check-out
- Push notifications for request status updates
- Offline detection with an in-app offline banner
- Visit logs and basic reporting for admins

---

## 📌 Project Status

This is a self-built, self-employed project developed to demonstrate a production-style mobile + backend architecture for a real institutional use case. It is not currently published to the App Store or Google Play. The backend and mobile client are both functional and wired together for local/dev testing (see `integration.md`).

---

## 👤 Author

**Remy Claudien Kirenga (GITORI)**
Kigali, Rwanda
[GitHub](https://github.com/KIRENGA-Remy)

---

## 📄 License

This project is provided for portfolio and demonstration purposes.
