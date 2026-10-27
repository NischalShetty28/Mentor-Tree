import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, Save, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge, RiskBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { AcademicRiskAlert } from '../../types';

export const AdminRiskPage: React.FC = () => {
  const [thresholds, setThresholds] = useState({
    minAttendancePercent: 75.0,
    minCgpa: 6.5,
    maxFailedSubjects: 1,
    maxConsecutiveAbsences: 2,
  });

  const [alerts, setAlerts] = useState<AcademicRiskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [threshData, alertsData] = await Promise.all([
        api.getRiskThresholds(),
        api.getRiskAlerts(),
      ]);
      if (threshData) setThresholds(threshData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load risk configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingThresholds(true);
      await api.updateRiskThresholds(thresholds);
      alert('Threshold configurations updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update thresholds');
    } finally {
      setSavingThresholds(false);
    }
  };

  const handleTriggerEvaluation = async () => {
    try {
      setScanning(true);
      setScanMessage(null);
      const res = await api.triggerRiskEvaluation();
      setScanMessage(res.message);
      await fetchData();
      setTimeout(() => setScanMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to run risk evaluation scan');
    } finally {
      setScanning(false);
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Academic Risk Engine & Configuration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure early warning thresholds, evaluate campus-wide student data, and oversee remedial interventions.
          </p>
        </div>
        <Button
          onClick={handleTriggerEvaluation}
          isLoading={scanning}
          variant="danger"
          size="sm"
          leftIcon={<Play className="w-4 h-4" />}
        >
          Run Campus-wide Risk Scan
        </Button>
      </div>

      {scanMessage && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{scanMessage}</span>
        </div>
      )}

      {/* Threshold Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brand-600" />
            <div>
              <CardTitle>Configurable Risk Alert Thresholds</CardTitle>
              <p className="text-xs text-slate-500">
                When student metrics fall below these criteria, automated risk alerts are generated.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveThresholds} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Minimum Attendance %"
                type="number"
                step="0.5"
                min="50"
                max="100"
                value={thresholds.minAttendancePercent}
                onChange={(e) => setThresholds({ ...thresholds, minAttendancePercent: parseFloat(e.target.value) })}
                helperText="Students below this trigger shortage warning."
                required
              />

              <Input
                label="Minimum CGPA / SGPA"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={thresholds.minCgpa}
                onChange={(e) => setThresholds({ ...thresholds, minCgpa: parseFloat(e.target.value) })}
                helperText="Below this initiates academic counseling."
                required
              />

              <Input
                label="Max Permissible Backlogs"
                type="number"
                min="0"
                max="5"
                value={thresholds.maxFailedSubjects}
                onChange={(e) => setThresholds({ ...thresholds, maxFailedSubjects: parseInt(e.target.value, 10) })}
                helperText="Exceeding triggers high risk alert."
                required
              />

              <Input
                label="Consecutive Missed Sessions"
                type="number"
                min="1"
                max="5"
                value={thresholds.maxConsecutiveAbsences}
                onChange={(e) => setThresholds({ ...thresholds, maxConsecutiveAbsences: parseInt(e.target.value, 10) })}
                helperText="Repeated unexcused mentoring absences."
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" isLoading={savingThresholds} leftIcon={<Save className="w-4 h-4" />}>
                Save Threshold Rules
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Open Risk Alerts Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Institutional Academic Risk Log ({alerts.length})</CardTitle>
            <p className="text-xs text-slate-500">Live feed of all flagged student cases</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Student & USN</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Trigger Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Mentor</th>
                  <th className="py-3 px-4">Action Plan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{alert.mentee?.fullName}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{alert.mentee?.usn}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {alert.mentee?.department?.code}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge level={alert.severity} />
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate" title={alert.triggerReason}>
                      {alert.triggerReason}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          alert.status === 'RESOLVED'
                            ? 'success'
                            : alert.status === 'ACTION_PLANNED'
                            ? 'purple'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {alert.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {alert.mentee?.assignments?.[0]?.mentor?.fullName || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-500 truncate" title={alert.actionPlan || 'Under review'}>
                      {alert.actionPlan || 'Under review'}
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
