
import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/authContext';
import { Copy, Download, Share2, Mail, Shield, Sparkles, PlusCircle, Check, X, AlertCircle, Coins, Eye, Briefcase, Building2 } from 'lucide-react';
import { DOMAIN_PREFIX } from '../constants';
import { claimCustomShortId, generateAiSuggestions, addRoleToUser } from '../services/db';
import { handleOneTimePayment } from '../services/payment';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

export const UserDashboard: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0); // Index of selected ID
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [customIdInput, setCustomIdInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Modal States
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (user && showClaimForm) {
        setAiSuggestions(generateAiSuggestions(user.name, user.email));
    }
  }, [user, showClaimForm]);

  if (!user) return null;

  const aliases = user.shortIds || [];
  const hasAlias = aliases.length > 0;
  const credits = user.aliasCredits || 0;
  
  const isFreeClaimAvailable = aliases.length === 0;
  const hasPendingCredit = credits > 0;
  const canClaim = isFreeClaimAvailable || hasPendingCredit;

  const handleUnlockForm = () => {
      if (canClaim) {
          setShowClaimForm(true);
      } else {
          handleOneTimePayment(
              user, 
              49, 
              "Additional EZID Alias", 
              async () => {
                  await refreshUserProfile();
                  setShowClaimForm(true);
                  setSuccessMsg("Payment successful! Credit added. Create your new ID below.");
              }
          );
      }
  };

  const handleClaim = async () => {
      setError(null);
      setSuccessMsg(null);
      setIsSubmitting(true);
      try {
          await claimCustomShortId(user.id, user.email, customIdInput);
          await refreshUserProfile(); 
          setIsSubmitting(false);
          setSuccessMsg("ID Claimed Successfully!");
          setTimeout(() => {
              setShowClaimForm(false);
              setCustomIdInput('');
          }, 1000);
      } catch (e: any) {
          setError(e.message || "Failed to claim ID");
          setIsSubmitting(false);
      }
  };

  const processBusinessUpgrade = async () => {
      setUpgrading(true);
      try {
          await addRoleToUser(user.id, UserRole.BUSINESS);
          await refreshUserProfile();
          navigate('/dashboard');
      } catch (e) {
          setError("Failed to upgrade account. Please try again.");
          console.error(e);
      }
      setUpgrading(false);
      setShowUpgradeModal(false);
  };

  useEffect(() => {
      if (aliases.length > 0) {
          setActiveTab(aliases.length - 1);
      }
  }, [aliases.length]);

  const handleCopy = (id: string) => {
    const url = `https://${DOMAIN_PREFIX}${id}`;
    navigator.clipboard.writeText(url);
    setSuccessMsg("Link copied to clipboard!");
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const handleDownloadQR = async (id: string) => {
    const url = `https://${DOMAIN_PREFIX}${id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
    try {
        const response = await fetch(qrUrl);
        const blob = await response.blob();
        const objUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objUrl;
        link.download = `ezid-${id}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        window.open(qrUrl, '_blank');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      
      {/* Confirmation Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                    <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Enable Business Features?</h3>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    This will activate the <strong>Business Dashboard</strong> for your account, allowing you to lookup other Short IDs and manage API keys.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowUpgradeModal(false)}
                        className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={processBusinessUpgrade}
                        disabled={upgrading}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors flex justify-center items-center"
                    >
                        {upgrading ? 'Activating...' : 'Yes, Enable'}
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-900">My Identity</h1>
            <p className="text-slate-500">Manage your digital aliases and privacy.</p>
        </div>
      </div>

      {successMsg && !showClaimForm && (
         <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center shadow-sm border border-green-100">
            <Check className="w-5 h-5 mr-2" /> {successMsg}
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: LIST OF IDs */}
        <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                    Your Aliases
                    {credits > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                            <Coins className="w-3 h-3 mr-1" /> {credits} Credit{credits > 1 ? 's' : ''}
                        </span>
                    )}
                </h3>
                
                {aliases.map((id, idx) => (
                    <button
                        key={id}
                        onClick={() => { setActiveTab(idx); setShowClaimForm(false); }}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                            activeTab === idx && !showClaimForm
                            ? 'bg-white border-indigo-600 ring-1 ring-indigo-600 shadow-md' 
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                activeTab === idx && !showClaimForm ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {id.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <span className={`block font-bold text-sm ${activeTab === idx && !showClaimForm ? 'text-indigo-900' : 'text-slate-700'}`}>
                                    {id}
                                </span>
                                <span className="text-xs text-slate-400">ezid.in/{id}</span>
                            </div>
                        </div>
                        {activeTab === idx && !showClaimForm && <Check className="w-5 h-5 text-indigo-600" />}
                    </button>
                ))}

                {!showClaimForm && (
                    <button
                        onClick={handleUnlockForm}
                        className="w-full py-3 px-4 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                        <PlusCircle className="w-5 h-5" />
                        <span className="font-medium text-sm">
                            {canClaim 
                            ? (hasPendingCredit ? "Redeem Alias Credit" : "Claim Free ID") 
                            : "Buy New Alias (₹49)"}
                        </span>
                    </button>
                )}
            </div>

            {/* CROSS SELL BUSINESS */}
            {!user.roles.includes(UserRole.BUSINESS) && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Briefcase className="w-5 h-5 text-orange-400" />
                        </div>
                        <h3 className="font-bold text-sm">Need to collect emails?</h3>
                    </div>
                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                        Enable Business features to lookup Short IDs and export data to CRM.
                    </p>
                    <button 
                        onClick={() => setShowUpgradeModal(true)}
                        className="w-full py-2 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-orange-50 transition-colors"
                    >
                        Enable Business Mode
                    </button>
                </div>
            )}
        </div>

        {/* RIGHT COLUMN: ACTIVE ID DETAILS or CLAIM FORM */}
        <div className="lg:col-span-2">
            
            {/* CLAIM FORM */}
            {showClaimForm ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Create New EZID</h2>
                        <button onClick={() => setShowClaimForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {successMsg && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4 flex items-center">
                            <Check className="w-4 h-4 mr-2" /> {successMsg}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" /> {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Choose your custom ID</label>
                            <div className="flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                                    ezid.in/
                                </span>
                                <input
                                    type="text"
                                    value={customIdInput}
                                    onChange={(e) => setCustomIdInput(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-slate-300"
                                    placeholder="yourname"
                                />
                            </div>
                            <p className="mt-1 text-xs text-slate-400">Min 5 chars. Letters, numbers, dots only.</p>
                        </div>

                        {/* AI Suggestions */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-medium text-slate-700">AI Suggestions</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {aiSuggestions.map(sugg => (
                                    <button
                                        key={sugg}
                                        onClick={() => setCustomIdInput(sugg)}
                                        className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-100 hover:bg-purple-100 hover:border-purple-200 transition-colors"
                                    >
                                        {sugg}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleClaim}
                            disabled={isSubmitting || customIdInput.length < 5}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Checking & Claiming...' : 'Claim This ID'}
                        </button>
                    </div>
                </div>
            ) : hasAlias ? (
                // ACTIVE ID CARD VIEW
                <div className="space-y-6">
                    {/* COMPACT DIGITAL CARD */}
                     <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Card Header */}
                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Identity</span>
                            </div>
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Shield className="w-4 h-4" />
                                <span className="text-xs font-semibold">Verified</span>
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                             {/* Text Info */}
                             <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                                    {aliases[activeTab]}
                                </h2>
                                <p className="text-slate-400 text-sm mb-6 font-mono">
                                    {DOMAIN_PREFIX}{aliases[activeTab]}
                                </p>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase font-bold mb-1">Linked Email</p>
                                        <div className="flex items-center justify-center md:justify-start gap-2 text-slate-700 bg-slate-50 py-1.5 px-3 rounded-lg inline-flex">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium text-sm">
                                                {user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* REVEALS COUNTER */}
                                    <div className="pt-2">
                                         <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500">
                                            <Eye className="w-4 h-4 text-purple-500" />
                                            <span className="text-sm">
                                                Revealed <strong className="text-slate-900">{user.totalLookups || 0} times</strong> by businesses
                                            </span>
                                        </div>
                                    </div>
                                </div>
                             </div>

                             {/* QR Section */}
                             <div className="flex-shrink-0">
                                 <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://${DOMAIN_PREFIX}${aliases[activeTab]}`} 
                                        alt="QR Code" 
                                        className="w-32 h-32 md:w-36 md:h-36 rounded-lg"
                                    />
                                 </div>
                             </div>
                        </div>

                        {/* Card Footer / Actions */}
                        <div className="bg-slate-50 border-t border-slate-100 p-4 grid grid-cols-3 gap-4">
                            <button 
                                onClick={() => handleCopy(aliases[activeTab])} 
                                className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600 hover:text-indigo-600"
                            >
                                <Copy className="w-5 h-5" />
                                <span className="text-xs font-medium">Copy Link</span>
                            </button>
                            <button 
                                onClick={() => handleDownloadQR(aliases[activeTab])} 
                                className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600 hover:text-indigo-600"
                            >
                                <Download className="w-5 h-5" />
                                <span className="text-xs font-medium">Save QR</span>
                            </button>
                             <button 
                                onClick={() => {
                                    const url = `https://${DOMAIN_PREFIX}${aliases[activeTab]}`;
                                    if (navigator.share) {
                                        navigator.share({ title: 'My EZID', url });
                                    } else {
                                        handleCopy(aliases[activeTab]);
                                    }
                                }}
                                className="flex flex-col items-center justify-center gap-1 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all text-slate-600 hover:text-indigo-600"
                            >
                                <Share2 className="w-5 h-5" />
                                <span className="text-xs font-medium">Share</span>
                            </button>
                        </div>
                     </div>
                </div>
            ) : (
                // EMPTY STATE
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-200 min-h-[400px]">
                    <Sparkles className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Identity Claimed</h3>
                    <p className="text-slate-500 mb-6">Create your first digital alias to get started.</p>
                    <button onClick={handleUnlockForm} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                        Claim Free ID
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
