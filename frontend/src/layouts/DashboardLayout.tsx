import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  AlertTriangle,
  FileText,
  Bell,
  Settings,
  LogOut,
  User,
  GraduationCap,
  Briefcase,
  ShieldAlert,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
  BookOpen,
  UserCheck,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number | string;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Role-specific navigation items
  const menteeNav: NavItem[] = [
    { name: 'Dashboard', path: '/mentee/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/mentee/profile', icon: User },
    { name: 'Recommendations', path: '/mentee/recommendations', icon: BookOpen },
    { name: 'Action Tasks', path: '/mentee/tasks', icon: CheckSquare },
    { name: 'Meeting Schedule', path: '/mentee/meetings', icon: Calendar },
    { name: 'Academic Records', path: '/mentee/academics', icon: GraduationCap },
  ];

  const mentorNav: NavItem[] = [
    { name: 'Overview', path: '/mentor/dashboard', icon: LayoutDashboard },
    { name: 'My Mentees', path: '/mentor/mentees', icon: Users },
    { name: 'Meeting Calendar', path: '/mentor/calendar', icon: Calendar },
    { name: 'Recommendations', path: '/mentor/recommendations', icon: BookOpen },
    { name: 'Tasks & Follow-ups', path: '/mentor/tasks', icon: CheckSquare },
    { name: 'Academic Alerts', path: '/mentor/alerts', icon: AlertTriangle },
    { name: 'Reports & Exports', path: '/mentor/reports', icon: FileText },
  ];

  const adminNav: NavItem[] = [
    { name: 'Institutional Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Student Records', path: '/admin/students', icon: GraduationCap },
    { name: 'Faculty Mentors', path: '/admin/mentors', icon: Briefcase },
    { name: 'Mentor Allocations', path: '/admin/assignments', icon: UserCheck },
    { name: 'Registration Approvals', path: '/admin/approvals', icon: ClipboardList },
    { name: 'Academic Risk Engine', path: '/admin/risk-management', icon: ShieldAlert },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { name: 'Institutional Reports', path: '/admin/reports', icon: FileText },
  ];

  const navItems =
    user?.role === 'MENTEE'
      ? menteeNav
      : user?.role === 'MENTOR'
      ? mentorNav
      : adminNav;

  const roleTitle =
    user?.role === 'MENTEE'
      ? 'Student Mentee Portal'
      : user?.role === 'MENTOR'
      ? 'Faculty Mentor Workspace'
      : user?.role === 'HOD'
      ? 'HOD Department Administration'
      : 'Master Institutional Administration';

  const roleBadgeVariant =
    user?.role === 'MENTEE'
      ? 'info'
      : user?.role === 'MENTOR'
      ? 'purple'
      : 'danger';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Brand header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-bold text-lg">
                M
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white leading-tight">MentorTree</h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 tracking-tight">Academic Mentoring</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User profile summary pill */}
          <div className="p-4 mx-3 my-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-800 dark:bg-navy-700 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
                {user?.fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.usn || user?.facultyId || user?.employeeId || user?.department}
                </p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <Badge variant={roleBadgeVariant} size="sm">
                {user?.role}
              </Badge>
              {user?.semester && (
                <span className="text-[11px] text-slate-500 font-medium">Sem {user.semester}</span>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom user action bar */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navigation Bar */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {roleTitle}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:inline" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                  {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                </span>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notification Center */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-brand-50 text-brand-600 text-xs px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">No notifications yet.</div>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setNotificationsOpen(false);
                            }}
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition ${
                              !n.isRead ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu avatar */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                    {user?.fullName?.charAt(0) || user?.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden md:inline">
                    {user?.fullName?.split(' ')[0] || user?.email.split('@')[0]}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>
                    {user?.role === 'MENTEE' && (
                      <Link
                        to="/mentee/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Student Profile
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Main Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
