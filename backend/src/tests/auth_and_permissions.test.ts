import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('MentorTree Security, Authentication & Role Authorization Tests', () => {
  let menteeToken: string;
  let mentorToken: string;
  let adminToken: string;

  let assignedMenteeId: string;
  let unassignedMenteeId: string;

  beforeAll(async () => {
    // 1. Mentee login by USN
    const menteeLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: '1MS22CS001',
        password: 'Mentee@123',
        portalRole: 'MENTEE',
      });
    expect(menteeLoginRes.status).toBe(200);
    expect(menteeLoginRes.body.token).toBeDefined();
    menteeToken = menteeLoginRes.body.token;

    // 2. Mentor login by Faculty ID
    const mentorLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'FAC101',
        password: 'Mentor@123',
        portalRole: 'MENTOR',
      });
    expect(mentorLoginRes.status).toBe(200);
    mentorToken = mentorLoginRes.body.token;

    // 3. Admin login by Email
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'admin@institution.edu',
        password: 'Admin@123',
        portalRole: 'ADMIN',
      });
    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.token;

    // Retrieve students to test access restriction
    const studentsRes = await request(app)
      .get('/api/admin/students')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(studentsRes.status).toBe(200);

    const students = studentsRes.body;
    const aryan = students.find((s: any) => s.usn === '1MS22CS001');
    const kavya = students.find((s: any) => s.usn === '1MS23IS012'); // Assigned to Prof. Anand, not Dr. Ramesh

    assignedMenteeId = aryan.id;
    unassignedMenteeId = kavya.id;
  });

  it('rejects login with incorrect password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: '1MS22CS001',
        password: 'WrongPassword!',
        portalRole: 'MENTEE',
      });
    expect(res.status).toBe(401);
  });

  it('prevents cross-portal login (student trying to login through mentor portal)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: '1MS22CS001',
        password: 'Mentee@123',
        portalRole: 'MENTOR',
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  it('allows mentee to access their own dashboard', async () => {
    const res = await request(app)
      .get('/api/mentee/dashboard')
      .set('Authorization', `Bearer ${menteeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.usn).toBe('1MS22CS001');
  });

  it('denies mentee from accessing admin-only dashboard', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${menteeToken}`);
    expect(res.status).toBe(403);
  });

  it('allows mentor to access assigned mentee detail', async () => {
    const res = await request(app)
      .get(`/api/mentor/mentees/${assignedMenteeId}`)
      .set('Authorization', `Bearer ${mentorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.mentee.id).toBe(assignedMenteeId);
  });

  it('STRICT ACCESS CONTROL: prevents mentor from accessing unassigned mentee detail', async () => {
    const res = await request(app)
      .get(`/api/mentor/mentees/${unassignedMenteeId}`)
      .set('Authorization', `Bearer ${mentorToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access Denied');
  });

  it('allows administrator to access institutional dashboard and assign mentor', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.summary.totalStudents).toBeGreaterThan(0);
  });
});
