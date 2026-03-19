# RCS Visitation — Backend Architecture
# Node.js + TypeScript + Express + PostgreSQL + Prisma

## Project Folder Structure

```
rcs-visitation-api/
│
├── prisma/
│   ├── schema.prisma           ← All models defined here
│   ├── migrations/             ← Auto-generated migration files
│   └── seed.ts                 ← Seed data (prisons, test users)
│
├── src/
│   ├── config/
│   │   ├── env.ts              ← Validated env vars (zod)
│   │   ├── prisma.ts           ← Prisma client singleton
│   │   └── logger.ts           ← Winston logger
│   │
│   ├── modules/                ← Feature-based module structure
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts  ← Zod validation schemas
│   │   │
│   │   ├── users/
│   │   │   ├── user.routes.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.schema.ts
│   │   │
│   │   ├── visitors/
│   │   │   ├── visitor.routes.ts
│   │   │   ├── visitor.controller.ts
│   │   │   ├── visitor.service.ts
│   │   │   └── visitor.schema.ts
│   │   │
│   │   ├── prisons/
│   │   │   ├── prison.routes.ts
│   │   │   ├── prison.controller.ts
│   │   │   ├── prison.service.ts
│   │   │   └── prison.schema.ts
│   │   │
│   │   ├── prisoners/
│   │   │   ├── prisoner.routes.ts
│   │   │   ├── prisoner.controller.ts
│   │   │   ├── prisoner.service.ts
│   │   │   └── prisoner.schema.ts
│   │   │
│   │   ├── schedules/
│   │   │   ├── schedule.routes.ts
│   │   │   ├── schedule.controller.ts
│   │   │   ├── schedule.service.ts
│   │   │   └── schedule.schema.ts
│   │   │
│   │   ├── visit-requests/
│   │   │   ├── visit-request.routes.ts
│   │   │   ├── visit-request.controller.ts
│   │   │   ├── visit-request.service.ts
│   │   │   └── visit-request.schema.ts
│   │   │
│   │   ├── visit-logs/
│   │   │   ├── visit-log.routes.ts
│   │   │   ├── visit-log.controller.ts
│   │   │   ├── visit-log.service.ts
│   │   │   └── visit-log.schema.ts
│   │   │
│   │   └── notifications/      ← Phase 2
│   │       ├── notification.routes.ts
│   │       ├── notification.controller.ts
│   │       ├── notification.service.ts
│   │       └── notification.schema.ts
│   │
│   ├── middleware/
│   │   ├── authenticate.ts     ← JWT verification
│   │   ├── authorize.ts        ← Role-based access (RBAC)
│   │   ├── validate.ts         ← Zod request validation
│   │   ├── rateLimiter.ts      ← Rate limiting
│   │   └── errorHandler.ts     ← Global error handler
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts        ← Shared TS interfaces
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── bcrypt.ts
│   │   │   ├── qrcode.ts       ← QR generation (Phase 2)
│   │   │   ├── pagination.ts
│   │   │   └── apiResponse.ts  ← Standard response wrapper
│   │   └── constants.ts
│   │
│   ├── app.ts                  ← Express app setup
│   └── server.ts               ← HTTP server entry point
│
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```
