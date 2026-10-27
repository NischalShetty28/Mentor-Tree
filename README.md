# MentorTree: Academic Mentor–Mentee Management System

**MentorTree** is a full-stack, responsive, secure, and role-based **Academic Mentor–Mentee Management System** engineered for colleges and universities.

It provides three isolated, role-specific portals for **Mentees (Students), Mentors (Faculty), and Administrators / HODs**, backed by a real relational database, comprehensive access controls, an automated early academic risk engine, conflict-free meeting scheduling, and official PDF/CSV report generation.

---

## 🏛️ System Architecture

MentorTree is architected as a clean full-stack TypeScript application:

```
Mentor tree/
├── package.json                    # Root workspace runner with concurrently
├── README.md                       # Complete documentation & operational manual
├── backend/                        # Node.js + Express.js + Prisma ORM + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                        # Environment configuration (PORT, JWT_SECRET, DATABASE_URL)
│   ├── .env.example                # Example configuration with PostgreSQL & SQLite instructions
│   ├── prisma/
│   │   ├── schema.prisma           # Relational schema (Users, Profiles, Meetings, Tasks, Records, Logs)
│   │   ├── seed.ts                 # Realistic institutional seed dataset
│   │   └── dev.db                  # Relational SQLite database file
│   └── src/
│       ├── config/                 # Environment variables & runtime constants
│       ├── controllers/            # Auth, Mentee, Mentor, Admin, Meeting, Alert, Report, Notification
│       ├── middlewares/            # JWT verification, Role authorization, Mentor-student scoping, Error handling
│       ├── routes/                 # Express API routes
│       ├── services/               # Risk evaluation engine, PDF/CSV report generation, Audit logger
│       ├── tests/                  # Integration & unit test suites (Vitest & Supertest)
│       ├── types/                  # Strict TypeScript interfaces & enums
│       └── server.ts               # Express application entrypoint
└── frontend/                       # React 18 + Vite + Tailwind CSS + Lucide React + Recharts
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts              # Vite server & API reverse proxy configuration
    ├── tailwind.config.js          # Custom theme with Academic Navy & Slate palette
    ├── index.html
    └── src/
        ├── api/client.ts           # Typed API client with token injection & report blob downloaders
        ├── context/                # AuthContext, NotificationContext, ThemeContext
        ├── layouts/                # DashboardLayout, AuthLayout, Mobile overlay sidebar
        ├── components/ui/          # Button, Input, Card, Modal, Badge, RiskBadge
        ├── pages/
        │   ├── LandingPage.tsx     # Role portal chooser & demo credential guide
        │   ├── auth/               # 6 Distinct Login/Signup pages + Forgot Password Modal
        │   ├── mentee/             # Dashboard, Profile, Recommendations, Tasks, Meetings, Academics
        │   ├── mentor/             # Workspace, Assigned Mentees, Detailed Portfolio, Calendar, Alerts, Reports
        │   └── admin/              # Dashboard, Students, Mentors, Allocations, Approvals, Risk Engine, Audit, Reports
        ├── types/                  # Frontend TypeScript definitions
        ├── App.tsx                 # Client routing & Role-based ProtectedRoute
        └── main.tsx
```

---

## 🔑 Default Accounts / Initial Credentials

The system initializes with seed accounts for local testing across all three roles. Login forms maintain strictly **two input fields** (Identifier and Password) and show **Recent Accounts** saved on the device:

| Role | Name & Title | Username / Identifier | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Shailesh Kumar | `EMP001` or `admin@institution.edu` | `Admin@123` | Institution-wide administrative access & allocations |
| **HOD** | Dr. Nalini Hegde | `EMP010` or `hod.cse@institution.edu` | `Hod@123` | Department-level (CSE) student & faculty oversight |
| **Mentor** | Dr. Ramesh Rao | `FAC101` or `ramesh.rao@institution.edu` | `Mentor@123` | Assigned students, meeting scheduler, private notes |
| **Mentor** | Prof. Priya Sharma | `FAC102` or `priya.sharma@institution.edu` | `Mentor@123` | Assigned students, task tracking, recommendations |
| **Mentee** | Aryan Verma | `1MS22CS001` or `aryan.verma@student.edu` | `Mentee@123` | Student dashboard, profile, mentor tasks, meetings |
| **Mentee** | Sneha Patil | `1MS22CS045` or `sneha.patil@student.edu` | `Mentee@123` | Student dashboard, profile, mentor tasks, meetings |
| **Mentee** | Rohan Iyer | `1MS22CS078` or `rohan.iyer@student.edu` | `Mentee@123` | Student dashboard, profile, mentor tasks, meetings |

---

## 🚀 Quick Start Instructions (Windows & Cross-Platform)

### Prerequisites
- **Node.js** (v18+ or v20+ recommended, tested on v22.14.0)
- **npm** (v9+ or v10+)

### 1. Installation
From the root workspace directory:
```powershell
# Install all dependencies across backend, frontend, and root runner
npm install
npm run install:all
```

### 2. Database Initialization & Seeding
```powershell
# Push Prisma schema and seed the database with realistic demonstration data
cd backend
npx prisma db push
npm run prisma:seed
cd ..
```

### 3. Run Development Servers
To start both the Backend (port 5000) and Frontend (port 5173) simultaneously:
```powershell
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## 🧪 Running Automated Tests

A comprehensive suite of **12 automated integration and security tests** verifies authentication, role authorization, resource scoping, meeting scheduling, and report generation:

```powershell
# Run the complete test suite from the root directory
npm test
```

### Test Coverage Highlights:
- **Authentication & Validation:** Verifies password hashing, password confirmation matching, unique constraints on USN/Faculty ID/Employee ID.
- **Cross-Portal Defense:** Ensures a student attempting to log in via the Mentor or Admin portal is blocked with HTTP 403.
- **Resource-Level Scoping:** Explicitly verifies that a faculty mentor cannot access an unassigned student's records.
- **Privacy Protection:** Confirms confidential faculty notes are restricted from students, and private student notes are withheld from mentors.
- **Meeting Scheduling & Conflict Detection:** Verifies schedule overlap prevention and attendance recording.
- **Export Integrity:** Tests binary PDF generation and formatted CSV data streams.

---

## 🛡️ Role-Specific Portals & Feature Matrix

### 1. Authentication & Account Management
- **Six Distinct Pages:**
  1. `Mentee Login` (`/login/mentee`)
  2. `Mentee Signup` (`/signup/mentee`)
  3. `Mentor Login` (`/login/mentor`)
  4. `Mentor Signup` (`/signup/mentor`)
  5. `Admin/HOD Login` (`/login/admin`)
  6. `Admin/HOD Signup` (`/signup/admin`)
- **Login Requirement Compliance:** All login forms contain **strictly two inputs** (Username / Identifier and Password) plus password visibility toggle and forgot-password modal.
- **Signup Validation:** Enforces matching passwords, email validation, uniqueness on USN/Faculty ID/Employee ID, and institutional approval workflows.

### 2. Mentee Portal (Students)
- **Dashboard:** Academic overview KPIs (CGPA, SGPA, attendance percentage, completed action items), semester SGPA progression trend chart (Recharts), assigned mentor card with contact details, upcoming scheduled meetings, and pending recommendations.
- **Student Profile:** Complete editable portfolio with clear badges distinguishing **"Shared with Mentor"** fields from **"Strictly Private to Student"** reflection notes. Master toggle allows students to control mentor sharing.
- **Recommendations:** View mentor advice, click "Acknowledge" with custom commitments, and interact via inline comment threads.
- **Action Tasks:** Track tasks with priority badges, interactive progress slider (0% to 100%), and evidence submission URL/notes.
- **Meetings:** View calendar schedule, past meeting summaries, and request 1-on-1 sessions.
- **Academic Results:** Detailed subject-wise marks table across all semesters with grades, credits, pass/fail status, and course attendance.

### 3. Mentor Workspace (Faculty)
- **Dashboard:** Key metrics (total assigned mentees, attention-needed count, upcoming sessions, pending follow-ups, attendance concerns), attention-needed list, and quick action modals.
- **My Mentees:** Filter by semester, risk standing, and attendance range (<75%, 75-85%, >85%). Scoped access prevents viewing unassigned students.
- **Detailed Mentee Portfolio:**
  - Complete academic transcript and semester-by-semester comparison chart.
  - **Shared Recommendations:** Add student-visible recommendations and review student comments.
  - **Confidential Faculty Notes:** Record private observations (Behavioral, Personal, Academic) visible ONLY to authorized faculty.
  - **Action Items:** Assign tasks with deadlines and priorities; verify/approve submitted student evidence.
- **Meeting Calendar:** Schedule individual or group sessions with **conflict detection**, reschedule/cancel with notifications, and record attendance (Present / Absent) and meeting summaries.
- **Risk Intervention:** Review flagged alerts and assign remedial action plans.
- **Report Exports:** Download official PDFs and CSVs for academic performance, attendance, and risk.

### 4. Administrator & HOD Portal
- **Dashboard:** Institutional KPI cards, semester distribution chart, mentor workload distribution (capacity utilization bars), and flagged student table.
- **Student & Mentor Registry:** Searchable campus-wide directories with department and semester filters.
- **Mentor Allocation Manager:** Assign or reassign individual or bulk student cohorts to faculty mentors in one click.
- **Registration Approvals:** Review and approve pending faculty and admin registrations.
- **Early Academic Risk Engine:** Configurable thresholds (Minimum Attendance %, Minimum CGPA, Max Permissible Backlogs, Max Consecutive Missed Sessions) and a **"Run Campus-wide Risk Scan"** button that evaluates all student records in real time.
- **Compliance Audit Logs:** Filterable audit trail tracking all user logins, mentor reassignments, confidential note creations, and risk status updates with IP address and timestamps.
- **Downloadable Reports:** Official PDF and CSV downloads with custom department filters.

---

## 🗄️ Relational Database Schema & Entities

The database is built on **Prisma ORM** with full relational integrity and foreign keys:

- `User`: Base authentication record with role (`MENTEE`, `MENTOR`, `ADMIN`, `HOD`), hashed password (bcrypt), and approval status.
- `Department`: Institutional departments (`CSE`, `ISE`, `ECE`, `AIML`).
- `MenteeProfile`: Student academic and mentoring details, CGPA, SGPA, attendance percentage, risk flags, and private notes.
- `MentorProfile`: Faculty advisor details, designation, office location, and mentee capacity.
- `AdminProfile`: Institutional administrators and HOD designations.
- `MentorMenteeAssignment`: Active/inactive assignment linking a mentor to a mentee with audit attribution.
- `AcademicRecord`: Subject-wise course marks, IA scores, end-semester exam scores, credits, and grades across semesters.
- `AttendanceRecord`: Course-wise attendance registers (classes held, classes attended, percentage, shortage flag).
- `MentorPrivateNote`: **Confidential faculty notes** visible only to mentors and administrators.
- `Recommendation`: Transparent mentor guidance shared with the student.
- `RecommendationComment`: Discussion comments between student and mentor.
- `StudentTask`: Action items with due dates, priority, progress percentage (0-100), and evidence verification.
- `Meeting`: Scheduled sessions with title, date, duration, mode (`IN_PERSON`, `ONLINE`), location/link, and mentor summary.
- `MeetingAttendee`: Individual attendance record (`PRESENT`, `ABSENT`, `EXCUSED`) and feedback per student.
- `AcademicRiskAlert`: Early intervention records with severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), trigger reasons, and action plans.
- `RiskThresholdConfig`: Configurable institutional thresholds for attendance, CGPA, backlogs, and missed sessions.
- `Notification`: In-app notification messages with read/unread tracking and deep links.
- `AuditLog`: Immutable compliance trail of sensitive actions with IP addresses and JSON payloads.

---

## 🌐 Switching to PostgreSQL in Production

While SQLite (`file:./dev.db`) is configured by default for zero-friction local development on Windows, switching to PostgreSQL in production takes just 2 steps:

1. In `backend/prisma/schema.prisma`, update the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. In `backend/.env`, set your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/mentortree?schema=public"
   ```
3. Run migrations:
   ```powershell
   npx prisma migrate deploy
   ```

---

## 📡 API Reference & Example Requests

### Authentication
- `POST /api/auth/signup/mentee`: Register new student mentee
- `POST /api/auth/signup/mentor`: Register new faculty mentor (pending approval)
- `POST /api/auth/signup/admin`: Register new administrator / HOD
- `POST /api/auth/login`: Authenticate with 2 inputs (`identifier` and `password`) + `portalRole`
- `GET /api/auth/me`: Current user profile and unread notifications count

### Mentee Endpoints (Protected: `MENTEE`)
- `GET /api/mentee/dashboard`: Performance KPIs, charts, assigned mentor, upcoming meetings
- `GET /api/mentee/profile`: Full profile with private and shared fields
- `PUT /api/mentee/profile`: Update personal goals, strengths, and privacy toggle
- `GET /api/mentee/recommendations`: Recommendations list
- `POST /api/mentee/recommendations/:id/acknowledge`: Acknowledge recommendation with note
- `POST /api/mentee/recommendations/:id/comments`: Add comment on recommendation
- `GET /api/mentee/tasks`: Assigned action items
- `PUT /api/mentee/tasks/:id`: Update progress percentage (0-100) and evidence
- `POST /api/mentee/meetings/request`: Request follow-up meeting with mentor
- `GET /api/mentee/academics`: Semester-wise subject marks and grades
- `GET /api/mentee/attendance`: Subject-wise attendance breakdown

### Mentor Endpoints (Protected: `MENTOR`, `ADMIN`, `HOD`)
- `GET /api/mentor/dashboard`: Mentor workspace metrics and attention-needed list
- `GET /api/mentor/mentees`: Assigned students with search and filter
- `GET /api/mentor/mentees/:menteeId`: Scoped detailed student portfolio (unassigned returns 403)
- `POST /api/mentor/recommendations`: Add recommendation shared with student
- `POST /api/mentor/tasks`: Assign action item with due date and priority
- `POST /api/mentor/private-notes`: Record confidential faculty note
- `PUT /api/mentor/tasks/:id/verify`: Verify/approve student evidence

### Administrator Endpoints (Protected: `ADMIN`, `HOD`)
- `GET /api/admin/dashboard`: Campus-wide analytics and workload distribution
- `GET /api/admin/students`: Full student registry
- `GET /api/admin/mentors`: Full faculty registry
- `POST /api/admin/assignments`: Assign or reassign students to mentor
- `DELETE /api/admin/assignments/:id`: Deactivate assignment
- `GET /api/admin/registrations`: Pending account approval requests
- `PUT /api/admin/registrations/:userId`: Approve or reject registration
- `GET /api/admin/audit-logs`: Compliance audit trail
- `POST /api/admin/evaluate-risks`: Run live campus-wide risk evaluation scan
- `GET /api/admin/thresholds`: Get current risk thresholds
- `PUT /api/admin/thresholds`: Update risk thresholds

### Meetings & Reports
- `GET /api/meetings`: List sessions for current user's role
- `POST /api/meetings`: Schedule session with conflict checking
- `POST /api/meetings/:id/attendance`: Record attendee attendance (Present/Absent) & summary
- `GET /api/reports/student-progress?format=pdf|csv`: Progress report
- `GET /api/reports/academics?format=pdf|csv`: Semester results report
- `GET /api/reports/attendance?format=pdf|csv`: Attendance audit report
- `GET /api/reports/mentor-workload?format=pdf|csv`: Faculty workload report
- `GET /api/reports/risk-interventions?format=pdf|csv`: Academic risk report

---

## 🔒 Security Best Practices Implemented

- **Password Security:** Salted hashes using bcrypt (10 rounds). Plaintext passwords are never stored.
- **Strict Server-Side Authorization:** Roles and resource scoping are validated in Express middleware on every API call. Mentors cannot inspect students outside their active assignments.
- **Data Privacy Separation:** Student private reflection notes are filtered out of faculty responses. Faculty private notes are inaccessible to students.
- **Audit Trails:** Sensitive events (allocations, note creations, login events, risk modifications) are persisted in the `AuditLog` table with IP addresses and details.
- **Conflict Prevention:** Meeting scheduler detects overlapping bookings for faculty mentors and prevents double-booking.
- **Safe Error Handling:** Production error responses never leak stack traces, database schemas, or secret keys.

---

## 📦 Production Deployment Guide

### Deploying Backend
1. Build the TypeScript source: `npm run build` inside `backend/`.
2. Set environment variables on your hosting provider (e.g. Render, Railway, AWS ECS, Heroku):
   - `PORT=5000`
   - `NODE_ENV=production`
   - `DATABASE_URL=postgresql://user:pass@host:5432/dbname`
   - `JWT_SECRET=your-random-32-character-secret`
   - `CORS_ORIGIN=https://your-frontend-domain.com`
3. Run database migrations: `npx prisma migrate deploy`
4. Start the service: `node dist/server.js`

### Deploying Frontend
1. Build the production bundle: `npm run build` inside `frontend/`.
2. The optimized static assets will be output to `frontend/dist/`.
3. Deploy `frontend/dist/` to Vercel, Netlify, Cloudflare Pages, or an AWS S3/CloudFront bucket.
4. Configure SPA rewrite rules so all routes redirect to `/index.html`.

---

## 📄 License & Attribution
Developed for institutional academic mentor–mentee governance. Built with React, Vite, TypeScript, Tailwind CSS, Express.js, Prisma ORM, Recharts, and Lucide React.
