

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { authResetPassword } from '../services/db';
import { UserRole } from '../types';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.INDIVIDUAL); 
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isEmailVerified } = useAuth();
  const navigate = useNavigate();

  // Redirect logic
  useEffect(() => {
    if (user) {
      if (!isEmailVerified) {
          navigate('/verify-email');
      } else if (user.roles?.includes(UserRole.BUSINESS)) {
        navigate('/dashboard');
      } else {
        navigate('/my-id');
      }
    }
  }, [user, isEmailVerified, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
        await login(email, password);
        // Navigation handled by useEffect
    } catch (error: any) {
        setIsSubmitting(false);
        if (error.message?.includes('EMAIL_NOT_VERIFIED')) {
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
            return;
        }
        setError(error.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
            Sign in to EZID
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Or <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">create a new account</Link>
          </p>
        </div>
        
        <div className="flex justify-center gap-4 mb-6">
            <button 
                type="button"
                onClick={() => setRole(UserRole.INDIVIDUAL)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${role === UserRole.INDIVIDUAL ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
            >
                Individual
            </button>
            <button 
                type="button"
                onClick={() => setRole(UserRole.BUSINESS)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${role === UserRole.BUSINESS ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 ring-offset-2' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'}`}
            >
                Business
            </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input 
                 id="password"
                 type="password"
                 required
                 className="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                 placeholder="Password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.INDIVIDUAL);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, user, isEmailVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('type') === 'business') {
      setRole(UserRole.BUSINESS);
    }
  }, [location]);

  // Redirect logic
  React.useEffect(() => {
    if (user) {
       if (!isEmailVerified) {
           navigate('/verify-email');
       } else if (user.roles?.includes(UserRole.BUSINESS)) {
        navigate('/dashboard');
      } else {
        navigate('/my-id');
      }
    }
  }, [user, isEmailVerified, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
        await register(name, email, password, role);
        // Account created — go to the "check your email" screen.
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
        console.error("Registration Error:", error);
        setIsSubmitting(false);
        setError(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900">
            Create your EZID
          </h2>
           <p className="mt-2 text-center text-sm text-slate-600">
             Already have an ID? <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Log in</Link>
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
            </div>
          )}

          <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="block w-full px-3 py-3 border border-slate-300 bg-white text-slate-900 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value={UserRole.INDIVIDUAL} className="text-slate-900">Individual (Get Short ID)</option>
                <option value={UserRole.BUSINESS} className="text-slate-900">Business (Lookups & API)</option>
              </select>
          </div>

          <div className="space-y-4">
            <div>
                <label htmlFor="name" className="sr-only">Full Name / Organization Name</label>
                <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder={role === UserRole.BUSINESS ? "Organization Name" : "Full Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 shadow-md"
          >
            {isSubmitting ? 'Creating Account...' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const { resetPassword } = useAuth();

  const COOLDOWN_KEY = 'ezid_reset_cooldown_until';

  // Restore an in-progress cooldown after a page refresh (it's persisted as an
  // absolute end-time, so reloading no longer bypasses it).
  useEffect(() => {
    const until = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    const remaining = Math.ceil((until - Date.now()) / 1000);
    if (remaining > 0) setCooldown(remaining);
  }, []);

  const startCooldown = (secs: number) => {
    setCooldown(secs);
    localStorage.setItem(COOLDOWN_KEY, String(Date.now() + secs * 1000));
  };

  // Tick the countdown down every second.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setStatus('LOADING');
    setMessage('');

    try {
      await resetPassword(email);
      setStatus('SUCCESS');
      setMessage('Password reset link sent! Check your inbox (and spam folder).');
      startCooldown(90);
    } catch (error: any) {
      // Server-enforced rate limit (HTTP 429) — sync the UI to its real wait time.
      if (error.status === 429) {
        startCooldown(error.retryAfter || 90);
        setStatus('ERROR');
        setMessage(error.message || 'Please wait before requesting another link.');
      } else {
        setStatus('ERROR');
        setMessage(error.message || 'Failed to send reset link. Please try again later.');
      }
    }
  };

  const buttonDisabled = status === 'LOADING' || cooldown > 0;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <div>
            <Link to="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </Link>
          <h2 className="text-center text-3xl font-extrabold text-slate-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Enter your email and we'll send you a link to get back into your account.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {status === 'SUCCESS' && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {message}
            </div>
          )}
          {status === 'ERROR' && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {message}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={buttonDisabled}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'LOADING'
                ? 'Sending Link...'
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : status === 'SUCCESS'
                    ? 'Resend Link'
                    : 'Send Reset Link'}
            </button>
          </div>

          <p className="text-center">
            <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Back to Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (password.length < 6) { setStatus('ERROR'); setMessage('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setStatus('ERROR'); setMessage('Passwords do not match.'); return; }
    setStatus('LOADING');
    try {
      await authResetPassword(token, password);
      setStatus('SUCCESS');
    } catch (error: any) {
      setStatus('ERROR');
      setMessage(error.message || 'Could not reset password.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-slate-100">
        <h2 className="text-center text-3xl font-extrabold text-slate-900">Set a new password</h2>

        {!token ? (
          <p className="text-center text-sm text-red-600">This reset link is missing its token. Please use the link from your email.</p>
        ) : status === 'SUCCESS' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-green-900">Password updated</h3>
            <button onClick={() => navigate('/login')} className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Continue to Sign In
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {status === 'ERROR' && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> {message}
              </div>
            )}
            <input
              type="password" required placeholder="New password (min 6 chars)"
              className="block w-full px-3 py-3 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password" required placeholder="Confirm new password"
              className="block w-full px-3 py-3 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
            />
            <button
              type="submit" disabled={status === 'LOADING'}
              className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
            >
              {status === 'LOADING' ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};