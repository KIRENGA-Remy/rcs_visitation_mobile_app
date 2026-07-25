-- AlterEnum
-- Postgres requires ADD VALUE to run outside a transaction that also uses
-- the new value — this migration only adds the value, so it's safe on its
-- own. This is exactly the pattern Prisma itself generates for enum
-- additions.
ALTER TYPE "NotificationType" ADD VALUE 'SCHEDULE_CHANGED';
