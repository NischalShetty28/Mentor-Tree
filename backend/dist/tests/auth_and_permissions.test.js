"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
(0, vitest_1.describe)('MentorTree Security, Authentication & Role Authorization Tests', () => {
    let menteeToken;
    let mentorToken;
    let adminToken;
    let assignedMenteeId;
    let unassignedMenteeId;
    (0, vitest_1.beforeAll)(async () => {
        // 1. Mentee login by USN
        const menteeLoginRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/auth/login')
            .send({
            identifier: '1MS22CS001',
            password: 'Mentee@123',
            portalRole: 'MENTEE',
        });
        (0, vitest_1.expect)(menteeLoginRes.status).toBe(200);
        (0, vitest_1.expect)(menteeLoginRes.body.token).toBeDefined();
        menteeToken = menteeLoginRes.body.token;
        // 2. Mentor login by Faculty ID
        const mentorLoginRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/auth/login')
            .send({
            identifier: 'FAC101',
            password: 'Mentor@123',
            portalRole: 'MENTOR',
        });
        (0, vitest_1.expect)(mentorLoginRes.status).toBe(200);
        mentorToken = mentorLoginRes.body.token;
        // 3. Admin login by Email
        const adminLoginRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/auth/login')
            .send({
            identifier: 'admin@institution.edu',
            password: 'Admin@123',
            portalRole: 'ADMIN',
        });
        (0, vitest_1.expect)(adminLoginRes.status).toBe(200);
        adminToken = adminLoginRes.body.token;
        // Retrieve students to test access restriction
        const studentsRes = await (0, supertest_1.default)(server_1.app)
            .get('/api/admin/students')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(studentsRes.status).toBe(200);
        const students = studentsRes.body;
        const aryan = students.find((s) => s.usn === '1MS22CS001');
        const kavya = students.find((s) => s.usn === '1MS23IS012'); // Assigned to Prof. Anand, not Dr. Ramesh
        assignedMenteeId = aryan.id;
        unassignedMenteeId = kavya.id;
    });
    (0, vitest_1.it)('rejects login with incorrect password', async () => {
        const res = await (0, supertest_1.default)(server_1.app)
            .post('/api/auth/login')
            .send({
            identifier: '1MS22CS001',
            password: 'WrongPassword!',
            portalRole: 'MENTEE',
        });
        (0, vitest_1.expect)(res.status).toBe(401);
    });
    (0, vitest_1.it)('prevents cross-portal login (student trying to login through mentor portal)', async () => {
        const res = await (0, supertest_1.default)(server_1.app)
            .post('/api/auth/login')
            .send({
            identifier: '1MS22CS001',
            password: 'Mentee@123',
            portalRole: 'MENTOR',
        });
        (0, vitest_1.expect)(res.status).toBe(403);
        (0, vitest_1.expect)(res.body.message).toContain('Access denied');
    });
    (0, vitest_1.it)('allows mentee to access their own dashboard', async () => {
        const res = await (0, supertest_1.default)(server_1.app)
            .get('/api/mentee/dashboard')
            .set('Authorization', `Bearer ${menteeToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.profile.usn).toBe('1MS22CS001');
    });
    (0, vitest_1.it)('denies mentee from accessing admin-only dashboard', async () => {
        const res = await (0, supertest_1.default)(server_1.app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${menteeToken}`);
        (0, vitest_1.expect)(res.status).toBe(403);
    });
    (0, vitest_1.it)('allows mentor to access assigned mentee detail', async () => {
        const res = await (0, supertest_1.default)(server_1.app)
            .get(`/api/mentor/mentees/${assignedMenteeId}`)
            .set('Authorization', `Bearer ${mentorToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.mentee.id).toBe(assignedMenteeId);
    });
    (0, vitest_1.it)('STRICT ACCESS CONTROL: prevents mentor from accessing unassigned mentee detail', async () => {
        const res = await (0, supertest_1.default)(server_1.app)
            .get(`/api/mentor/mentees/${unassignedMenteeId}`)
            .set('Authorization', `Bearer ${mentorToken}`);
        (0, vitest_1.expect)(res.status).toBe(403);
        (0, vitest_1.expect)(res.body.message).toContain('Access Denied');
    });
    (0, vitest_1.it)('allows administrator to access institutional dashboard and assign mentor', async () => {
        const res = await (0, supertest_1.default)(server_1.app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.summary.totalStudents).toBeGreaterThan(0);
    });
});
