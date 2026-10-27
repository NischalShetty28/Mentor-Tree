import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Video, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { Meeting } from '../../types';

export const MenteeMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    agenda: '',
    preferredDate: '',
    preferredMode: 'IN_PERSON',
  });
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const data = await api.getMeetings();
      setMeetings(data);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
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
      alert(err.message || 'Failed to request meeting');
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mentoring Sessions Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View scheduled 1-on-1 and group mentoring sessions with your faculty advisor.
          </p>
        </div>
        <Button onClick={() => setRequestModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Request Follow-up Session
        </Button>
      </div>

      {/* Upcoming Meetings */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Upcoming Scheduled Sessions ({upcoming.length})
        </h3>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-slate-500 text-xs">
              No upcoming sessions scheduled. Click &quot;Request Follow-up Session&quot; to arrange a meeting.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((m) => (
              <Card key={m.id} className="p-5 border-l-4 border-l-brand-600 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="purple" size="sm">{m.meetingType}</Badge>
                  <Badge variant={m.mode === 'ONLINE' ? 'info' : 'default'} size="sm">
                    {m.mode === 'ONLINE' ? <Video className="w-3 h-3 inline mr-1" /> : <MapPin className="w-3 h-3 inline mr-1" />}
                    {m.mode}
                  </Badge>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h4>
                {m.agenda && <p className="text-xs text-slate-500 line-clamp-2">{m.agenda}</p>}

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{new Date(m.scheduledAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })} ({m.durationMinutes} mins)</span>
                  </div>
                  {m.locationOrLink && (
                    <div className="flex items-center gap-2 text-brand-600 font-medium truncate">
                      {m.mode === 'ONLINE' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                      <span className="truncate">{m.locationOrLink}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Meetings History */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Past Mentoring History ({past.length})
        </h3>
        {past.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-slate-500 text-xs">
              No previous mentoring history logged.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {past.map((m) => {
              const myAttendee = m.attendees?.[0];
              const attendanceStatus = myAttendee?.attendanceStatus || 'PRESENT';

              return (
                <Card key={m.id} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(m.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} • Mentor: {m.mentor?.fullName}
                      </p>
                    </div>
                    <Badge variant={attendanceStatus === 'PRESENT' ? 'success' : 'danger'} size="sm">
                      Attendance: {attendanceStatus}
                    </Badge>
                  </div>

                  {m.mentorSummary && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Mentor Summary & Notes:</span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{m.mentorSummary}</p>
                    </div>
                  )}

                  {myAttendee?.actionItems && (
                    <div className="mt-2 text-xs text-brand-700 dark:text-brand-300">
                      <span className="font-semibold">Action Items Logged:</span> {myAttendee.actionItems}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Meeting Request Modal */}
      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Follow-up Session"
        description="Notify your mentor regarding a discussion agenda."
      >
        {requestSuccess ? (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{requestSuccess}</span>
          </div>
        ) : (
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                Discussion Agenda *
              </label>
              <textarea
                rows={3}
                required
                placeholder="What topics or academic matters would you like to review?"
                value={requestForm.agenda}
                onChange={(e) => setRequestForm({ ...requestForm, agenda: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Preferred Date"
                type="date"
                value={requestForm.preferredDate}
                onChange={(e) => setRequestForm({ ...requestForm, preferredDate: e.target.value })}
              />

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300">
                  Meeting Mode
                </label>
                <select
                  value={requestForm.preferredMode}
                  onChange={(e) => setRequestForm({ ...requestForm, preferredMode: e.target.value })}
                  className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="IN_PERSON">In-Person</option>
                  <option value="ONLINE">Online Video Session</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setRequestModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Send Request
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
