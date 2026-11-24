import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const DEMO_USERS = {
  student: {
    _id: '6b050eaf6c6223464824ae36',
    name: 'Aarav Sharma',
    email: 'student.demo@mitaoe.ac.in',
    role: 'student',
    studentId: '2022BTECS001',
    department: 'Computer Engineering',
    academicYear: 'Third Year',
    semester: 5,
    division: 'A',
  },
  faculty: {
    _id: '6b050eaf6c6223464824ae25',
    name: 'Prof. Rajesh Kulkarni',
    email: 'faculty.demo@mitaoe.ac.in',
    role: 'faculty',
    department: 'Computer Engineering',
    designation: 'Associate Professor',
  },
  hod: {
    _id: '6b050eaf6c6223464824ae20',
    name: 'Dr. Sunita Patil',
    email: 'hod.demo@mitaoe.ac.in',
    role: 'hod',
    department: 'Computer Engineering',
  },
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mitaoe_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Check existing session on boot if token exists
  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('mitaoe_token');
      if (!token) return;

      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('mitaoe_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        // If network error, preserve saved user state
      }
    };

    fetchMe();
  }, []);

  const bypassLoginAs = (role = 'student') => {
    const demoUser = DEMO_USERS[role] || DEMO_USERS.student;
    setUser(demoUser);
    localStorage.setItem('mitaoe_user', JSON.stringify(demoUser));
    return demoUser;
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data?.user) {
        if (res.data.token) {
          localStorage.setItem('mitaoe_token', res.data.token);
        }
        localStorage.setItem('mitaoe_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      // Automatic fallback for demo accounts if server is unreachable
      const matchedRole = Object.keys(DEMO_USERS).find(
        (r) => DEMO_USERS[r].email.toLowerCase() === email.trim().toLowerCase()
      );
      if (matchedRole) {
        const demoUser = DEMO_USERS[matchedRole];
        localStorage.setItem('mitaoe_user', JSON.stringify(demoUser));
        setUser(demoUser);
        return demoUser;
      }
      throw err;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data?.success) {
      if (res.data.token) {
        localStorage.setItem('mitaoe_token', res.data.token);
      }
      localStorage.setItem('mitaoe_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue client logout
    } finally {
      localStorage.removeItem('mitaoe_token');
      localStorage.removeItem('mitaoe_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        login,
        register,
        logout,
        setUser,
        bypassLoginAs,
      }}
    >
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
