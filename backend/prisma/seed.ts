import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in relational order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.academicRiskAlert.deleteMany();
  await prisma.meetingAttendee.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.studentTask.deleteMany();
  await prisma.recommendationComment.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.mentorPrivateNote.deleteMany();
  await prisma.mentorMenteeAssignment.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.academicRecord.deleteMany();
  await prisma.riskThresholdConfig.deleteMany();
  await prisma.menteeProfile.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('Cleared existing records.');

  // 2. Create Departments
  const deptCse = await prisma.department.create({
    data: {
      code: 'CSE',
      name: 'Computer Science and Engineering',
      description: 'Department of Computer Science and Engineering',
    },
  });

  const deptIse = await prisma.department.create({
    data: {
      code: 'ISE',
      name: 'Information Science and Engineering',
      description: 'Department of Information Science and Engineering',
    },
  });

  const deptEce = await prisma.department.create({
    data: {
      code: 'ECE',
      name: 'Electronics and Communication Engineering',
      description: 'Department of Electronics and Communication',
    },
  });

  const deptAiml = await prisma.department.create({
    data: {
      code: 'AIML',
      name: 'Artificial Intelligence & Machine Learning',
      description: 'Department of AI and Data Intelligence',
    },
  });

  console.log('Departments created.');

  // 3. Create Global Risk Threshold Configuration
  await prisma.riskThresholdConfig.create({
    data: {
      departmentId: null, // Global
      minAttendancePercent: 75.0,
      minCgpa: 6.5,
      maxFailedSubjects: 1,
      maxConsecutiveAbsences: 2,
    },
  });

  // Common hashed password for demonstration
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const hodPassword = await bcrypt.hash('Hod@123', 10);
  const mentorPassword = await bcrypt.hash('Mentor@123', 10);
  const menteePassword = await bcrypt.hash('Mentee@123', 10);

  // 4. Create Super Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@institution.edu',
      password: adminPassword,
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      adminProfile: {
        create: {
          fullName: 'Dr. Shailesh Kumar',
          employeeId: 'EMP001',
          officialEmail: 'admin@institution.edu',
          phone: '+91 98765 43210',
          administrativeDesignation: 'Chief Academic Dean & System Admin',
          isSuperAdmin: true,
        },
      },
    },
    include: { adminProfile: true },
  });

  // 5. Create HOD (Computer Science)
  const hodUser = await prisma.user.create({
    data: {
      email: 'hod.cse@institution.edu',
      password: hodPassword,
      role: 'HOD',
      approvalStatus: 'APPROVED',
      adminProfile: {
        create: {
          fullName: 'Dr. Nalini Hegde',
          employeeId: 'EMP010',
          officialEmail: 'hod.cse@institution.edu',
          phone: '+91 98765 43211',
          departmentId: deptCse.id,
          administrativeDesignation: 'Head of Department (CSE)',
          isSuperAdmin: false,
        },
      },
    },
    include: { adminProfile: true },
  });

  // 6. Create Faculty Mentors
  const mentor1 = await prisma.user.create({
    data: {
      email: 'ramesh.rao@institution.edu',
      password: mentorPassword,
      role: 'MENTOR',
      approvalStatus: 'APPROVED',
      mentorProfile: {
        create: {
          fullName: 'Dr. Ramesh Rao',
          facultyId: 'FAC101',
          collegeEmail: 'ramesh.rao@institution.edu',
          phone: '+91 98450 11223',
          departmentId: deptCse.id,
          designation: 'Associate Professor',
          officeLocation: 'Room 304, CS Academic Block',
          maxMentees: 20,
        },
      },
    },
    include: { mentorProfile: true },
  });

  const mentor2 = await prisma.user.create({
    data: {
      email: 'priya.sharma@institution.edu',
      password: mentorPassword,
      role: 'MENTOR',
      approvalStatus: 'APPROVED',
      mentorProfile: {
        create: {
          fullName: 'Prof. Priya Sharma',
          facultyId: 'FAC102',
          collegeEmail: 'priya.sharma@institution.edu',
          phone: '+91 98450 44556',
          departmentId: deptCse.id,
          designation: 'Assistant Professor',
          officeLocation: 'Room 208, CS Academic Block',
          maxMentees: 20,
        },
      },
    },
    include: { mentorProfile: true },
  });

  const mentor3 = await prisma.user.create({
    data: {
      email: 'anand.k@institution.edu',
      password: mentorPassword,
      role: 'MENTOR',
      approvalStatus: 'APPROVED',
      mentorProfile: {
        create: {
          fullName: 'Prof. Anand Kulkarni',
          facultyId: 'FAC103',
          collegeEmail: 'anand.k@institution.edu',
          phone: '+91 98450 77889',
          departmentId: deptIse.id,
          designation: 'Associate Professor',
          officeLocation: 'Room 102, IS Block',
          maxMentees: 20,
        },
      },
    },
    include: { mentorProfile: true },
  });

  console.log('Mentors created.');

  // 7. Create Mentees (Students)
  // Mentee 1: Aryan Verma (High achiever)
  const mentee1 = await prisma.user.create({
    data: {
      email: 'aryan.verma@student.edu',
      password: menteePassword,
      role: 'MENTEE',
      approvalStatus: 'APPROVED',
      menteeProfile: {
        create: {
          fullName: 'Aryan Verma',
          usn: '1MS22CS001',
          collegeEmail: 'aryan.verma@student.edu',
          phone: '+91 91234 56701',
          departmentId: deptCse.id,
          semester: 5,
          academicYear: '2025-2026',
          section: 'A',
          cgpa: 8.85,
          sgpa: 9.10,
          attendancePercent: 92.5,
          isRiskFlagged: false,
          riskLevel: 'NONE',
          hobbies: 'Competitive Programming, Chess, Technical Blogging',
          interests: 'Distributed Systems, Cloud Native Architecture, Machine Learning',
          strengths: 'Algorithms, Fast Learner, Team Collaboration',
          areasForImprovement: 'Public Speaking and Presentation under pressure',
          skills: 'TypeScript, Go, Python, React, PostgreSQL, Docker',
          certifications: 'AWS Certified Cloud Practitioner, HashiCorp Terraform Associate',
          achievements: '1st Place in National Hackathon 2025, Dean’s Merit List 2024',
          projects: 'Campus Marketplace, Real-time Collaborative Whiteboard',
          careerGoals: 'Senior Software Architect at a leading tech institution',
          specializationPreference: 'Systems Engineering and Distributed Cloud Infrastructure',
          personalDevGoals: 'Read 2 technical architecture books per semester',
          mentoringPreferences: 'Prefers fortnightly 1-on-1 career guidance sessions',
          shareWithMentor: true,
        },
      },
    },
    include: { menteeProfile: true },
  });

  // Mentee 2: Sneha Patil (Academic Risk: Low attendance 64.5%, SGPA 5.92, Backlog)
  const mentee2 = await prisma.user.create({
    data: {
      email: 'sneha.patil@student.edu',
      password: menteePassword,
      role: 'MENTEE',
      approvalStatus: 'APPROVED',
      menteeProfile: {
        create: {
          fullName: 'Sneha Patil',
          usn: '1MS22CS045',
          collegeEmail: 'sneha.patil@student.edu',
          phone: '+91 91234 56745',
          departmentId: deptCse.id,
          semester: 5,
          academicYear: '2025-2026',
          section: 'B',
          cgpa: 5.92,
          sgpa: 5.75,
          attendancePercent: 64.5,
          isRiskFlagged: true,
          riskLevel: 'CRITICAL',
          hobbies: 'Digital Art, Creative Writing, Badminton',
          interests: 'UI/UX Design, Human-Computer Interaction',
          strengths: 'Design Thinking, Empathy in Product Design, HTML/CSS',
          areasForImprovement: 'Complex Math Analysis, Core Operating Systems internals',
          skills: 'Figma, Adobe Illustrator, HTML/CSS, Basic JavaScript',
          careerGoals: 'Product Designer / UX Specialist in EdTech',
          personalDevGoals: 'Improve continuous study discipline and bridge attendance deficit',
          mentoringPreferences: 'Wants structured weekly accountability check-ins',
          shareWithMentor: true,
        },
      },
    },
    include: { menteeProfile: true },
  });

  // Mentee 3: Rohan Iyer (Average performer, minor attendance dips)
  const mentee3 = await prisma.user.create({
    data: {
      email: 'rohan.iyer@student.edu',
      password: menteePassword,
      role: 'MENTEE',
      approvalStatus: 'APPROVED',
      menteeProfile: {
        create: {
          fullName: 'Rohan Iyer',
          usn: '1MS22CS078',
          collegeEmail: 'rohan.iyer@student.edu',
          phone: '+91 91234 56778',
          departmentId: deptCse.id,
          semester: 5,
          academicYear: '2025-2026',
          section: 'A',
          cgpa: 7.42,
          sgpa: 7.60,
          attendancePercent: 78.0,
          isRiskFlagged: false,
          riskLevel: 'LOW',
          hobbies: 'Guitar, Photography, Robotics',
          interests: 'Embedded Systems, IoT Devices, Full Stack Web',
          strengths: 'Hardware interfacing, C++, Arduino/ESP32',
          areasForImprovement: 'Data Structures and Algorithms optimization',
          skills: 'C++, Python, React, ESP32 Microcontrollers',
          careerGoals: 'IoT Solutions Developer',
          shareWithMentor: true,
        },
      },
    },
    include: { menteeProfile: true },
  });

  // Mentee 4: Kavya Reddy (ISE Department)
  const mentee4 = await prisma.user.create({
    data: {
      email: 'kavya.reddy@student.edu',
      password: menteePassword,
      role: 'MENTEE',
      approvalStatus: 'APPROVED',
      menteeProfile: {
        create: {
          fullName: 'Kavya Reddy',
          usn: '1MS23IS012',
          collegeEmail: 'kavya.reddy@student.edu',
          phone: '+91 91234 56712',
          departmentId: deptIse.id,
          semester: 3,
          academicYear: '2025-2026',
          section: 'A',
          cgpa: 8.20,
          sgpa: 8.40,
          attendancePercent: 88.0,
          isRiskFlagged: false,
          riskLevel: 'NONE',
          hobbies: 'Reading, Debate, Table Tennis',
          interests: 'Data Analytics, Business Intelligence',
          strengths: 'Analytical reasoning, SQL, Statistics',
          skills: 'SQL, Python, PowerBI, Tableau',
          careerGoals: 'Data Analyst at top management consultancy',
          shareWithMentor: true,
        },
      },
    },
    include: { menteeProfile: true },
  });

  // Mentee 5: Varun Nair (High Risk Attendance 71.2%)
  const mentee5 = await prisma.user.create({
    data: {
      email: 'varun.nair@student.edu',
      password: menteePassword,
      role: 'MENTEE',
      approvalStatus: 'APPROVED',
      menteeProfile: {
        create: {
          fullName: 'Varun Nair',
          usn: '1MS22CS110',
          collegeEmail: 'varun.nair@student.edu',
          phone: '+91 91234 56710',
          departmentId: deptCse.id,
          semester: 5,
          academicYear: '2025-2026',
          section: 'C',
          cgpa: 6.30,
          sgpa: 6.10,
          attendancePercent: 71.2,
          isRiskFlagged: true,
          riskLevel: 'HIGH',
          hobbies: 'Gaming, Football',
          interests: 'Cybersecurity, Ethical Hacking',
          strengths: 'Network packet analysis, Linux command line',
          areasForImprovement: 'Consistent lecture attendance, punctuality',
          skills: 'Linux, Wireshark, Python Scripting',
          careerGoals: 'SOC Analyst / Information Security Consultant',
          shareWithMentor: true,
        },
      },
    },
    include: { menteeProfile: true },
  });

  console.log('Mentees created.');

  // 8. Create Mentor-Mentee Assignments
  const rameshProfile = mentor1.mentorProfile!;
  const priyaProfile = mentor2.mentorProfile!;
  const anandProfile = mentor3.mentorProfile!;

  // Dr. Ramesh Rao manages Aryan, Sneha, Rohan
  await prisma.mentorMenteeAssignment.createMany({
    data: [
      {
        mentorId: rameshProfile.id,
        menteeId: mentee1.menteeProfile!.id,
        academicYear: '2025-2026',
        semester: 5,
        status: 'ACTIVE',
        notes: 'Aryan assigned for honors track mentoring.',
      },
      {
        mentorId: rameshProfile.id,
        menteeId: mentee2.menteeProfile!.id,
        academicYear: '2025-2026',
        semester: 5,
        status: 'ACTIVE',
        notes: 'Sneha assigned with academic recovery focus.',
      },
      {
        mentorId: rameshProfile.id,
        menteeId: mentee3.menteeProfile!.id,
        academicYear: '2025-2026',
        semester: 5,
        status: 'ACTIVE',
        notes: 'Regular mentoring assignment.',
      },
    ],
  });

  // Prof. Priya Sharma manages Varun
  await prisma.mentorMenteeAssignment.create({
    data: {
      mentorId: priyaProfile.id,
      menteeId: mentee5.menteeProfile!.id,
      academicYear: '2025-2026',
      semester: 5,
      status: 'ACTIVE',
      notes: 'Assigned for attendance & course recovery.',
    },
  });

  // Prof. Anand Kulkarni manages Kavya
  await prisma.mentorMenteeAssignment.create({
    data: {
      mentorId: anandProfile.id,
      menteeId: mentee4.menteeProfile!.id,
      academicYear: '2025-2026',
      semester: 3,
      status: 'ACTIVE',
      notes: 'Direct department mentoring.',
    },
  });

  console.log('Assignments created.');

  // 9. Academic Records (Subject marks across semesters)
  const coursesSem4 = [
    { code: 'CS401', name: 'Design & Analysis of Algorithms', credits: 4 },
    { code: 'CS402', name: 'Operating Systems', credits: 4 },
    { code: 'CS403', name: 'Database Management Systems', credits: 4 },
    { code: 'CS404', name: 'Computer Communication Networks', credits: 3 },
    { code: 'CS405', name: 'Discrete Mathematical Structures', credits: 3 },
  ];

  // Aryan's Sem 4 records (Strong scores)
  for (const c of coursesSem4) {
    await prisma.academicRecord.create({
      data: {
        menteeId: mentee1.menteeProfile!.id,
        semester: 4,
        academicYear: '2024-2025',
        courseCode: c.code,
        courseName: c.name,
        credits: c.credits,
        iaMarks: 28,
        endSemMarks: 64,
        totalMarks: 92,
        grade: 'S',
        isPassed: true,
        sgpa: 9.10,
      },
    });
  }

  // Sneha's Sem 4 records (Struggled with OS and Algorithms)
  await prisma.academicRecord.createMany({
    data: [
      {
        menteeId: mentee2.menteeProfile!.id,
        semester: 4,
        academicYear: '2024-2025',
        courseCode: 'CS401',
        courseName: 'Design & Analysis of Algorithms',
        credits: 4,
        iaMarks: 16,
        endSemMarks: 32,
        totalMarks: 48,
        grade: 'D',
        isPassed: true,
        sgpa: 5.75,
      },
      {
        menteeId: mentee2.menteeProfile!.id,
        semester: 4,
        academicYear: '2024-2025',
        courseCode: 'CS402',
        courseName: 'Operating Systems',
        credits: 4,
        iaMarks: 12,
        endSemMarks: 24,
        totalMarks: 36,
        grade: 'F', // Backlog
        isPassed: false,
        sgpa: 5.75,
      },
      {
        menteeId: mentee2.menteeProfile!.id,
        semester: 4,
        academicYear: '2024-2025',
        courseCode: 'CS403',
        courseName: 'Database Management Systems',
        credits: 4,
        iaMarks: 21,
        endSemMarks: 44,
        totalMarks: 65,
        grade: 'B',
        isPassed: true,
        sgpa: 5.75,
      },
      {
        menteeId: mentee2.menteeProfile!.id,
        semester: 4,
        academicYear: '2024-2025',
        courseCode: 'CS404',
        courseName: 'Computer Communication Networks',
        credits: 3,
        iaMarks: 18,
        endSemMarks: 38,
        totalMarks: 56,
        grade: 'C',
        isPassed: true,
        sgpa: 5.75,
      },
    ],
  });

  // 10. Attendance Records
  await prisma.attendanceRecord.createMany({
    data: [
      {
        menteeId: mentee1.menteeProfile!.id,
        semester: 5,
        academicYear: '2025-2026',
        courseCode: 'CS501',
        courseName: 'Software Engineering',
        classesHeld: 42,
        classesAttended: 39,
        attendancePercent: 92.8,
        isShortage: false,
      },
      {
        menteeId: mentee1.menteeProfile!.id,
        semester: 5,
        academicYear: '2025-2026',
        courseCode: 'CS502',
        courseName: 'Web Technologies & Cloud Architecture',
        classesHeld: 40,
        classesAttended: 37,
        attendancePercent: 92.5,
        isShortage: false,
      },
      // Sneha's severe shortages
      {
        menteeId: mentee2.menteeProfile!.id,
        semester: 5,
        academicYear: '2025-2026',
        courseCode: 'CS501',
        courseName: 'Software Engineering',
        classesHeld: 42,
        classesAttended: 27,
        attendancePercent: 64.2,
        isShortage: true,
      },
      {
        menteeId: mentee2.menteeProfile!.id,
        semester: 5,
        academicYear: '2025-2026',
        courseCode: 'CS502',
        courseName: 'Web Technologies & Cloud Architecture',
        classesHeld: 40,
        classesAttended: 26,
        attendancePercent: 65.0,
        isShortage: true,
      },
      // Varun's borderline attendance
      {
        menteeId: mentee5.menteeProfile!.id,
        semester: 5,
        academicYear: '2025-2026',
        courseCode: 'CS501',
        courseName: 'Software Engineering',
        classesHeld: 42,
        classesAttended: 30,
        attendancePercent: 71.4,
        isShortage: true,
      },
    ],
  });

  console.log('Academic & Attendance records created.');

  // 11. Mentor Private Notes (Visible ONLY to Faculty)
  await prisma.mentorPrivateNote.createMany({
    data: [
      {
        mentorId: rameshProfile.id,
        menteeId: mentee1.menteeProfile!.id,
        title: 'Initial Career Potential Evaluation',
        category: 'Career',
        content: 'Aryan is performing at the top tier of his class. Shows strong analytical instincts in Distributed Systems. Recommended him to submit a research paper abstract for IEEE student conference.',
        isConfidential: true,
      },
      {
        mentorId: rameshProfile.id,
        menteeId: mentee2.menteeProfile!.id,
        title: 'Confidential: Health & Attendance Intervention',
        category: 'Personal',
        content: 'Met Sneha to discuss recent absences. She mentioned a viral illness in September that caused her to miss two full weeks of classes. She felt overwhelmed trying to catch up with Operating Systems. Discussed a daily study schedule and remedial tutoring with teaching assistants.',
        isConfidential: true,
      },
    ],
  });

  // 12. Student-Visible Recommendations
  const rec1 = await prisma.recommendation.create({
    data: {
      mentorId: rameshProfile.id,
      menteeId: mentee1.menteeProfile!.id,
      title: 'Competitive Coding & Open Source Contributions',
      category: 'Career Guidance',
      description: 'Continue daily LeetCode medium/hard challenges in Dynamic Programming and Graph Theory. Pick one CNCF open source project to contribute documentation and bug fixes.',
      isAcknowledged: true,
      acknowledgedAt: new Date(Date.now() - 3 * 86400000),
      acknowledgmentNote: 'Thank you Professor Rao. I have begun looking at issues in Kubernetes docs and Grafana.',
      status: 'IN_PROGRESS',
    },
  });

  const rec2 = await prisma.recommendation.create({
    data: {
      mentorId: rameshProfile.id,
      menteeId: mentee2.menteeProfile!.id,
      title: 'Operating Systems Remedial Action Plan',
      category: 'Academic Improvement',
      description: 'Attend the special Saturday remedial sessions for Memory Management and Deadlock algorithms. Submit handwritten weekly summaries of chapters 6-8 before November 15.',
      isAcknowledged: true,
      acknowledgedAt: new Date(Date.now() - 5 * 86400000),
      acknowledgmentNote: 'Understood. I will attend Saturday coaching and submit the chapter summaries.',
      status: 'ACKNOWLEDGED',
    },
  });

  // 13. Comments on Recommendation
  await prisma.recommendationComment.createMany({
    data: [
      {
        recommendationId: rec2.id,
        authorId: mentee2.id,
        content: 'Professor, will the Saturday coaching cover Virtual Memory paging algorithms specifically?',
      },
      {
        recommendationId: rec2.id,
        authorId: mentor1.id,
        content: 'Yes Sneha, Prof. Sharma will dedicate the first 90 minutes solely to Page Replacement algorithms and exercise problems.',
      },
    ],
  });

  // 14. Action Item Tasks
  await prisma.studentTask.createMany({
    data: [
      {
        mentorId: rameshProfile.id,
        menteeId: mentee1.menteeProfile!.id,
        recommendationId: rec1.id,
        title: 'Submit IEEE Conference Abstract Draft',
        description: 'Draft 500-word abstract on consensus protocols in decentralized ledgers.',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 10 * 86400000),
        status: 'IN_PROGRESS',
        progressPercent: 60,
        evidenceUrl: 'https://docs.google.com/document/d/example-draft',
        evidenceNotes: 'Outline and background literature review sections completed.',
      },
      {
        mentorId: rameshProfile.id,
        menteeId: mentee2.menteeProfile!.id,
        recommendationId: rec2.id,
        title: 'Submit OS Chapter 6 Summary',
        description: 'Hand in handwritten summary on Process Synchronization and Semaphores.',
        priority: 'URGENT',
        dueDate: new Date(Date.now() + 3 * 86400000),
        status: 'IN_PROGRESS',
        progressPercent: 40,
        evidenceNotes: 'Writing notes for Peterson Algorithm and Dining Philosophers.',
      },
      {
        mentorId: rameshProfile.id,
        menteeId: mentee2.menteeProfile!.id,
        recommendationId: rec2.id,
        title: 'Maintain 90%+ Attendance in November',
        description: 'Do not miss any lecture hours in Software Engineering or Web Tech throughout November.',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 25 * 86400000),
        status: 'PENDING',
        progressPercent: 10,
      },
    ],
  });

  // 15. Meetings & Attendees
  // Meeting 1: Upcoming Individual Check-in with Aryan
  const meeting1 = await prisma.meeting.create({
    data: {
      mentorId: rameshProfile.id,
      title: 'Semester 5 Mid-Term Progress Check-in',
      agenda: 'Review internal assessment scores, conference abstract progress, and upcoming hackathon.',
      meetingType: 'INDIVIDUAL',
      mode: 'IN_PERSON',
      locationOrLink: 'Room 304, CS Academic Block',
      scheduledAt: new Date(Date.now() + 2 * 86400000), // in 2 days
      durationMinutes: 30,
      status: 'SCHEDULED',
      attendees: {
        create: {
          menteeId: mentee1.menteeProfile!.id,
          attendanceStatus: 'SCHEDULED',
        },
      },
    },
  });

  // Meeting 2: Upcoming Group Mentoring Session
  const meeting2 = await prisma.meeting.create({
    data: {
      mentorId: rameshProfile.id,
      title: 'Batch Mentoring: Career Pathways & Internship Strategy',
      agenda: 'Discuss summer 2026 internship prep, resume building, and research opportunities.',
      meetingType: 'GROUP',
      mode: 'ONLINE',
      locationOrLink: 'https://meet.google.com/uid-mentor-tree-session',
      scheduledAt: new Date(Date.now() + 5 * 86400000), // in 5 days
      durationMinutes: 45,
      status: 'SCHEDULED',
      attendees: {
        create: [
          { menteeId: mentee1.menteeProfile!.id, attendanceStatus: 'SCHEDULED' },
          { menteeId: mentee2.menteeProfile!.id, attendanceStatus: 'SCHEDULED' },
          { menteeId: mentee3.menteeProfile!.id, attendanceStatus: 'SCHEDULED' },
        ],
      },
    },
  });

  // Meeting 3: Past Completed Meeting
  const pastMeeting = await prisma.meeting.create({
    data: {
      mentorId: rameshProfile.id,
      title: 'Initial Semester Orientation & Academic Review',
      agenda: 'Discuss previous semester grades and outline semester 5 objectives.',
      meetingType: 'INDIVIDUAL',
      mode: 'IN_PERSON',
      locationOrLink: 'Room 304, CS Academic Block',
      scheduledAt: new Date(Date.now() - 14 * 86400000),
      durationMinutes: 30,
      status: 'COMPLETED',
      mentorSummary: 'Discussed semester goals. Mentee committed to improving continuous assessment scores and starting competitive coding.',
      attendees: {
        create: {
          menteeId: mentee1.menteeProfile!.id,
          attendanceStatus: 'PRESENT',
          menteeFeedback: 'Session was very insightful and clarified course priorities.',
          actionItems: 'Submit draft resume and practice 3 algorithm problems weekly.',
          recordedAt: new Date(Date.now() - 14 * 86400000),
        },
      },
    },
  });

  // 16. Academic Risk Alerts
  await prisma.academicRiskAlert.create({
    data: {
      menteeId: mentee2.menteeProfile!.id,
      severity: 'CRITICAL',
      triggerReason: 'Severe overall attendance shortage: 64.5% (Threshold: 75.0%); Course backlogs in CS402 Operating Systems',
      metricsSnapshot: JSON.stringify({
        cgpa: 5.92,
        attendancePercent: 64.5,
        failedCoursesCount: 1,
        evaluatedAt: new Date().toISOString(),
      }),
      status: 'ACTION_PLANNED',
      reviewedBy: mentor1.id,
      reviewNotes: 'Discussed with student. Remedial schedule assigned and student committed to daily attendance logging.',
      actionPlan: 'Enrolled in Saturday remedial coaching; mentor check-in scheduled every Wednesday.',
    },
  });

  await prisma.academicRiskAlert.create({
    data: {
      menteeId: mentee5.menteeProfile!.id,
      severity: 'HIGH',
      triggerReason: 'Course attendance shortage in CS501 (71.4%) below minimum mandatory 75% limit',
      metricsSnapshot: JSON.stringify({
        cgpa: 6.30,
        attendancePercent: 71.2,
        evaluatedAt: new Date().toISOString(),
      }),
      status: 'UNDER_REVIEW',
      reviewedBy: mentor2.id,
      reviewNotes: 'Faculty advisor contacted student regarding unexcused morning lecture absences.',
      actionPlan: 'Mandatory attendance verification slip to be signed weekly by subject teachers.',
    },
  });

  // 17. Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientId: mentee1.id,
        senderId: mentor1.id,
        title: 'Upcoming Mentoring Check-in',
        message: 'Your 1-on-1 session is scheduled for Friday at 11:00 AM in Room 304.',
        type: 'MEETING',
        link: '/mentee/dashboard',
        isRead: false,
      },
      {
        recipientId: mentee2.id,
        senderId: mentor1.id,
        title: 'Academic Action Plan Advisory',
        message: 'Please review and acknowledge your Operating Systems Remedial Action Plan.',
        type: 'RISK_ALERT',
        link: '/mentee/dashboard',
        isRead: false,
      },
      {
        recipientId: mentor1.id,
        senderId: mentee2.id,
        title: 'Recommendation Feedback Received',
        message: 'Sneha Patil left a comment on: "Operating Systems Remedial Action Plan"',
        type: 'RECOMMENDATION',
        link: `/mentor/mentees/${mentee2.menteeProfile!.id}`,
        isRead: false,
      },
    ],
  });

  // 18. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        details: JSON.stringify({ version: '1.0.0', status: 'Initialized successfully' }),
        ipAddress: '127.0.0.1',
      },
      {
        userId: adminUser.id,
        action: 'ASSIGN_MENTOR',
        entityType: 'MentorMenteeAssignment',
        details: JSON.stringify({ mentorId: rameshProfile.id, studentCount: 3 }),
        ipAddress: '127.0.0.1',
      },
      {
        userId: mentor1.id,
        action: 'CREATE_FACULTY_PRIVATE_NOTE',
        entityType: 'MentorPrivateNote',
        details: JSON.stringify({ menteeId: mentee2.menteeProfile!.id, category: 'Personal' }),
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('✅ Seed completed successfully with realistic institutional data!');
  console.log(`
----------------------------------------------------------------------
Demo Institutional Accounts:
----------------------------------------------------------------------
1. Master Administrator:
   Email: admin@institution.edu | Password: Admin@123 | ID: EMP001
2. Head of Department (HOD CSE):
   Email: hod.cse@institution.edu | Password: Hod@123 | ID: EMP010
3. Faculty Mentors:
   - Dr. Ramesh Rao:   ramesh.rao@institution.edu   | Password: Mentor@123 | ID: FAC101
   - Prof. Priya Sharma: priya.sharma@institution.edu | Password: Mentor@123 | ID: FAC102
   - Prof. Anand K:      anand.k@institution.edu      | Password: Mentor@123 | ID: FAC103
4. Students (Mentees):
   - Aryan Verma (High Achiever):  aryan.verma@student.edu  | Password: Mentee@123 | USN: 1MS22CS001
   - Sneha Patil (Academic Risk):  sneha.patil@student.edu  | Password: Mentee@123 | USN: 1MS22CS045
   - Rohan Iyer:                   rohan.iyer@student.edu   | Password: Mentee@123 | USN: 1MS22CS078
   - Kavya Reddy (ISE):            kavya.reddy@student.edu  | Password: Mentee@123 | USN: 1MS23IS012
   - Varun Nair (Attendance Risk): varun.nair@student.edu   | Password: Mentee@123 | USN: 1MS22CS110
----------------------------------------------------------------------
  `);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
