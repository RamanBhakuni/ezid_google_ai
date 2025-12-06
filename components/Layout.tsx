

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Search, QrCode, Shield } from 'lucide-react';
import { useAuth } from '../services/authContext';
import { UserRole } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isEmailVerified } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Helper to check roles safely
  const hasRole = (role: UserRole) => user?.roles?.includes(role) || user?.role === role;

  const isBusiness = hasRole(UserRole.BUSINESS);
  const isIndividual = hasRole(UserRole.INDIVIDUAL);
  const isAdmin = hasRole(UserRole.ADMIN);
  
  const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Sticky Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">EZID</span>
              </Link>
              
              {/* Desktop Nav */}
              <nav className="hidden md:ml-8 md:flex md:space-x-4">
                {user && isEmailVerified ? (
                  <>
                    {/* Admin Link */}
                    {isAdmin && (
                         <NavLink to="/admin" icon={Shield} label="Admin" />
                    )}

                    {/* Business Links */}
                    {(isBusiness || isAdmin) && (
                        <>
                            <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                            <NavLink to="/bulk-lookup" icon={Search} label="Bulk Lookup" />
                        </>
                    )}
                    
                    {/* Individual Links */}
                    {(isIndividual || isAdmin) && (
                        <NavLink to="/my-id" icon={QrCode} label="My ID" />
                    )}
                  </>
                ) : (
                   <>
                    {/* Public or Unverified Links */}
                    {!user && (
                        <>
                        <Link to="/how-it-works" className="text-slate-500 hover:text-slate-900 px-3 py-2 text-sm font-medium">How it Works</Link>
                        <Link to="/#pricing" className="text-slate-500 hover:text-slate-900 px-3 py-2 text-sm font-medium">Pricing</Link>
                        </>
                    )}
                   </>
                )}
              </nav>
            </div>

            <div className="flex items-center">
              {user ? (
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium leading-none">{user.name}</span>
                        {/* Show Short ID or Role badge */}
                        {isEmailVerified ? (
                            <>
                            {hasRole(UserRole.INDIVIDUAL) && user.shortId && (
                                <span className="text-xs text-indigo-600 font-mono mt-0.5">@{user.shortId}</span>
                            )}
                            {hasRole(UserRole.BUSINESS) && !user.shortId && (
                                <span className="text-[10px] uppercase font-bold text-orange-600 mt-0.5">Business</span>
                            )}
                            {hasRole(UserRole.ADMIN) && (
                                <span className="text-[10px] uppercase font-bold text-red-600 mt-0.5">Admin</span>
                            )}
                            </>
                        ) : (
                             <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Unverified</span>
                        )}
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                   <Link to="/login" className="text-slate-600 hover:text-indigo-600 font-medium text-sm">Log in</Link>
                   <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm hover:shadow">
                     Get Started
                   </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <div className="flex items-center md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="pt-2 pb-3 space-y-1 px-4">
               {user ? (
                  <>
                     {isEmailVerified && (
                         <>
                            {isAdmin && (
                                <NavLink to="/admin" icon={Shield} label="Admin" />
                            )}
                            {(isBusiness || isAdmin) && (
                                <>
                                    <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                                    <NavLink to="/bulk-lookup" icon={Search} label="Bulk Lookup" />
                                </>
                            )}
                            {(isIndividual || isAdmin) && (
                                <NavLink to="/my-id" icon={QrCode} label="My ID" />
                            )}
                         </>
                     )}

                     <div className="border-t border-slate-100 mt-2 pt-2">
                        <div className="flex items-center px-4 py-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold mr-3">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-slate-800">{user.name}</div>
                                {isEmailVerified ? (
                                    <>
                                    {isIndividual && user.shortId ? (
                                        <div className="text-xs font-mono text-indigo-600">@{user.shortId}</div>
                                    ) : (
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    )}
                                    </>
                                ) : (
                                    <div className="text-xs text-orange-500 font-bold">Unverified</div>
                                )}
                            </div>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="w-full text-left flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign out
                        </button>
                     </div>
                  </>
                ) : (
                   <>
                    <Link to="/how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">How It Works</Link>
                    <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50">Log in</Link>
                    <Link to="/register" className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100">Create Account</Link>
                   </>
                )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center text-slate-500 font-bold text-xs">E</div>
                    <p className="text-slate-500 text-sm">© 2024 EZID India. All rights reserved.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                    <Link to="/how-it-works" className="text-slate-400 hover:text-indigo-600 text-sm">How it Works</Link>
                    <Link to="/privacy" className="text-slate-400 hover:text-indigo-600 text-sm">Privacy</Link>
                    <Link to="/terms" className="text-slate-400 hover:text-indigo-600 text-sm">Terms</Link>
                    <Link to="/refund-policy" className="text-slate-400 hover:text-indigo-600 text-sm">Refund Policy</Link>
                    <Link to="/contact" className="text-slate-400 hover:text-indigo-600 text-sm">Contact Us</Link>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};