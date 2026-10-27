"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMentorAssignment = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const prisma_1 = require("../prisma");
const types_1 = require("../types");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        res.status(401).json({ message: 'Authentication required. No token provided.' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        // Check user active status in database
        const user = await prisma_1.prisma.user.findUnique({
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
            role: user.role,
            menteeId: user.menteeProfile?.id,
            mentorId: user.mentorProfile?.id,
            adminId: user.adminProfile?.id,
            departmentId: user.menteeProfile?.departmentId ||
                user.mentorProfile?.departmentId ||
                user.adminProfile?.departmentId ||
                undefined,
        };
        next();
    }
    catch (error) {
        res.status(403).json({ message: 'Invalid or expired authentication token.' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
// Ensures that if mentor is trying to access a specific mentee's record, the mentee is assigned to them!
const requireMentorAssignment = async (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required.' });
        return;
    }
    // Admins have overarching permission
    if (req.user.role === types_1.Role.ADMIN || req.user.role === types_1.Role.HOD) {
        next();
        return;
    }
    if (req.user.role !== types_1.Role.MENTOR || !req.user.mentorId) {
        res.status(403).json({ message: 'Access denied. Mentor workspace only.' });
        return;
    }
    const menteeId = req.params.menteeId || req.body.menteeId;
    if (!menteeId) {
        res.status(400).json({ message: 'Mentee ID is required for verification.' });
        return;
    }
    const assignment = await prisma_1.prisma.mentorMenteeAssignment.findFirst({
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
exports.requireMentorAssignment = requireMentorAssignment;
