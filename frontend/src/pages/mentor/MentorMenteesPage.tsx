import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Users, ArrowRight, AlertTriangle, CheckSquare, BookOpen, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { api } from '../../api/client';

export const MentorMenteesPage: React.FC = () => {
  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [attendanceFilter, setAttendanceFilter] = useState('');

  const fetchMentees = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (semesterFilter) params.semester = semesterFilter;
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      if (attendanceFilter) params.attendanceRange = attendanceFilter;

      const data = await api.getAssignedMentees(params);
      setMentees(data);
    } catch (error) {
      console.error('Failed to load mentees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentees();
  }, [semesterFilter, riskFilter, attendanceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMentees();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Assigned Student Mentees
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Academic portfolio tracking, attendance monitoring, and individual mentoring records.
          </p>
        </div>
        <Badge variant="purple" size="md">
          {mentees.length} Active Mentees
        </Badge>
      </div>

      {/* Filters & Search Toolbar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search by student name or USN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Risk Standings</option>
            <option value="CRITICAL">Critical Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
            <option value="NONE">Normal Standing</option>
          </select>

          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">All Attendance Ranges</option>
            <option value="LOW">Shortage Alert (&lt; 75%)</option>
            <option value="MEDIUM">Borderline (75% - 85%)</option>
            <option value="HIGH">Excellent (&gt; 85%)</option>
          </select>
        </form>
      </Card>

      {/* Mentees Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mentees.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-slate-500 text-xs">
            No mentees found matching the selected filter criteria.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mentees.map((m) => (
            <Card
              key={m.id}
              className={`hover:shadow-lg transition-all border flex flex-col justify-between ${
                m.isRiskFlagged ? 'border-rose-300 dark:border-rose-900' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-navy-800 text-white flex items-center justify-center font-bold text-sm">
                      {m.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {m.fullName}
                      </h3>
                      <span className="font-mono text-xs text-slate-500">{m.usn}</span>
                    </div>
                  </div>
                  <RiskBadge level={m.riskLevel} />
                </div>

                <div className="text-xs text-slate-500">
                  {m.department} • Semester {m.semester} ({m.academicYear})
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Attendance</span>
                    <span className={`font-bold text-sm ${m.attendancePercent < 75 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                      {m.attendancePercent ? `${m.attendancePercent.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg">
                    <span className="text-slate-400 block text-[10px] uppercase">Cumulative CGPA</span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {m.cgpa ? m.cgpa.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Sub counts */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>{m.pendingTasksCount} Pending Tasks</span>
                  {m.unacknowledgedRecsCount > 0 && (
                    <span className="text-amber-600 font-semibold">
                      {m.unacknowledgedRecsCount} Unacknowledged Recs
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link to={`/mentor/mentees/${m.id}`} className="w-full">
                  <Button size="sm" variant="outline" className="w-full justify-between" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    <span>View Mentoring Portfolio</span>
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
