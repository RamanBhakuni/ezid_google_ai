import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/authContext';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, ArrowUpRight, Search, FileDown, Crown, Key, Copy, Check, QrCode, Clock, Coins, Lock, Terminal, FileCode, Server } from 'lucide-react';
import { getBusinessStats, addRoleToUser, generateAndSaveApiKey } from '../services/db';
import { LookupLog, UserRole } from '../types';
import { PLAN_LIMITS } from '../constants';

export const BusinessDashboard: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [expiry, setExpiry] = useState<Date | null>(null);
  
  // Key state logic
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  
  // Modal States
  const [showPersonalIdModal, setShowPersonalIdModal] = useState(false);
  const [addingRole, setAddingRole] = useState(false);
  const [showApiDocs, setShowApiDocs] = useState(false);

  useEffect(() => {
    if (user?.id) {
        getBusinessStats(user.id).then(data => {
            setLogs(data.lookups);
            setBalance(data.balance);
            setExpiry(data.expiry || null);
        });
        // Sync API key from user profile
        if (user.apiKey) {
            setApiKey(user.apiKey);
        }
    }
  }, [user]);

  if (!user) return null;

  // Transform logs for chart
  const chartData = logs.reduce((acc: any[], log) => {
    const day = log.timestamp.toLocaleDateString('en-US', { weekday: 'short' });
    const existing = acc.find(i => i.name === day);
    if (existing) {
        existing.lookups++;
    } else {
        acc.push({ name: day, lookups: 1 });
    }
    return acc;
  }, []);

  const getPlanLabel = (plan?: string) => {
      if (!plan || plan === 'FREE') return 'Free Tier';
      if (plan === 'EDU_BASIC') return 'Edu Pack';
      if (plan === 'BUSINESS_PRO') return 'Business Pro';
      return plan;
  };

  const isLowBalance = balance < 5;
  const isExpired = expiry && new Date() > expiry;
  
  // API Access Rule: Only Business Pro, Pro, or Enterprise
  const isApiAllowed = ['BUSINESS_PRO', 'PRO', 'ENTERPRISE'].includes(user.plan || '');

  const handleGenerateKey = async () => {
      setLoadingKey(true);
      try {
          const newKey = await generateAndSaveApiKey(user.id);
          setApiKey(newKey);
          await refreshUserProfile();
      } catch (e) {
          console.error("Failed to generate key", e);
      }
      setLoadingKey(false);
  };

  const copyApiKey = () => {
      if (apiKey) {
          navigator.clipboard.writeText(apiKey);
          setCopiedKey(true);
          setTimeout(() => setCopiedKey(false), 2000);
      }
  };

  const processClaimPersonalId = async () => {
      setAddingRole(true);
      try {
          await addRoleToUser(user.id, UserRole.INDIVIDUAL);
          await refreshUserProfile();
          navigate('/my-id');
      } catch (e) {
          console.error("Failed to add personal ID capability.", e);
      }
      setAddingRole(false);
      setShowPersonalIdModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      
      {/* PERSONAL ID MODAL */}
      {showPersonalIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                    <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Claim Personal Short ID?</h3>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    This will enable the <strong>Individual Features</strong> for your account, allowing you to create and share your own digital alias.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowPersonalIdModal(false)}
                        className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={processClaimPersonalId}
                        disabled={addingRole}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center"
                    >
                        {addingRole ? 'Adding...' : 'Yes, Activate'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* API DOCS MODAL */}
      {showApiDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl animate-fade-in my-8">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                            <Terminal className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">API Documentation</h3>
                            <p className="text-xs text-slate-500">Integrate EZID lookups into your CRM or App</p>
                        </div>
                    </div>
                    <button onClick={() => setShowApiDocs(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3">
                        <Server className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <strong>Endpoint URL:</strong> <code className="bg-blue-100 px-1 rounded">https://api.ezid.in/v1/lookup</code>
                            <br/>
                            <span className="text-xs opacity-75 mt-1 block">Note: This is a simulated endpoint for documentation. In a production deployment, this would be your Firebase Cloud Function URL.</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Key className="w-4 h-4 text-indigo-500" /> Authentication
                        </h4>
                        <p className="text-sm text-slate-600 mb-2">Include your API Key in the request header.</p>
                        <div className="bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-sm overflow-x-auto">
                            x-api-key: {apiKey || 'YOUR_API_KEY'}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-green-500" /> cURL Example
                        </h4>
                        <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">
<pre>{`curl -X POST https://api.ezid.in/v1/lookup \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{"shortId": "rahul23"}'`}</pre>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-yellow-500" /> Python Example
                        </h4>
                        <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm overflow-x-auto">
<pre>{`import requests

url = "https://api.ezid.in/v1/lookup"
payload = {"shortId": "rahul23"}
headers = {
    "x-api-key": "${apiKey || 'YOUR_API_KEY'}",
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`}</pre>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-slate-900 mb-2">Success Response (200 OK)</h4>
                        <div className="bg-slate-100 text-slate-700 p-3 rounded-lg font-mono text-sm">
<pre>{`{
  "status": "success",
  "data": {
    "shortId": "rahul23",
    "email": "rahul.official@gmail.com",
    "status": "FOUND"
  },
  "credits_remaining": 499
}`}</pre>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end rounded-b-2xl">
                    <button onClick={() => setShowApiDocs(false)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Close Docs</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Organization Dashboard
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.plan === 'BUSINESS_PRO' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                  {getPlanLabel(user.plan)}
              </span>
          </h1>
          <p className="text-slate-500">Welcome back, {user.organizationName}</p>
        </div>
        <div className="flex gap-3">
             <Link to="/pricing" className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 font-medium">
                <Crown className="w-4 h-4 text-orange-500" />
                Buy Credits
             </Link>
            <Link to="/bulk-lookup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm">
                <Search className="w-4 h-4" />
                New Lookup
            </Link>
        </div>
      </div>

      {(isLowBalance || isExpired) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg text-red-600">
                  <Coins className="w-5 h-5" />
              </div>
              <div className="flex-1">
                  <h3 className="text-red-900 font-bold text-sm">
                      {isExpired ? 'Plan Expired' : 'Low Credit Balance'}
                  </h3>
                  <p className="text-red-700 text-sm mt-1">
                      {isExpired 
                        ? "Your previous pack validity has expired. Please purchase a new pack to continue." 
                        : "You are running low on lookup credits. Purchase a pack to avoid interruption."}
                  </p>
              </div>
              <Link to="/pricing" className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 whitespace-nowrap">
                  Top Up Now
              </Link>
          </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Credits Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500">Credits Remaining</p>
                 <h3 className={`text-3xl font-bold mt-2 ${isLowBalance ? 'text-orange-600' : 'text-slate-900'}`}>
                     {balance}
                 </h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                 <Coins className="w-5 h-5 text-blue-600" />
              </div>
           </div>
           <p className="text-xs text-slate-400 mt-4">
               Each lookup costs 1 credit
           </p>
        </div>

        {/* Expiry Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex justify-between items-start">
              <div>
                 <p className="text-sm font-medium text-slate-500">Plan Validity</p>
                 <h3 className="text-xl font-bold text-slate-900 mt-2">
                     {expiry ? expiry.toLocaleDateString() : 'Lifetime (Free)'}
                 </h3>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                 <Clock className="w-5 h-5 text-green-600" />
              </div>
           </div>
           <p className="text-xs text-slate-400 mt-4">
               {expiry ? (isExpired ? 'Expired' : 'Days remaining') : 'Auto-renews monthly'}
           </p>
        </div>

        {/* API Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-center">
            {isApiAllowed ? (
                !apiKey ? (
                    <>
                        <div className="flex items-center gap-2 mb-2">
                             <Key className="w-5 h-5 text-indigo-600" />
                             <h3 className="font-semibold text-slate-900">API Access</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Integrate EZID directly into your CRM.</p>
                        <button 
                            onClick={handleGenerateKey}
                            disabled={loadingKey}
                            className="text-indigo-600 text-sm font-medium hover:text-indigo-800 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 w-full"
                        >
                            {loadingKey ? 'Generating...' : 'Generate API Key'}
                        </button>
                    </>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-400 uppercase">Your API Secret</p>
                            <button onClick={() => setShowApiDocs(true)} className="text-xs text-indigo-600 font-bold hover:underline flex items-center">
                                <FileCode className="w-3 h-3 mr-1" /> Docs
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-slate-700 truncate flex-1 block">
                                {apiKey}
                            </code>
                            <button onClick={copyApiKey} className="p-1.5 hover:bg-slate-100 rounded text-slate-500">
                                {copiedKey ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleGenerateKey} className="text-[10px] text-slate-400 hover:text-red-500 underline">
                                Roll Key
                            </button>
                        </div>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">API Access Locked</h3>
                    <p className="text-xs text-slate-500 mb-4">Upgrade to Business Pro to generate API keys.</p>
                    <Link 
                        to="/pricing"
                        className="text-indigo-600 text-xs font-bold hover:underline"
                    >
                        Upgrade to Pro &rarr;
                    </Link>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Lookup Activity</h3>
            <div className="h-80 w-full">
            {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorLookups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="lookups" stroke="#4f46e5" fillOpacity={1} fill="url(#colorLookups)" strokeWidth={3} />
                </AreaChart>
            </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Search className="w-10 h-10 mb-2 opacity-20" />
                    <p>No activity data yet</p>
                    <Link to="/bulk-lookup" className="text-indigo-600 text-sm hover:underline mt-2">Start your first lookup</Link>
                </div>
            )}
            </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
             {!user.roles.includes(UserRole.INDIVIDUAL) && (
                <div className="bg-indigo-900 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white/10 p-2 rounded-lg">
                                <QrCode className="w-5 h-5 text-indigo-300" />
                            </div>
                            <h3 className="font-bold text-sm">Want your own ID?</h3>
                        </div>
                        <p className="text-xs text-indigo-200 mb-4 leading-relaxed">
                            Create a personal Short ID (e.g. ezid.in/acme.admin) to share your contact safely.
                        </p>
                        <button 
                            onClick={() => setShowPersonalIdModal(true)}
                            className="w-full py-2 bg-white text-indigo-900 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors"
                        >
                            Claim Personal ID
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-indigo-800 rounded-full opacity-50"></div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900 text-sm">Recent Lookups</h3>
                </div>
                <div className="divide-y divide-slate-200 max-h-[400px] overflow-y-auto">
                    {logs.length > 0 ? logs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-4 flex justify-between items-center">
                        <div>
                            <div className="text-sm font-mono text-indigo-600 font-bold">{log.shortId}</div>
                            <div className="text-xs text-slate-500">{log.foundEmail || 'Not Found'}</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.status === 'FOUND' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {log.status === 'FOUND' ? 'Success' : 'Failed'}
                        </span>
                    </div>
                    )) : (
                        <div className="p-6 text-center text-sm text-slate-500">No recent activity</div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};