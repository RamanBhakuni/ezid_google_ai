
import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { Mail, RefreshCw, CheckCircle, ArrowRight, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

export const VerifyEmailPage: React.FC = () => {
  const { user, isEmailVerified, checkVerificationStatus, resendVerificationEmail, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  // If already verified, redirect immediately
  React.useEffect(() => {
    if (isEmailVerified && user) {
        if (user.role === UserRole.BUSINESS) {
            navigate('/dashboard');
        } else {
            navigate('/my-id');
        }
    }
  }, [isEmailVerified, user, navigate]);

  const handleCheck = async () => {
    setChecking(true);
    const verified = await checkVerificationStatus();
    if (verified) {
        // Redirect handled by useEffect
    } else {
        alert("Email not verified yet. Please check your inbox or spam folder.");
    }
    setChecking(false);
  };

  const handleResend = async () => {
    try {
        await resendVerificationEmail();
        setSent(true);
        setTimeout(() => setSent(false), 5000);
    } catch (e: any) {
        alert("Error sending email: " + e.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-indigo-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify your email</h2>
        <p className="text-slate-600 mb-6">
            We've sent a verification link to <strong>{user?.email}</strong>. 
            Please click the link in your email to activate your account.
        </p>

        <div className="space-y-4">
            <button
                onClick={handleCheck}
                disabled={checking}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors"
            >
                {checking ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {checking ? 'Checking status...' : "I've Verified My Email"}
            </button>

            <button
                onClick={handleResend}
                disabled={sent}
                className="w-full flex items-center justify-center py-3 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none transition-colors"
            >
                {sent ? 'Email Sent!' : 'Resend Verification Email'}
            </button>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-xs text-slate-400 mb-4">
                Can't find the email? Check your spam folder.
            </p>
            <button 
                onClick={() => { logout(); navigate('/login'); }}
                className="text-sm text-slate-500 hover:text-red-600 flex items-center justify-center mx-auto gap-2"
            >
                <LogOut className="w-4 h-4" /> Sign out
            </button>
        </div>
      </div>
    </div>
  );
};
