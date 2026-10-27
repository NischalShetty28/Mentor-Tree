import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Department } from '../../types';

export const MentorSignup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    facultyId: '',
    email: '',
    password: '',
    confirmPassword: '',
    departmentId: '',
    designation: 'Assistant Professor',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState<string | null>(null);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required.';
    if (!formData.facultyId.trim()) errors.facultyId = 'Faculty ID is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) errors.email = 'Valid institutional email is required.';
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
      const res = await api.signupMentor(formData);

      if (res.token) {
        login(res.token, res.user);
        navigate('/mentor/dashboard');
      } else {
        setPendingApprovalMsg(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Mentor registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingApprovalMsg) {
    return (
      <AuthLayout
        title="Registration Submitted"
        subtitle="Your faculty profile has been submitted for institutional verification."
        portalName="Mentor"
      >
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-800">{pendingApprovalMsg}</p>
          <p className="text-xs text-slate-500">
            Once approved by the Head of Department (HOD) or Academic Administrator, you can sign in using your Faculty ID.
          </p>
          <Button onClick={() => navigate('/login/mentor')} className="mt-4">
            Return to Mentor Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Mentor Faculty Registration"
      subtitle="Register as an academic mentor to guide and track students through their degree program."
      portalName="Mentor"
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
            placeholder="Dr. Ramesh Rao"
            value={formData.fullName}
            onChange={handleChange}
            error={fieldErrors.fullName}
            required
          />
          <Input
            label="Faculty ID"
            name="facultyId"
            placeholder="FAC101"
            value={formData.facultyId}
            onChange={handleChange}
            error={fieldErrors.facultyId}
            required
          />
        </div>

        <Input
          label="College / Official Email"
          name="email"
          type="email"
          placeholder="ramesh.rao@institution.edu"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
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
              Designation *
            </label>
            <select
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Professor">Professor</option>
              <option value="Visiting Faculty">Visiting Faculty</option>
            </select>
          </div>
        </div>

        <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
          Register Mentor Account
        </Button>

        <p className="text-center text-xs text-slate-500 pt-3">
          Already registered?{' '}
          <Link to="/login/mentor" className="font-semibold text-brand-600 hover:underline">
            Login to Mentor Workspace
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
