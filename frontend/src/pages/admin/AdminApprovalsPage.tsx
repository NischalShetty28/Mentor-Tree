import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, XCircle, UserCheck, Shield, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';

export const AdminApprovalsPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getRegistrationRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdate = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      setProcessingId(userId);
      await api.updateRegistrationStatus(userId, status);
      await fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update registration status');
    } finally {
      setProcessingId(null);
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
          Institutional Registration Approvals
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review and approve pending faculty mentor and administrative accounts before campus access is granted.
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-slate-400 text-xs space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-semibold text-slate-700 text-sm">No Pending Approvals</h3>
            <p className="text-xs text-slate-400">All registered institutional accounts are currently processed and verified.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={req.role === 'MENTOR' ? 'purple' : 'danger'} size="sm">
                    {req.role}
                  </Badge>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {req.details?.fullName}
                  </h4>
                  <span className="font-mono text-xs text-slate-500">({req.details?.identifier})</span>
                </div>
                <p className="text-xs text-slate-500">
                  {req.details?.designation} • {req.details?.department} • Email: <span className="font-mono text-slate-700 dark:text-slate-300">{req.email}</span>
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  Submitted on: {new Date(req.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={processingId === req.id}
                  onClick={() => handleUpdate(req.id, 'REJECTED')}
                  leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={processingId === req.id}
                  onClick={() => handleUpdate(req.id, 'APPROVED')}
                  leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                >
                  Approve Account
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
