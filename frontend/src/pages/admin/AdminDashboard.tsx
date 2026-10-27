import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (error) {
      console.error('Failed to load admin dashboard:', error);
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

  const { summary, mentorWorkload, flaggedStudents, semesterDistribution, departments } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institutional Administration & Oversight
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Campus-wide mentoring performance, faculty workload allocation, and student risk intervention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/assignments">
            <Button size="sm" leftIcon={<Users className="w-4 h-4" />}>
              Assign Mentees
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button variant="outline" size="sm">
              Institutional Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-brand-600">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled Students</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {summary.totalStudents}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {summary.activeAssignmentsCount} assigned to mentors
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faculty Mentors</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {summary.totalMentors}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Across {departments.length} departments
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Risk Alerts</p>
              <h3 className="text-2xl font-black text-rose-600 mt-1">
                {summary.criticalRisksCount + summary.highRisksCount}
              </h3>
              <p className="text-[11px] text-rose-500 mt-1">
                {summary.criticalRisksCount} critical • {summary.highRisksCount} high risk
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Registrations</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {summary.pendingApprovalsCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">Awaiting verification</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Workload & Semester Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Semester Distribution & Workload */}
        <div className="lg:col-span-2 space-y-6">
          {/* Semester-wise Performance Chart */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Semester-wise Student Academic Standing</CardTitle>
                <p className="text-xs text-slate-500">Average attendance and CGPA by semester cohort</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={semesterDistribution} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
                    <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 12 }} label={{ value: 'Attendance %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 12 }} label={{ value: 'Avg CGPA', angle: 90, position: 'insideRight', fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="avgAttendance" name="Avg Attendance %" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="avgCgpa" name="Avg CGPA" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Flagged Students for Administrative Review */}
          <Card>
            <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <div>
                  <CardTitle>Students Flagged for Academic Intervention</CardTitle>
                  <p className="text-xs text-slate-500">Active alerts requiring monitoring</p>
                </div>
              </div>
              <Link to="/admin/risk-management" className="text-xs text-rose-600 font-semibold hover:underline">
                Risk Engine
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {flaggedStudents.map((s: any) => (
                  <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{s.fullName}</span>
                        <span className="font-mono text-xs text-slate-500">({s.usn})</span>
                        <RiskBadge level={s.riskLevel} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {s.department} • Sem {s.semester} • Mentor: <span className="font-semibold text-slate-700">{s.assignedMentor}</span> • Attendance: <span className="font-bold text-rose-600">{s.attendancePercent ? `${s.attendancePercent.toFixed(1)}%` : 'N/A'}</span>
                      </p>
                      <p className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded">
                        Trigger: {s.latestTrigger}
                      </p>
                    </div>

                    <Link to="/admin/risk-management">
                      <Button size="sm" variant="outline">
                        Review Plan
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Mentor Workload & Department Summary */}
        <div className="space-y-6">
          {/* Mentor Workload Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Mentor Workload Distribution</CardTitle>
              <Link to="/admin/mentors" className="text-xs text-brand-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {mentorWorkload.map((m: any) => (
                <div key={m.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{m.name}</span>
                    <span className="text-slate-500 font-medium">
                      {m.assignedCount} / {m.capacity} mentees ({m.utilizationPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        m.utilizationPercent >= 100
                          ? 'bg-rose-500'
                          : m.utilizationPercent >= 75
                          ? 'bg-amber-500'
                          : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min(100, m.utilizationPercent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Department Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Departments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {departments.map((dept: any) => (
                <div key={dept.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{dept.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{dept.code}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">{dept.menteesCount} Students</span>
                    <span className="text-[11px] text-slate-400">{dept.mentorsCount} Faculty</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
