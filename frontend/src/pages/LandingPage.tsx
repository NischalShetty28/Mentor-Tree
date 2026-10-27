import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, Shield, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">MentorTree</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block -mt-1 font-medium">
                Academic Mentoring Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login/mentee">
              <Button variant="ghost" size="sm">
                Student
              </Button>
            </Link>
            <Link to="/login/mentor">
              <Button variant="ghost" size="sm">
                Faculty
              </Button>
            </Link>
            <Link to="/login/admin">
              <Button variant="outline" size="sm">
                Administration
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Role Selection Area */}
      <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Institutional Mentoring Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select your role to access your institutional dashboard.
          </p>
        </div>

        {/* 3 Clean Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mentee (Student) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Student Portal</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                View assigned faculty mentor, academic standing, recommendations, and mentoring session schedule.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Link to="/login/mentee" className="flex-1">
                <Button className="w-full" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Sign In
                </Button>
              </Link>
              <Link to="/signup/mentee">
                <Button variant="outline" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          </div>

          {/* Mentor (Faculty) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Faculty Workspace</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Manage assigned student rosters, record confidential notes, schedule sessions, and track action items.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Link to="/login/mentor" className="flex-1">
                <Button className="w-full" variant="navy" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Sign In
                </Button>
              </Link>
              <Link to="/signup/mentor">
                <Button variant="outline" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          </div>

          {/* Administration & HOD */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Administration & HOD</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Departmental oversight, mentor allocations, early risk alerts configuration, and official reports.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Link to="/login/admin" className="flex-1">
                <Button className="w-full" variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Sign In
                </Button>
              </Link>
              <Link to="/signup/admin">
                <Button variant="ghost" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
        <p>MentorTree • Academic Mentoring Management System</p>
      </footer>
    </div>
  );
};
