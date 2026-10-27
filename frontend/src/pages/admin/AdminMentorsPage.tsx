import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Mail, Phone, MapPin, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export const AdminMentorsPage: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const data = await api.getAllMentors();
      setMentors(data);
    } catch (error) {
      console.error('Failed to load mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const filteredMentors = mentors.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.facultyId.toLowerCase().includes(search.toLowerCase()) ||
    m.department.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Faculty Mentor Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Directory of approved faculty advisors, department distribution, and student workload allocations.
          </p>
        </div>
        <Input
          placeholder="Search by faculty name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="w-72"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMentors.map((m) => {
          const utilization = Math.round((m.activeMenteesCount / (m.maxMentees || 20)) * 100);

          return (
            <Card key={m.id} className="p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-navy-800 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {m.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {m.fullName}
                      </h4>
                      <p className="text-xs text-brand-600 font-semibold">{m.designation}</p>
                    </div>
                  </div>
                  <Badge variant="outline" size="sm" className="font-mono">
                    {m.facultyId}
                  </Badge>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-medium text-slate-700 dark:text-slate-200">{m.department}</p>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="font-mono truncate">{m.collegeEmail}</span>
                  </div>
                  {m.officeLocation && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{m.officeLocation}</span>
                    </div>
                  )}
                </div>

                {/* Workload Progress */}
                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Mentee Workload Allocation</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {m.activeMenteesCount} / {m.maxMentees}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        utilization >= 100 ? 'bg-rose-500' : utilization >= 75 ? 'bg-amber-500' : 'bg-brand-600'
                      }`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
