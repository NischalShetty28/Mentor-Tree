import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, Filter, ShieldAlert, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';

export const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (deptFilter) params.departmentId = deptFilter;
      if (semesterFilter) params.semester = semesterFilter;
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      if (assignmentFilter) params.assignmentStatus = assignmentFilter;

      const data = await api.getAllStudents(params);
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [deptFilter, semesterFilter, riskFilter, assignmentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Student Institutional Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Campus-wide student registry, assigned faculty mentors, and academic performance status.
          </p>
        </div>
        <Badge variant="default" size="md">
          {students.length} Total Students
        </Badge>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Input
            placeholder="Search by name, USN, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>

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
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">All Allocation Status</option>
            <option value="ASSIGNED">Assigned to Mentor</option>
            <option value="UNASSIGNED">Unassigned Students</option>
          </select>
        </form>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Student Name & USN</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Sem</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4">Assigned Mentor</th>
                  <th className="py-3 px-4">Academic Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{s.fullName}</div>
                      <div className="font-mono text-slate-400 text-[11px]">{s.usn}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {s.departmentCode}
                    </td>
                    <td className="py-3 px-4 text-slate-500">Sem {s.semester}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${(s.attendancePercent || 0) < 75 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {s.attendancePercent ? `${s.attendancePercent.toFixed(1)}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {s.cgpa ? s.cgpa.toFixed(2) : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {s.assignedMentor ? (
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {s.assignedMentor.fullName}
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {s.assignedMentor.facultyId}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Unassigned
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={s.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
