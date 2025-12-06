import React from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, QrCode, Search, Lock, CheckCircle } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="bg-indigo-700 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            How EZID Works
          </h1>
          <p className="mt-4 text-xl text-indigo-100 max-w-2xl mx-auto">
            A secure bridge between offline forms and digital data.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        
        {/* For Individuals */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
              For Individuals
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">Get your Digital Identity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              icon={User}
              step="01"
              title="Create Account"
              desc="Sign up with your primary email address. Verify your email to prove ownership."
            />
            <StepCard 
              icon={QrCode}
              step="02"
              title="Claim Short ID"
              desc="Choose a unique handle like 'ezid.in/rahul23'. We generate a unique QR code for you."
            />
            <StepCard 
              icon={Lock}
              step="03"
              title="Share Securely"
              desc="Write your Short ID on forms at events or shops. Your real email remains hidden from the public eye."
            />
          </div>
          
          <div className="mt-8 text-center">
            <Link to="/register" className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800">
              Create your ID <span aria-hidden="true" className="ml-2">&rarr;</span>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-20">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-300" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-slate-50 text-lg font-medium text-slate-500">
              The Lookup Process
            </span>
          </div>
        </div>

        {/* For Businesses */}
        <div>
          <div className="text-center mb-12">
            <span className="bg-orange-100 text-orange-800 text-sm font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
              For Businesses
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">Collect Accurate Data</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              icon={Building2}
              step="01"
              title="Business Verification"
              desc="Create an organization account. Access is restricted to registered businesses to prevent spam."
            />
            <StepCard 
              icon={Search}
              step="02"
              title="Lookup or Scan"
              desc="Enter Short IDs manually, upload a CSV file from your event team, or use our API."
            />
            <StepCard 
              icon={CheckCircle}
              step="03"
              title="Get Verified Emails"
              desc="Our system decodes the ID and returns the verified email address directly to your dashboard."
            />
          </div>

           <div className="mt-8 text-center">
            <Link to="/register?type=business" className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800">
              Start Business Account <span aria-hidden="true" className="ml-2">&rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

const StepCard: React.FC<{ icon: any, step: string, title: string, desc: string }> = ({ icon: Icon, step, title, desc }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 relative overflow-hidden group hover:shadow-md transition-all">
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl font-black text-slate-200 group-hover:text-indigo-50 transition-colors">
      {step}
    </div>
    <div className="relative z-10">
      <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-6">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">
        {desc}
      </p>
    </div>
  </div>
);