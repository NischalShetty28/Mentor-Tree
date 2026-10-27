import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Shield, CheckCircle } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Department } from '../../types';

export const AdminSignup: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    password: '',
    confirmPassword: '',
    departmentId: '',
    administrativeDesignation: 'Mentor Coordinator',
    institutionalCode: 'ADMIN2026', // Pre-filled for seamless testing
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState<string | null>(null);

  useEffect(() => {
    api.getDepartments().then((data) => {
      setDepartments(data);
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
    if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) errors.email = 'Valid official email is required.';
    if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!formData.administrativeDesignation.trim()) errors.administrativeDesignation = 'Designation is required.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await api.signupAdmin(formData);

      if (res.token) {
        login(res.token, res.user);
        navigate('/admin/dashboard');
      } else {
        setPendingApprovalMsg(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Admin registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingApprovalMsg) {
    return (
      <AuthLayout
        title="Admin Registration Submitted"
        subtitle="Your administrative registration is awaiting institutional approval."
        portalName="Admin/HOD"
      >
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-800">{pendingApprovalMsg}</p>
          <Button onClick={() => navigate('/login/admin')} className="mt-4">
            Return to Admin Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Admin & HOD Registration"
      subtitle="Institutional registration for Head of Departments, Deans, and Mentoring Program Coordinators."
      portalName="Admin/HOD"
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
            placeholder="Dr. Nalini Hegde"
            value={formData.fullName}
            onChange={handleChange}
            error={fieldErrors.fullName}
            required
          />
          <Input
            label="Employee ID"
            name="employeeId"
            placeholder="EMP010"
            value={formData.employeeId}
            onChange={handleChange}
            error={fieldErrors.employeeId}
            required
          />
        </div>

        <Input
          label="Official Institutional Email"
          name="email"
          type="email"
          placeholder="admin.hod@institution.edu"
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
              Department (Optional for Campus-wide)
            </label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">Campus-wide / All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Administrative Designation"
            name="administrativeDesignation"
            placeholder="e.g. HOD CSE or Dean"
            value={formData.administrativeDesignation}
            onChange={handleChange}
            error={fieldErrors.administrativeDesignation}
            required
          />
        </div>

        <Input
          label="Institutional Passkey / Authorization Code"
          name="institutionalCode"
          placeholder="ADMIN2026"
          value={formData.institutionalCode}
          onChange={handleChange}
          helperText="Use ADMIN2026 for automated institutional verification."
        />

        <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
          Register Administrator Account
        </Button>

        <p className="text-center text-xs text-slate-500 pt-3">
          Already registered?{' '}
          <Link to="/login/admin" className="font-semibold text-brand-600 hover:underline">
            Login to Admin / HOD Portal
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
