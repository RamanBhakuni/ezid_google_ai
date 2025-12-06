import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '../constants';
import { useAuth } from '../services/authContext';
import { handleSubscription } from '../services/payment';
import { CheckCircle2, Zap } from 'lucide-react';

export const PricingPage: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const handlePlanClick = (plan: any) => {
    // 1. If not logged in, redirect to register
    if (!user) {
        navigate('/register?type=business'); 
        return;
    }

    // 2. If free plan, just go to dashboard
    if (plan.price === "₹0") {
        navigate('/dashboard');
        return;
    }

    // 3. Trigger Razorpay
    handleSubscription(user, plan.name, plan.price, async (newPlanCode) => {
        await refreshUserProfile();
        navigate('/dashboard');
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Buy Lookup Credits</h2>
          <p className="mt-4 text-lg text-slate-500">Purchase a prepaid pack. Credits are valid for 30 days.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan, idx) => {
            const isFree = idx === 0;
            return (
                <div key={idx} className={`bg-white border rounded-2xl p-8 flex flex-col transition-all shadow-sm hover:border-indigo-300 hover:shadow-lg ${idx === 2 ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-200'}`}>
                    {!isFree && (
                        <div className="flex items-center gap-2 mb-4 bg-blue-50 text-blue-700 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            <Zap className="w-3 h-3" /> One-Time Purchase
                        </div>
                    )}
                    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline text-slate-900">
                        <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                        {!isFree && <span className="ml-2 text-slate-500 font-medium text-sm">/ 30 days pass</span>}
                    </div>
                    <ul className="mt-6 space-y-4 flex-1">
                    {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex">
                        <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-green-500" />
                        <span className="ml-3 text-slate-500">{feature}</span>
                        </li>
                    ))}
                    </ul>
                    <button 
                    onClick={() => handlePlanClick(plan)}
                    disabled={isFree && user?.plan === 'FREE'}
                    className={`mt-8 w-full block rounded-lg py-3 px-6 text-center font-medium transition-colors ${
                        isFree 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : idx === 2 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                    >
                    {isFree ? "Default" : "Buy Pack"}
                    </button>
                </div>
            );
          })}
        </div>
        
        <p className="text-center text-slate-400 text-sm mt-12">
            Note: Purchasing a new pack adds credits to your balance and extends the validity of all credits by 30 days from purchase.
        </p>
      </div>
    </div>
  );
};