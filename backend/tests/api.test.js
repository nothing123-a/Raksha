import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Session } from '../models/Session.js';
import { Attendance } from '../models/Attendance.js';
import { Timetable } from '../models/Timetable.js';
import { CorrectionRequest } from '../models/CorrectionRequest.js';

let studentToken = '';
let facultyToken = '';
let hodToken = '';
let studentUser = null;
let facultyUser = null;
let hodUser = null;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mitaoe_attendance');
  }

  // Login with seeded demo accounts
  const studentRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student.demo@mitaoe.ac.in', password: 'Password123!' });
  studentToken = studentRes.body.token;
  studentUser = studentRes.body.user;

  const facultyRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'faculty.demo@mitaoe.ac.in', password: 'Password123!' });
  facultyToken = facultyRes.body.token;
  facultyUser = facultyRes.body.user;

  const hodRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'hod.demo@mitaoe.ac.in', password: 'Password123!' });
  hodToken = hodRes.body.token;
  hodUser = hodRes.body.user;
});

afterAll(async () => {
  // We keep the seed data for development
});

describe('1. Authentication & Role Validation Tests', () => {
  it('should successfully log in demo student and return user profile', () => {
    expect(studentToken).toBeDefined();
    expect(studentUser.role).toBe('student');
    expect(studentUser.studentId).toBe('2022BTECS001');
  });

  it('should successfully log in demo faculty', () => {
    expect(facultyToken).toBeDefined();
    expect(facultyUser.role).toBe('faculty');
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student.demo@mitaoe.ac.in', password: 'WrongPassword999' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject public HOD registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Malicious HOD Attempt',
        email: 'fake.hod@mitaoe.ac.in',
        password: 'Password123!',
        role: 'hod',
        department: 'Computer Engineering',
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should register a valid new student and reject duplicate email/PRN', async () => {
    const testEmail = `test.student.${Date.now()}@mitaoe.ac.in`;
    const testPRN = `PRN${Date.now().toString().slice(-6)}`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Test Student',
        email: testEmail,
        password: 'Password123!',
        role: 'student',
        studentId: testPRN,
        department: 'Computer Engineering',
        academicYear: 'Third Year',
        semester: 5,
        division: 'A',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Duplicate email registration should fail
    const dupRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Student',
        email: testEmail,
        password: 'Password123!',
        role: 'student',
        studentId: `PRN_DIFF_${Date.now()}`,
        department: 'Computer Engineering',
      });
    expect(dupRes.status).toBe(400);
    expect(dupRes.body.success).toBe(false);

    // Clean up created test user
    await User.deleteOne({ email: testEmail });
  });

  it('should reject student accessing faculty endpoints', async () => {
    const res = await request(app)
      .get('/api/faculty/me/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should reject faculty accessing HOD endpoints', async () => {
    const res = await request(app)
      .get('/api/hod/dashboard')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

describe('2. Student Module Endpoints', () => {
  it('should get enrolled courses for logged in student', async () => {
    const res = await request(app)
      .get('/api/students/me/courses')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.courses.length).toBeGreaterThan(0);
  });

  it('should get course-wise attendance and shortage warnings', async () => {
    const res = await request(app)
      .get('/api/students/me/attendance')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.overall).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);
    // Student demo has shortage in DBMS (<75%) from seed
    expect(res.body.shortageAlerts.length).toBeGreaterThan(0);
  });

  it('should get timetable for student division', async () => {
    const res = await request(app)
      .get('/api/students/me/timetable')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.timetable)).toBe(true);
  });
});

describe('3. Faculty Module & Attendance Marking', () => {
  it('should get assigned courses for faculty', async () => {
    const res = await request(app)
      .get('/api/faculty/me/courses')
      .set('Authorization', `Bearer ${facultyToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.courses.length).toBeGreaterThan(0);
  });

  it('should reject attendance marking from an unassigned faculty', async () => {
    // Find course assigned to someone else
    const course = await Course.findOne({ facultyId: { $ne: facultyUser._id } });
    if (course) {
      const session = await Session.findOne({ courseId: course._id });
      if (session) {
        const res = await request(app)
          .post('/api/attendance')
          .set('Authorization', `Bearer ${facultyToken}`)
          .send({
            sessionId: session._id,
            records: [{ studentId: studentUser._id, status: 'present' }],
          });
        expect(res.status).toBe(403);
      }
    }
  });

  it('should reject future session creation as conducted', async () => {
    const course = await Course.findOne({ facultyId: facultyUser._id });
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        courseId: course._id,
        sessionDate: futureDate,
        startTime: '14:00',
        endTime: '15:00',
        topic: 'Future Lecture Test',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('4. Timetable Conflict Detection', () => {
  it('should reject timetable creation with overlapping room', async () => {
    // Existing slot: Monday 09:15-10:15 in Room 304
    const course = await Course.findOne({ department: 'Computer Engineering' });
    const res = await request(app)
      .post('/api/timetable')
      .set('Authorization', `Bearer ${hodToken}`)
      .send({
        courseId: course._id,
        facultyId: facultyUser._id,
        day: 'Monday',
        startTime: '09:30', // Overlaps with 09:15-10:15
        endTime: '10:30',
        room: 'Room 304',
        division: 'B',
      });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Room conflict');
  });
});

describe('5. Correction Request Workflow', () => {
  it('should prevent student submitting duplicate pending request for same session', async () => {
    // There is already a pending request seeded for student.demo
    const existing = await CorrectionRequest.findOne({
      studentId: studentUser._id,
      status: 'pending',
    });

    if (existing) {
      const res = await request(app)
        .post('/api/corrections')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sessionId: existing.sessionId,
          reason: 'Medical Leave',
          description: 'Duplicate attempt test',
        });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already have an active pending');
    }
  });
});
