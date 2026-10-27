import { Router } from 'express';
import {
  exportStudentProgressReport,
  exportAcademicReport,
  exportAttendanceReport,
  exportMentorWorkloadReport,
  exportRiskReport,
} from '../controllers/reportController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

router.get('/student-progress', exportStudentProgressReport);
router.get('/academics', requireRole(Role.MENTOR, Role.ADMIN, Role.HOD), exportAcademicReport);
router.get('/attendance', requireRole(Role.MENTOR, Role.ADMIN, Role.HOD), exportAttendanceReport);
router.get('/mentor-workload', requireRole(Role.ADMIN, Role.HOD), exportMentorWorkloadReport);
router.get('/risk-interventions', requireRole(Role.MENTOR, Role.ADMIN, Role.HOD), exportRiskReport);

export default router;
