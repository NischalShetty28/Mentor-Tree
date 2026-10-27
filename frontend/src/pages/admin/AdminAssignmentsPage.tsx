import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';

export const AdminAssignmentsPage: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [unassignedOnly, setUnassignedOnly] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mentorsData, studentsData, deptsData] = await Promise.all([
        api.getAllMentors(),
        api.getAllStudents(),
        api.getDepartments(),
      ]);
      setMentors(mentorsData);
      setStudents(studentsData);
      setDepartments(deptsData);
      if (mentorsData.length > 0 && !selectedMentorId) {
        setSelectedMentorId(mentorsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load allocation data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStudentToggle = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentorId || selectedStudentIds.length === 0) {
      alert('Please select a mentor and at least one student.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createAssignment(selectedMentorId, selectedStudentIds, notes);
      setSuccessMsg(res.message);
      setSelectedStudentIds([]);
      setNotes('');
      await fetchData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to assign mentor');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    if (unassignedOnly && s.assignedMentor) return false;
    if (deptFilter && s.departmentCode !== deptFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedMentor = mentors.find((m) => m.id === selectedMentorId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mentor–Mentee Allocation Manager
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Assign, reassign, or balance student cohorts among departmental faculty mentors.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Allocation Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 Col): Select Target Mentor */}
        <Card className="p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Step 1: Select Target Mentor</h3>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">Faculty Mentor *</label>
            <select
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-semibold"
            >
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.facultyId}) - {m.departmentCode}
                </option>
              ))}
            </select>
          </div>

          {selectedMentor && (
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-bold">{selectedMentor.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Designation:</span>
                <span className="font-bold">{selectedMentor.designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Mentees:</span>
                <span className="font-bold text-brand-600">
                  {selectedMentor.activeMenteesCount} / {selectedMentor.maxMentees}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">Assignment Notes / Term</label>
            <textarea
              rows={2}
              placeholder="e.g. Assigned for Semester 5 Honors & Academic recovery."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
            />
          </div>

          <Button
            onClick={handleAssign}
            isLoading={submitting}
            className="w-full"
            disabled={selectedStudentIds.length === 0}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Assign {selectedStudentIds.length} Selected Student(s)
          </Button>
        </Card>

        {/* Right Column (2 Cols): Student Selection Table */}
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Step 2: Choose Students ({selectedStudentIds.length} selected)
              </h3>
              <p className="text-xs text-slate-500">Filter and check students to assign to the selected mentor.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs py-1 px-2.5 rounded-lg border border-slate-300"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-xs cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => setUnassignedOnly(e.target.checked)}
                  className="accent-brand-600 rounded"
                />
                <span>Unassigned only</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-brand-600 font-semibold hover:underline"
            >
              {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                ? 'Deselect All'
                : 'Select All Filtered'}
            </button>
            <span className="text-slate-400">{filteredStudents.length} candidates available</span>
          </div>

          <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
            {filteredStudents.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs">
                No students match the current criteria.
              </p>
            ) : (
              filteredStudents.map((s) => {
                const isChecked = selectedStudentIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center justify-between p-3 cursor-pointer text-xs transition ${
                      isChecked ? 'bg-brand-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleStudentToggle(s.id)}
                        className="accent-brand-600 w-4 h-4 rounded"
                      />
                      <div>
                        <span className="font-bold text-slate-800">{s.fullName}</span>
                        <span className="text-slate-400 font-mono text-[11px] ml-2">{s.usn}</span>
                        <span className="text-slate-500 text-[11px] ml-2">
                          {s.departmentCode} • Sem {s.semester}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.assignedMentor ? (
                        <span className="text-[11px] text-slate-500">
                          Current: {s.assignedMentor.fullName}
                        </span>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Unassigned
                        </Badge>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
