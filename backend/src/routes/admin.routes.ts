import { Router } from 'express';
import {
  getDashboard,
  getAllStudents,
  getAllMentors,
  createAssignment,
  removeAssignment,
  getRegistrationRequests,
  updateRegistrationStatus,
  getAuditLogs,
  triggerRiskEvaluation,
  getRiskThresholds,
  updateRiskThresholds,
} from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);
router.use(requireRole(Role.ADMIN, Role.HOD));

router.get('/dashboard', getDashboard);
router.get('/students', getAllStudents);
router.get('/mentors', getAllMentors);
router.post('/assignments', createAssignment);
router.delete('/assignments/:id', removeAssignment);
router.get('/registrations', getRegistrationRequests);
router.put('/registrations/:userId', updateRegistrationStatus);
router.get('/audit-logs', getAuditLogs);
router.post('/evaluate-risks', triggerRiskEvaluation);
router.get('/thresholds', getRiskThresholds);
router.put('/thresholds', updateRiskThresholds);

export default router;
