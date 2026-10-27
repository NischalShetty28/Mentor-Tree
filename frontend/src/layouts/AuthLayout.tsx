import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  portalName: 'Mentee' | 'Mentor' | 'Admin/HOD';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  portalName,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white">
      {/* Top Banner Navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-navy-900 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">MentorTree</span>
            <span className="block text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
              {portalName} Portal
            </span>
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200/80 dark:border-slate-800">
          {children}
        </div>

        {/* Portal Switching Bar */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-2">
          <p className="font-medium text-slate-600 dark:text-slate-400">Switch Role Portal:</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/login/mentee"
              className="text-brand-600 hover:text-brand-700 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Mentee (Student)
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to="/login/mentor"
              className="text-brand-600 hover:text-brand-700 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Mentor (Faculty)
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              to="/login/admin"
              className="text-brand-600 hover:text-brand-700 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Administrator / HOD
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
