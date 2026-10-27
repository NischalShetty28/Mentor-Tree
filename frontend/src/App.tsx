import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Landing Page
import { LandingPage } from './pages/LandingPage';

// 6 Authentication Pages
import { MenteeLogin } from './pages/auth/MenteeLogin';
import { MenteeSignup } from './pages/auth/MenteeSignup';
import { MentorLogin } from './pages/auth/MentorLogin';
import { MentorSignup } from './pages/auth/MentorSignup';
import { AdminLogin } from './pages/auth/AdminLogin';
import { AdminSignup } from './pages/auth/AdminSignup';

// Mentee Portal Pages
import { MenteeDashboard } from './pages/mentee/MenteeDashboard';
import { MenteeProfilePage } from './pages/mentee/MenteeProfilePage';
import { MenteeRecommendationsPage } from './pages/mentee/MenteeRecommendationsPage';
import { MenteeTasksPage } from './pages/mentee/MenteeTasksPage';
import { MenteeMeetingsPage } from './pages/mentee/MenteeMeetingsPage';
import { MenteeAcademicsPage } from './pages/mentee/MenteeAcademicsPage';

// Mentor Workspace Pages
import { MentorDashboard } from './pages/mentor/MentorDashboard';
import { MentorMenteesPage } from './pages/mentor/MentorMenteesPage';
import { MenteeDetailPage } from './pages/mentor/MenteeDetailPage';
import { MentorCalendarPage } from './pages/mentor/MentorCalendarPage';
import { MentorAlertsPage } from './pages/mentor/MentorAlertsPage';
import { MentorReportsPage } from './pages/mentor/MentorReportsPage';

// Admin / HOD Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminMentorsPage } from './pages/admin/AdminMentorsPage';
import { AdminAssignmentsPage } from './pages/admin/AdminAssignmentsPage';
import { AdminApprovalsPage } from './pages/admin/AdminApprovalsPage';
import { AdminRiskPage } from './pages/admin/AdminRiskPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Landing & Portal Selector */}
              <Route path="/" element={<LandingPage />} />

              {/* 6 Authentication Pages */}
              <Route path="/login/mentee" element={<MenteeLogin />} />
              <Route path="/signup/mentee" element={<MenteeSignup />} />
              <Route path="/login/mentor" element={<MentorLogin />} />
              <Route path="/signup/mentor" element={<MentorSignup />} />
              <Route path="/login/admin" element={<AdminLogin />} />
              <Route path="/signup/admin" element={<AdminSignup />} />

              {/* Mentee Portal (Role: MENTEE) */}
              <Route
                path="/mentee/*"
                element={
                  <ProtectedRoute allowedRoles={['MENTEE']}>
                    <DashboardLayout>
                      <Routes>
                        <Route path="dashboard" element={<MenteeDashboard />} />
                        <Route path="profile" element={<MenteeProfilePage />} />
                        <Route path="recommendations" element={<MenteeRecommendationsPage />} />
                        <Route path="tasks" element={<MenteeTasksPage />} />
                        <Route path="meetings" element={<MenteeMeetingsPage />} />
                        <Route path="academics" element={<MenteeAcademicsPage />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Mentor Workspace (Role: MENTOR, ADMIN, HOD) */}
              <Route
                path="/mentor/*"
                element={
                  <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN', 'HOD']}>
                    <DashboardLayout>
                      <Routes>
                        <Route path="dashboard" element={<MentorDashboard />} />
                        <Route path="mentees" element={<MentorMenteesPage />} />
                        <Route path="mentees/:menteeId" element={<MenteeDetailPage />} />
                        <Route path="calendar" element={<MentorCalendarPage />} />
                        <Route path="recommendations" element={<MentorMenteesPage />} />
                        <Route path="tasks" element={<MentorMenteesPage />} />
                        <Route path="alerts" element={<MentorAlertsPage />} />
                        <Route path="reports" element={<MentorReportsPage />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Administrator & HOD Portal (Role: ADMIN, HOD) */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'HOD']}>
                    <DashboardLayout>
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="students" element={<AdminStudentsPage />} />
                        <Route path="mentors" element={<AdminMentorsPage />} />
                        <Route path="assignments" element={<AdminAssignmentsPage />} />
                        <Route path="approvals" element={<AdminApprovalsPage />} />
                        <Route path="risk-management" element={<AdminRiskPage />} />
                        <Route path="audit-logs" element={<AdminAuditPage />} />
                        <Route path="reports" element={<AdminReportsPage />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
