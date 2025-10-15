import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';

import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './components/EnhancedStudentProfile';
import TeacherDashboard from './pages/TeacherDashboard'; // Import TeacherDashboard

import ResultManagement from './components/pages/ResultManagement';
import ProfessionalResultManagement from './components/pages/ResultManagement';
import TransportManagement from './components/pages/TransportManagement';


// Use the full AdminDashboard component from pages/AdminDashboard.tsx

// Use AdminDashboard as the default dashboard for now
const Dashboard = () => <AdminDashboard />;

// Staff dashboard component
const StaffDashboard = () => <div className="p-8"><h1 className="text-2xl font-bold">Staff Dashboard</h1><p>Staff dashboard content will be added here.</p></div>;

const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();

  // Determine redirect path based on user role
  const getRedirectPath = () => {
    if (!currentUser) return '/login';

    switch (currentUser.role) {
      case 'student':
        return '/student';
      case 'staff':
        return '/staff';
      case 'instructor': // Add instructor role
        return '/teacher';
      case 'admin':
      case 'principal':
      case 'director':
        return '/admin';
      default:
        return '/dashboard';
    }
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={currentUser ? <Navigate to={getRedirectPath()} /> : <AuthPage />} />
      <Route path="/register" element={currentUser ? <Navigate to={getRedirectPath()} /> : <AuthPage />} />
      
      {/* Redirect root to login if not authenticated */}
      <Route path="/" element={currentUser ? <Navigate to={getRedirectPath()} /> : <Navigate to="/login" />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      
      {/* Role-specific routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student-dashboard" element={<Navigate to="/student" />} />
      </Route>
      
      {/* Student Profile Route - accessible by multiple roles */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'student']} />}>
        <Route path="/student-profile/:id" element={<StudentProfile />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff-dashboard" element={<Navigate to="/staff" />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['admin', 'principal', 'director']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin" />} />
      </Route>

      {/* Result Management Routes */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'principal', 'director']} />}>
        <Route path="/result-management" element={<ResultManagement />} />
        <Route path="/professional-result-management" element={<ProfessionalResultManagement />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to={getRedirectPath()} />} />
    
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/transport" element={<TransportManagement />} />
      

     
      </Routes>

  );
};

export default AppRoutes;
