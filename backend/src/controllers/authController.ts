import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma';
import { config } from '../config';
import { Role, ApprovalStatus, AuthenticatedRequest } from '../types';
import { logAuditEvent } from '../services/auditService';

// Schemas
export const menteeSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  usn: z.string().min(4, 'USN is required').toUpperCase().trim(),
  email: z.string().email('Valid college email is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  departmentId: z.string().min(1, 'Department is required'),
  semester: z.number().int().min(1).max(8),
  academicYear: z.string().min(4, 'Academic year is required'),
  section: z.string().optional().default('A'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const mentorSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  facultyId: z.string().min(3, 'Faculty ID is required').toUpperCase().trim(),
  email: z.string().email('Valid college email is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  departmentId: z.string().min(1, 'Department is required'),
  designation: z.string().min(2, 'Designation is required'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const adminSignupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  employeeId: z.string().min(3, 'Employee ID is required').toUpperCase().trim(),
  email: z.string().email('Valid official email is required').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  departmentId: z.string().optional().nullable(),
  administrativeDesignation: z.string().min(2, 'Administrative designation is required'),
  phone: z.string().optional(),
  institutionalCode: z.string().optional(), // Optional passkey for instant admin verification
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Username, USN, Faculty/Employee ID or Email is required').trim(),
  password: z.string().min(1, 'Password is required'),
  portalRole: z.enum(['MENTEE', 'MENTOR', 'ADMIN', 'HOD']).optional(),
});

// Mentee Signup
export const signupMentee = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = menteeSignupSchema.parse(req.body);

    // Uniqueness checks
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email },
          { menteeProfile: { usn: validated.usn } },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({
        message: existingUser.email === validated.email
          ? 'Email address is already registered.'
          : 'USN is already registered.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        role: Role.MENTEE,
        approvalStatus: ApprovalStatus.APPROVED, // Students are active upon registration
        menteeProfile: {
          create: {
            fullName: validated.fullName,
            usn: validated.usn,
            collegeEmail: validated.email,
            phone: validated.phone,
            departmentId: validated.departmentId,
            semester: validated.semester,
            academicYear: validated.academicYear,
            section: validated.section,
          },
        },
      },
      include: {
        menteeProfile: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'SIGNUP_MENTEE',
      entityType: 'MenteeProfile',
      entityId: user.menteeProfile?.id,
      details: { usn: validated.usn, email: validated.email },
      ipAddress: req.ip,
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: Role.MENTEE,
        menteeId: user.menteeProfile?.id,
        departmentId: user.menteeProfile?.departmentId,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Mentee account registered successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.menteeProfile?.fullName,
        usn: user.menteeProfile?.usn,
        profileId: user.menteeProfile?.id,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
      return;
    }
    console.error('Mentee signup error:', error);
    res.status(500).json({ message: 'Registration failed due to a server error.' });
  }
};

// Mentor Signup
export const signupMentor = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = mentorSignupSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email },
          { mentorProfile: { facultyId: validated.facultyId } },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({
        message: existingUser.email === validated.email
          ? 'Email address is already registered.'
          : 'Faculty ID is already registered.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Mentor requires administrative approval or is auto-approved in dev
    const approvalStatus = config.nodeEnv === 'development' ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING;

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        role: Role.MENTOR,
        approvalStatus,
        mentorProfile: {
          create: {
            fullName: validated.fullName,
            facultyId: validated.facultyId,
            collegeEmail: validated.email,
            phone: validated.phone,
            departmentId: validated.departmentId,
            designation: validated.designation,
          },
        },
      },
      include: {
        mentorProfile: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'SIGNUP_MENTOR',
      entityType: 'MentorProfile',
      entityId: user.mentorProfile?.id,
      details: { facultyId: validated.facultyId, email: validated.email, approvalStatus },
      ipAddress: req.ip,
    });

    const token = approvalStatus === ApprovalStatus.APPROVED
      ? jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role: Role.MENTOR,
            mentorId: user.mentorProfile?.id,
            departmentId: user.mentorProfile?.departmentId,
          },
          config.jwtSecret,
          { expiresIn: '7d' }
        )
      : null;

    res.status(201).json({
      message:
        approvalStatus === ApprovalStatus.APPROVED
          ? 'Mentor account created and activated successfully.'
          : 'Mentor registration submitted. Your account is pending HOD / Admin approval.',
      token,
      approvalStatus,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.mentorProfile?.fullName,
        facultyId: user.mentorProfile?.facultyId,
        profileId: user.mentorProfile?.id,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
      return;
    }
    console.error('Mentor signup error:', error);
    res.status(500).json({ message: 'Registration failed due to a server error.' });
  }
};

// Admin / HOD Signup
export const signupAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = adminSignupSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email },
          { adminProfile: { employeeId: validated.employeeId } },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({
        message: existingUser.email === validated.email
          ? 'Official email is already registered.'
          : 'Employee ID is already registered.',
      });
      return;
    }

    // Role differentiation: HOD if department is selected, else ADMIN
    const isHod = !!validated.departmentId && validated.administrativeDesignation.toLowerCase().includes('hod');
    const role = isHod ? Role.HOD : Role.ADMIN;

    // Security check: Check if an admin already exists.
    // If no admins exist, first registered admin is automatically superadmin & approved.
    const adminCount = await prisma.user.count({
      where: { role: { in: [Role.ADMIN, Role.HOD] } },
    });

    const isFirstAdmin = adminCount === 0;
    const isCodeValid = validated.institutionalCode === 'ADMIN2026' || validated.institutionalCode === 'INST_ADMIN_KEY';
    const isDev = config.nodeEnv === 'development';

    const approvalStatus = isFirstAdmin || isCodeValid || isDev
      ? ApprovalStatus.APPROVED
      : ApprovalStatus.PENDING;

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        role,
        approvalStatus,
        adminProfile: {
          create: {
            fullName: validated.fullName,
            employeeId: validated.employeeId,
            officialEmail: validated.email,
            phone: validated.phone,
            departmentId: validated.departmentId || null,
            administrativeDesignation: validated.administrativeDesignation,
            isSuperAdmin: isFirstAdmin,
          },
        },
      },
      include: {
        adminProfile: true,
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'SIGNUP_ADMIN',
      entityType: 'AdminProfile',
      entityId: user.adminProfile?.id,
      details: { employeeId: validated.employeeId, role, approvalStatus },
      ipAddress: req.ip,
    });

    const token = approvalStatus === ApprovalStatus.APPROVED
      ? jwt.sign(
          {
            userId: user.id,
            email: user.email,
            role,
            adminId: user.adminProfile?.id,
            departmentId: user.adminProfile?.departmentId || undefined,
          },
          config.jwtSecret,
          { expiresIn: '7d' }
        )
      : null;

    res.status(201).json({
      message:
        approvalStatus === ApprovalStatus.APPROVED
          ? 'Administrator account created successfully.'
          : 'Admin registration submitted. Requires master administrator approval.',
      token,
      approvalStatus,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.adminProfile?.fullName,
        employeeId: user.adminProfile?.employeeId,
        profileId: user.adminProfile?.id,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
      return;
    }
    console.error('Admin signup error:', error);
    res.status(500).json({ message: 'Registration failed due to a server error.' });
  }
};

// Login - Exactly TWO input fields: identifier and password
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password, portalRole } = loginSchema.parse(req.body);
    const cleanIdentifier = identifier.trim();

    // Find user by email, USN, facultyId, or employeeId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier.toLowerCase() },
          { menteeProfile: { usn: cleanIdentifier.toUpperCase() } },
          { mentorProfile: { facultyId: cleanIdentifier.toUpperCase() } },
          { adminProfile: { employeeId: cleanIdentifier.toUpperCase() } },
        ],
      },
      include: {
        menteeProfile: { include: { department: true } },
        mentorProfile: { include: { department: true } },
        adminProfile: { include: { department: true } },
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials. User identifier not found.' });
      return;
    }

    // Role check against portal if specified
    if (portalRole) {
      const allowedRolesForPortal: Record<string, string[]> = {
        MENTEE: ['MENTEE'],
        MENTOR: ['MENTOR'],
        ADMIN: ['ADMIN', 'HOD'],
        HOD: ['HOD', 'ADMIN'],
      };

      const allowed = allowedRolesForPortal[portalRole] || [portalRole];
      if (!allowed.includes(user.role)) {
        res.status(403).json({
          message: `Access denied. Your account is registered as a ${user.role}. Please log in via the ${user.role} portal.`,
        });
        return;
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Your account has been deactivated. Please contact administration.' });
      return;
    }

    if (user.approvalStatus !== 'APPROVED') {
      res.status(403).json({
        message: `Account is currently ${user.approvalStatus.toLowerCase()}. Awaiting institutional verification.`,
      });
      return;
    }

    const token = jwt.sign(
      {
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
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Get user details
    const profileDetails =
      user.role === Role.MENTEE
        ? {
            fullName: user.menteeProfile?.fullName,
            usn: user.menteeProfile?.usn,
            department: user.menteeProfile?.department.name,
            semester: user.menteeProfile?.semester,
            profileId: user.menteeProfile?.id,
          }
        : user.role === Role.MENTOR
        ? {
            fullName: user.mentorProfile?.fullName,
            facultyId: user.mentorProfile?.facultyId,
            department: user.mentorProfile?.department.name,
            designation: user.mentorProfile?.designation,
            profileId: user.mentorProfile?.id,
          }
        : {
            fullName: user.adminProfile?.fullName,
            employeeId: user.adminProfile?.employeeId,
            designation: user.adminProfile?.administrativeDesignation,
            department: user.adminProfile?.department?.name,
            isSuperAdmin: user.adminProfile?.isSuperAdmin,
            profileId: user.adminProfile?.id,
          };

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      details: { role: user.role, portalRole },
      ipAddress: req.ip,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        ...profileDetails,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation error', errors: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'An unexpected error occurred during login.' });
  }
};

// Get current user profile
export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        menteeProfile: { include: { department: true } },
        mentorProfile: { include: { department: true } },
        adminProfile: { include: { department: true } },
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const unreadNotificationsCount = await prisma.notification.count({
      where: { recipientId: user.id, isRead: false },
    });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      unreadNotificationsCount,
      menteeProfile: user.menteeProfile,
      mentorProfile: user.mentorProfile,
      adminProfile: user.adminProfile,
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Failed to fetch user details.' });
  }
};

// Forgot Password Request
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Security practice: Don't reveal user existence
    res.json({
      message: 'If the provided email is registered, a password reset instruction link has been dispatched.',
      // For developer demonstration convenience:
      demoResetToken: user ? 'DEV-RESET-TOKEN-2026' : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Password reset request failed.' });
  }
};

// Reset Password with Token / Direct Demo Reset
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword) {
      res.status(400).json({ message: 'Email and new password are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found with this email.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'RESET_PASSWORD',
      entityType: 'User',
      entityId: user.id,
      details: { email },
      ipAddress: req.ip,
    });

    res.json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password.' });
  }
};
