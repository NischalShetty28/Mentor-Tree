"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRiskReport = exports.exportMentorWorkloadReport = exports.exportAttendanceReport = exports.exportAcademicReport = exports.exportStudentProgressReport = void 0;
const prisma_1 = require("../prisma");
const types_1 = require("../types");
const reportingService_1 = require("../services/reportingService");
// 1. Student Progress Report
const exportStudentProgressReport = async (req, res) => {
    try {
        const { format = 'csv', menteeId } = req.query;
        const targetMenteeId = (req.user?.role === types_1.Role.MENTEE ? req.user?.menteeId : menteeId);
        if (!targetMenteeId) {
            res.status(400).json({ message: 'Mentee ID is required.' });
            return;
        }
        const mentee = await prisma_1.prisma.menteeProfile.findUnique({
            where: { id: targetMenteeId },
            include: {
                department: true,
                assignments: {
                    where: { status: 'ACTIVE' },
                    include: { mentor: true },
                },
                academicRecords: {
                    orderBy: [{ semester: 'asc' }, { courseCode: 'asc' }],
                },
                attendanceRecords: true,
                tasks: true,
                recommendations: true,
            },
        });
        if (!mentee) {
            res.status(404).json({ message: 'Mentee not found.' });
            return;
        }
        const mentorName = mentee.assignments[0]?.mentor.fullName || 'Unassigned';
        if (format === 'pdf') {
            const columns = ['Course Code', 'Course Title', 'Credits', 'IA Marks', 'End Sem', 'Total', 'Grade', 'Status'];
            const rows = mentee.academicRecords.map((r) => [
                r.courseCode,
                r.courseName,
                r.credits,
                r.iaMarks ?? '-',
                r.endSemMarks ?? '-',
                r.totalMarks ?? '-',
                r.grade ?? '-',
                r.isPassed ? 'PASS' : 'FAIL',
            ]);
            const pdfBuffer = (0, reportingService_1.generatePdfReport)({
                title: `Comprehensive Student Progress Report - ${mentee.fullName}`,
                meta: {
                    'Student Name': mentee.fullName,
                    USN: mentee.usn,
                    Department: mentee.department.name,
                    'Current Semester': `Semester ${mentee.semester}`,
                    'Cumulative CGPA': mentee.cgpa?.toFixed(2) ?? 'N/A',
                    'Overall Attendance': `${mentee.attendancePercent?.toFixed(1)}%`,
                    'Assigned Mentor': mentorName,
                    'Completed Tasks': `${mentee.tasks.filter((t) => t.status === 'COMPLETED').length} of ${mentee.tasks.length}`,
                },
                columns,
                rows,
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Student_Progress_${mentee.usn}.pdf"`);
            res.send(pdfBuffer);
            return;
        }
        // CSV Format
        const headers = ['USN', 'Full Name', 'Course Code', 'Course Name', 'Semester', 'Credits', 'Grade', 'Passed', 'CGPA', 'Attendance %'];
        const rows = mentee.academicRecords.map((r) => [
            mentee.usn,
            mentee.fullName,
            r.courseCode,
            r.courseName,
            r.semester,
            r.credits,
            r.grade,
            r.isPassed ? 'Yes' : 'No',
            mentee.cgpa,
            mentee.attendancePercent,
        ]);
        const csvData = (0, reportingService_1.generateCsv)(headers, rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="Student_Progress_${mentee.usn}.csv"`);
        res.send(csvData);
    }
    catch (error) {
        console.error('exportStudentProgressReport error:', error);
        res.status(500).json({ message: 'Failed to generate progress report.' });
    }
};
exports.exportStudentProgressReport = exportStudentProgressReport;
// 2. Department & Semester Academic Performance Report
const exportAcademicReport = async (req, res) => {
    try {
        const { format = 'csv', departmentId, semester } = req.query;
        const whereClause = {};
        if (departmentId)
            whereClause.departmentId = String(departmentId);
        if (semester)
            whereClause.semester = parseInt(String(semester), 10);
        const students = await prisma_1.prisma.menteeProfile.findMany({
            where: whereClause,
            include: {
                department: true,
                assignments: {
                    where: { status: 'ACTIVE' },
                    include: { mentor: { select: { fullName: true } } },
                },
            },
            orderBy: [{ departmentId: 'asc' }, { semester: 'asc' }, { fullName: 'asc' }],
        });
        if (format === 'pdf') {
            const columns = ['USN', 'Student Name', 'Department', 'Sem', 'CGPA', 'SGPA', 'Attendance %', 'Risk Level', 'Mentor'];
            const rows = students.map((s) => [
                s.usn,
                s.fullName,
                s.department.code,
                s.semester,
                s.cgpa?.toFixed(2) ?? '-',
                s.sgpa?.toFixed(2) ?? '-',
                `${s.attendancePercent?.toFixed(1) ?? 0}%`,
                s.riskLevel,
                s.assignments[0]?.mentor.fullName ?? 'None',
            ]);
            const pdfBuffer = (0, reportingService_1.generatePdfReport)({
                title: 'Academic Performance & Standing Summary',
                meta: {
                    'Total Students Included': students.length,
                    'Filtered Department': departmentId ? String(departmentId) : 'All Departments',
                    'Filtered Semester': semester ? `Semester ${semester}` : 'All Semesters',
                },
                columns,
                rows,
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Academic_Performance_Report.pdf"');
            res.send(pdfBuffer);
            return;
        }
        const headers = ['USN', 'Full Name', 'Department', 'Semester', 'CGPA', 'SGPA', 'Attendance %', 'Risk Level', 'Mentor Name'];
        const rows = students.map((s) => [
            s.usn,
            s.fullName,
            s.department.code,
            s.semester,
            s.cgpa,
            s.sgpa,
            s.attendancePercent,
            s.riskLevel,
            s.assignments[0]?.mentor.fullName ?? 'Unassigned',
        ]);
        const csvData = (0, reportingService_1.generateCsv)(headers, rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Academic_Performance_Report.csv"');
        res.send(csvData);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to generate academic report.' });
    }
};
exports.exportAcademicReport = exportAcademicReport;
// 3. Attendance Report
const exportAttendanceReport = async (req, res) => {
    try {
        const { format = 'csv', departmentId, shortageOnly } = req.query;
        const whereClause = {};
        if (departmentId)
            whereClause.departmentId = String(departmentId);
        if (shortageOnly === 'true')
            whereClause.attendancePercent = { lt: 75.0 };
        const students = await prisma_1.prisma.menteeProfile.findMany({
            where: whereClause,
            include: {
                department: true,
                assignments: {
                    where: { status: 'ACTIVE' },
                    include: { mentor: { select: { fullName: true } } },
                },
            },
            orderBy: { attendancePercent: 'asc' },
        });
        if (format === 'pdf') {
            const columns = ['USN', 'Student Name', 'Department', 'Sem', 'Attendance %', 'Status', 'Assigned Mentor'];
            const rows = students.map((s) => [
                s.usn,
                s.fullName,
                s.department.code,
                s.semester,
                `${s.attendancePercent?.toFixed(1)}%`,
                (s.attendancePercent || 0) < 75 ? 'SHORTAGE ALERT' : 'Normal',
                s.assignments[0]?.mentor.fullName ?? 'None',
            ]);
            const pdfBuffer = (0, reportingService_1.generatePdfReport)({
                title: 'Institutional Student Attendance Audit',
                meta: {
                    'Total Evaluated Students': students.length,
                    'Shortage Filter': shortageOnly === 'true' ? 'Attendance < 75% Only' : 'All Students',
                },
                columns,
                rows,
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Student_Attendance_Report.pdf"');
            res.send(pdfBuffer);
            return;
        }
        const headers = ['USN', 'Full Name', 'Department', 'Semester', 'Attendance Percentage', 'Shortage Flag', 'Mentor'];
        const rows = students.map((s) => [
            s.usn,
            s.fullName,
            s.department.code,
            s.semester,
            s.attendancePercent,
            (s.attendancePercent || 0) < 75 ? 'YES' : 'NO',
            s.assignments[0]?.mentor.fullName ?? 'Unassigned',
        ]);
        const csvData = (0, reportingService_1.generateCsv)(headers, rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Attendance_Report.csv"');
        res.send(csvData);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to generate attendance report.' });
    }
};
exports.exportAttendanceReport = exportAttendanceReport;
// 4. Mentor Workload & Assignment Report
const exportMentorWorkloadReport = async (req, res) => {
    try {
        const { format = 'csv', departmentId } = req.query;
        const whereClause = {};
        if (departmentId)
            whereClause.departmentId = String(departmentId);
        const mentors = await prisma_1.prisma.mentorProfile.findMany({
            where: whereClause,
            include: {
                department: true,
                _count: {
                    select: {
                        assignments: { where: { status: 'ACTIVE' } },
                        meetings: true,
                        recommendations: true,
                    },
                },
            },
            orderBy: { fullName: 'asc' },
        });
        if (format === 'pdf') {
            const columns = ['Faculty ID', 'Faculty Name', 'Department', 'Designation', 'Assigned Mentees', 'Max Quota', 'Utilization', 'Meetings Conducted'];
            const rows = mentors.map((m) => [
                m.facultyId,
                m.fullName,
                m.department.code,
                m.designation,
                m._count.assignments,
                m.maxMentees,
                `${Math.round((m._count.assignments / (m.maxMentees || 20)) * 100)}%`,
                m._count.meetings,
            ]);
            const pdfBuffer = (0, reportingService_1.generatePdfReport)({
                title: 'Faculty Mentor Allocation & Workload Audit',
                meta: {
                    'Total Mentors': mentors.length,
                    'Total Active Mentees Distributed': mentors.reduce((acc, m) => acc + m._count.assignments, 0),
                },
                columns,
                rows,
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Mentor_Workload_Report.pdf"');
            res.send(pdfBuffer);
            return;
        }
        const headers = ['Faculty ID', 'Faculty Name', 'Department', 'Designation', 'Active Mentees', 'Max Quota', 'Utilization %', 'Total Meetings'];
        const rows = mentors.map((m) => [
            m.facultyId,
            m.fullName,
            m.department.code,
            m.designation,
            m._count.assignments,
            m.maxMentees,
            Math.round((m._count.assignments / (m.maxMentees || 20)) * 100),
            m._count.meetings,
        ]);
        const csvData = (0, reportingService_1.generateCsv)(headers, rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Mentor_Workload_Report.csv"');
        res.send(csvData);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to generate mentor workload report.' });
    }
};
exports.exportMentorWorkloadReport = exportMentorWorkloadReport;
// 5. Academic Risk & Intervention Report
const exportRiskReport = async (req, res) => {
    try {
        const { format = 'csv' } = req.query;
        const alerts = await prisma_1.prisma.academicRiskAlert.findMany({
            include: {
                mentee: {
                    include: {
                        department: true,
                        assignments: {
                            where: { status: 'ACTIVE' },
                            include: { mentor: { select: { fullName: true } } },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (format === 'pdf') {
            const columns = ['USN', 'Student Name', 'Dept', 'Severity', 'Trigger Reason', 'Status', 'Assigned Mentor', 'Date Logged'];
            const rows = alerts.map((a) => [
                a.mentee.usn,
                a.mentee.fullName,
                a.mentee.department.code,
                a.severity,
                a.triggerReason.slice(0, 40) + '...',
                a.status,
                a.mentee.assignments[0]?.mentor.fullName ?? 'None',
                new Date(a.createdAt).toLocaleDateString(),
            ]);
            const pdfBuffer = (0, reportingService_1.generatePdfReport)({
                title: 'Academic Risk & Early Intervention Report',
                meta: {
                    'Total Recorded Alerts': alerts.length,
                    'Active Action Plans': alerts.filter((a) => a.status === 'ACTION_PLANNED').length,
                    'Resolved Cases': alerts.filter((a) => a.status === 'RESOLVED').length,
                },
                columns,
                rows,
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Academic_Risk_Report.pdf"');
            res.send(pdfBuffer);
            return;
        }
        const headers = ['USN', 'Student Name', 'Department', 'Semester', 'Severity', 'Reason', 'Status', 'Action Plan', 'Mentor', 'Date'];
        const rows = alerts.map((a) => [
            a.mentee.usn,
            a.mentee.fullName,
            a.mentee.department.code,
            a.mentee.semester,
            a.severity,
            a.triggerReason,
            a.status,
            a.actionPlan ?? 'None',
            a.mentee.assignments[0]?.mentor.fullName ?? 'Unassigned',
            new Date(a.createdAt).toISOString(),
        ]);
        const csvData = (0, reportingService_1.generateCsv)(headers, rows);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="Academic_Risk_Report.csv"');
        res.send(csvData);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to generate risk report.' });
    }
};
exports.exportRiskReport = exportRiskReport;
