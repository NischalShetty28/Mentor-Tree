"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.AttendanceStatus = exports.MeetingStatus = exports.MeetingMode = exports.MeetingType = exports.TaskStatus = exports.Priority = exports.RecommendationStatus = exports.AssignmentStatus = exports.RiskAlertStatus = exports.RiskLevel = exports.ApprovalStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["MENTEE"] = "MENTEE";
    Role["MENTOR"] = "MENTOR";
    Role["ADMIN"] = "ADMIN";
    Role["HOD"] = "HOD";
})(Role || (exports.Role = Role = {}));
var ApprovalStatus;
(function (ApprovalStatus) {
    ApprovalStatus["PENDING"] = "PENDING";
    ApprovalStatus["APPROVED"] = "APPROVED";
    ApprovalStatus["REJECTED"] = "REJECTED";
})(ApprovalStatus || (exports.ApprovalStatus = ApprovalStatus = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["NONE"] = "NONE";
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var RiskAlertStatus;
(function (RiskAlertStatus) {
    RiskAlertStatus["NEW"] = "NEW";
    RiskAlertStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    RiskAlertStatus["ACTION_PLANNED"] = "ACTION_PLANNED";
    RiskAlertStatus["RESOLVED"] = "RESOLVED";
})(RiskAlertStatus || (exports.RiskAlertStatus = RiskAlertStatus = {}));
var AssignmentStatus;
(function (AssignmentStatus) {
    AssignmentStatus["ACTIVE"] = "ACTIVE";
    AssignmentStatus["INACTIVE"] = "INACTIVE";
    AssignmentStatus["COMPLETED"] = "COMPLETED";
    AssignmentStatus["TRANSFERRED"] = "TRANSFERRED";
})(AssignmentStatus || (exports.AssignmentStatus = AssignmentStatus = {}));
var RecommendationStatus;
(function (RecommendationStatus) {
    RecommendationStatus["OPEN"] = "OPEN";
    RecommendationStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    RecommendationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    RecommendationStatus["COMPLETED"] = "COMPLETED";
    RecommendationStatus["ARCHIVED"] = "ARCHIVED";
})(RecommendationStatus || (exports.RecommendationStatus = RecommendationStatus = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "LOW";
    Priority["MEDIUM"] = "MEDIUM";
    Priority["HIGH"] = "HIGH";
    Priority["URGENT"] = "URGENT";
})(Priority || (exports.Priority = Priority = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "PENDING";
    TaskStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TaskStatus["COMPLETED"] = "COMPLETED";
    TaskStatus["OVERDUE"] = "OVERDUE";
    TaskStatus["CANCELLED"] = "CANCELLED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var MeetingType;
(function (MeetingType) {
    MeetingType["INDIVIDUAL"] = "INDIVIDUAL";
    MeetingType["GROUP"] = "GROUP";
})(MeetingType || (exports.MeetingType = MeetingType = {}));
var MeetingMode;
(function (MeetingMode) {
    MeetingMode["IN_PERSON"] = "IN_PERSON";
    MeetingMode["ONLINE"] = "ONLINE";
})(MeetingMode || (exports.MeetingMode = MeetingMode = {}));
var MeetingStatus;
(function (MeetingStatus) {
    MeetingStatus["SCHEDULED"] = "SCHEDULED";
    MeetingStatus["COMPLETED"] = "COMPLETED";
    MeetingStatus["CANCELLED"] = "CANCELLED";
    MeetingStatus["RESCHEDULED"] = "RESCHEDULED";
})(MeetingStatus || (exports.MeetingStatus = MeetingStatus = {}));
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["SCHEDULED"] = "SCHEDULED";
    AttendanceStatus["PRESENT"] = "PRESENT";
    AttendanceStatus["ABSENT"] = "ABSENT";
    AttendanceStatus["EXCUSED"] = "EXCUSED";
    AttendanceStatus["RESCHEDULED"] = "RESCHEDULED";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["MEETING"] = "MEETING";
    NotificationType["RECOMMENDATION"] = "RECOMMENDATION";
    NotificationType["TASK"] = "TASK";
    NotificationType["RISK_ALERT"] = "RISK_ALERT";
    NotificationType["APPROVAL"] = "APPROVAL";
    NotificationType["ASSIGNMENT"] = "ASSIGNMENT";
    NotificationType["SYSTEM"] = "SYSTEM";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
