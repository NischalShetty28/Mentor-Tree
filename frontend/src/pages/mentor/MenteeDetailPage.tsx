import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  GraduationCap,
  Calendar,
  CheckCircle,
  Plus,
  Lock,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  ArrowLeft,
  Percent,
  Clock,
  Send,
  Eye,
  Shield,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export const MenteeDetailPage: React.FC = () => {
  const { menteeId } = useParams<{ menteeId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: overview, recommendations, privateNotes, tasks, meetings
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'privateNotes' | 'tasks' | 'meetings'>('overview');

  // Modal states
  const [recModalOpen, setRecModalOpen] = useState(false);
  const [recForm, setRecForm] = useState({ title: '', description: '', category: 'Academic' });

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', category: 'General' });

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });

  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = async () => {
    if (!menteeId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMenteeDetail(menteeId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load mentee portfolio.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [menteeId]);

  const handleCreateRec = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createRecommendation({ ...recForm, menteeId });
      setRecModalOpen(false);
      setRecForm({ title: '', description: '', category: 'Academic' });
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to save recommendation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createPrivateNote({ ...noteForm, menteeId });
      setNoteModalOpen(false);
      setNoteForm({ title: '', content: '', category: 'General' });
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to save private note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.createTask({ ...taskForm, menteeId });
      setTaskModalOpen(false);
      setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyTask = async (taskId: string, verified: boolean) => {
    try {
      await api.verifyTask(taskId, verified);
      await fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to update verification status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <Link to="/mentor/mentees">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Assigned Mentees
          </Button>
        </Link>
      </div>
    );
  }

  const { mentee, privateFacultyNotes, semesterTrends } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/mentor/mentees" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {mentee.fullName}
              </h2>
              <RiskBadge level={mentee.riskLevel} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              USN: <span className="font-mono font-medium">{mentee.usn}</span> • {mentee.department?.name} • Semester {mentee.semester}
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setNoteModalOpen(true)} leftIcon={<Lock className="w-3.5 h-3.5 text-amber-500" />}>
            Private Note
          </Button>
          <Button size="sm" variant="outline" onClick={() => setTaskModalOpen(true)} leftIcon={<CheckSquare className="w-3.5 h-3.5" />}>
            Assign Task
          </Button>
          <Button size="sm" onClick={() => setRecModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Recommendation
          </Button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Attendance</span>
              <span className={`text-xl font-black ${(mentee.attendancePercent || 0) < 75 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {mentee.attendancePercent ? `${mentee.attendancePercent.toFixed(1)}%` : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {(mentee.attendancePercent || 0) < 75 ? 'Shortage Alert' : 'Normal Standing'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cumulative CGPA</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {mentee.cgpa ? mentee.cgpa.toFixed(2) : 'N/A'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Latest SGPA: {mentee.sgpa?.toFixed(2) || 'N/A'}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Shared Recommendations</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {mentee.recommendations?.length || 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {mentee.recommendations?.filter((r: any) => r.isAcknowledged).length || 0} acknowledged
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Private Faculty Notes</span>
              <span className="text-xl font-black text-amber-600">
                {privateFacultyNotes?.length || 0}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Confidential Records</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Academic Portfolio & Goals', icon: GraduationCap },
          { id: 'recommendations', label: `Shared Recommendations (${mentee.recommendations?.length || 0})`, icon: BookOpen },
          { id: 'privateNotes', label: `Confidential Notes (${privateFacultyNotes?.length || 0})`, icon: Lock, badge: 'Faculty Only' },
          { id: 'tasks', label: `Action Items (${mentee.tasks?.length || 0})`, icon: CheckSquare },
          { id: 'meetings', label: `Meeting History (${mentee.meetingAttendees?.length || 0})`, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Overview & Academic Marks */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progression chart if data available */}
          {semesterTrends.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Semester Performance Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={semesterTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.6} />
                      <XAxis dataKey="semester" tickFormatter={(sem) => `Sem ${sem}`} tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} ticks={[2, 4, 6, 8, 10]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val: any) => [`${val} SGPA`, 'SGPA']} />
                      <Line type="monotone" dataKey="sgpa" stroke="#4F46E5" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Development Details (Strengths, Career Goals) */}
          <Card>
            <CardHeader>
              <CardTitle>Student Development & Goals Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Career Goals & Vision:</span>
                  <p className="text-slate-600 dark:text-slate-400">{mentee.careerGoals || 'Not specified'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Specialization Preference:</span>
                  <p className="text-slate-600 dark:text-slate-400">{mentee.specializationPreference || 'Not specified'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Key Strengths:</span>
                  <p className="text-slate-600 dark:text-slate-400">{mentee.strengths || 'Not specified'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Areas for Improvement:</span>
                  <p className="text-slate-600 dark:text-slate-400">{mentee.areasForImprovement || 'Not specified'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">Mentoring Preferences:</span>
                <p className="text-slate-600 dark:text-slate-400">{mentee.mentoringPreferences || 'Standard schedule'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Records Transcript */}
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Academic Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-4">Sem</th>
                      <th className="py-2.5 px-4">Course</th>
                      <th className="py-2.5 px-4">Title</th>
                      <th className="py-2.5 px-4">Credits</th>
                      <th className="py-2.5 px-4">IA Marks</th>
                      <th className="py-2.5 px-4">Final Exam</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4">Grade</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {mentee.academicRecords?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4">{r.semester}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{r.courseCode}</td>
                        <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300">{r.courseName}</td>
                        <td className="py-2.5 px-4 text-slate-500">{r.credits}</td>
                        <td className="py-2.5 px-4 text-slate-600">{r.iaMarks ?? '-'}</td>
                        <td className="py-2.5 px-4 text-slate-600">{r.endSemMarks ?? '-'}</td>
                        <td className="py-2.5 px-4 font-bold">{r.totalMarks ?? '-'}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-brand-600">{r.grade ?? '-'}</td>
                        <td className="py-2.5 px-4">
                          {r.isPassed ? (
                            <Badge variant="success" size="sm">PASS</Badge>
                          ) : (
                            <Badge variant="danger" size="sm">FAIL</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content 2: Student-Visible Recommendations */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Guidance shared transparently with {mentee.fullName}. Students can acknowledge and comment.
            </p>
            <Button size="sm" onClick={() => setRecModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Recommendation
            </Button>
          </div>

          {mentee.recommendations?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-slate-400 text-xs">
                No recommendations recorded yet for this mentee.
              </CardContent>
            </Card>
          ) : (
            mentee.recommendations?.map((rec: any) => (
              <Card key={rec.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                      {rec.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                  </div>
                  <Badge variant={rec.isAcknowledged ? 'success' : 'warning'} size="sm">
                    {rec.isAcknowledged ? '✓ Acknowledged by Student' : 'Awaiting Acknowledgment'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  {rec.description}
                </p>

                {rec.acknowledgmentNote && (
                  <div className="text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                    <span className="font-bold">Student Note:</span> {rec.acknowledgmentNote}{' '}
                    <span className="text-[10px] text-emerald-600 block mt-0.5">
                      Acknowledged on {new Date(rec.acknowledgedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Discussion Thread */}
                {rec.comments && rec.comments.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500">Discussion ({rec.comments.length}):</span>
                    {rec.comments.map((c: any) => (
                      <div key={c.id} className="text-xs p-2 rounded bg-slate-50 dark:bg-slate-800">
                        <span className="font-bold">{c.author.role === 'MENTOR' ? 'You' : mentee.fullName}:</span>{' '}
                        <span>{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab Content 3: Private Faculty Notes (CONFIDENTIAL) */}
      {activeTab === 'privateNotes' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Confidential Faculty Notes:</strong> Strictly visible only to authorized faculty advisors. The student does not have access to this section.
              </span>
            </div>
            <Button size="sm" variant="navy" onClick={() => setNoteModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Faculty Note
            </Button>
          </div>

          {privateFacultyNotes?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-slate-400 text-xs">
                No confidential faculty observations recorded yet.
              </CardContent>
            </Card>
          ) : (
            privateFacultyNotes?.map((note: any) => (
              <Card key={note.id} className="p-5 border-l-4 border-l-amber-500 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {note.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{note.title}</h4>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/30 p-3 rounded-lg border border-amber-100/50">
                  {note.content}
                </p>
                <div className="text-[11px] text-slate-400">
                  Recorded by: {note.mentor?.fullName} ({note.mentor?.designation})
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab Content 4: Action Items / Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Tasks and action items assigned with due dates. You can verify and approve student evidence submissions.
            </p>
            <Button size="sm" onClick={() => setTaskModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Assign New Task
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mentee.tasks?.map((t: any) => (
              <Card key={t.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</h4>
                  <Badge variant={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'danger' : 'default'} size="sm">
                    {t.priority}
                  </Badge>
                </div>

                {t.description && <p className="text-xs text-slate-500">{t.description}</p>}

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Progress</span>
                    <span>{t.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${t.progressPercent}%` }} />
                  </div>
                </div>

                {t.evidenceUrl && (
                  <div className="text-xs text-brand-600 bg-slate-50 p-2 rounded truncate">
                    Evidence: <a href={t.evidenceUrl} target="_blank" rel="noreferrer" className="underline">{t.evidenceUrl}</a>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}
                  </span>
                  <div>
                    {t.verifiedByMentor ? (
                      <Badge variant="success" size="sm">✓ Verified by Faculty</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleVerifyTask(t.id, true)}>
                        Verify Evidence
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content 5: Meeting History */}
      {activeTab === 'meetings' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mentoring Sessions Attended</h3>
          {mentee.meetingAttendees?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-slate-400 text-xs">
                No meeting records logged for this mentee.
              </CardContent>
            </Card>
          ) : (
            mentee.meetingAttendees?.map((att: any) => (
              <Card key={att.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{att.meeting.title}</h4>
                  <Badge variant={att.attendanceStatus === 'PRESENT' ? 'success' : 'danger'} size="sm">
                    {att.attendanceStatus}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(att.meeting.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                {att.meeting.mentorSummary && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <strong>Meeting Summary:</strong> {att.meeting.mentorSummary}
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal 1: Add Recommendation */}
      <Modal isOpen={recModalOpen} onClose={() => setRecModalOpen(false)} title="Add Student Recommendation" description="Shared with student portfolio.">
        <form onSubmit={handleCreateRec} className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Operating Systems Saturday Coaching"
            value={recForm.title}
            onChange={(e) => setRecForm({ ...recForm, title: e.target.value })}
            required
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">Category</label>
            <select
              value={recForm.category}
              onChange={(e) => setRecForm({ ...recForm, category: e.target.value })}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            >
              <option value="Academic">Academic Improvement</option>
              <option value="Career Guidance">Career Guidance</option>
              <option value="Skill Development">Skill Development</option>
              <option value="Attendance Recovery">Attendance Recovery</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">Guidance & Action Steps *</label>
            <textarea
              rows={4}
              required
              placeholder="Detailed recommendations..."
              value={recForm.description}
              onChange={(e) => setRecForm({ ...recForm, description: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRecModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={submitting}>Publish Recommendation</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Private Faculty Note */}
      <Modal isOpen={noteModalOpen} onClose={() => setNoteModalOpen(false)} title="Add Confidential Faculty Note" description="Visible ONLY to faculty / administrators.">
        <form onSubmit={handleCreateNote} className="space-y-4">
          <Input
            label="Note Heading"
            placeholder="e.g. Behavioral / Personal Observation"
            value={noteForm.title}
            onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
            required
          />
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">Category</label>
            <select
              value={noteForm.category}
              onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
              className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
            >
              <option value="General">General</option>
              <option value="Academic">Academic</option>
              <option value="Personal">Personal / Health</option>
              <option value="Behavioral">Behavioral</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">Confidential Observation *</label>
            <textarea
              rows={4}
              required
              placeholder="Enter private faculty observation..."
              value={noteForm.content}
              onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setNoteModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" variant="navy" isLoading={submitting}>Save Confidential Note</Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Assign Task */}
      <Modal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Assign Action Item" description="Student will receive a notification and due date.">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            label="Task Title"
            placeholder="e.g. Submit Chapter 6 Operating Systems Summary"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <Input
              label="Due Date"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">Instructions (Optional)</label>
            <textarea
              rows={3}
              placeholder="Details on deliverables..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setTaskModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={submitting}>Assign Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
