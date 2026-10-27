export type Role = 'MENTEE' | 'MENTOR' | 'ADMIN' | 'HOD';

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskAlertStatus = 'NEW' | 'UNDER_REVIEW' | 'ACTION_PLANNED' | 'RESOLVED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type RecommendationStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
export type MeetingMode = 'IN_PERSON' | 'ONLINE';
export type AttendanceStatus = 'SCHEDULED' | 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'RESCHEDULED';

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  fullName?: string;
  usn?: string;
  facultyId?: string;
  employeeId?: string;
  department?: string;
  semester?: number;
  designation?: string;
  isSuperAdmin?: boolean;
  profileId?: string;
}

export interface MenteeProfile {
  id: string;
  userId: string;
  fullName: string;
  usn: string;
  collegeEmail: string;
  phone?: string | null;
  departmentId: string;
  department: Department;
  semester: number;
  academicYear: string;
  section?: string | null;
  cgpa?: number | null;
  sgpa?: number | null;
  attendancePercent?: number | null;
  isRiskFlagged: boolean;
  riskLevel: RiskLevel;
  hobbies?: string | null;
  interests?: string | null;
  strengths?: string | null;
  areasForImprovement?: string | null;
  skills?: string | null;
  certifications?: string | null;
  achievements?: string | null;
  extracurricular?: string | null;
  projects?: string | null;
  careerGoals?: string | null;
  specializationPreference?: string | null;
  personalDevGoals?: string | null;
  mentoringPreferences?: string | null;
  privateNotes?: string | null;
  shareWithMentor: boolean;
}

export interface MentorProfile {
  id: string;
  userId: string;
  fullName: string;
  facultyId: string;
  collegeEmail: string;
  phone?: string | null;
  departmentId: string;
  department: Department;
  designation: string;
  officeLocation?: string | null;
  maxMentees: number;
  activeMenteesCount?: number;
}

export interface AcademicRecord {
  id: string;
  semester: number;
  academicYear: string;
  courseCode: string;
  courseName: string;
  credits: number;
  iaMarks?: number | null;
  endSemMarks?: number | null;
  totalMarks?: number | null;
  grade?: string | null;
  isPassed: boolean;
  sgpa?: number | null;
}

export interface AttendanceRecord {
  id: string;
  semester: number;
  courseCode: string;
  courseName: string;
  classesHeld: number;
  classesAttended: number;
  attendancePercent: number;
  isShortage: boolean;
}

export interface RecommendationComment {
  id: string;
  recommendationId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    email: string;
    role: Role;
  };
}

export interface Recommendation {
  id: string;
  mentorId: string;
  menteeId: string;
  title: string;
  description: string;
  category: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string | null;
  acknowledgmentNote?: string | null;
  status: RecommendationStatus;
  createdAt: string;
  mentor?: {
    fullName: string;
    designation: string;
    collegeEmail?: string;
  };
  comments?: RecommendationComment[];
  tasks?: StudentTask[];
  mentee?: {
    fullName: string;
    usn: string;
  };
}

export interface StudentTask {
  id: string;
  mentorId?: string | null;
  menteeId: string;
  recommendationId?: string | null;
  title: string;
  description?: string | null;
  priority: Priority;
  dueDate?: string | null;
  status: TaskStatus;
  progressPercent: number;
  evidenceUrl?: string | null;
  evidenceNotes?: string | null;
  completedAt?: string | null;
  verifiedByMentor: boolean;
  createdAt: string;
  mentor?: { fullName: string };
  mentee?: { fullName: string; usn: string };
  recommendation?: { title: string };
}

export interface MeetingAttendee {
  id: string;
  meetingId: string;
  menteeId: string;
  attendanceStatus: AttendanceStatus;
  menteeFeedback?: string | null;
  actionItems?: string | null;
  mentee: {
    id: string;
    fullName: string;
    usn: string;
    collegeEmail?: string;
  };
}

export interface Meeting {
  id: string;
  mentorId: string;
  title: string;
  agenda?: string | null;
  meetingType: 'INDIVIDUAL' | 'GROUP';
  mode: MeetingMode;
  locationOrLink?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: MeetingStatus;
  rescheduledReason?: string | null;
  mentorSummary?: string | null;
  createdAt: string;
  mentor?: {
    id: string;
    fullName: string;
    designation: string;
    collegeEmail: string;
    officeLocation?: string;
  };
  attendees: MeetingAttendee[];
}

export interface AcademicRiskAlert {
  id: string;
  menteeId: string;
  severity: RiskLevel;
  triggerReason: string;
  metricsSnapshot?: string | null;
  status: RiskAlertStatus;
  reviewNotes?: string | null;
  actionPlan?: string | null;
  createdAt: string;
  mentee: {
    id: string;
    fullName: string;
    usn: string;
    semester: number;
    department: Department;
    assignments?: Array<{
      mentor: { fullName: string };
    }>;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}
