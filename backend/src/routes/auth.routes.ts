import { Router } from 'express';
import {
  signupMentee,
  signupMentor,
  signupAdmin,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/signup/mentee', signupMentee);
router.post('/signup/mentor', signupMentor);
router.post('/signup/admin', signupAdmin);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
