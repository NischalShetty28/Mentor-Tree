import React, { useState, useEffect } from 'react';
import { Download, FileText, AlertTriangle, CheckCircle, Percent, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api, downloadReport } from '../../api/client';
import { AcademicRecord, AttendanceRecord } from '../../types';

export const MenteeAcademicsPage: React.FC = () => {
  const [academicRecords, setAcademicRecords] = useState<AcademicRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    Promise.all([api.getAcademicRecords(), api.getAttendanceRecords()])
      .then(([academics, attendance]) => {
        setAcademicRecords(academics);
        setAttendanceRecords(attendance);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (format: 'pdf' | 'csv') => {
    try {
      setDownloading(true);
      await downloadReport(`/reports/student-progress?format=${format}`, `My_Academic_Progress.${format}`);
    } catch (error) {
      alert('Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group academic records by semester
  const semesterMap: { [sem: number]: AcademicRecord[] } = {};
  academicRecords.forEach((r) => {
    if (!semesterMap[r.semester]) semesterMap[r.semester] = [];
    semesterMap[r.semester].push(r);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Academic Performance & Attendance Audit
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Subject-wise examination scores, internal assessment results, and course attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            isLoading={downloading}
            onClick={() => handleDownload('csv')}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            isLoading={downloading}
            onClick={() => handleDownload('pdf')}
            leftIcon={<FileText className="w-4 h-4" />}
          >
            Download Official PDF
          </Button>
        </div>
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Course-wise Attendance Status</CardTitle>
            <p className="text-xs text-slate-500">Minimum mandatory attendance: 75% per course</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Course Title</th>
                  <th className="py-2.5 px-3">Classes Held</th>
                  <th className="py-2.5 px-3">Classes Attended</th>
                  <th className="py-2.5 px-3">Attendance %</th>
                  <th className="py-2.5 px-3">Shortage Warning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceRecords.map((att) => {
                  const isShortage = att.isShortage || att.attendancePercent < 75;
                  return (
                    <tr key={att.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {att.courseCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{att.courseName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{att.classesHeld}</td>
                      <td className="py-2.5 px-3 text-slate-500">{att.classesAttended}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold ${isShortage ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {att.attendancePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isShortage ? (
                          <Badge variant="danger" size="sm">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            Shortage Alert
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Normal
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Semester Marks */}
      <div className="space-y-4">
        {Object.keys(semesterMap).map((sem) => {
          const courses = semesterMap[Number(sem)];
          const semSgpa = courses[0]?.sgpa;

          return (
            <Card key={sem}>
              <CardHeader className="bg-slate-50/60 dark:bg-slate-800/50">
                <div className="flex items-center justify-between w-full">
                  <div>
                    <CardTitle>Semester {sem} Results</CardTitle>
                    <p className="text-xs text-slate-500">{courses[0]?.academicYear}</p>
                  </div>
                  {semSgpa && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Semester SGPA:</span>
                      <span className="text-base font-extrabold text-brand-600 dark:text-brand-400 ml-2">
                        {semSgpa.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/40 dark:bg-slate-800/40 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-4">Course</th>
                        <th className="py-2.5 px-4">Title</th>
                        <th className="py-2.5 px-4">Credits</th>
                        <th className="py-2.5 px-4">IA Marks</th>
                        <th className="py-2.5 px-4">Final Exam</th>
                        <th className="py-2.5 px-4">Total</th>
                        <th className="py-2.5 px-4">Grade</th>
                        <th className="py-2.5 px-4">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {courses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                            {course.courseCode}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{course.courseName}</td>
                          <td className="py-3 px-4 text-slate-500">{course.credits}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{course.iaMarks ?? '-'}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{course.endSemMarks ?? '-'}</td>
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">{course.totalMarks ?? '-'}</td>
                          <td className="py-3 px-4 font-bold font-mono text-brand-600">{course.grade ?? '-'}</td>
                          <td className="py-3 px-4">
                            {course.isPassed ? (
                              <Badge variant="success" size="sm">PASS</Badge>
                            ) : (
                              <Badge variant="danger" size="sm">BACKLOG</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
