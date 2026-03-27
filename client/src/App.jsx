import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { SocketProvider } from './contexts/SocketContext.jsx';

// Pages
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import DonorDashboard from './pages/donor/DonorDashboard.jsx';
import AddFood from './pages/donor/AddFood.jsx';
import DonationHistory from './pages/donor/DonationHistory.jsx';
import NGODashboard from './pages/ngo/NGODashboard.jsx';
import AvailableFood from './pages/ngo/AvailableFood.jsx';
import ClaimedFood from './pages/ngo/ClaimedFood.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import AllActivities from './pages/admin/AllActivities.jsx';
import MapView from './pages/MapView.jsx';
import Layout from './components/Layout.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return null;

  const defaultPath = user
    ? user.role === 'donor' ? '/donor'
    : user.role === 'ngo' ? '/ngo'
    : '/admin'
    : '/login';

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={defaultPath} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={defaultPath} replace />} />

      {/* Donor Routes */}
      <Route path="/donor" element={<ProtectedRoute allowedRoles={['donor']}><Layout /></ProtectedRoute>}>
        <Route index element={<DonorDashboard />} />
        <Route path="add" element={<AddFood />} />
        <Route path="history" element={<DonationHistory />} />
        <Route path="map" element={<MapView />} />
      </Route>

      {/* NGO Routes */}
      <Route path="/ngo" element={<ProtectedRoute allowedRoles={['ngo']}><Layout /></ProtectedRoute>}>
        <Route index element={<NGODashboard />} />
        <Route path="available" element={<AvailableFood />} />
        <Route path="claimed" element={<ClaimedFood />} />
        <Route path="map" element={<MapView />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="activities" element={<AllActivities />} />
        <Route path="map" element={<MapView />} />
      </Route>

      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
              success: { iconTheme: { primary: '#22c55e', secondary: '#0f172a' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
            }}
          />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}
