import { Request } from 'express';

export enum Role {
  MENTEE = 'MENTEE',
  MENTOR = 'MENTOR',
  ADMIN = 'ADMIN',
  HOD = 'HOD',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RiskLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RiskAlertStatus {
  NEW = 'NEW',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTION_PLANNED = 'ACTION_PLANNED',
  RESOLVED = 'RESOLVED',
}

export enum AssignmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
  TRANSFERRED = 'TRANSFERRED',
}

export enum RecommendationStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum MeetingType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
}

export enum MeetingMode {
  IN_PERSON = 'IN_PERSON',
  ONLINE = 'ONLINE',
}

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum AttendanceStatus {
  SCHEDULED = 'SCHEDULED',
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
  RESCHEDULED = 'RESCHEDULED',
}

export enum NotificationType {
  MEETING = 'MEETING',
  RECOMMENDATION = 'RECOMMENDATION',
  TASK = 'TASK',
  RISK_ALERT = 'RISK_ALERT',
  APPROVAL = 'APPROVAL',
  ASSIGNMENT = 'ASSIGNMENT',
  SYSTEM = 'SYSTEM',
}

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: Role;
  menteeId?: string;
  mentorId?: string;
  adminId?: string;
  departmentId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}
