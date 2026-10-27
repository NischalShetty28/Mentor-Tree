import React, { useState, useEffect } from 'react';
import { Download, FileText, Briefcase, Percent, ShieldAlert, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api, downloadReport } from '../../api/client';

export const AdminReportsPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    api.getDepartments().then(setDepartments);
  }, []);

  const handleDownload = async (baseEndpoint: string, defaultName: string, key: string, format: 'pdf' | 'csv') => {
    try {
      setDownloading(key);
      const deptQuery = selectedDept ? `&departmentId=${selectedDept}` : '';
      const endpoint = `${baseEndpoint}?format=${format}${deptQuery}`;
      const filename = `${defaultName}.${format}`;
      await downloadReport(endpoint, filename);
    } catch (error) {
      alert('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institutional Mentoring Reports & Exports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download verified institutional records, department-wide summaries, and faculty workload audits.
          </p>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Filter Department:</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">Campus-wide (All Departments)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Report 1: Academic Performance */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Academic Performance & Standing Summary
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Comprehensive semester-wise SGPA and CGPA results, pass/fail ratios, and student grade standings.
              </p>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              isLoading={downloading === 'acad_csv'}
              onClick={() => handleDownload('/reports/academics', 'Academic_Performance_Report', 'acad_csv', 'csv')}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              className="flex-1"
              isLoading={downloading === 'acad_pdf'}
              onClick={() => handleDownload('/reports/academics', 'Academic_Performance_Report', 'acad_pdf', 'pdf')}
            >
              Download PDF
            </Button>
          </div>
        </Card>

        {/* Report 2: Attendance Audit */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Institutional Attendance Audit
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Course-wise student attendance registers, shortage warnings below the 75% regulatory requirement.
              </p>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              isLoading={downloading === 'att_csv'}
              onClick={() => handleDownload('/reports/attendance', 'Attendance_Audit_Report', 'att_csv', 'csv')}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              className="flex-1"
              isLoading={downloading === 'att_pdf'}
              onClick={() => handleDownload('/reports/attendance', 'Attendance_Audit_Report', 'att_pdf', 'pdf')}
            >
              Download PDF
            </Button>
          </div>
        </Card>

        {/* Report 3: Mentor Workload */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Faculty Mentor Allocation & Workload
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Assigned mentee counts, capacity utilization quotas, and mentoring session statistics per faculty.
              </p>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              isLoading={downloading === 'workload_csv'}
              onClick={() => handleDownload('/reports/mentor-workload', 'Mentor_Workload_Report', 'workload_csv', 'csv')}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              className="flex-1"
              isLoading={downloading === 'workload_pdf'}
              onClick={() => handleDownload('/reports/mentor-workload', 'Mentor_Workload_Report', 'workload_pdf', 'pdf')}
            >
              Download PDF
            </Button>
          </div>
        </Card>

        {/* Report 4: Academic Risk */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white">
                Academic Risk & Early Intervention Report
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Students flagged by the early warning system, recorded trigger reasons, and remedial action plans.
              </p>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              isLoading={downloading === 'risk_csv'}
              onClick={() => handleDownload('/reports/risk-interventions', 'Academic_Risk_Report', 'risk_csv', 'csv')}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              className="flex-1"
              isLoading={downloading === 'risk_pdf'}
              onClick={() => handleDownload('/reports/risk-interventions', 'Academic_Risk_Report', 'risk_pdf', 'pdf')}
            >
              Download PDF
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
