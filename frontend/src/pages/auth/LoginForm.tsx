import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User as UserIcon, AlertCircle, ArrowRight, Clock, X } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Role } from '../../types';

interface RecentUser {
  identifier: string;
  name: string;
  role: Role;
  lastUsed: number;
}

const RECENT_USERS_STORAGE_KEY = 'mentor_tree_recent_users';

// Helper to get recent users from localStorage
const getStoredRecentUsers = (): RecentUser[] => {
  try {
    const raw = localStorage.getItem(RECENT_USERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const saveRecentUser = (user: { identifier: string; name: string; role: Role }) => {
  try {
    const existing = getStoredRecentUsers();
    const updated = [
      { ...user, lastUsed: Date.now() },
      ...existing.filter((u) => u.identifier.toLowerCase() !== user.identifier.toLowerCase()),
    ].slice(0, 5); // Keep top 5
    localStorage.setItem(RECENT_USERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent user:', e);
  }
};

interface LoginFormProps {
  portalRole: Role;
  title: string;
  identifierLabel: string;
  identifierPlaceholder: string;
  signupLink: string;
  defaultRecentUsers?: Array<{ identifier: string; name: string }>;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  portalRole,
  title,
  identifierLabel,
  identifierPlaceholder,
  signupLink,
  defaultRecentUsers = [],
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recent users on this device
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(RECENT_USERS_STORAGE_KEY);
    if (raw === null) {
      if (defaultRecentUsers.length > 0) {
        const initial: RecentUser[] = defaultRecentUsers.map((u) => ({
          identifier: u.identifier,
          name: u.name,
          role: portalRole,
          lastUsed: Date.now(),
        }));
        setRecentUsers(initial);
        localStorage.setItem(RECENT_USERS_STORAGE_KEY, JSON.stringify(initial));
      }
    } else {
      const stored = getStoredRecentUsers().filter((u) => u.role === portalRole);
      setRecentUsers(stored);
    }
  }, [portalRole]);

  const removeRecent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const all = getStoredRecentUsers().filter(
      (u) => !(u.identifier.toLowerCase() === id.toLowerCase() && u.role === portalRole)
    );
    localStorage.setItem(RECENT_USERS_STORAGE_KEY, JSON.stringify(all));
    setRecentUsers(all.filter((u) => u.role === portalRole));
  };

  const handleSelectRecent = (user: RecentUser) => {
    setIdentifier(user.identifier);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError(`${identifierLabel} is required.`);
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({
        identifier: identifier.trim(),
        password,
        portalRole,
      });

      // Save into recent users
      saveRecentUser({
        identifier: identifier.trim(),
        name: res.user.fullName || identifier.trim(),
        role: res.user.role,
      });

      login(res.token, res.user);

      if (res.user.role === 'MENTEE') {
        navigate('/mentee/dashboard');
      } else if (res.user.role === 'MENTOR') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    try {
      setForgotLoading(true);
      const res = await api.forgotPassword(forgotEmail);
      setForgotSuccess(res.message);
    } catch {
      setForgotSuccess('Instructions have been dispatched if the email is registered.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Recent Users Selection */}
      {recentUsers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              Recent Accounts:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentUsers.map((u) => (
              <button
                key={u.identifier}
                type="button"
                onClick={() => handleSelectRecent(u)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition text-left ${
                  identifier.toLowerCase() === u.identifier.toLowerCase()
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <span className="block leading-tight font-medium">{u.name}</span>
                  <span className="block font-mono text-[10px] text-slate-400 leading-tight">{u.identifier}</span>
                </div>
                <span
                  onClick={(e) => removeRecent(u.identifier, e)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 ml-1 p-0.5 rounded transition"
                  title="Remove account"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Strictly TWO input fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Field 1: Username / Identifier */}
        <Input
          label={identifierLabel}
          placeholder={identifierPlaceholder}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          leftIcon={<UserIcon className="w-4 h-4" />}
          autoComplete="username"
          required
        />

        {/* Field 2: Password with toggle */}
        <div className="space-y-1">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setForgotSuccess(null);
                setForgotModalOpen(true);
              }}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={loading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* Signup Redirection */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
        Need an institutional account?{' '}
        <Link to={signupLink} className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Register here
        </Link>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Account Password</h3>
            <p className="text-xs text-slate-500">
              Enter your registered institutional email to receive reset instructions.
            </p>

            {forgotSuccess ? (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs">
                {forgotSuccess}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <Input
                  label="Registered Email"
                  type="email"
                  placeholder="user@institution.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" isLoading={forgotLoading}>
                  Send Reset Link
                </Button>
              </form>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => setForgotModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
