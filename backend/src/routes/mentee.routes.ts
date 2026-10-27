import { Router } from 'express';
import {
  getDashboard,
  getProfile,
  updateProfile,
  getRecommendations,
  acknowledgeRecommendation,
  addRecommendationComment,
  getTasks,
  updateTaskProgress,
  requestMeeting,
  getAcademicRecords,
  getAttendance,
} from '../controllers/menteeController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(Role.MENTEE));

router.get('/dashboard', getDashboard);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/recommendations', getRecommendations);
router.post('/recommendations/:id/acknowledge', acknowledgeRecommendation);
router.post('/recommendations/:id/comments', addRecommendationComment);
router.get('/tasks', getTasks);
router.put('/tasks/:id', updateTaskProgress);
router.post('/meetings/request', requestMeeting);
router.get('/academics', getAcademicRecords);
router.get('/attendance', getAttendance);

export default router;
