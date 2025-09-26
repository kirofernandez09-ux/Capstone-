import React, { useState, useEffect } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, StaffLoginPortal, CustomerLoginPortal } from './components/Login.jsx';

// Shared Components
import { Navbar, Footer } from './components/shared/NavigationComponents.jsx';
import NotificationSystem from './components/shared/NotificationSystem.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Cars from './pages/Cars.jsx';
import Tours from './pages/Tours.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';

// Admin/Owner Pages & Layout
import AdminDashboard from './pages/owner/AdminDashboard.jsx';
import ManageCars from './pages/owner/ManageCars.jsx';
import ManageTours from './pages/owner/ManageTours.jsx';
import ManageBookings from './pages/owner/ManageBookings.jsx';
import EmployeeManagement from './pages/owner/EmployeeManagement.jsx';
import Reports from './pages/owner/Reports.jsx';
import Messages from './pages/owner/Message.jsx';
import ContentManagement from './pages/owner/ContentManagement.jsx';

// Employee Pages & Layout
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';

import DataService from './components/services/DataService.jsx';

// Layout for Admin Routes
const AdminLayout = () => (
  <AdminDashboard>
    <Outlet />
  </AdminDashboard>
);

// Layout for Employee Routes
const EmployeeLayout = () => (
  <EmployeeDashboard>
    <Outlet />
  </EmployeeDashboard>
);

function App() {
  const [systemReady, setSystemReady] = useState(false);
  const [systemError, setSystemError] = useState(null);
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const healthData = await DataService.checkHealth();
        if (healthData.success && healthData.database === 'connected') {
          setSystemReady(true);
        } else {
          throw new Error('Backend check passed but database connection failed.');
        }
      } catch (error) {
        setSystemError(error.message);
        setSystemReady(false);
      }
    };
    checkSystemHealth();
  }, []);

  if (!systemReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
          <h2 className="text-2xl font-semibold mt-4">Connecting to Server...</h2>
          {systemError && <p className="text-red-500 mt-2">{systemError}</p>}
        </div>
      </div>
    );
  }

return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar 
          onStaffLogin={() => setShowStaffLogin(true)} 
          onCustomerLogin={() => setShowCustomerLogin(true)}
        />
        <main className="flex-grow">
          <NotificationSystem />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/contact" element={<Contact />} />
            <Route 
              path="/my-bookings" 
              element={<ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>} 
            />

            {/* Admin Protected Routes */}
            <Route path="/owner" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
              <Route index element={null} />
              <Route path="dashboard" element={null} />
              <Route path="manage-cars" element={<ManageCars />} />
              <Route path="manage-tours" element={<ManageTours />} />
              <Route path="manage-bookings" element={<ManageBookings />} />
              <Route path="employee-management" element={<EmployeeManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="messages" element={<Messages />} />
              <Route path="content-management" element={<ContentManagement />} />
            </Route>

            {/* --- REVISED Employee Protected Routes --- */}
            <Route path="/employee" element={<ProtectedRoute requiredRole="employee"><EmployeeLayout /></ProtectedRoute>}>
               <Route index element={null} />
               <Route path="dashboard" element={null} />
               {/* These routes allow employees to use the same components as admins, but via their own protected path */}
               <Route path="manage-cars" element={<ManageCars />} />
               <Route path="manage-tours" element={<ManageTours />} />
               <Route path="manage-bookings" element={<ManageBookings />} />
               <Route path="messages" element={<Messages />} />
               <Route path="reports" element={<Reports />} />
               <Route path="content-management" element={<ContentManagement />} />
            </Route>

            <Route path="/unauthorized" element={<div>Access Denied</div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        {showStaffLogin && <StaffLoginPortal isOpen={showStaffLogin} onClose={() => setShowStaffLogin(false)} />}
        {showCustomerLogin && <CustomerLoginPortal isOpen={showCustomerLogin} onClose={() => setShowCustomerLogin(false)} />}
      </div>
    </AuthProvider>
  );
}

export default App;