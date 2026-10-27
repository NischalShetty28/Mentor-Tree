import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ShieldAlert, Percent, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { downloadReport } from '../../api/client';

export const MentorReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (endpoint: string, filename: string, key: string) => {
    try {
      setDownloading(key);
      await downloadReport(endpoint, filename);
    } catch (err: any) {
      alert('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mentoring Reports & Official Exports
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Generate structured institutional PDF reports and CSV datasets for department meetings and audits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Report 1 */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Academic Performance Summary
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Semester-wise GPA distribution, passing percentages, and marks across assigned mentees.
              </p>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              isLoading={downloading === 'acad_csv'}
              onClick={() => handleDownload('/reports/academics?format=csv', 'Academic_Performance.csv', 'acad_csv')}
            >
              CSV
            </Button>
            <Button
              size="sm"
              className="flex-1"
              isLoading={downloading === 'acad_pdf'}
              onClick={() => handleDownload('/reports/academics?format=pdf', 'Academic_Performance.pdf', 'acad_pdf')}
            >
              Official PDF
            </Button>
          </div>
        </Card>

        {/* Report 2 */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Student Attendance Audit
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Course-wise attendance rates, classes held/attended, and critical shortage (&lt;75%) flags.
              </p>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              isLoading={downloading === 'att_csv'}
              onClick={() => handleDownload('/reports/attendance?format=csv', 'Attendance_Audit.csv', 'att_csv')}
            >
              CSV
            </Button>
            <Button
              size="sm"
              className="flex-1"
              isLoading={downloading === 'att_pdf'}
              onClick={() => handleDownload('/reports/attendance?format=pdf', 'Attendance_Audit.pdf', 'att_pdf')}
            >
              Official PDF
            </Button>
          </div>
        </Card>

        {/* Report 3 */}
        <Card className="flex flex-col justify-between">
          <CardContent className="p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Academic Risk & Interventions
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Active early alerts, triggers, review statuses, and assigned remedial coaching action plans.
              </p>
            </div>
          </CardContent>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              isLoading={downloading === 'risk_csv'}
              onClick={() => handleDownload('/reports/risk-interventions?format=csv', 'Academic_Risk_Report.csv', 'risk_csv')}
            >
              CSV
            </Button>
            <Button
              size="sm"
              className="flex-1"
              isLoading={downloading === 'risk_pdf'}
              onClick={() => handleDownload('/reports/risk-interventions?format=pdf', 'Academic_Risk_Report.pdf', 'risk_pdf')}
            >
              Official PDF
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
