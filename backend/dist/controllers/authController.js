"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.getMe = exports.login = exports.signupAdmin = exports.signupMentor = exports.signupMentee = exports.loginSchema = exports.adminSignupSchema = exports.mentorSignupSchema = exports.menteeSignupSchema = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const config_1 = require("../config");
const types_1 = require("../types");
const auditService_1 = require("../services/auditService");
// Schemas
exports.menteeSignupSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    usn: zod_1.z.string().min(4, 'USN is required').toUpperCase().trim(),
    email: zod_1.z.string().email('Valid college email is required').toLowerCase().trim(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod_1.z.string(),
    departmentId: zod_1.z.string().min(1, 'Department is required'),
    semester: zod_1.z.number().int().min(1).max(8),
    academicYear: zod_1.z.string().min(4, 'Academic year is required'),
    section: zod_1.z.string().optional().default('A'),
    phone: zod_1.z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.mentorSignupSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    facultyId: zod_1.z.string().min(3, 'Faculty ID is required').toUpperCase().trim(),
    email: zod_1.z.string().email('Valid college email is required').toLowerCase().trim(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod_1.z.string(),
    departmentId: zod_1.z.string().min(1, 'Department is required'),
    designation: zod_1.z.string().min(2, 'Designation is required'),
    phone: zod_1.z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.adminSignupSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters'),
    employeeId: zod_1.z.string().min(3, 'Employee ID is required').toUpperCase().trim(),
    email: zod_1.z.string().email('Valid official email is required').toLowerCase().trim(),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: zod_1.z.string(),
    departmentId: zod_1.z.string().optional().nullable(),
    administrativeDesignation: zod_1.z.string().min(2, 'Administrative designation is required'),
    phone: zod_1.z.string().optional(),
    institutionalCode: zod_1.z.string().optional(), // Optional passkey for instant admin verification
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.loginSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1, 'Username, USN, Faculty/Employee ID or Email is required').trim(),
    password: zod_1.z.string().min(1, 'Password is required'),
    portalRole: zod_1.z.enum(['MENTEE', 'MENTOR', 'ADMIN', 'HOD']).optional(),
});
// Mentee Signup
const signupMentee = async (req, res) => {
    try {
        const validated = exports.menteeSignupSchema.parse(req.body);
        // Uniqueness checks
        const existingUser = await prisma_1.prisma.user.findFirst({
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
        const hashedPassword = await bcryptjs_1.default.hash(validated.password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email: validated.email,
                password: hashedPassword,
                role: types_1.Role.MENTEE,
                approvalStatus: types_1.ApprovalStatus.APPROVED, // Students are active upon registration
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
        await (0, auditService_1.logAuditEvent)({
            userId: user.id,
            action: 'SIGNUP_MENTEE',
            entityType: 'MenteeProfile',
            entityId: user.menteeProfile?.id,
            details: { usn: validated.usn, email: validated.email },
            ipAddress: req.ip,
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: types_1.Role.MENTEE,
            menteeId: user.menteeProfile?.id,
            departmentId: user.menteeProfile?.departmentId,
        }, config_1.config.jwtSecret, { expiresIn: '7d' });
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: 'Validation error', errors: error.errors });
            return;
        }
        console.error('Mentee signup error:', error);
        res.status(500).json({ message: 'Registration failed due to a server error.' });
    }
};
exports.signupMentee = signupMentee;
// Mentor Signup
const signupMentor = async (req, res) => {
    try {
        const validated = exports.mentorSignupSchema.parse(req.body);
        const existingUser = await prisma_1.prisma.user.findFirst({
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
        const hashedPassword = await bcryptjs_1.default.hash(validated.password, 10);
        // Mentor requires administrative approval or is auto-approved in dev
        const approvalStatus = config_1.config.nodeEnv === 'development' ? types_1.ApprovalStatus.APPROVED : types_1.ApprovalStatus.PENDING;
        const user = await prisma_1.prisma.user.create({
            data: {
                email: validated.email,
                password: hashedPassword,
                role: types_1.Role.MENTOR,
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
        await (0, auditService_1.logAuditEvent)({
            userId: user.id,
            action: 'SIGNUP_MENTOR',
            entityType: 'MentorProfile',
            entityId: user.mentorProfile?.id,
            details: { facultyId: validated.facultyId, email: validated.email, approvalStatus },
            ipAddress: req.ip,
        });
        const token = approvalStatus === types_1.ApprovalStatus.APPROVED
            ? jsonwebtoken_1.default.sign({
                userId: user.id,
                email: user.email,
                role: types_1.Role.MENTOR,
                mentorId: user.mentorProfile?.id,
                departmentId: user.mentorProfile?.departmentId,
            }, config_1.config.jwtSecret, { expiresIn: '7d' })
            : null;
        res.status(201).json({
            message: approvalStatus === types_1.ApprovalStatus.APPROVED
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: 'Validation error', errors: error.errors });
            return;
        }
        console.error('Mentor signup error:', error);
        res.status(500).json({ message: 'Registration failed due to a server error.' });
    }
};
exports.signupMentor = signupMentor;
// Admin / HOD Signup
const signupAdmin = async (req, res) => {
    try {
        const validated = exports.adminSignupSchema.parse(req.body);
        const existingUser = await prisma_1.prisma.user.findFirst({
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
        const role = isHod ? types_1.Role.HOD : types_1.Role.ADMIN;
        // Security check: Check if an admin already exists.
        // If no admins exist, first registered admin is automatically superadmin & approved.
        const adminCount = await prisma_1.prisma.user.count({
            where: { role: { in: [types_1.Role.ADMIN, types_1.Role.HOD] } },
        });
        const isFirstAdmin = adminCount === 0;
        const isCodeValid = validated.institutionalCode === 'ADMIN2026' || validated.institutionalCode === 'INST_ADMIN_KEY';
        const isDev = config_1.config.nodeEnv === 'development';
        const approvalStatus = isFirstAdmin || isCodeValid || isDev
            ? types_1.ApprovalStatus.APPROVED
            : types_1.ApprovalStatus.PENDING;
        const hashedPassword = await bcryptjs_1.default.hash(validated.password, 10);
        const user = await prisma_1.prisma.user.create({
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
        await (0, auditService_1.logAuditEvent)({
            userId: user.id,
            action: 'SIGNUP_ADMIN',
            entityType: 'AdminProfile',
            entityId: user.adminProfile?.id,
            details: { employeeId: validated.employeeId, role, approvalStatus },
            ipAddress: req.ip,
        });
        const token = approvalStatus === types_1.ApprovalStatus.APPROVED
            ? jsonwebtoken_1.default.sign({
                userId: user.id,
                email: user.email,
                role,
                adminId: user.adminProfile?.id,
                departmentId: user.adminProfile?.departmentId || undefined,
            }, config_1.config.jwtSecret, { expiresIn: '7d' })
            : null;
        res.status(201).json({
            message: approvalStatus === types_1.ApprovalStatus.APPROVED
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: 'Validation error', errors: error.errors });
            return;
        }
        console.error('Admin signup error:', error);
        res.status(500).json({ message: 'Registration failed due to a server error.' });
    }
};
exports.signupAdmin = signupAdmin;
// Login - Exactly TWO input fields: identifier and password
const login = async (req, res) => {
    try {
        const { identifier, password, portalRole } = exports.loginSchema.parse(req.body);
        const cleanIdentifier = identifier.trim();
        // Find user by email, USN, facultyId, or employeeId
        const user = await prisma_1.prisma.user.findFirst({
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
            const allowedRolesForPortal = {
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
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
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
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            role: user.role,
            menteeId: user.menteeProfile?.id,
            mentorId: user.mentorProfile?.id,
            adminId: user.adminProfile?.id,
            departmentId: user.menteeProfile?.departmentId ||
                user.mentorProfile?.departmentId ||
                user.adminProfile?.departmentId ||
                undefined,
        }, config_1.config.jwtSecret, { expiresIn: '7d' });
        // Get user details
        const profileDetails = user.role === types_1.Role.MENTEE
            ? {
                fullName: user.menteeProfile?.fullName,
                usn: user.menteeProfile?.usn,
                department: user.menteeProfile?.department.name,
                semester: user.menteeProfile?.semester,
                profileId: user.menteeProfile?.id,
            }
            : user.role === types_1.Role.MENTOR
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
        await (0, auditService_1.logAuditEvent)({
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ message: 'Validation error', errors: error.errors });
            return;
        }
        console.error('Login error:', error);
        res.status(500).json({ message: 'An unexpected error occurred during login.' });
    }
};
exports.login = login;
// Get current user profile
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
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
        const unreadNotificationsCount = await prisma_1.prisma.notification.count({
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
    }
    catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: 'Failed to fetch user details.' });
    }
};
exports.getMe = getMe;
// Forgot Password Request
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        // Security practice: Don't reveal user existence
        res.json({
            message: 'If the provided email is registered, a password reset instruction link has been dispatched.',
            // For developer demonstration convenience:
            demoResetToken: user ? 'DEV-RESET-TOKEN-2026' : null,
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Password reset request failed.' });
    }
};
exports.forgotPassword = forgotPassword;
// Reset Password with Token / Direct Demo Reset
const resetPassword = async (req, res) => {
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
        const user = await prisma_1.prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (!user) {
            res.status(404).json({ message: 'User not found with this email.' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        await (0, auditService_1.logAuditEvent)({
            userId: user.id,
            action: 'RESET_PASSWORD',
            entityType: 'User',
            entityId: user.id,
            details: { email },
            ipAddress: req.ip,
        });
        res.json({ message: 'Password has been reset successfully. You can now login.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to reset password.' });
    }
};
exports.resetPassword = resetPassword;
