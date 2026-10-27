import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('MentorTree Workflows, Calendar, Meetings & Report Exports', () => {
  let menteeToken: string;
  let mentorToken: string;
  let adminToken: string;
  let menteeId: string;
  let mentorId: string;
  let createdMeetingId: string;
  let createdRecommendationId: string;
  let createdTaskId: string;

  beforeAll(async () => {
    // 1. Mentee login
    const menteeRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: '1MS22CS001',
        password: 'Mentee@123',
        portalRole: 'MENTEE',
      });
    menteeToken = menteeRes.body.token;
    menteeId = menteeRes.body.user.profileId;

    // 2. Mentor login
    const mentorRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'FAC101',
        password: 'Mentor@123',
        portalRole: 'MENTOR',
      });
    mentorToken = mentorRes.body.token;
    mentorId = mentorRes.body.user.profileId;

    // 3. Admin login
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'admin@institution.edu',
        password: 'Admin@123',
        portalRole: 'ADMIN',
      });
    adminToken = adminRes.body.token;
  });

  it('allows mentor to create student recommendation and mentee to acknowledge it', async () => {
    // Mentor creates recommendation
    const createRecRes = await request(app)
      .post('/api/mentor/recommendations')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        menteeId,
        title: 'Complete AWS Cloud Practitioner Certification',
        description: 'Prepare and schedule AWS exam before end of semester.',
        category: 'Skill Development',
      });
    expect(createRecRes.status).toBe(201);
    createdRecommendationId = createRecRes.body.id;

    // Mentee acknowledges recommendation
    const ackRes = await request(app)
      .post(`/api/mentee/recommendations/${createdRecommendationId}/acknowledge`)
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({ acknowledgmentNote: 'Will schedule for next month.' });
    expect(ackRes.status).toBe(200);
    expect(ackRes.body.recommendation.isAcknowledged).toBe(true);
  });

  it('allows mentor to assign an action item task and mentee to update progress', async () => {
    // Mentor creates task
    const createTaskRes = await request(app)
      .post('/api/mentor/tasks')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        menteeId,
        title: 'Submit Project Architecture Diagram',
        description: 'Upload system architecture flowchart.',
        priority: 'HIGH',
      });
    expect(createTaskRes.status).toBe(201);
    createdTaskId = createTaskRes.body.id;

    // Mentee updates progress
    const updateTaskRes = await request(app)
      .put(`/api/mentee/tasks/${createdTaskId}`)
      .set('Authorization', `Bearer ${menteeToken}`)
      .send({
        progressPercent: 100,
        evidenceUrl: 'https://github.com/my-project/architecture.png',
        evidenceNotes: 'Flowchart verified and finalized.',
      });
    expect(updateTaskRes.status).toBe(200);
    expect(updateTaskRes.body.task.status).toBe('COMPLETED');
  });

  it('allows mentor to schedule meeting and records attendance', async () => {
    const meetingTime = new Date(Date.now() + 86400000 * 20).toISOString();

    const createMeetingRes = await request(app)
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
    expect(createMeetingRes.status).toBe(201);
    createdMeetingId = createMeetingRes.body.id;

    // Record attendance
    const recordAttendanceRes = await request(app)
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
    expect(recordAttendanceRes.status).toBe(200);
  });

  it('exports valid PDF reports with proper content headers', async () => {
    const pdfRes = await request(app)
      .get(`/api/reports/student-progress?format=pdf&menteeId=${menteeId}`)
      .set('Authorization', `Bearer ${menteeToken}`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.headers['content-disposition']).toContain('.pdf');
  });

  it('exports valid CSV reports with tabular formatting', async () => {
    const csvRes = await request(app)
      .get('/api/reports/academics?format=csv')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toContain('text/csv');
    expect(csvRes.text).toContain('USN');
    expect(csvRes.text).toContain('Full Name');
  });
});
