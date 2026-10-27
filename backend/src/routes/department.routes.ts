import { Router } from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';
import { Role } from '../types';

const router = Router();

// Publicly readable so signup pages can populate department dropdowns!
router.get('/', getDepartments);
router.post('/', authenticateToken, requireRole(Role.ADMIN, Role.HOD), createDepartment);

export default router;
