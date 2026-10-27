import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  Users,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { Meeting } from '../../types';

export const MentorCalendarPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    agenda: '',
    meetingType: 'INDIVIDUAL',
    mode: 'IN_PERSON',
    locationOrLink: 'Room 304, CS Academic Block',
    scheduledAt: '',
    durationMinutes: 30,
    menteeIds: [] as string[],
  });

  // Record Attendance modal
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [menteeId: string]: string }>({});
  const [mentorSummary, setMentorSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetingsAndMentees = async () => {
    try {
      setLoading(true);
      const [meetingsData, menteesData] = await Promise.all([
        api.getMeetings(),
        api.getAssignedMentees(),
      ]);
      setMeetings(meetingsData);
      setMentees(menteesData);
    } catch (err: any) {
      console.error('Failed to load meetings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingsAndMentees();
  }, []);

  const handleMenteeToggle = (id: string) => {
    setScheduleForm((prev) => {
      const exists = prev.menteeIds.includes(id);
      return {
        ...prev,
        menteeIds: exists ? prev.menteeIds.filter((m) => m !== id) : [...prev.menteeIds, id],
      };
    });
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (scheduleForm.menteeIds.length === 0) {
      setError('Please select at least one mentee attendee.');
      return;
    }

    try {
      setSubmitting(true);
      await api.createMeeting(scheduleForm);
      setScheduleModalOpen(false);
      setScheduleForm({
        title: '',
        agenda: '',
        meetingType: 'INDIVIDUAL',
        mode: 'IN_PERSON',
        locationOrLink: 'Room 304, CS Academic Block',
        scheduledAt: '',
        durationMinutes: 30,
        menteeIds: [],
      });
      await fetchMeetingsAndMentees();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule meeting. Conflicting schedule may exist.');
    } finally {
      setSubmitting(false);
    }
  };

  const openAttendanceModal = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    const initialAttendance: { [id: string]: string } = {};
    meeting.attendees?.forEach((a) => {
      initialAttendance[a.menteeId] = a.attendanceStatus || 'PRESENT';
    });
    setAttendanceRecords(initialAttendance);
    setMentorSummary(meeting.mentorSummary || '');
  };

  const handleRecordAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    try {
      setSubmitting(true);
      const records = Object.entries(attendanceRecords).map(([menteeId, status]) => ({
        menteeId,
        status,
      }));

      await api.recordMeetingAttendance(selectedMeeting.id, records, mentorSummary);
      setSelectedMeeting(null);
      await fetchMeetingsAndMentees();
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduledAt) >= now && m.status === 'SCHEDULED');
  const past = meetings.filter((m) => new Date(m.scheduledAt) < now || m.status === 'COMPLETED');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Meeting Calendar & Attendance Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Schedule 1-on-1 or group mentoring sessions, record attendance, and save meeting summaries.
          </p>
        </div>
        <Button onClick={() => setScheduleModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Schedule Mentoring Session
        </Button>
      </div>

      {/* Upcoming Meetings */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Scheduled Upcoming Sessions ({upcoming.length})
        </h3>

        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-slate-400 text-xs">
              No upcoming sessions scheduled. Click &quot;Schedule Mentoring Session&quot; to arrange one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((m) => (
              <Card key={m.id} className="p-5 border-l-4 border-l-brand-600 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="purple" size="sm">{m.meetingType}</Badge>
                    <Badge variant={m.mode === 'ONLINE' ? 'info' : 'default'} size="sm">
                      {m.mode === 'ONLINE' ? <Video className="w-3 h-3 inline mr-1" /> : <MapPin className="w-3 h-3 inline mr-1" />}
                      {m.mode}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{m.title}</h4>
                  {m.agenda && <p className="text-xs text-slate-600 dark:text-slate-400">{m.agenda}</p>}

                  <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(m.scheduledAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })} ({m.durationMinutes} mins)</span>
                    </div>
                    {m.locationOrLink && (
                      <p className="text-brand-600 truncate font-medium">
                        {m.locationOrLink}
                      </p>
                    )}
                  </div>

                  {/* Attendees */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      Invited Mentees ({m.attendees?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {m.attendees?.map((att) => (
                        <span key={att.id} className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium text-slate-700 dark:text-slate-300">
                          {att.mentee?.fullName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => openAttendanceModal(m)} leftIcon={<UserCheck className="w-3.5 h-3.5" />}>
                    Record Attendance & Notes
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings */}
      <div className="space-y-3 pt-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Completed & Past Sessions ({past.length})
        </h3>

        {past.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-slate-400 text-xs">
              No completed sessions recorded yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {past.map((m) => (
              <Card key={m.id} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(m.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} • {m.mode}
                    </p>
                  </div>
                  <Badge variant={m.status === 'COMPLETED' ? 'success' : 'default'} size="sm">
                    {m.status}
                  </Badge>
                </div>

                {m.mentorSummary && (
                  <div className="text-xs p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Meeting Notes & Summary:</span>
                    <p className="text-slate-600 dark:text-slate-400">{m.mentorSummary}</p>
                  </div>
                )}

                {/* Attendees list with attendance badges */}
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
                    Attendance Record:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {m.attendees?.map((att) => (
                      <div key={att.id} className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        <span className="font-semibold">{att.mentee?.fullName}</span>
                        <Badge
                          variant={
                            att.attendanceStatus === 'PRESENT'
                              ? 'success'
                              : att.attendanceStatus === 'ABSENT'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {att.attendanceStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Meeting Modal */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title="Schedule Mentoring Session"
        description="Book a new individual or group session with assigned mentees."
        maxWidth="lg"
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Session Title *"
            placeholder="e.g. Mid-Semester Progress Review & Elective Planning"
            value={scheduleForm.title}
            onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">Agenda / Discussion Topics</label>
            <textarea
              rows={2}
              placeholder="Outline topics to discuss..."
              value={scheduleForm.agenda}
              onChange={(e) => setScheduleForm({ ...scheduleForm, agenda: e.target.value })}
              className="w-full text-xs p-3 rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date & Time *"
              type="datetime-local"
              value={scheduleForm.scheduledAt}
              onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
              required
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700">Duration</label>
              <select
                value={scheduleForm.durationMinutes}
                onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: parseInt(e.target.value, 10) })}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700">Mode</label>
              <select
                value={scheduleForm.mode}
                onChange={(e) => setScheduleForm({ ...scheduleForm, mode: e.target.value })}
                className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300"
              >
                <option value="IN_PERSON">In-Person</option>
                <option value="ONLINE">Online Video</option>
              </select>
            </div>
          </div>

          <Input
            label={scheduleForm.mode === 'ONLINE' ? 'Meeting Link (Google Meet / Zoom)' : 'Location / Room Number'}
            value={scheduleForm.locationOrLink}
            onChange={(e) => setScheduleForm({ ...scheduleForm, locationOrLink: e.target.value })}
          />

          {/* Select Mentees */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase text-slate-700">
              Select Mentee Attendees * ({scheduleForm.menteeIds.length} selected)
            </label>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2.5 divide-y divide-slate-100">
              {mentees.map((m) => {
                const checked = scheduleForm.menteeIds.includes(m.id);
                return (
                  <label key={m.id} className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer rounded-lg text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{m.fullName}</span>
                      <span className="text-slate-400 font-mono text-[11px] ml-2">{m.usn}</span>
                      <span className="text-slate-400 text-[11px] ml-2">Sem {m.semester}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleMenteeToggle(m.id)}
                      className="accent-brand-600 w-4 h-4 rounded cursor-pointer"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" isLoading={submitting}>Schedule Session</Button>
          </div>
        </form>
      </Modal>

      {/* Record Attendance Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Record Attendance & Summary: {selectedMeeting.title}
            </h3>

            <form onSubmit={handleRecordAttendanceSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Mark Mentee Attendance
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {selectedMeeting.attendees?.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
                      <div>
                        <span className="font-bold">{att.mentee?.fullName}</span>
                        <span className="text-slate-400 font-mono text-[11px] block">{att.mentee?.usn}</span>
                      </div>
                      <select
                        value={attendanceRecords[att.menteeId] || 'PRESENT'}
                        onChange={(e) =>
                          setAttendanceRecords({ ...attendanceRecords, [att.menteeId]: e.target.value })
                        }
                        className="text-xs py-1 px-2.5 rounded-lg border border-slate-300 font-semibold"
                      >
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="EXCUSED">Excused</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-700">
                  Session Summary & Observations
                </label>
                <textarea
                  rows={4}
                  placeholder="Record summary of discussion, guidance given, and next steps..."
                  value={mentorSummary}
                  onChange={(e) => setMentorSummary(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedMeeting(null)}>Cancel</Button>
                <Button type="submit" size="sm" isLoading={submitting}>Save Attendance & Complete Session</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
