import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';

// Auth Pages (Immediate load)
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { NotFound } from './pages/NotFound';

// Lazy Loaded Student Pages
const StudentDashboard = lazy(() => import('./pages/student/Dashboard').then((m) => ({ default: m.StudentDashboard })));
const MyAttendance = lazy(() => import('./pages/student/MyAttendance').then((m) => ({ default: m.MyAttendance })));
const CourseDetails = lazy(() => import('./pages/student/CourseDetails').then((m) => ({ default: m.CourseDetails })));
const AttendanceCalculator = lazy(() => import('./pages/student/AttendanceCalculator').then((m) => ({ default: m.AttendanceCalculator })));
const StudentTimetable = lazy(() => import('./pages/student/StudentTimetable').then((m) => ({ default: m.StudentTimetable })));
const CorrectionRequests = lazy(() => import('./pages/student/CorrectionRequests').then((m) => ({ default: m.CorrectionRequests })));
const StudentProfile = lazy(() => import('./pages/student/Profile').then((m) => ({ default: m.StudentProfile })));

// Lazy Loaded Faculty Pages
const FacultyDashboard = lazy(() => import('./pages/faculty/Dashboard').then((m) => ({ default: m.FacultyDashboard })));
const MyCourses = lazy(() => import('./pages/faculty/MyCourses').then((m) => ({ default: m.MyCourses })));
const MarkAttendance = lazy(() => import('./pages/faculty/MarkAttendance').then((m) => ({ default: m.MarkAttendance })));
const AttendanceHistory = lazy(() => import('./pages/faculty/AttendanceHistory').then((m) => ({ default: m.AttendanceHistory })));
const FacultyTimetable = lazy(() => import('./pages/faculty/FacultyTimetable').then((m) => ({ default: m.FacultyTimetable })));
const FacultyCorrections = lazy(() => import('./pages/faculty/FacultyCorrections').then((m) => ({ default: m.FacultyCorrections })));
const FacultyReports = lazy(() => import('./pages/faculty/FacultyReports').then((m) => ({ default: m.FacultyReports })));
const FacultyProfile = lazy(() => import('./pages/faculty/Profile').then((m) => ({ default: m.FacultyProfile })));

// Lazy Loaded HOD Pages
const HODDashboard = lazy(() => import('./pages/hod/Dashboard').then((m) => ({ default: m.HODDashboard })));
const StudentManagement = lazy(() => import('./pages/hod/StudentManagement').then((m) => ({ default: m.StudentManagement })));
const FacultyManagement = lazy(() => import('./pages/hod/FacultyManagement').then((m) => ({ default: m.FacultyManagement })));
const CourseManagement = lazy(() => import('./pages/hod/CourseManagement').then((m) => ({ default: m.CourseManagement })));
const TimetableManagement = lazy(() => import('./pages/hod/TimetableManagement').then((m) => ({ default: m.TimetableManagement })));
const ShortageReport = lazy(() => import('./pages/hod/ShortageReport').then((m) => ({ default: m.ShortageReport })));
const AuditLogs = lazy(() => import('./pages/hod/AuditLogs').then((m) => ({ default: m.AuditLogs })));
const HODProfile = lazy(() => import('./pages/hod/Profile').then((m) => ({ default: m.HODProfile })));

// High-performance smooth loading fallback
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-academic border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-brandText-secondary font-medium">Loading view...</span>
    </div>
  </div>
);

// Root redirector based on authenticated user role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user?.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
  if (user?.role === 'hod') return <Navigate to="/hod/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<RootRedirect />} />

              {/* Student Role Routes */}
              <Route element={<AppLayout allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/attendance" element={<MyAttendance />} />
                <Route path="/student/courses/:courseId" element={<CourseDetails />} />
                <Route path="/student/calculator" element={<AttendanceCalculator />} />
                <Route path="/student/timetable" element={<StudentTimetable />} />
                <Route path="/student/corrections" element={<CorrectionRequests />} />
                <Route path="/student/profile" element={<StudentProfile />} />
              </Route>

              {/* Faculty Role Routes */}
              <Route element={<AppLayout allowedRoles={['faculty']} />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/courses" element={<MyCourses />} />
                <Route path="/faculty/attendance/mark" element={<MarkAttendance />} />
                <Route path="/faculty/attendance/history" element={<AttendanceHistory />} />
                <Route path="/faculty/timetable" element={<FacultyTimetable />} />
                <Route path="/faculty/corrections" element={<FacultyCorrections />} />
                <Route path="/faculty/reports" element={<FacultyReports />} />
                <Route path="/faculty/profile" element={<FacultyProfile />} />
              </Route>

              {/* HOD Role Routes */}
              <Route element={<AppLayout allowedRoles={['hod']} />}>
                <Route path="/hod/dashboard" element={<HODDashboard />} />
                <Route path="/hod/students" element={<StudentManagement />} />
                <Route path="/hod/faculty" element={<FacultyManagement />} />
                <Route path="/hod/courses" element={<CourseManagement />} />
                <Route path="/hod/timetable" element={<TimetableManagement />} />
                <Route path="/hod/shortages" element={<ShortageReport />} />
                <Route path="/hod/audit-logs" element={<AuditLogs />} />
                <Route path="/hod/profile" element={<HODProfile />} />
              </Route>

              {/* 404 Catch All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
