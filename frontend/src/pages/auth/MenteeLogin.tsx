import React from 'react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { LoginForm } from './LoginForm';

export const MenteeLogin: React.FC = () => {
  return (
    <AuthLayout
      title="Mentee Portal Login"
      subtitle="Sign in with your University Seat Number (USN) or student email."
      portalName="Mentee"
    >
      <LoginForm
        portalRole="MENTEE"
        title="Mentee"
        identifierLabel="USN or Student Email"
        identifierPlaceholder="e.g. 1MS22CS001"
        signupLink="/signup/mentee"
        defaultRecentUsers={[
          { identifier: '1MS22CS001', name: 'Aryan Verma' },
          { identifier: '1MS22CS045', name: 'Sneha Patil' },
        ]}
      />
    </AuthLayout>
  );
};
