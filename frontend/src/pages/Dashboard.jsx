import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PatientDashboard from './patient/PatientDashboard';
import NGODashboard from './ngo/NGODashboard';

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'ngo') {
    return <NGODashboard />;
  }

  // Default to patient dashboard
  return <PatientDashboard />;
}
