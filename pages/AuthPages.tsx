

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../services/authContext';
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
        if (error.code === 'auth/invalid-credential') {
            setError("Invalid email or password.");
        } else if (error.code === 'auth/user-not-found') {
            setError("No account found with this email.");
        } else {
            setError("Login failed. Please try again.");
        }
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
        // Navigation handled by useEffect
    } catch (error: any) {
        console.error("Full Registration Error:", error);
        setIsSubmitting(false);
        
        if (error.code === 'auth/email-already-in-use') {
            setError("Email registered. Try logging in with your password to upgrade.");
        } else if (error.code === 'auth/weak-password') {
            setError("Password should be at least 6 characters.");
        } else if (error.code === 'auth/invalid-email') {
            setError("Please enter a valid email address.");
        } else {
            setError(error.message || "Registration failed. Please try again.");
        }
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
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('LOADING');
    setMessage('');
    
    try {
      await resetPassword(email);
      setStatus('SUCCESS');
      setMessage('Password reset link sent! Check your inbox (and spam folder).');
    } catch (error: any) {
      setStatus('ERROR');
      if (error.code === 'auth/user-not-found') {
        setMessage('No account found with this email address.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('Please enter a valid email address.');
      } else {
        setMessage('Failed to send reset link. Please try again later.');
      }
    }
  };

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

        {status === 'SUCCESS' ? (
           <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                 <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-900">Check your email</h3>
              <p className="mt-2 text-sm text-green-700">
                 {message}
              </p>
              <div className="mt-6">
                 <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Back to Sign In
                 </Link>
              </div>
           </div>
        ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                disabled={status === 'LOADING'}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                >
                {status === 'LOADING' ? 'Sending Link...' : 'Send Reset Link'}
                </button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
};