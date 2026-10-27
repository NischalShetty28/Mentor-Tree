import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Hash, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Department } from '../../types';

export const MenteeSignup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    usn: '',
    email: '',
    password: '',
    confirmPassword: '',
    departmentId: '',
    semester: 1,
    academicYear: '2025-2026',
    section: 'A',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    api.getDepartments().then((data) => {
      setDepartments(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, departmentId: data[0].id }));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'semester' ? parseInt(value, 10) : value,
    }));
    // Clear inline error
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!formData.usn.trim()) errors.usn = 'USN is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) errors.email = 'Valid college email is required.';
    if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!formData.departmentId) errors.departmentId = 'Department is required.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.signupMentee(formData);
      login(res.token, res.user);
      navigate('/mentee/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Mentee Account Registration"
      subtitle="Create your official student mentoring profile to connect with your assigned faculty mentor."
      portalName="Mentee"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="fullName"
            placeholder="Aryan Verma"
            value={formData.fullName}
            onChange={handleChange}
            error={fieldErrors.fullName}
            required
          />
          <Input
            label="University Seat Number (USN)"
            name="usn"
            placeholder="1MS22CS001"
            value={formData.usn}
            onChange={handleChange}
            error={fieldErrors.usn}
            required
          />
        </div>

        <Input
          label="College / Student Email"
          name="email"
          type="email"
          placeholder="student@institution.edu"
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Min 6 characters"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
            required
          />
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={fieldErrors.confirmPassword}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Department *
            </label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Semester *
            </label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleChange}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Academic Year *
            </label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
          Complete Mentee Registration
        </Button>

        <p className="text-center text-xs text-slate-500 pt-3">
          Already registered?{' '}
          <Link to="/login/mentee" className="font-semibold text-brand-600 hover:underline">
            Login to Mentee Portal
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
