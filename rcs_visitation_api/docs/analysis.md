# RCS Domain Analysis Notes

## Core Business Rules (from document)
1. Multiple prisons — one system serves all
2. Visitors must book in advance (time slots)
3. Visitor identity must be verified (QR/ID)
4. Each prisoner has visitation limits (time, frequency)
5. Visits can be approved/rejected by prison officer
6. Visit duration must be tracked
7. Special visits (lawyers) need different workflow
8. Notifications must reach visitors before they travel
9. Admin needs analytics (peak times, patterns)
10. Prisoners can be transferred — visitors must be notified

## Role Responsibilities (MVP)
- VISITOR: register, book visit, get notifications, check status
- PRISON_OFFICER: approve/reject requests, check in/out visitors, log incidents
- ADMIN: manage prisoners, manage schedules, view analytics, configure system

## Key Constraints
- A visitor can only have ONE active visit request per prisoner at a time
- A prisoner can only have a limited number of visitors per day/session
- Each visit slot has a max capacity
- Visit must be within scheduled available time windows
- Legal visits bypass normal queue — different flow
- Transfers invalidate pending visits to old prison

## State Machines
VisitRequest: PENDING → APPROVED | REJECTED | CANCELLED
              APPROVED → CHECKED_IN → COMPLETED | NO_SHOW
VisitSchedule: OPEN → FULL | CANCELLED | CLOSED
Prisoner: ACTIVE | TRANSFERRED | RELEASED | RESTRICTED

## Relationships (conceptual)
User 1──1 VisitorProfile (visitor users only)
Prison 1──∞ Prisoner
Prison 1──∞ VisitSchedule (available slots)
Prisoner 1──∞ VisitRequest
VisitorProfile 1──∞ VisitRequest
VisitRequest 1──1 VisitSchedule (booked slot)
VisitRequest 1──1 VisitLog (created on check-in)
User (officer) 1──∞ VisitLog (logged by)
