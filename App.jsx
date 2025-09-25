import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar, Footer } from './components/shared/NavigationComponents.jsx';
import { AuthProvider, ProtectedRoute } from './components/Login.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Cars from './pages/Cars.jsx';
import Tours from './pages/Tours.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';
import EnvironmentInfo from './components/shared/EnvironmentInfo.jsx';
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';

// Admin/Owner Routes
import OwnerDashboard from './pages/owner/AdminDashboard.jsx';
import ManageCars from './pages/owner/ManageCars.jsx';
import ManageTours from './pages/owner/ManageTours.jsx';
import ManageBookings from './pages/owner/ManageBookings.jsx';
import EmployeeManagement from './pages/owner/EmployeeManagement.jsx';
import Reports from './pages/owner/Reports.jsx';
import Messages from './pages/owner/Message.jsx';
import ContentManagement from './pages/owner/ContentManagement.jsx';

// Employee Routes
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';

// Login Components
import { AdminLogin, EmployeeLogin, UnifiedLoginPortal } from './components/Login.jsx';

import DataService from './components/services/DataService.jsx';

function App() {
  const [systemReady, setSystemReady] = useState(false);
  const [systemError, setSystemError] = useState(null);
  const [showLoginPortal, setShowLoginPortal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🚀 DoRayd Travel & Tours App initializing at:', new Date().toISOString());
    console.log('📅 Current Date/Time: 2025-09-03 17:15:44');
    console.log('👤 Current User: BlueDrinkingWater');

    // Check system health on startup
    const checkSystemHealth = async () => {
      try {
        const healthData = await DataService.checkHealth();
        if (healthData.success && healthData.database === 'connected') {
          setSystemReady(true);
          setSystemError(null);
          console.log('✅ System health check passed - Database connected at 2025-09-03 17:15:44');
        } else {
          throw new Error('Database connection failed');
        }
      } catch (error) {
        console.error('❌ System health check failed:', error);
        setSystemError(error.message);
        setSystemReady(false);
      }
    };

    checkSystemHealth();
  }, []);

  // Loading screen while checking system health
  if (!systemReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Connecting to DoRayd Database</h3>
          <p className="text-gray-600 mb-4">Establishing connection to our MongoDB database...</p>
          
          {systemError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
              <p className="font-medium">Database Connection Error:</p>
              <p className="text-sm">{systemError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                Retry Database Connection
              </button>
              <div className="mt-2 text-xs">
                <p>Make sure your backend server is running on http://localhost:5000</p>
                <p>Run: npm run dev (in backend folder)</p>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-4">
            <p>Database Status: {systemError ? 'Disconnected' : 'Connecting...'}</p>
            <p>Time: {new Date().toLocaleString()}</p>
            <p>User: BlueDrinkingWater</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        {process.env.NODE_ENV === 'development' && <EnvironmentInfo />}
        
        <Navbar 
          onStaffLogin={() => setShowLoginPortal(true)}
          onLogoClick={() => navigate('/')}
        />
        
        <main className="flex-grow pt-16"> {/* Add padding top to prevent content being hidden by fixed navbar */} 
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/tours" element={<Tours />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/browse" element={<CustomerDashboard initialTab="all" />} />
            
            {/* Authentication Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/employee-login" element={<EmployeeLogin />} />
            
            {/* Admin/Owner Protected Routes */}
            <Route path="/owner" element={
  <ProtectedRoute requiredRole="admin">
    <OwnerDashboard />
  </ProtectedRoute>
}>
              <Route index element={<Navigate to="/owner/AdminDashboard" replace />} />
              <Route path="dashboard" element={<OwnerDashboard />} />
              <Route path="manage-cars" element={<ManageCars />} />
              <Route path="manage-tours" element={<ManageTours />} />
              <Route path="manage-bookings" element={<ManageBookings />} />
              <Route path="employee-management" element={<EmployeeManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="messages" element={<Messages />} />
              <Route path="content-management" element={<ContentManagement />} />
              <Route path="customer-view" element={<CustomerDashboard initialTab="all" />} />
            </Route>
            
            {/* Employee Protected Routes */}
            <Route path="/employee" element={
              <ProtectedRoute requiredRole="employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }>
              {/* If EmployeeLayout existed with an Outlet, nested routes would go here */}
            </Route>
            
            {/* Unauthorized Route */}
            <Route path="/unauthorized" element={
              <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-4">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
                  <p className="text-gray-600 mb-6">You don't have permission to access this resource in the database.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Return to Homepage
                  </button>
                </div>
              </div>
            } />
            
            {/* 404 Route */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
        
        <Footer />
        
        {/* Unified Login Portal */}
        {showLoginPortal && (
          <UnifiedLoginPortal 
            isOpen={showLoginPortal} 
            onClose={() => setShowLoginPortal(false)} 
          />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
