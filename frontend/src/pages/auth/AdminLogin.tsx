import React from 'react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { LoginForm } from './LoginForm';

export const AdminLogin: React.FC = () => {
  return (
    <AuthLayout
      title="Admin & HOD Portal Login"
      subtitle="Sign in with your Employee ID or institutional email to access administrative analytics and mentor allocations."
      portalName="Admin/HOD"
    >
      <LoginForm
        portalRole="ADMIN"
        title="Administrator"
        identifierLabel="Employee ID or Official Email"
        identifierPlaceholder="e.g. EMP001 or admin@institution.edu"
        signupLink="/signup/admin"
        defaultRecentUsers={[
          { identifier: 'EMP001', name: 'Dr. Shailesh Kumar' },
          { identifier: 'EMP010', name: 'Dr. Nalini Hegde' },
        ]}
      />
    </AuthLayout>
  );
};
