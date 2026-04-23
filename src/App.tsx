import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthListener } from './components/AuthListener';
import { LanguageProvider } from './lib/LanguageContext';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user, loading } = useStore();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthListener>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/*" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/" element={<HomeRedirect />} />
          </Routes>
        </AuthListener>
      </LanguageProvider>
    </Router>
  );
}

function HomeRedirect() {
  const { user, loading } = useStore();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'teacher') return <Navigate to="/teacher" />;
  if (user.role === 'student') return <Navigate to="/student" />;
  
  return <Navigate to="/login" />;
}
