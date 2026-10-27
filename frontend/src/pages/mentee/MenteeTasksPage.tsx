import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Link as LinkIcon, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { StudentTask } from '../../types';

export const MenteeTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<StudentTask | null>(null);

  const [formProgress, setFormProgress] = useState(0);
  const [formEvidenceUrl, setFormEvidenceUrl] = useState('');
  const [formEvidenceNotes, setFormEvidenceNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getMenteeTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openUpdateModal = (task: StudentTask) => {
    setEditingTask(task);
    setFormProgress(task.progressPercent || 0);
    setFormEvidenceUrl(task.evidenceUrl || '');
    setFormEvidenceNotes(task.evidenceNotes || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setSaving(true);
      await api.updateTaskProgress(editingTask.id, {
        progressPercent: formProgress,
        evidenceUrl: formEvidenceUrl,
        evidenceNotes: formEvidenceNotes,
      });
      await fetchTasks();
      setEditingTask(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update task progress');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mentoring Action Items & Tasks
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Update progress, log completion percentages, and submit verification evidence to your mentor.
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-slate-500 space-y-2">
            <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No Action Items Assigned</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are all caught up! When your faculty mentor assigns new action items, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED' || task.progressPercent === 100;
            const priorityVariant =
              task.priority === 'URGENT' || task.priority === 'HIGH'
                ? 'danger'
                : task.priority === 'MEDIUM'
                ? 'warning'
                : 'default';

            return (
              <Card
                key={task.id}
                className={`overflow-hidden border flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {task.recommendation?.title ? `Ref: ${task.recommendation.title}` : 'Action Item'}
                    </span>
                    <Badge variant={priorityVariant} size="sm">
                      {task.priority}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {task.title}
                  </h3>

                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                      {task.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Progress</span>
                      <span className="font-bold text-slate-900 dark:text-white">{task.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-brand-600'
                        }`}
                        style={{ width: `${task.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Evidence submitted */}
                  {task.evidenceUrl && (
                    <div className="text-[11px] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg flex items-center gap-2 text-brand-600 dark:text-brand-400 truncate">
                      <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href={task.evidenceUrl} target="_blank" rel="noreferrer" className="truncate hover:underline">
                        {task.evidenceUrl}
                      </a>
                    </div>
                  )}

                  {task.evidenceNotes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50/50 p-2 rounded border border-slate-100">
                      Notes: &ldquo;{task.evidenceNotes}&rdquo;
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50/80 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Open'}</span>
                  </div>
                  <Button size="sm" variant={isCompleted ? 'outline' : 'primary'} onClick={() => openUpdateModal(task)}>
                    {isCompleted ? 'Update Details' : 'Update Progress'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Progress / Evidence Update Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Progress: {editingTask.title}
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">Completion Percentage</span>
                  <span className="text-brand-600 font-bold">{formProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formProgress}
                  onChange={(e) => setFormProgress(parseInt(e.target.value, 10))}
                  className="w-full accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>0% (Not Started)</span>
                  <span>50% (In Progress)</span>
                  <span>100% (Completed)</span>
                </div>
              </div>

              <Input
                label="Evidence URL / Submission Link"
                placeholder="https://github.com/my-repo or https://drive.google.com/..."
                value={formEvidenceUrl}
                onChange={(e) => setFormEvidenceUrl(e.target.value)}
                helperText="Link to completed assignment, certificate, or GitHub PR."
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Notes on Completion & Steps Taken
                </label>
                <textarea
                  rows={3}
                  value={formEvidenceNotes}
                  onChange={(e) => setFormEvidenceNotes(e.target.value)}
                  placeholder="Summarize the work done, challenges faced, or key outcomes..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={saving}>
                  Save Progress
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
