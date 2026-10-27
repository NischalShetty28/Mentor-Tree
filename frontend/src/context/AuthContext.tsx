import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api, getToken, removeToken, setToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      const role = data.role as Role;
      const profile =
        role === 'MENTEE'
          ? data.menteeProfile
          : role === 'MENTOR'
          ? data.mentorProfile
          : data.adminProfile;

      setUser({
        id: data.id,
        email: data.email,
        role,
        avatarUrl: data.avatarUrl,
        fullName: profile?.fullName,
        usn: profile?.usn,
        facultyId: profile?.facultyId,
        employeeId: profile?.employeeId,
        department: profile?.department?.name,
        semester: profile?.semester,
        designation: profile?.designation || profile?.administrativeDesignation,
        isSuperAdmin: profile?.isSuperAdmin,
        profileId: profile?.id,
      });
    } catch (error) {
      console.error('Failed to authenticate stored token:', error);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (token: string, userData: User) => {
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const hasRole = (roles: Role[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
