import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  Calendar,
  CheckSquare,
  Clock,
  ArrowRight,
  Plus,
  Percent,
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';

export const MentorDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getMentorDashboard();
      setData(res);
    } catch (error) {
      console.error('Failed to load mentor dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, studentsRequiringAttention, upcomingMeetings, pendingRecommendations, incompleteTasks, attendanceConcerns } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Faculty Mentor Workspace
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Overview of assigned students, academic intervention alerts, and upcoming mentoring sessions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/mentor/calendar">
            <Button size="sm" leftIcon={<Calendar className="w-4 h-4" />}>
              Schedule Meeting
            </Button>
          </Link>
          <Link to="/mentor/mentees">
            <Button variant="outline" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              All Mentees ({metrics.totalMentees})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-600">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Mentees</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {metrics.totalMentees}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Active student roster</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Requires Attention</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                {metrics.attentionCount}
              </h3>
              <p className="text-[11px] text-rose-500 mt-1">Risk flagged / Shortages</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Sessions</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {metrics.upcomingMeetingsCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Scheduled check-ins</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Follow-ups</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {metrics.pendingFollowupsCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting acknowledgment</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Attention Students & Sidebar Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Students Requiring Immediate Attention */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <div>
                  <CardTitle>Students Requiring Attention</CardTitle>
                  <p className="text-xs text-slate-500">
                    Flagged for attendance shortage (&lt;75%), falling grades, or open academic alerts.
                  </p>
                </div>
              </div>
              <Link to="/mentor/alerts" className="text-xs text-rose-600 font-semibold hover:underline">
                View All Alerts
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {studentsRequiringAttention.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  All assigned mentees are in good academic standing.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentsRequiringAttention.map((student: any) => (
                    <div
                      key={student.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/mentor/mentees/${student.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 transition"
                          >
                            {student.fullName}
                          </Link>
                          <span className="font-mono text-xs text-slate-500">({student.usn})</span>
                          <RiskBadge level={student.riskLevel} />
                        </div>
                        <p className="text-xs text-slate-500">
                          Sem {student.semester} • Attendance: <span className="font-semibold text-rose-600">{student.attendancePercent ? `${student.attendancePercent.toFixed(1)}%` : 'N/A'}</span> • CGPA: <span className="font-semibold text-slate-800 dark:text-slate-200">{student.cgpa ? student.cgpa.toFixed(2) : 'N/A'}</span>
                        </p>
                        {student.riskAlerts && student.riskAlerts[0] && (
                          <p className="text-[11px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-100 dark:border-rose-900/40">
                            Reason: {student.riskAlerts[0].triggerReason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link to={`/mentor/mentees/${student.id}`}>
                          <Button size="sm" variant="outline" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                            Review Portfolio
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incomplete Tasks Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Incomplete Action Items & Progress</CardTitle>
                <p className="text-xs text-slate-500">Assigned student tasks with due dates and progress.</p>
              </div>
              <Link to="/mentor/tasks" className="text-xs text-brand-600 hover:underline">
                View All Tasks
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-4">Student</th>
                      <th className="py-2.5 px-4">Action Item</th>
                      <th className="py-2.5 px-4">Priority</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {incompleteTasks.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {t.mentee?.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">{t.title}</td>
                        <td className="py-3 px-4">
                          <Badge variant={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'danger' : 'default'} size="sm">
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${t.progressPercent}%` }} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{t.progressPercent}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Upcoming Meetings & Attendance Alerts */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Upcoming Sessions</CardTitle>
                <p className="text-xs text-slate-500">Scheduled mentoring check-ins</p>
              </div>
              <Link to="/mentor/calendar" className="text-xs text-brand-600 hover:underline">
                Calendar
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMeetings.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No upcoming sessions.</p>
              ) : (
                upcomingMeetings.map((m: any) => (
                  <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{m.title}</span>
                      <Badge variant="purple" size="sm">{m.meetingType}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(m.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      Attendees ({m.attendees?.length}):{' '}
                      {m.attendees?.map((a: any) => a.mentee.fullName).join(', ')}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Attendance Shortage Concerns */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-rose-500" />
                <CardTitle>Attendance Shortage Concerns</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {attendanceConcerns.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No attendance concerns.</p>
              ) : (
                attendanceConcerns.map((att: any) => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{att.fullName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{att.usn}</p>
                    </div>
                    <span className="font-bold text-rose-600">{att.attendancePercent.toFixed(1)}%</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
