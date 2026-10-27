import { Router } from 'express';
import {
  getDashboard,
  getAssignedMentees,
  getMenteeDetail,
  createRecommendation,
  createTask,
  createPrivateNote,
  verifyTask,
} from '../controllers/mentorController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(Role.MENTOR, Role.ADMIN, Role.HOD));

router.get('/dashboard', getDashboard);
router.get('/mentees', getAssignedMentees);
router.get('/mentees/:menteeId', getMenteeDetail);
router.post('/recommendations', createRecommendation);
router.post('/tasks', createTask);
router.post('/private-notes', createPrivateNote);
router.put('/tasks/:id/verify', verifyTask);

export default router;
