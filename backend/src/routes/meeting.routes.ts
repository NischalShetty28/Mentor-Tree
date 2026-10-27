import { Router } from 'express';
import {
  getMeetings,
  createMeeting,
  rescheduleMeeting,
  cancelMeeting,
  recordAttendance,
} from '../controllers/meetingController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

router.get('/', getMeetings);
router.post('/', requireRole(Role.MENTOR, Role.ADMIN, Role.HOD), createMeeting);
router.put('/:id', requireRole(Role.MENTOR, Role.ADMIN, Role.HOD), rescheduleMeeting);
router.post('/:id/cancel', requireRole(Role.MENTOR, Role.ADMIN, Role.HOD), cancelMeeting);
router.post('/:id/attendance', requireRole(Role.MENTOR, Role.ADMIN, Role.HOD), recordAttendance);

export default router;
