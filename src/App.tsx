import React, { useState, useEffect } from 'react';
import { School, ShieldAlert, BookOpen, Users, Key, Sparkles } from 'lucide-react';
import { User } from './types';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ParentDashboard from './components/ParentDashboard';
import { db } from './database';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from './assets/logo';
import royalPathLogo from './assets/images/royalpath_logo.svg';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('settings_school_name') || 'RoyalPath College');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('settings_color_theme') || 'indigo');
  const [schoolLogo, setSchoolLogo] = useState(() => localStorage.getItem('settings_school_logo') || ROYALPATH_LOGO_DATA_URL);

  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setTimeout(() => {
          if (customEvent.detail.name) setSchoolName(customEvent.detail.name);
          if (customEvent.detail.theme) setColorTheme(customEvent.detail.theme);
          setSchoolLogo(customEvent.detail.logo || '');
        }, 0);
      }
    };
    const handleDbUpdate = () => {
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 0);
    };
    window.addEventListener('school_settings_changed', handleSettingsChange);
    window.addEventListener('database_updated', handleDbUpdate);
    window.addEventListener('database_sync_error', handleDbUpdate);
    return () => {
      window.removeEventListener('school_settings_changed', handleSettingsChange);
      window.removeEventListener('database_updated', handleDbUpdate);
      window.removeEventListener('database_sync_error', handleDbUpdate);
    };
  }, []);

  // Load active user session from localStorage, if any exists
  useEffect(() => {
    const rawUser = localStorage.getItem('school_portal_user_session');
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        // double check user is still valid in db simulator
        const validUser = db.getRawData().users.find(dbu => dbu.email === u.email);
        if (validUser) {
          setCurrentUser(prev => {
            if (prev && prev.id === validUser.id && prev.avatarUrl === validUser.avatarUrl && prev.fullName === validUser.fullName && prev.role === validUser.role) {
              return prev;
            }
            return validUser;
          });
        }
      } catch (err) {
        localStorage.removeItem('school_portal_user_session');
      }
    }
  }, [refreshKey]);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('school_portal_user_session', JSON.stringify(user));
    setCurrentUser(user);
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = () => {
    localStorage.removeItem('school_portal_user_session');
    setCurrentUser(null);
  };

  const forceAppRefresh = () => {
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      const rawUser = localStorage.getItem('school_portal_user_session');
      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          const validUser = db.getRawData().users.find(dbu => dbu.email === u.email);
          if (!validUser) {
            setCurrentUser(null);
          } else {
            setCurrentUser(validUser);
          }
        } catch (e) {
          setCurrentUser(null);
        }
      }
    }, 0);
  };

  const renderDashboardByRole = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'admin':
        return (
          <AdminDashboard 
            currentUser={currentUser}
            adminId={currentUser.id}
            adminName={currentUser.fullName}
            onLogout={handleLogout}
            onRefreshUserSession={forceAppRefresh}
          />
        );
      case 'teacher':
        return (
          <TeacherDashboard 
            currentUser={currentUser}
            teacherUserId={currentUser.id} 
            teacherName={currentUser.fullName}
            onLogout={handleLogout}
            onRefreshUserSession={forceAppRefresh}
          />
        );
      case 'parent':
        return (
          <ParentDashboard 
            currentUser={currentUser}
            parentId={currentUser.id} 
            parentName={currentUser.fullName}
            onLogout={handleLogout}
            onRefreshUserSession={forceAppRefresh}
          />
        );
      default:
        return (
          <div className="p-8 text-center text-slate-500 font-sans">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-850">Role Error</h3>
            <p className="text-sm">Assigned user role is unrecognized. Reset the database model or re-authenticate.</p>
            <button 
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm"
            >
              Sign Out
            </button>
          </div>
        );
    }
  };

  // Render Page Content
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* Dynamic Main Body */}
      <div className="flex-1">
        
        {currentUser ? (
          <div className="space-y-6">
            
            {/* Top Status Mini-Bar */}
            <div className="bg-slate-900 text-slate-200 text-[11px] font-medium px-4 md:px-8 py-3.5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <SchoolLogo src={schoolLogo} className="w-full h-full object-contain" />
                </div>
                <span className="font-extrabold tracking-wider uppercase font-sans text-xs sm:text-sm text-white">{schoolName} Academic Portal</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                    currentUser.role === 'admin' ? 'bg-emerald-500 animate-pulse' :
                    currentUser.role === 'teacher' ? 'bg-blue-500 animate-pulse' :
                    'bg-amber-500 animate-pulse'
                  }`} />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{currentUser.role} Session</span>
                </div>
                <div className="hidden md:flex items-center gap-1 text-slate-400">
                  <Key className="w-3 h-3 text-slate-500" />
                  <span className="font-mono text-[10px] truncate max-w-[150px]" title={currentUser.email}>
                    {currentUser.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Render core platform */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-2">
              {renderDashboardByRole()}
            </div>

          </div>
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}

      </div>

      {/* Footer Banner */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-sans tracking-wide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 border border-slate-200">
              <SchoolLogo src={schoolLogo} className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-slate-800 text-sm">{schoolName}</span>
            <span className="text-slate-300">•</span>
            <span>Est. 2026 Admin Management</span>
          </div>
          <div>
            <p className="font-mono text-[10px] text-slate-400">
              Vite Cloud SQL Synced • Europe-West2 Enterprise Database
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
