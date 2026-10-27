import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  BookOpen,
  ArrowRight,
  Clock,
  User,
  MapPin,
  Mail,
  Phone,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export const MenteeDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    agenda: '',
    preferredDate: '',
    preferredMode: 'IN_PERSON',
  });
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getMenteeDashboard();
      setData(res);
    } catch (error) {
      console.error('Failed to load mentee dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRequestMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.requestMeeting(requestForm);
      setRequestSuccess(res.message);
      setTimeout(() => {
        setRequestModalOpen(false);
        setRequestSuccess(null);
        setRequestForm({ agenda: '', preferredDate: '', preferredMode: 'IN_PERSON' });
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to submit meeting request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { profile, assignedMentor, performanceOverview, upcomingMeetings, recommendations, pendingTasks, riskAlerts, attendanceRecords } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Risk Advisory Warning Banner (if student is flagged) */}
      {profile?.isRiskFlagged && (
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Academic Attention Advisory</h3>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white text-rose-700 px-2 py-0.5 rounded-full">
                  {profile.riskLevel} Priority
                </span>
              </div>
              <p className="text-xs text-rose-100 mt-1 max-w-2xl leading-relaxed">
                {riskAlerts && riskAlerts.length > 0
                  ? riskAlerts[0].triggerReason
                  : 'Your attendance or semester standing is below the recommended institutional threshold. Connect with your faculty mentor for guidance.'}
              </p>
              {riskAlerts && riskAlerts[0]?.actionPlan && (
                <p className="text-xs font-semibold text-white mt-1">
                  Active Action Plan: {riskAlerts[0].actionPlan}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setRequestModalOpen(true)}
            className="whitespace-nowrap bg-white text-rose-800 hover:bg-rose-50 font-semibold"
          >
            Request Mentor Session
          </Button>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {profile?.fullName}!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            USN: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{profile?.usn}</span> •{' '}
            {profile?.department} • Semester {profile?.semester} ({profile?.academicYear})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge level={profile?.riskLevel} />
          <Button variant="outline" size="sm" onClick={() => setRequestModalOpen(true)}>
            Request Meeting
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cumulative CGPA</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {profile?.cgpa ? profile.cgpa.toFixed(2) : 'N/A'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Latest SGPA: {profile?.sgpa?.toFixed(2) || 'N/A'}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Attendance</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {profile?.attendancePercent ? `${profile.attendancePercent.toFixed(1)}%` : '100%'}
              </h3>
              <p className={`text-[11px] mt-1 font-medium ${(profile?.attendancePercent || 100) < 75 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {(profile?.attendancePercent || 100) < 75 ? 'Shortage Alert (< 75%)' : 'Good Standing (≥ 75%)'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {performanceOverview?.completedTasksCount} / {performanceOverview?.totalTasksCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {pendingTasks?.length || 0} action items pending
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recommendations</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {recommendations?.length || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">From faculty mentor</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Charts & Mentor Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Academic Progression Trend</CardTitle>
                <p className="text-xs text-slate-500">Semester SGPA history</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {performanceOverview?.performanceTrend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceOverview.performanceTrend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="semester" tickFormatter={(sem) => `Sem ${sem}`} tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val: any) => [`${val} SGPA`, 'Semester Grade']} />
                      <Line
                        type="monotone"
                        dataKey="sgpa"
                        stroke="#6366F1"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#6366F1' }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No semester marks data recorded yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subject Attendance Breakdown Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Subject-wise Attendance Status</CardTitle>
                <p className="text-xs text-slate-500">Threshold: 75% mandatory attendance</p>
              </div>
              <Link to="/mentee/academics" className="text-xs text-brand-600 hover:underline">
                View Details
              </Link>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {attendanceRecords?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceRecords} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
                      <XAxis dataKey="courseCode" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Attendance']} />
                      <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '75% Min', fill: '#ef4444', fontSize: 11 }} />
                      <Bar dataKey="attendancePercent" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No attendance records logged for current term.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Mentor Card & Upcoming Meetings */}
        <div className="space-y-6">
          {/* Assigned Mentor Card */}
          <Card className="border-t-4 border-t-brand-600">
            <CardHeader>
              <CardTitle>Assigned Faculty Mentor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignedMentor ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-navy-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {assignedMentor.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {assignedMentor.fullName}
                      </h4>
                      <p className="text-xs text-slate-500">{assignedMentor.designation}</p>
                      <p className="text-xs text-brand-600 dark:text-brand-400">{assignedMentor.department}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    {assignedMentor.officeLocation && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{assignedMentor.officeLocation}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="font-mono">{assignedMentor.email}</span>
                    </div>
                    {assignedMentor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{assignedMentor.phone}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    size="sm"
                    onClick={() => setRequestModalOpen(true)}
                  >
                    Request 1-on-1 Mentoring Meeting
                  </Button>
                </>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No mentor assigned currently.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Please contact your department HOD coordinator.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <Link to="/mentee/meetings" className="text-xs text-brand-600 hover:underline">
                All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMeetings?.length > 0 ? (
                upcomingMeetings.map((m: any) => (
                  <div key={m.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{m.title}</span>
                      <Badge variant="info" size="sm">{m.mode}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(m.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    {m.locationOrLink && (
                      <p className="text-[11px] text-brand-600 dark:text-brand-400 truncate">
                        {m.locationOrLink}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No upcoming meetings scheduled.</p>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Action Items</CardTitle>
              <Link to="/mentee/tasks" className="text-xs text-brand-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {pendingTasks?.length > 0 ? (
                pendingTasks.slice(0, 3).map((t: any) => (
                  <div key={t.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{t.title}</span>
                      <Badge variant={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'danger' : 'default'} size="sm">
                        {t.priority}
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${t.progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Progress: {t.progressPercent}%</span>
                      {t.dueDate && <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">No pending action items.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Meeting Request Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Mentoring Session"
        description="Notify your mentor to schedule a personalized follow-up discussion."
      >
        {requestSuccess ? (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{requestSuccess}</span>
          </div>
        ) : (
          <form onSubmit={handleRequestMeeting} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Discussion Agenda / Purpose *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Discuss course backlog in Operating Systems, review resume draft, or clarify career electives."
                value={requestForm.agenda}
                onChange={(e) => setRequestForm({ ...requestForm, agenda: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Preferred Date / Time"
                type="date"
                value={requestForm.preferredDate}
                onChange={(e) => setRequestForm({ ...requestForm, preferredDate: e.target.value })}
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Preferred Mode
                </label>
                <select
                  value={requestForm.preferredMode}
                  onChange={(e) => setRequestForm({ ...requestForm, preferredMode: e.target.value })}
                  className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="IN_PERSON">In-Person (Faculty Office)</option>
                  <option value="ONLINE">Online Video Call</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit Request</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
