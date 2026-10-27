import React from 'react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { LoginForm } from './LoginForm';

export const MentorLogin: React.FC = () => {
  return (
    <AuthLayout
      title="Mentor Workspace Login"
      subtitle="Sign in with your Faculty ID or college email address."
      portalName="Mentor"
    >
      <LoginForm
        portalRole="MENTOR"
        title="Mentor"
        identifierLabel="Faculty ID or College Email"
        identifierPlaceholder="e.g. FAC101"
        signupLink="/signup/mentor"
        defaultRecentUsers={[
          { identifier: 'FAC101', name: 'Dr. Ramesh Rao' },
          { identifier: 'FAC102', name: 'Prof. Priya Sharma' },
        ]}
      />
    </AuthLayout>
  );
};
