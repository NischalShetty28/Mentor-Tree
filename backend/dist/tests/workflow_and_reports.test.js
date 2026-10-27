"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../server");
(0, vitest_1.describe)('MentorTree Workflows, Calendar, Meetings & Report Exports', () => {
    let menteeToken;
    let mentorToken;
    let adminToken;
    let menteeId;
    let mentorId;
    let createdMeetingId;
    let createdRecommendationId;
    let createdTaskId;
    (0, vitest_1.beforeAll)(async () => {
        // 1. Mentee login
        const menteeRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/auth/login')
            .send({
            identifier: '1MS22CS001',
            password: 'Mentee@123',
            portalRole: 'MENTEE',
        });
        menteeToken = menteeRes.body.token;
        menteeId = menteeRes.body.user.profileId;
        // 2. Mentor login
        const mentorRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/auth/login')
            .send({
            identifier: 'FAC101',
            password: 'Mentor@123',
            portalRole: 'MENTOR',
        });
        mentorToken = mentorRes.body.token;
        mentorId = mentorRes.body.user.profileId;
        // 3. Admin login
        const adminRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/auth/login')
            .send({
            identifier: 'admin@institution.edu',
            password: 'Admin@123',
            portalRole: 'ADMIN',
        });
        adminToken = adminRes.body.token;
    });
    (0, vitest_1.it)('allows mentor to create student recommendation and mentee to acknowledge it', async () => {
        // Mentor creates recommendation
        const createRecRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/mentor/recommendations')
            .set('Authorization', `Bearer ${mentorToken}`)
            .send({
            menteeId,
            title: 'Complete AWS Cloud Practitioner Certification',
            description: 'Prepare and schedule AWS exam before end of semester.',
            category: 'Skill Development',
        });
        (0, vitest_1.expect)(createRecRes.status).toBe(201);
        createdRecommendationId = createRecRes.body.id;
        // Mentee acknowledges recommendation
        const ackRes = await (0, supertest_1.default)(server_1.app)
            .post(`/api/mentee/recommendations/${createdRecommendationId}/acknowledge`)
            .set('Authorization', `Bearer ${menteeToken}`)
            .send({ acknowledgmentNote: 'Will schedule for next month.' });
        (0, vitest_1.expect)(ackRes.status).toBe(200);
        (0, vitest_1.expect)(ackRes.body.recommendation.isAcknowledged).toBe(true);
    });
    (0, vitest_1.it)('allows mentor to assign an action item task and mentee to update progress', async () => {
        // Mentor creates task
        const createTaskRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/mentor/tasks')
            .set('Authorization', `Bearer ${mentorToken}`)
            .send({
            menteeId,
            title: 'Submit Project Architecture Diagram',
            description: 'Upload system architecture flowchart.',
            priority: 'HIGH',
        });
        (0, vitest_1.expect)(createTaskRes.status).toBe(201);
        createdTaskId = createTaskRes.body.id;
        // Mentee updates progress
        const updateTaskRes = await (0, supertest_1.default)(server_1.app)
            .put(`/api/mentee/tasks/${createdTaskId}`)
            .set('Authorization', `Bearer ${menteeToken}`)
            .send({
            progressPercent: 100,
            evidenceUrl: 'https://github.com/my-project/architecture.png',
            evidenceNotes: 'Flowchart verified and finalized.',
        });
        (0, vitest_1.expect)(updateTaskRes.status).toBe(200);
        (0, vitest_1.expect)(updateTaskRes.body.task.status).toBe('COMPLETED');
    });
    (0, vitest_1.it)('allows mentor to schedule meeting and records attendance', async () => {
        const meetingTime = new Date(Date.now() + 86400000 * 20).toISOString();
        const createMeetingRes = await (0, supertest_1.default)(server_1.app)
            .post('/api/meetings')
            .set('Authorization', `Bearer ${mentorToken}`)
            .send({
            title: 'Career Progression Check-in',
            agenda: 'Review internship opportunities.',
            scheduledAt: meetingTime,
            durationMinutes: 30,
            mode: 'IN_PERSON',
            locationOrLink: 'Room 304, CS Academic Block',
            menteeIds: [menteeId],
        });
        (0, vitest_1.expect)(createMeetingRes.status).toBe(201);
        createdMeetingId = createMeetingRes.body.id;
        // Record attendance
        const recordAttendanceRes = await (0, supertest_1.default)(server_1.app)
            .post(`/api/meetings/${createdMeetingId}/attendance`)
            .set('Authorization', `Bearer ${mentorToken}`)
            .send({
            mentorSummary: 'Discussed resume formatting and referrals.',
            attendeeRecords: [
                {
                    menteeId,
                    status: 'PRESENT',
                    feedback: 'Very helpful session.',
                },
            ],
        });
        (0, vitest_1.expect)(recordAttendanceRes.status).toBe(200);
    });
    (0, vitest_1.it)('exports valid PDF reports with proper content headers', async () => {
        const pdfRes = await (0, supertest_1.default)(server_1.app)
            .get(`/api/reports/student-progress?format=pdf&menteeId=${menteeId}`)
            .set('Authorization', `Bearer ${menteeToken}`);
        (0, vitest_1.expect)(pdfRes.status).toBe(200);
        (0, vitest_1.expect)(pdfRes.headers['content-type']).toContain('application/pdf');
        (0, vitest_1.expect)(pdfRes.headers['content-disposition']).toContain('.pdf');
    });
    (0, vitest_1.it)('exports valid CSV reports with tabular formatting', async () => {
        const csvRes = await (0, supertest_1.default)(server_1.app)
            .get('/api/reports/academics?format=csv')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, vitest_1.expect)(csvRes.status).toBe(200);
        (0, vitest_1.expect)(csvRes.headers['content-type']).toContain('text/csv');
        (0, vitest_1.expect)(csvRes.text).toContain('USN');
        (0, vitest_1.expect)(csvRes.text).toContain('Full Name');
    });
});
