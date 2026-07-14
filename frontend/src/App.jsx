import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import AdminPanel from './pages/AdminPanel';
import Analytics from './pages/Analytics';
import Templates from './pages/Templates';
import PendingApprovals from './pages/PendingApprovals';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/create" element={
                <ProtectedRoute><CreateRequest /></ProtectedRoute>
              } />
              <Route path="/requests/:id" element={
                <ProtectedRoute><RequestDetail /></ProtectedRoute>
              } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['staff', 'admin']}><AdminPanel /></ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute roles={['staff', 'admin']}><Analytics /></ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute roles={['staff', 'admin']}><Templates /></ProtectedRoute>
            } />
            <Route path="/approvals" element={
              <ProtectedRoute roles={['staff', 'admin']}><PendingApprovals /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
