import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/authContext';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

export const VerifyEmailPage: React.FC = () => {
  const { verifyEmail, resendVerification } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get('token');
  const email = params.get('email') || '';

  // 'verifying' | 'verified' | 'error' | 'pending' (waiting for the user to click the link)
  const [state, setState] = useState<'verifying' | 'verified' | 'error' | 'pending'>(
    token ? 'verifying' : 'pending'
  );
  const [message, setMessage] = useState('');
  const [resent, setResent] = useState(false);

  // If we arrived with a token, verify it immediately.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        await verifyEmail(token);
        setState('verified');
      } catch (e: any) {
        setState('error');
        setMessage(e.message || 'Verification failed.');
      }
    })();
  }, [token, verifyEmail]);

  const handleResend = async () => {
    try {
      await resendVerification(email);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (e: any) {
      setMessage(e.message || 'Could not resend email.');
    }
  };

  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-100 text-center">
        {children}
      </div>
    </div>
  );

  if (state === 'verifying') {
    return <Card>
      <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Verifying your email…</h2>
    </Card>;
  }

  if (state === 'verified') {
    return <Card>
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Email verified!</h2>
      <p className="text-slate-600 mb-6">Your account is now active. You can sign in.</p>
      <button
        onClick={() => navigate('/login')}
        className="w-full flex items-center justify-center py-3 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Continue to Login <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </Card>;
  }

  if (state === 'error') {
    return <Card>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification failed</h2>
      <p className="text-slate-600 mb-6">{message}</p>
      {email && (
        <button onClick={handleResend} className="w-full py-3 px-4 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50">
          {resent ? 'New link sent!' : 'Resend verification email'}
        </button>
      )}
      <div className="mt-4">
        <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500">Back to login</Link>
      </div>
    </Card>;
  }

  // 'pending' — user just registered, waiting to click the emailed link
  return <Card>
    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <Mail className="w-8 h-8 text-indigo-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify your email</h2>
    <p className="text-slate-600 mb-6">
      We've sent a verification link{email ? <> to <strong>{email}</strong></> : ''}.
      Click the link in that email to activate your account, then sign in.
    </p>
    <div className="space-y-4">
      {email && (
        <button onClick={handleResend} disabled={resent}
          className="w-full py-3 px-4 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50 disabled:opacity-70">
          {resent ? 'Email Sent!' : 'Resend Verification Email'}
        </button>
      )}
      <Link to="/login" className="block w-full py-3 px-4 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
        I've verified — Sign in
      </Link>
    </div>
    {message && <p className="text-xs text-red-500 mt-4">{message}</p>}
    <p className="text-xs text-slate-400 mt-6">Can't find the email? Check your spam folder.</p>
  </Card>;
};
