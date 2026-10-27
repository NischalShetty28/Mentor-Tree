const API_BASE = '/api';

export class ApiError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const getToken = (): string | null => {
  return localStorage.getItem('mentor_tree_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('mentor_tree_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('mentor_tree_token');
};

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    let fieldErrors;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
      fieldErrors = errorData.errors;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(errorMessage, response.status, fieldErrors);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Download Report Blob (PDF or CSV)
export async function downloadReport(endpoint: string, filename: string): Promise<void> {
  const token = getToken();
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to download report file');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Typed API modules
export const api = {
  // Auth
  login: (data: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  signupMentee: (data: any) => apiRequest('/auth/signup/mentee', { method: 'POST', body: JSON.stringify(data) }),
  signupMentor: (data: any) => apiRequest('/auth/signup/mentor', { method: 'POST', body: JSON.stringify(data) }),
  signupAdmin: (data: any) => apiRequest('/auth/signup/admin', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),
  forgotPassword: (email: string) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (data: any) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),

  // Departments
  getDepartments: () => apiRequest('/departments'),

  // Mentee Portal
  getMenteeDashboard: () => apiRequest('/mentee/dashboard'),
  getMenteeProfile: () => apiRequest('/mentee/profile'),
  updateMenteeProfile: (data: any) => apiRequest('/mentee/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getMenteeRecommendations: () => apiRequest('/mentee/recommendations'),
  acknowledgeRecommendation: (id: string, note?: string) =>
    apiRequest(`/mentee/recommendations/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ acknowledgmentNote: note }) }),
  addRecommendationComment: (id: string, content: string) =>
    apiRequest(`/mentee/recommendations/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  getMenteeTasks: () => apiRequest('/mentee/tasks'),
  updateTaskProgress: (id: string, data: any) =>
    apiRequest(`/mentee/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  requestMeeting: (data: any) => apiRequest('/mentee/meetings/request', { method: 'POST', body: JSON.stringify(data) }),
  getAcademicRecords: () => apiRequest('/mentee/academics'),
  getAttendanceRecords: () => apiRequest('/mentee/attendance'),

  // Mentor Workspace
  getMentorDashboard: () => apiRequest('/mentor/dashboard'),
  getAssignedMentees: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/mentor/mentees${qs}`);
  },
  getMenteeDetail: (menteeId: string) => apiRequest(`/mentor/mentees/${menteeId}`),
  createRecommendation: (data: any) => apiRequest('/mentor/recommendations', { method: 'POST', body: JSON.stringify(data) }),
  createTask: (data: any) => apiRequest('/mentor/tasks', { method: 'POST', body: JSON.stringify(data) }),
  createPrivateNote: (data: any) => apiRequest('/mentor/private-notes', { method: 'POST', body: JSON.stringify(data) }),
  verifyTask: (id: string, verified: boolean) =>
    apiRequest(`/mentor/tasks/${id}/verify`, { method: 'PUT', body: JSON.stringify({ verified }) }),

  // Admin & HOD Portal
  getAdminDashboard: () => apiRequest('/admin/dashboard'),
  getAllStudents: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/admin/students${qs}`);
  },
  getAllMentors: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/admin/mentors${qs}`);
  },
  createAssignment: (mentorId: string, menteeIds: string[], notes?: string) =>
    apiRequest('/admin/assignments', { method: 'POST', body: JSON.stringify({ mentorId, menteeIds, notes }) }),
  removeAssignment: (assignmentId: string) =>
    apiRequest(`/admin/assignments/${assignmentId}`, { method: 'DELETE' }),
  getRegistrationRequests: () => apiRequest('/admin/registrations'),
  updateRegistrationStatus: (userId: string, status: 'APPROVED' | 'REJECTED') =>
    apiRequest(`/admin/registrations/${userId}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getAuditLogs: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/admin/audit-logs${qs}`);
  },
  triggerRiskEvaluation: () => apiRequest('/admin/evaluate-risks', { method: 'POST' }),
  getRiskThresholds: () => apiRequest('/admin/thresholds'),
  updateRiskThresholds: (data: any) => apiRequest('/admin/thresholds', { method: 'PUT', body: JSON.stringify(data) }),

  // Meetings
  getMeetings: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/meetings${qs}`);
  },
  createMeeting: (data: any) => apiRequest('/meetings', { method: 'POST', body: JSON.stringify(data) }),
  rescheduleMeeting: (id: string, data: any) => apiRequest(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelMeeting: (id: string, reason?: string) =>
    apiRequest(`/meetings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  recordMeetingAttendance: (id: string, attendeeRecords: any[], mentorSummary?: string) =>
    apiRequest(`/meetings/${id}/attendance`, { method: 'POST', body: JSON.stringify({ attendeeRecords, mentorSummary }) }),

  // Academic Risk Alerts
  getRiskAlerts: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/alerts${qs}`);
  },
  updateRiskAlertStatus: (id: string, data: any) =>
    apiRequest(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => apiRequest('/notifications'),
  markNotificationAsRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsAsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),
};
