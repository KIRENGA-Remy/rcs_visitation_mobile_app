import { Router } from 'express';
import { visitorController } from './visitor.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { updateVisitorProfileSchema, banVisitorSchema, linkPrisonerSchema, requestContactSchema, rejectContactRequestSchema } from './visitor.schema';

const router = Router();

// Visitor: own profile
router.get('/me',        authenticate, authorize('VISITOR'), visitorController.getMyProfile.bind(visitorController));
router.put('/me',        authenticate, authorize('VISITOR'), validate(updateVisitorProfileSchema), visitorController.updateMyProfile.bind(visitorController));

// Visitor: self-service contact (new prisoner relationship) requests —
// registered before '/:id' below so they're never shadowed by it.
router.post('/me/contact-requests', authenticate, authorize('VISITOR'), validate(requestContactSchema), visitorController.requestContact.bind(visitorController));
router.get('/me/contact-requests',  authenticate, authorize('VISITOR'), visitorController.getMyContactRequests.bind(visitorController));

// Admin / Officer: review pending contact requests
router.get('/contact-requests/pending',        authenticate, authorize('ADMIN', 'PRISON_OFFICER'), visitorController.getPendingContactRequests.bind(visitorController));
router.patch('/contact-requests/:id/approve',  authenticate, authorize('ADMIN', 'PRISON_OFFICER'), visitorController.approveContactRequest.bind(visitorController));
router.patch('/contact-requests/:id/reject',   authenticate, authorize('ADMIN', 'PRISON_OFFICER'), validate(rejectContactRequestSchema), visitorController.rejectContactRequest.bind(visitorController));

// Admin / Officer: all visitors
router.get('/',          authenticate, authorize('ADMIN', 'PRISON_OFFICER'), visitorController.findAll.bind(visitorController));
router.get('/:id',       authenticate, authorize('ADMIN', 'PRISON_OFFICER'), visitorController.findById.bind(visitorController));
router.put('/:id',       authenticate, authorize('ADMIN'), validate(updateVisitorProfileSchema), visitorController.update.bind(visitorController));
router.put('/:id/ban',   authenticate, authorize('ADMIN', 'PRISON_OFFICER'), validate(banVisitorSchema), visitorController.ban.bind(visitorController));

// Prisoner linkage (who they are approved to visit)
router.post('/:id/prisoners',                  authenticate, authorize('ADMIN', 'PRISON_OFFICER'), validate(linkPrisonerSchema), visitorController.linkPrisoner.bind(visitorController));
router.delete('/:id/prisoners/:prisonerId',    authenticate, authorize('ADMIN'), visitorController.unlinkPrisoner.bind(visitorController));

// Visit history for a visitor profile
router.get('/:id/history', authenticate, authorize('ADMIN', 'PRISON_OFFICER'), visitorController.getVisitHistory.bind(visitorController));

export default router;
