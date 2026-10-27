import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../prisma';
import { AuthenticatedRequest, JwtUserPayload, Role } from '../types';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtUserPayload;

    // Check user active status in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        menteeProfile: true,
        mentorProfile: true,
        adminProfile: true,
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'User account is inactive or not found.' });
      return;
    }

    if (user.approvalStatus !== 'APPROVED') {
      res.status(403).json({
        message: `Account registration is ${user.approvalStatus.toLowerCase()}. Please contact administrator.`,
      });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      menteeId: user.menteeProfile?.id,
      mentorId: user.mentorProfile?.id,
      adminId: user.adminProfile?.id,
      departmentId:
        user.menteeProfile?.departmentId ||
        user.mentorProfile?.departmentId ||
        user.adminProfile?.departmentId ||
        undefined,
    };

    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired authentication token.' });
  }
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

// Ensures that if mentor is trying to access a specific mentee's record, the mentee is assigned to them!
export const requireMentorAssignment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  // Admins have overarching permission
  if (req.user.role === Role.ADMIN || req.user.role === Role.HOD) {
    next();
    return;
  }

  if (req.user.role !== Role.MENTOR || !req.user.mentorId) {
    res.status(403).json({ message: 'Access denied. Mentor workspace only.' });
    return;
  }

  const menteeId = req.params.menteeId || req.body.menteeId;
  if (!menteeId) {
    res.status(400).json({ message: 'Mentee ID is required for verification.' });
    return;
  }

  const assignment = await prisma.mentorMenteeAssignment.findFirst({
    where: {
      mentorId: req.user.mentorId,
      menteeId: menteeId,
      status: 'ACTIVE',
    },
  });

  if (!assignment) {
    res.status(403).json({
      message: 'Access denied. You are not assigned as the active mentor for this student.',
    });
    return;
  }

  next();
};
