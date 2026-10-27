import { Router } from 'express';
import { getRiskAlerts, updateRiskAlertStatus } from '../controllers/alertController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = Router();

router.use(authenticateToken);

router.get('/', getRiskAlerts);
router.put('/:id', requireRole(Role.MENTOR, Role.ADMIN, Role.HOD), updateRiskAlertStatus);

export default router;
