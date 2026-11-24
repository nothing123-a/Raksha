import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { useAuth, DEMO_USERS } from '../context/AuthContext';

export const AppLayout = ({ allowedRoles = [] }) => {
  const { user, loading, setUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-academic border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-brandText-secondary font-medium">Loading portal...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, seamlessly auto-assign the demo role for this portal
  let activeUser = user;
  if (!activeUser) {
    let fallbackRole = 'student';
    if (location.pathname.startsWith('/faculty') || allowedRoles.includes('faculty')) {
      fallbackRole = 'faculty';
    } else if (location.pathname.startsWith('/hod') || allowedRoles.includes('hod')) {
      fallbackRole = 'hod';
    }
    activeUser = DEMO_USERS[fallbackRole];
    setUser(activeUser);
    localStorage.setItem('mitaoe_user', JSON.stringify(activeUser));
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(activeUser?.role)) {
    const redirectPath =
      activeUser.role === 'student'
        ? '/student/dashboard'
        : activeUser.role === 'faculty'
        ? '/faculty/dashboard'
        : '/hod/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="min-h-screen bg-surface-muted flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
