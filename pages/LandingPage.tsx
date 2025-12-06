import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, QrCode, Search, ShieldCheck, ArrowRight, Store, GraduationCap, Users, Briefcase, Bot } from 'lucide-react';
import { PLANS } from '../constants';
import { useAuth } from '../services/authContext';
import { handleSubscription } from '../services/payment';

export const LandingPage: React.FC = () => {
  const { user, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');

  const handlePlanClick = (plan: any) => {
    // 1. If not logged in, redirect to register
    if (!user) {
        navigate('/register?type=business'); // Defaulting to business intent for paid plans
        return;
    }

    // 2. If free plan, just go to dashboard
    if (plan.price === "₹0") {
        navigate(user.role === 'BUSINESS' ? '/dashboard' : '/my-id');
        return;
    }

    // 3. Trigger Razorpay
    handleSubscription(user, plan.name, plan.price, async (newPlanCode) => {
        // Update user profile seamlessly without reloading
        await refreshUserProfile();
        navigate(user.role === 'BUSINESS' ? '/dashboard' : '/my-id');
    });
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl mb-6">
              <span className="block">Stop writing long emails.</span>
              <span className="block text-indigo-600">Start using EZID.</span>
            </h1>
            <p className="mt-4 max-w-md mx-auto text-base text-slate-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              The perfect solution for <strong>Sharing</strong> and <strong>Collecting</strong> contact details. 
              Replace complex emails with a simple code like 
              <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded mx-1 font-bold">ezid.in/rahul23</span>.
              Eliminate handwriting errors, speed up queues, and keep data secure.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link to="/register" className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg shadow-lg shadow-indigo-200">
                Get your Free ID
              </Link>
              <Link to="/register?type=business" className="px-8 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 md:py-4 md:text-lg">
                Business Lookup
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background Blob */}
        <div className="absolute top-0 transform -translate-x-1/2 left-1/2 w-full h-full z-0 opacity-30 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-indigo-100 fill-current">
            <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="white" />
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">How it works</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Simple, Secure, Scalable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Create Short ID</h3>
              <p className="text-slate-500 leading-relaxed">
                Sign up and claim your unique handle like <strong>ezid.in/acme</strong>. Get a personal QR code instantly.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Share Securely</h3>
              <p className="text-slate-500 leading-relaxed">
                Write your Short ID on forms or show your QR. Your real email stays private until authorized lookup.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Business Lookup</h3>
              <p className="text-slate-500 leading-relaxed">
                Businesses can look up individual IDs or upload CSVs to get verified emails instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900">Who uses EZID?</h2>
            <p className="mt-4 text-lg text-slate-500">Tailored solutions for every interaction.</p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="bg-slate-100 p-1 rounded-lg flex">
              <button
                onClick={() => setActiveTab('INDIVIDUAL')}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'INDIVIDUAL' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                For Individuals
              </button>
              <button
                onClick={() => setActiveTab('BUSINESS')}
                className={`px-6 py-2.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'BUSINESS' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                For Businesses
              </button>
            </div>
          </div>

          {activeTab === 'INDIVIDUAL' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center animate-fade-in">
              <div className="order-2 md:order-1 space-y-8">
                <div className="flex gap-4">
                   <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <Users className="w-5 h-5" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Networking & Trade Fairs</h3>
                      <p className="mt-2 text-slate-500">
                        Ran out of business cards? Just tell people "ezid.in/john". They can look you up later, and you don't have to spell out your email 5 times.
                      </p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                        <Briefcase className="w-5 h-5" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Job Applications & Forms</h3>
                      <p className="mt-2 text-slate-500">
                        Filling out handwritten forms at banks or interviews? Write your Short ID to ensure they can actually read your contact details.
                      </p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Privacy Control</h3>
                      <p className="mt-2 text-slate-500">
                        Don't want to expose your email publicly? Share your EZID. Only verified businesses with an account can see your real email.
                      </p>
                   </div>
                </div>
                {/* New Use Case: Anti-Spam */}
                <div className="flex gap-4">
                   <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                        <Bot className="w-5 h-5" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Website Anti-Spam</h3>
                      <p className="mt-2 text-slate-500">
                        Stop bots from scraping your email off your website contact page. Embed your EZID QR code instead. Real people can contact you; scrapers get blocked.
                      </p>
                   </div>
                </div>
              </div>
              <div className="order-1 md:order-2 bg-slate-50 rounded-2xl p-8 border border-slate-100">
                 <img 
                   src="https://images.unsplash.com/photo-1557425955-df376b5903c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                   alt="Networking event" 
                   className="rounded-lg shadow-md mb-6 w-full object-cover h-64"
                 />
                 <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">Your ID</p>
                        <p className="text-lg font-mono font-bold text-indigo-600">ezid.in/priya22</p>
                    </div>
                    <QrCode className="w-8 h-8 text-slate-800" />
                 </div>
              </div>
            </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center animate-fade-in">
              <div className="order-2 md:order-1 space-y-8">
                <div className="flex gap-4">
                   <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Store className="w-5 h-5" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Retail & POS Checkout</h3>
                      <p className="mt-2 text-slate-500">
                        Asking customers for emails at checkout slows down lines. Ask for their EZID instead. It's faster to type and 100% accurate.
                      </p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Schools & Colleges</h3>
                      <p className="mt-2 text-slate-500">
                        Collecting parent emails on paper forms usually results in 20% bounce rates due to bad handwriting. EZID eliminates this problem.
                      </p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <Users className="w-5 h-5" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Event Lead Generation</h3>
                      <p className="mt-2 text-slate-500">
                        Simply collect a list of Short IDs (scanned or written). Upload the CSV to EZID later and get a clean Excel sheet of verified emails.
                      </p>
                   </div>
                </div>
              </div>
              <div className="order-1 md:order-2 bg-slate-50 rounded-2xl p-8 border border-slate-100">
                 <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">BULK IMPORT TOOL</span>
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-sm p-2 bg-green-50 rounded text-green-700">
                            <span className="font-mono">rahul23</span>
                            <span className="font-medium">rahul.kumar@gmail.com</span>
                        </div>
                         <div className="flex items-center justify-between text-sm p-2 bg-green-50 rounded text-green-700">
                            <span className="font-mono">priya_art</span>
                            <span className="font-medium">priya.design@outlook.com</span>
                        </div>
                         <div className="flex items-center justify-between text-sm p-2 bg-green-50 rounded text-green-700">
                            <span className="font-mono">acme001</span>
                            <span className="font-medium">contact@acmecorp.in</span>
                        </div>
                    </div>
                 </div>
                 <p className="mt-4 text-center text-sm text-slate-400">
                    *Example of Business Dashboard output
                 </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-slate-500">Free for individuals. Affordable for organizations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col hover:border-indigo-300 transition-all hover:shadow-lg">
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline text-slate-900">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
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
                  className={`mt-8 w-full block rounded-lg py-3 px-6 text-center font-medium transition-colors ${
                      idx === 2 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  {user && user.role === 'BUSINESS' && plan.price !== "₹0" ? "Buy Now" : plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};