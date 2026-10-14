import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import ServicesPage from './pages/customer/ServicesPage';
import ActiveTokenPage from './pages/customer/ActiveTokenPage';
import TokenHistoryPage from './pages/customer/TokenHistoryPage';
import CustomerNotificationsPage from './pages/customer/CustomerNotificationsPage';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffCounterManagementPage from './pages/staff/CounterManagementPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import ServiceManagementPage from './pages/admin/ServiceManagementPage';
import AdminCounterManagementPage from './pages/admin/CounterManagementPage';
import QueueSettingsPage from './pages/admin/QueueSettingsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer Routes */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'admin']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CustomerDashboard />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="active" element={<ActiveTokenPage />} />
                <Route path="history" element={<TokenHistoryPage />} />
                <Route path="notifications" element={<CustomerNotificationsPage />} />
              </Route>

              {/* Staff Routes */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={['staff', 'admin']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StaffDashboard />} />
                <Route path="counter" element={<StaffCounterManagementPage />} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="services" element={<ServiceManagementPage />} />
                <Route path="counters" element={<AdminCounterManagementPage />} />
                <Route path="settings" element={<QueueSettingsPage />} />
                <Route path="logs" element={<AuditLogsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
