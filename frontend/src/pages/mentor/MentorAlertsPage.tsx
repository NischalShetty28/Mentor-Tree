import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ShieldAlert, Clock, ArrowRight, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { api } from '../../api/client';
import { AcademicRiskAlert } from '../../types';

export const MentorAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AcademicRiskAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [selectedAlert, setSelectedAlert] = useState<AcademicRiskAlert | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('UNDER_REVIEW');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getRiskAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const openReviewModal = (alert: AcademicRiskAlert) => {
    setSelectedAlert(alert);
    setReviewStatus(alert.status || 'UNDER_REVIEW');
    setReviewNotes(alert.reviewNotes || '');
    setActionPlan(alert.actionPlan || '');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    try {
      setSubmitting(true);
      await api.updateRiskAlertStatus(selectedAlert.id, {
        status: reviewStatus,
        reviewNotes,
        actionPlan,
      });
      setSelectedAlert(null);
      await fetchAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to update alert status');
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Academic Risk & Early Intervention Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Automated academic risk alerts flagged by attendance shortage, falling SGPA, or repeated absences.
        </p>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-slate-400 text-xs">
            No active academic risk alerts for your assigned mentees.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-5 border-l-4 ${
                alert.severity === 'CRITICAL'
                  ? 'border-l-rose-600'
                  : alert.severity === 'HIGH'
                  ? 'border-l-rose-500'
                  : 'border-l-amber-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <RiskBadge level={alert.severity} />
                  <Link
                    to={`/mentor/mentees/${alert.menteeId}`}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 transition"
                  >
                    {alert.mentee?.fullName}
                  </Link>
                  <span className="font-mono text-xs text-slate-500">({alert.mentee?.usn})</span>
                </div>
                <Badge
                  variant={
                    alert.status === 'RESOLVED'
                      ? 'success'
                      : alert.status === 'ACTION_PLANNED'
                      ? 'purple'
                      : alert.status === 'UNDER_REVIEW'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  Status: {alert.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium bg-rose-50/40 p-3 rounded-lg border border-rose-100/60">
                  <span className="font-bold text-rose-800">Trigger Reason:</span> {alert.triggerReason}
                </p>

                {alert.actionPlan && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <span className="font-bold">Intervention Action Plan:</span> {alert.actionPlan}
                  </p>
                )}

                {alert.reviewNotes && (
                  <p className="text-[11px] text-slate-500 italic">
                    Faculty Review Notes: &ldquo;{alert.reviewNotes}&rdquo;
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Logged: {new Date(alert.createdAt).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <Link to={`/mentor/mentees/${alert.menteeId}`}>
                    <Button size="sm" variant="outline">
                      View Portfolio
                    </Button>
                  </Link>
                  <Button size="sm" onClick={() => openReviewModal(alert)}>
                    Update Review Status
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Academic Review: {selectedAlert.mentee?.fullName}
            </h3>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-700">Review Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-lg border border-slate-300 font-semibold"
                >
                  <option value="NEW">New (Unreviewed)</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="ACTION_PLANNED">Action Planned (Remedial Scheduled)</option>
                  <option value="RESOLVED">Resolved (Goals Met & Dismissed)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-700">Action Plan (Intervention)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Enrolled in Saturday remedial coaching; mandatory weekly attendance check-in."
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-slate-700">Faculty Review Notes</label>
                <textarea
                  rows={3}
                  placeholder="Notes from 1-on-1 discussion with the student..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedAlert(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={submitting}>
                  Save Review
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
