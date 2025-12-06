import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './services/authContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import { UserDashboard } from './pages/UserDashboard';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { BulkLookupPage } from './pages/BulkLookupPage';
import { PrivacyPolicy, TermsOfUse, RefundPolicy } from './pages/LegalPages';
import { HowItWorks } from './pages/HowItWorks';
import { ContactUs } from './pages/ContactUs';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { PricingPage } from './pages/PricingPage';
import { UserRole } from './types';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { user, loading, isEmailVerified } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Enforce Email Verification
  if (!isEmailVerified) {
      return <Navigate to="/verify-email" />;
  }

  if (allowedRoles) {
     // Check if the user has AT LEAST one of the allowed roles
     const hasAllowedRole = allowedRoles.some(role => user.roles?.includes(role)) || allowedRoles.includes(user.role);
     
     // Admins can access everything
     if (user.roles?.includes(UserRole.ADMIN) || user.role === UserRole.ADMIN) {
         return <>{children}</>;
     }

     if (!hasAllowedRole) {
         // Redirect to their default dashboard
         return <Navigate to={user.roles?.includes(UserRole.BUSINESS) ? '/dashboard' : '/my-id'} />;
     }
  }

  return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            {/* Public Info Pages */}
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfUse />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* Verification Page (Protected from guests, but accessible to unverified users) */}
            <Route 
                path="/verify-email" 
                element={
                    <VerifyEmailPage />
                } 
            />

            {/* Admin Route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Individual Routes */}
            <Route 
              path="/my-id" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.INDIVIDUAL]}>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Business Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.BUSINESS]}>
                  <BusinessDashboard />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="/bulk-lookup" 
              element={
                <ProtectedRoute allowedRoles={[UserRole.BUSINESS]}>
                  <BulkLookupPage />
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
            <AppRoutes />
        </Layout>
      </Router>
    </AuthProvider>
  );
}