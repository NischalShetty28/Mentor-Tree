import React, { useState, useEffect } from 'react';
import { FileText, Search, Clock, Shield, Globe } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;

      const data = await api.getAuditLogs(params);
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Institutional Security & Compliance Audit Log
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Immutable audit record tracking all authentication, mentor allocations, confidential note creation, and records modifications.
        </p>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Search by action, user email, or entity type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="">All Security Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="SIGNUP_MENTEE">SIGNUP_MENTEE</option>
            <option value="SIGNUP_MENTOR">SIGNUP_MENTOR</option>
            <option value="ASSIGN_MENTOR">ASSIGN_MENTOR</option>
            <option value="CREATE_FACULTY_PRIVATE_NOTE">CREATE_FACULTY_PRIVATE_NOTE</option>
            <option value="CREATE_RECOMMENDATION">CREATE_RECOMMENDATION</option>
            <option value="UPDATE_RISK_ALERT_STATUS">UPDATE_RISK_ALERT_STATUS</option>
            <option value="TRIGGER_GLOBAL_RISK_EVALUATION">TRIGGER_GLOBAL_RISK_EVALUATION</option>
          </select>
        </form>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-brand-700 dark:text-brand-300 text-[11px] bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700 dark:text-slate-300">
                      {log.user ? log.user.email : 'System / Public'}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-600 dark:text-slate-400">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-sans text-[11px] max-w-xs truncate" title={log.details || ''}>
                      {log.details || '-'}
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
