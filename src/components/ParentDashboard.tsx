import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building, GraduationCap, Users, LogOut, Sparkles, BookOpen, Clock, MapPin,
  CheckCircle2, AlertCircle, Calendar, History, Award, BookOpenCheck, PieChart,
  LayoutDashboard, Laptop, Library, CalendarCheck, ChevronRight, Menu, X, ChevronDown, Lock, Settings,
  MessageSquare
} from 'lucide-react';
import { Student, Class, Grade, Attendance, DbState, Teacher, getStoredLetterGrade, getStoredLetterColor, computeWeightedScore, User } from '../types';
import { db } from '../database';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from '../assets/logo';
import royalPathLogo from '../assets/images/royalpath_logo.svg';

// Import our modular sub-views
import ParentAttendanceView from './ParentAttendanceView';
import ParentReportCardView from './ParentReportCardView';
import ParentCbtView from './ParentCbtView';
import ParentResourcesView from './ParentResourcesView';
import ParentMessagingView from './ParentMessagingView';
import ParentTimetableView from './ParentTimetableView';
import ProfileAvatarManager from './ProfileAvatarManager';

interface ParentProps {
  currentUser: User;
  parentId: string;
  parentName: string;
  onLogout: () => void;
  onRefreshUserSession: () => void;
}

export default function ParentDashboard({ currentUser, parentId, parentName, onLogout, onRefreshUserSession }: ParentProps) {
  const [dbState, setDbState] = useState<DbState>(db.getRawData());

  useEffect(() => {
    const handleDatabaseUpdate = () => {
      setDbState(db.getRawData());
    };
    window.addEventListener('database_updated', handleDatabaseUpdate);
    return () => {
      window.removeEventListener('database_updated', handleDatabaseUpdate);
    };
  }, []);

  const [children, setChildren] = useState<Student[]>([]);
  const [selectedChild, setSelectedChild] = useState<Student | null>(null);
  
  const [schoolName] = useState(() => localStorage.getItem('settings_school_name') || 'RoyalPath College');
  const [schoolLogo] = useState(() => localStorage.getItem('settings_school_logo') || ROYALPATH_LOGO_DATA_URL);
  
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'report_card' | 'cbt' | 'resources' | 'settings' | 'messages' | 'timetable'>('dashboard');

  // Password Management States
  const [parentNewPassword, setParentNewPassword] = useState('');
  const [parentConfirmPassword, setParentConfirmPassword] = useState('');
  
  // Mobile sidebar menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load children list linked to this parent ID
  useEffect(() => {
    const parentChildren = db.getParentChildren(parentId);
    setChildren(parentChildren);
    if (parentChildren.length > 0) {
      if (!selectedChild || !parentChildren.some(c => c.id === selectedChild.id)) {
        setSelectedChild(parentChildren[0]);
      } else {
        const updated = parentChildren.find(c => c.id === selectedChild.id);
        if (updated) setSelectedChild(updated);
      }
    }
  }, [parentId, dbState]);

  // Synchronize state from database
  const refreshDbData = () => {
    setDbState(db.getRawData());
  };

  // Helper calculation: GPA/Grades mapping
  const getLetterGrade = (score: number): string => {
    return getStoredLetterGrade(score);
  };

  const getLetterColor = (letter: string): string => {
    return getStoredLetterColor(letter);
  };

  // Statistics calculations for the selected student
  const getStudentMetrics = (studentId: string) => {
    const enrollments = dbState.enrollments.filter(e => e.studentId === studentId);
    const classes = dbState.classes.filter(c => enrollments.some(e => e.classId === c.id));
    const grades = dbState.grades.filter(g => g.studentId === studentId);
    const attendance = dbState.attendance.filter(a => a.studentId === studentId);

    const getSubjectsForClass = (cls: Class): string[] => {
      try {
        const savedOverride = localStorage.getItem('class_subjects_override');
        if (savedOverride) {
          const overrides = JSON.parse(savedOverride);
          if (overrides && overrides[cls.id]) {
            return overrides[cls.id];
          }
        }
      } catch (e) {}

      const level = cls.levelOfEducation || 'Junior Secondary';
      if (level === 'Junior Secondary') {
        const saved = localStorage.getItem('settings_jss_subjects');
        return saved ? JSON.parse(saved) : [
          "Mathematics",
          "Basic Science and Technology",
          "Religious and National Value",
          "History",
          "Prevocational Studies",
          "Business Studies",
          "Literature",
          "Yoruba",
          "Cultural and Creative Arts",
          "French",
          "Music",
          "Christian Religious Knowledge",
          "Digital Technologies",
          "English language",
          "Diction"
        ];
      } else if (level === 'Senior Secondary') {
        const saved = localStorage.getItem('settings_sss_subjects');
        return saved ? JSON.parse(saved) : [
          "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Civic Education", "Geography", "Economics", "Literature in English"
        ];
      } else if (level === 'Primary') {
        return [
          "Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education", "Computer Studies", "Creative Arts"
        ];
      } else { // Nursery
        return [
          "Numeracy", "Literacy", "Sensory Activity", "Creative Art", "Social Habit", "Health Education", "Science Experience"
        ];
      }
    };

    const getSubjectGradeDetails = (stId: string, cls: Class, subjectName: string) => {
      const studentGrades = grades.filter(g => 
        g.studentId === stId &&
        g.classId === cls.id &&
        (g.subjectName === subjectName || g.assignmentName.toLowerCase().includes(subjectName.toLowerCase()))
      );
      const examGradeObj = studentGrades.find(g => g.category === 'exam');
      const ca1Obj = studentGrades.find(g => g.category === 'ca1');
      const ca2Obj = studentGrades.find(g => g.category === 'ca2');
      const caObj = studentGrades.find(g => g.category === 'ca');
      const midObj = studentGrades.find(g => g.category === 'mid_term');

      let ca1 = 0;
      let ca2 = 0;
      let mid_term = 0;
      let exam = 0;

      if (ca1Obj !== undefined) {
        ca1 = Math.min(10, ca1Obj.score);
      } else if (caObj !== undefined) {
        ca1 = Math.min(10, Math.ceil(caObj.score / 2));
      }

      if (ca2Obj !== undefined) {
        ca2 = Math.min(10, ca2Obj.score);
      } else if (caObj !== undefined) {
        ca2 = Math.min(10, Math.floor(caObj.score / 2));
      }

      if (midObj !== undefined) {
        mid_term = Math.min(20, midObj.score);
      }

      if (examGradeObj !== undefined) {
        exam = Math.min(60, examGradeObj.score);
      }

      const total = ca1 + ca2 + mid_term + exam;
      const hasUploadedScore = examGradeObj !== undefined || ca1Obj !== undefined || ca2Obj !== undefined || caObj !== undefined || midObj !== undefined;
      return { total, hasUploadedScore };
    };

    // Calculate subject averages based on subjects allocated to classes
    let totalScoreSum = 0;
    let totalScoreCount = 0;

    const subjectAverages = classes.flatMap(cls => {
      const classSubjects = getSubjectsForClass(cls);
      return classSubjects.map(subj => {
        const details = getSubjectGradeDetails(studentId, cls, subj);
        const average = details.hasUploadedScore ? details.total : null; // matches report card total score
        
        if (details.hasUploadedScore) {
          totalScoreSum += details.total;
          totalScoreCount++;
        }

        // Get class specific grades
        const classGrades = grades.filter(g => 
          g.classId === cls.id && 
          (g.subjectName === subj || g.assignmentName.toLowerCase().includes(subj.toLowerCase()))
        );

        // Find teacher
        const teacher = dbState.teachers.find(t => t.id === cls.teacherId);

        return {
          cls: { ...cls, id: `${cls.id}-${subj}`, name: subj, code: `${cls.name} (${cls.code})` }, // show subject as name, class info as its code
          teacher,
          average,
          grades: classGrades
        };
      });
    });

    const overallAverage = totalScoreCount > 0 
      ? Math.round(totalScoreSum / totalScoreCount) 
      : null;

    // Attendance counts
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const tardyCount = attendance.filter(a => a.status === 'tardy').length;
    const totalRecords = attendance.length;
    const attendancePercentage = totalRecords > 0 
      ? Math.round(((presentCount + (tardyCount * 0.5)) / totalRecords) * 100) 
      : 100;

    return {
      classes,
      subjectAverages,
      overallAverage,
      presentCount,
      absentCount,
      tardyCount,
      attendancePercentage,
      attendanceHistory: attendance
    };
  };

  const metrics = selectedChild ? getStudentMetrics(selectedChild.id) : null;

  // Navigation Links definition
  const sidebarLinks = [
    { code: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { code: 'attendance', label: 'Attendance Report', icon: CalendarCheck },
    { code: 'timetable', label: 'Class Timetable', icon: Calendar },
    { code: 'report_card', label: 'Report Card Result', icon: Award },
    { code: 'cbt', label: 'CBT Portal', icon: Laptop },
    { code: 'messages', label: 'Teacher Messaging', icon: MessageSquare },
    { code: 'resources', label: 'Resource Library', icon: Library },
    { code: 'settings', label: 'Portal Settings', icon: Settings }
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 flex" id="parent-portal-scaffold">
      
      {/* 1. LEFT SIDEBAR PANEL (Desktop wide screen) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-white shrink-0 flex-col justify-between border-r border-slate-800 no-print" id="desktop-sidebar">
        
        <div className="p-5.5 space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 border-b border-slate-805/40 pb-5">
            <div className="p-2 rounded-[22px] bg-white shrink-0 w-[108px] h-[108px] flex items-center justify-center overflow-hidden border-2 border-indigo-400/20 shadow-xs hover:scale-105 transition-transform duration-300">
              <SchoolLogo src={schoolLogo} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-tight leading-snug break-words" title={schoolName}>
                {schoolName}
              </h2>
              <span className="text-[10px] text-slate-400 font-mono font-extrabold tracking-wider uppercase block mt-0.5">PARENT PORTAL</span>
            </div>
          </div>

          {/* Active Parent profile summary */}
          <div className="p-3.5 bg-slate-950/40 border border-slate-800/50 rounded-2xl flex items-center gap-3">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={parentName}
                className="w-10 h-10 rounded-full object-cover border border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-650 flex items-center justify-center font-bold text-sm text-indigo-100 uppercase">
                {parentName.slice(0, 2)}
              </div>
            )}
            <div className="leading-none overflow-hidden">
              <h4 className="text-xs font-black truncate">{parentName}</h4>
              <span className="text-[9px] text-indigo-400 font-mono tracking-wider uppercase block mt-1">Guardian profile</span>
            </div>
          </div>

          {/* Student quick-switch select cards in Sidebar */}
          {children.length > 0 && (
            <div className="space-y-1.5 border-t border-slate-800 pt-4">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block pl-1">Active Ward</span>
              <div className="space-y-1">
                {children.map(child => {
                  const isSelected = selectedChild?.id === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => {
                        setSelectedChild(child);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-800 text-white border border-transparent' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px]">{child.fullName.split(' ')[0]}</span>
                      </div>
                      <span className={`text-[8px] px-1 rounded ${isSelected ? 'bg-indigo-600 text-indigo-100' : 'bg-slate-800 text-slate-500'}`}>
                        {child.gradeLevel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sidebar Menu Links Grid */}
          <nav className="space-y-1 pt-3.5 border-t border-slate-800" id="desktop-sidebar-nav">
            {sidebarLinks.map(link => {
              const isActive = activeTab === link.code;
              return (
                <button
                  key={link.code}
                  id={`side-link-${link.code}`}
                  onClick={() => setActiveTab(link.code)}
                  className={`w-full text-left px-4 py-2.8 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer relative ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <link.icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute right-3 w-1.2 h-1.2 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Escape / Logout */}
        <div className="p-5.5 border-t border-slate-800">
          <button
            onClick={onLogout}
            id="side-logout-btn"
            className="w-full py-2.8 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Portal Hub</span>
          </button>
        </div>

      </aside>

      {/* 2. MOBILE RESPONSIVE TOP NAV & DRAWER MENU (Tablet & Mobile screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-18 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-5 text-white z-40 no-print" id="mobile-navigation-top-bar">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-xl bg-white shrink-0 w-18 h-18 flex items-center justify-center overflow-hidden">
            <SchoolLogo src={schoolLogo} className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-xs sm:text-sm tracking-wider uppercase truncate max-w-[180px]">{schoolName} Parent</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick toggle student selector */}
          {selectedChild && (
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-350">
              {selectedChild.fullName.split(' ')[0]}
            </span>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            id="mobile-hamburger-toggle"
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slideout screen overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/80 z-30 transition-all no-print" id="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-60 bg-slate-900 h-full p-5 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6 pt-20">
              
              <div className="flex bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white truncate max-w-[130px]">{parentName}</h4>
              </div>

              {/* Student selectors on mobile */}
              <div className="space-y-1.5">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest pl-1">Student select:</span>
                <div className="grid grid-cols-1 gap-1">
                  {children.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setSelectedChild(ch);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`text-left p-2 rounded-lg text-[11px] font-bold ${
                        selectedChild?.id === ch.id ? 'bg-indigo-650 text-white' : 'text-slate-400'
                      }`}
                    >
                      {ch.fullName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar list items */}
              <nav className="space-y-1 border-t border-slate-800 pt-4">
                {sidebarLinks.map(link => {
                  const isActive = activeTab === link.code;
                  return (
                    <button
                      key={link.code}
                      onClick={() => {
                        setActiveTab(link.code);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <link.icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
              </nav>

            </div>

            <button
              onClick={onLogout}
              className="w-full py-2.5 hover:bg-slate-850 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1 border border-slate-800 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE AREA */}
      <main className="flex-1 min-w-0 pt-[72px] md:pt-0 max-h-screen overflow-y-auto" id="parent-portal-main-panel">
        
        {/* Workspace responsive wrapper */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          
          {/* Breadcrumbs Row / Meta Details */}
          <div className="flex items-center justify-between border-b border-slate-200/50 pb-4.5 no-print" id="parent-breadcrumbs-raw">
            <div>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                <span>Institution Portal</span>
                <ChevronRight className="w-3 h-3 text-slate-350" />
                <span className="text-slate-500 font-extrabold capitalize">
                  {activeTab.replace('_', ' ')}
                </span>
              </p>
              
              {selectedChild && (
                <h2 className="text-lg font-black text-slate-800 mt-2 leading-none">
                  {activeTab === 'dashboard' ? 'Children Portfolio Overview' :
                   activeTab === 'attendance' ? 'Attendance register timesheet' :
                   activeTab === 'report_card' ? 'Form Advisor Report Card' :
                   activeTab === 'cbt' ? 'Computer-Based-Assessment Centre' :
                   'Academic Materials Resources Library'}
                </h2>
              )}
            </div>

            {/* Quick date display */}
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Session: 2025/2026 Academic Year</span>
            </div>
          </div>

          {/* Children length verification */}
          {children.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center flex flex-col justify-center items-center min-h-[300px]">
              <Users className="w-12 h-12 text-slate-200 mb-2" />
              <h3 className="text-base font-bold text-slate-700">No Children Linked</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Please notify Administrator Ayanwunmi to link your registered student profile records with your guardian profile.
              </p>
            </div>
          ) : selectedChild && metrics ? (
            
            /* Render subviews based on active navigation tab state */
            <div className="space-y-6">
              
              {/* -----------------------------------------------------------------
                  TAB 1: DYNAMICAL OVERVIEW SCHOOL REPORT DASHBOARD
                 ----------------------------------------------------------------- */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6" id="dashboard-tab-space">
                  
                  {/* Traditional upper welcoming segment */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print select-none">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {currentUser?.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={parentName}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-150 shadow-3xs"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-650 flex items-center justify-center font-black text-lg uppercase shadow-3xs border border-indigo-100">
                          {parentName.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 text-indigo-600 font-mono text-[10px] font-bold uppercase tracking-wider mb-1">
                          <Sparkles className="w-4 h-4 animate-pulse" />
                          <span>FAMILY PORTAL CONCIERGE</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1.5">
                          Guardian Dashboard: {parentName}
                        </h1>
                        <p className="text-slate-500 text-xs">
                          Inspecting academic profiles of <strong>{selectedChild.fullName}</strong>. Live grading sync enabled.
                        </p>
                      </div>
                    </div>

                    {/* Exit */}
                    <button
                      onClick={onLogout}
                      className="self-start md:self-center px-4 py-2 rounded-xl text-slate-505 hover:text-rose-600 hover:bg-rose-50/50 text-xs font-bold transition-all border border-slate-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>

                  {/* Desktop Student List selector toolbar (no sidebar mode fallback/redundancy) */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 no-print shadow-3xs md:hidden">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 pl-1">Student select:</span>
                    <div className="flex flex-wrap gap-2">
                      {children.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => setSelectedChild(ch)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                            selectedChild.id === ch.id ? 'bg-indigo-600 text-white shadow-3xs' : 'bg-slate-50 border text-slate-600'
                          }`}
                        >
                          {ch.fullName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Grid: Statistics summaries and subject indices */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left stats columns card components */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {/* Academic Performance KPI Summary */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <PieChart className="w-4 h-4 text-indigo-505" />
                          <span>Performance Index</span>
                        </h3>

                        <div className="flex items-center gap-4 bg-slate-50 p-4 border rounded-2xl">
                          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                            {metrics.overallAverage !== null ? `${metrics.overallAverage}%` : 'N/A'}
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Overall Average standing</p>
                            <p className="text-xs font-bold text-slate-700">
                              {metrics.overallAverage 
                                ? `Institutional Letter: ${getLetterGrade(metrics.overallAverage)}` 
                                : 'No submissions filed.'}
                            </p>
                            <p className="text-[9px] text-slate-450">Updated: {new Date().toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>

                        {/* Subject listing timetable quick index */}
                        <div className="pt-2">
                          <p className="text-xs font-black text-slate-800">Classrooms Schedules ({metrics.classes.length})</p>
                          <div className="mt-2.5 divide-y divide-slate-100 text-xs">
                            {metrics.classes.map(cls => {
                              const teach = dbState.teachers.find(t => t.id === cls.teacherId);
                              return (
                                <div key={cls.id} className="py-2.5 flex justify-between items-start gap-4">
                                  <div>
                                    <p className="font-bold text-slate-800 leading-tight">{cls.name}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{teach?.fullName || 'Teacher Office'} • {cls.room}</p>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 p-1 rounded-md">
                                    {cls.code}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Right subject evaluations card grids */}
                    <div className="lg:col-span-8 space-y-4">
                      
                      <div className="flex items-center justify-between no-print">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Course Performance Logs</h3>
                        <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">Realtime sync enabled</span>
                      </div>

                      {metrics.subjectAverages.map(({ cls, teacher, average, grades }) => {
                        const letter = average !== null ? getLetterGrade(average) : '--';
                        const badgeColor = average !== null ? getLetterColor(letter) : 'bg-slate-100 text-slate-400 border-slate-200';

                        return (
                          <div 
                            key={cls.id} 
                            id={`subject-card-${cls.id}`}
                            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-3xs space-y-4 hover:shadow-xs transition-all"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-black text-xs md:text-sm text-slate-800 leading-tight">{cls.name}</h4>
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200/50 text-slate-500 select-none">
                                    {cls.code}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Lector: {teacher?.fullName || 'Advisor'} ({teacher?.department || 'Department'}) • Venue Room: {cls.room}
                                </p>
                              </div>

                              <div className={`border px-3 py-1 text-center rounded-xl flex flex-col justify-center items-center shadow-3xs select-none ${badgeColor}`}>
                                <span className="text-[8px] uppercase font-bold tracking-wider leading-none">GRADE STATUS</span>
                                <span className="text-base font-black mt-0.5 leading-none">{letter}</span>
                                <span className="text-[9px] font-mono font-bold">{average !== null ? `${average}%` : 'No score'}</span>
                              </div>
                            </div>

                            {/* Class metrics assignments detailed sublist */}
                            <div className="border-t border-slate-100 pt-3">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Grade book details ({grades.length})</span>
                              
                              {grades.length === 0 ? (
                                <p className="text-[11px] text-slate-400 italic">No score evaluations registered for this course.</p>
                              ) : (
                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                  {grades.slice().reverse().map(grd => {
                                    const gLtr = getLetterGrade(grd.score);
                                    const gCol = getLetterColor(gLtr);
                                    return (
                                      <div key={grd.id} className="p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-extrabold text-slate-800">{grd.assignmentName}</p>
                                            <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-450 font-bold uppercase rounded">{grd.category}</span>
                                          </div>
                                          <p className="text-[9px] text-slate-400">Published Date: {grd.date}</p>
                                          {grd.feedback && (
                                            <div className="bg-white border p-2 rounded-lg text-[9px] italic text-slate-500 max-w-sm">
                                              <strong>Feedback:</strong> "{grd.feedback}"
                                            </div>
                                          )}
                                        </div>

                                        <div className={`p-1 px-2 border rounded-lg font-bold text-[10px] self-end sm:self-center shrink-0 ${gCol}`}>
                                          {grd.score}% ({gLtr})
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}

                    </div>

                  </div>

                </div>
              )}

              {/* -----------------------------------------------------------------
                  TAB 2: ATTENDANCE SHEETS REPORT SUBVIEW
                 ----------------------------------------------------------------- */}
              {activeTab === 'attendance' && (
                <ParentAttendanceView 
                  selectedChild={selectedChild}
                  dbState={dbState}
                  metrics={metrics}
                />
              )}

              {/* -----------------------------------------------------------------
                  TAB TIMETABLE: DYNAMIC COURSE TIMETABLE AND CALENDAR
                 ----------------------------------------------------------------- */}
              {activeTab === 'timetable' && (
                <ParentTimetableView 
                  selectedChild={selectedChild}
                  dbState={dbState}
                />
              )}

              {/* -----------------------------------------------------------------
                  TAB 3: COMPRESSED ADVISOR REPLICA REPORT CARD VIEW
                 ----------------------------------------------------------------- */}
              {activeTab === 'report_card' && (
                <ParentReportCardView 
                  selectedChild={selectedChild}
                  dbState={dbState}
                />
              )}

              {/* -----------------------------------------------------------------
                  TAB 4: CBT CENTER & ONLINE MULTI-CHOICE QUIZZES
                 ----------------------------------------------------------------- */}
              {activeTab === 'cbt' && (
                <ParentCbtView 
                  selectedChild={selectedChild}
                  dbState={dbState}
                  onGradeSubmitted={refreshDbData}
                />
              )}

              {/* -----------------------------------------------------------------
                  TAB MESSAGES: SECURE CHAT CHANNEL WITH TUTORS
                 ----------------------------------------------------------------- */}
              {activeTab === 'messages' && (
                <ParentMessagingView 
                  selectedChild={selectedChild}
                  dbState={dbState}
                />
              )}

              {/* -----------------------------------------------------------------
                  TAB 5: EDUCATION ASSETS & LIBRARIES
                 ----------------------------------------------------------------- */}
              {activeTab === 'resources' && (
                <ParentResourcesView 
                  selectedChild={selectedChild}
                  dbState={dbState}
                />
              )}

              {/* -----------------------------------------------------------------
                  TAB 6: SECURITY CREDENTIALS SETTINGS
                 ----------------------------------------------------------------- */}
              {activeTab === 'settings' && (
                <div className="space-y-6 animate-fade-in font-sans">
                  <div>
                    <h2 className="text-2xl font-black text-indigo-950 tracking-tight">Portal User Settings</h2>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Control your profile parameters, security, and login credentials.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: PROFILE PROFILE & PASSWORD MANAGEMENT */}
                    <div className="lg:col-span-7 space-y-6">
                      <ProfileAvatarManager 
                        userId={parentId}
                        userFullName={parentName}
                        onAvatarUpdated={onRefreshUserSession}
                      />

                      <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-2xs space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Lock className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">Login Security Credentials</h3>
                      </div>
                      <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                        Configure a secure password to protect your parent/guardian login portal access. Once saved, you will use this password paired with your registered email next time. Set to blank or empty to revert to email-only login.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                          <input
                            type="password"
                            value={parentNewPassword}
                            onChange={(e) => setParentNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:border-indigo-505 focus:outline-none text-slate-800"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirm Password</label>
                          <input
                            type="password"
                            value={parentConfirmPassword}
                            onChange={(e) => setParentConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:bg-white focus:border-indigo-505 focus:outline-none text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Parent Local Inline Alert */}
                      {parentNewPassword.trim() || parentConfirmPassword.trim() || parentNewPassword === '' ? (
                        <div className="text-slate-100"></div>
                      ) : null}

                      {/* Display Action Status */}
                      {parentNewPassword === '' && parentConfirmPassword === '' && (
                        <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-indigo-900 text-xs font-semibold flex items-center gap-2">
                          <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>Pass-phrase is blank. Re-saving blank removes password security layer.</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-semibold">Security status: Sync Terminal Secured</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!parentNewPassword) {
                              db.updateUserPassword(parentId, '');
                              refreshDbData();
                              setParentNewPassword('');
                              setParentConfirmPassword('');
                              alert('Login password removed successfully. Email-only login restored.');
                              return;
                            }
                            if (parentNewPassword !== parentConfirmPassword) {
                              alert('Passwords do not match. Please verify.');
                              return;
                            }
                            if (parentNewPassword.length < 4) {
                              alert('Password must be at least 4 characters long.');
                              return;
                            }
                            
                            db.updateUserPassword(parentId, parentNewPassword);
                            refreshDbData();
                            setParentNewPassword('');
                            setParentConfirmPassword('');
                            alert('Your secure login password has been successfully configured!');
                          }}
                          className="bg-[#4f46e5] hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs tracking-wide transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Update Password</span>
                        </button>
                      </div>
                    </div>
                  </div>

                    {/* RIGHT COLUMN: INSTITUTION LICENSING REPLICA */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-2xs space-y-4">
                      <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider">Parent Account Scope</h3>
                      
                      <div className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#4f46e5]" />
                          <p className="text-xs font-black text-indigo-950 leading-none uppercase">Linked Pupil Profiles</p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                          You are currently authorized as primary contact for: {children.map(c => c.fullName).join(', ') || 'No linked children'}.
                        </p>
                      </div>

                      <div className="space-y-2 text-xs font-bold text-slate-500">
                        <div className="flex justify-between py-1.5 border-b border-slate-50 col-span-2">
                          <span>Authority level:</span>
                          <span className="text-indigo-650 font-extrabold">Parent / Guardian</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-50 col-span-2">
                          <span>Registered parent email:</span>
                          <span className="text-slate-700 font-medium">{dbState.users.find(u => u.id === parentId)?.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : null}

        </div>
      </main>

    </div>
  );
}
