import React, { useState } from 'react';
import { motion } from 'motion/react';
import { School, LogIn } from 'lucide-react';
import { User, UserRole } from '../types';
import { db } from '../database';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from '../assets/logo';
import royalPathLogo from '../assets/images/royalpath_logo.svg';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [schoolName] = useState(() => localStorage.getItem('settings_school_name') || 'RoyalPath College');
  const [schoolLogo] = useState(() => localStorage.getItem('settings_school_logo') || ROYALPATH_LOGO_DATA_URL);



  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }

    const foundUser = db.getRawData().users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!foundUser) {
      setError('No user found with this email. Please verify your email spelling or contact support.');
      return;
    }

    if (foundUser.password && !password.trim()) {
      setError('This account requires a password. Please enter your password below to log in.');
      return;
    }

    const user = db.signIn(email, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      if (foundUser.password) {
        setError('Incorrect password. Please try again.');
      } else {
        setError('No user found with this email.');
      }
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Left Side: Editorial Banner */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 md:p-12 h-full flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 mb-8 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                <SchoolLogo src={schoolLogo} className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-black tracking-wider uppercase text-white">{schoolName}</span>
            </div>
            <h1 className="text-3xl font-bold font-sans tracking-tight leading-none mb-4">
              Integrated School Portal
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed font-sans font-medium">
              A comprehensive platform supporting collaborative academics between Admins, Educators, and Families. Securely login to view your personalized dashboard.
            </p>
          </div>
          
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs text-indigo-300 font-mono">
              PORTAL SYSTEM
            </p>
            <p className="text-xs text-indigo-400 mt-1 leading-relaxed">
              Equipped with role-based access control and persistent cloud synchronization.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form & Presets */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Sign In to Your Dashboard
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              Enter your registered school email address to gain access.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 mb-8">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    placeholder="you@oakridge.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-sans font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter password (leave blank if not yet configured)"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-sans font-medium"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-sans font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                id="sign-in-btn"
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to School Portal</span>
                <LogIn className="w-4 h-4" />
              </button>
            </form>


            
          </div>
        </div>

      </div>
    </div>
  );
}
