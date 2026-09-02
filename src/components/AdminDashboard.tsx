import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, BookOpen, GraduationCap, Users, UserPlus, FolderPlus, 
  MapPin, Clock, Trash2, CheckCircle2, AlertCircle, Plus, Sparkles, User, Link2, LogOut,
  LayoutDashboard, ClipboardCheck, Award, CalendarPlus, Calendar, Search, HelpCircle, CheckSquare, PlusCircle, X,
  Sliders, Info, Settings, Upload, Download, Globe, Phone, Mail, Image, ArrowLeft, ChevronDown, MoreHorizontal, Layers, Archive, Check, Edit3, TrendingUp, UserCheck, Lock, Save, FileSpreadsheet,
  Database, FileJson, Server, Loader2
} from 'lucide-react';
import { Class, Teacher, Student, Parent, DbState, GradeCategory, AttendanceStatus, Attendance, Grade, getStoredLetterGrade, getStoredLetterColor, computeWeightedScore, User as PortalUser, AVAILABLE_ACADEMIC_SESSIONS } from '../types';
import { db } from '../database';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from '../assets/logo';
import royalPathLogo from '../assets/images/royalpath_logo.svg';
import ProfileAvatarManager from './ProfileAvatarManager';
import { PrintableReportModal } from './PrintableReportModal';
import { ClassBroadsheetModal } from './ClassBroadsheetModal';
import { StudentTranscriptModal } from './StudentTranscriptModal';
import { ImportStudentsCSVModal } from './ImportStudentsCSVModal';
import { ImportResultsCSVModal } from './ImportResultsCSVModal';

export function getThemeColorClass(theme: string, type: 'bg_primary' | 'bg_light' | 'text_primary' | 'btn_primary' | 'border_light' | 'bullet' | 'accent_text' | 'bg_accent') {
  switch (theme) {
    case 'emerald':
      return {
        bg_primary: 'bg-emerald-600',
        bg_light: 'bg-emerald-50',
        text_primary: 'text-emerald-600',
        btn_primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        border_light: 'border-emerald-100',
        bullet: 'bg-emerald-500',
        accent_text: 'text-emerald-700',
        bg_accent: 'bg-emerald-650'
      }[type];
    case 'blue':
      return {
        bg_primary: 'bg-blue-600',
        bg_light: 'bg-blue-50',
        text_primary: 'text-blue-600',
        btn_primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        border_light: 'border-blue-100',
        bullet: 'bg-blue-500',
        accent_text: 'text-blue-700',
        bg_accent: 'bg-blue-650'
      }[type];
    case 'rose':
      return {
        bg_primary: 'bg-rose-600',
        bg_light: 'bg-rose-50',
        text_primary: 'text-rose-600',
        btn_primary: 'bg-rose-600 hover:bg-rose-700 text-white',
        border_light: 'border-rose-100',
        bullet: 'bg-rose-500',
        accent_text: 'text-rose-700',
        bg_accent: 'bg-rose-650'
      }[type];
    case 'amber':
      return {
        bg_primary: 'bg-amber-500',
        bg_light: 'bg-amber-50',
        text_primary: 'text-amber-600',
        btn_primary: 'bg-amber-500 hover:bg-amber-600 text-white',
        border_light: 'border-amber-100',
        bullet: 'bg-amber-500',
        accent_text: 'text-amber-700',
        bg_accent: 'bg-amber-655'
      }[type];
    case 'violet':
      return {
        bg_primary: 'bg-violet-600',
        bg_light: 'bg-violet-50',
        text_primary: 'text-violet-600',
        btn_primary: 'bg-violet-600 hover:bg-violet-700 text-white',
        border_light: 'border-violet-100',
        bullet: 'bg-violet-500',
        accent_text: 'text-violet-700',
        bg_accent: 'bg-violet-650'
      }[type];
    case 'slate':
      return {
        bg_primary: 'bg-slate-700',
        bg_light: 'bg-slate-50',
        text_primary: 'text-slate-700',
        btn_primary: 'bg-slate-705 hover:bg-slate-805 text-white bg-slate-700 hover:bg-slate-800',
        border_light: 'border-slate-200',
        bullet: 'bg-slate-600',
        accent_text: 'text-slate-800',
        bg_accent: 'bg-slate-700'
      }[type];
    case 'indigo':
    default:
      return {
        bg_primary: 'bg-[#404ce5]',
        bg_light: 'bg-indigo-50',
        text_primary: 'text-indigo-600',
        btn_primary: 'bg-[#404ce5] hover:bg-indigo-750 hover:bg-indigo-700 text-white',
        border_light: 'border-indigo-100',
        bullet: 'bg-indigo-500',
        accent_text: 'text-[#404ce5]',
        bg_accent: 'bg-indigo-650'
      }[type];
  }
}

interface AdminProps {
  currentUser: PortalUser;
  onLogout: () => void;
  adminId: string;
  adminName: string;
  onRefreshUserSession: () => void;
}

type TabType = 'dashboard' | 'sessions' | 'classes' | 'results' | 'attendance' | 'teachers' | 'students' | 'parents' | 'settings';

export default function AdminDashboard({ currentUser, adminId, adminName, onLogout, onRefreshUserSession }: AdminProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dbState, setDbState] = useState<DbState>(db.getRawData());

  // --- FORM TEACHER SIMULATED STATES FOR ADMIN ---
  const [adminSelectedClass, setAdminSelectedClass] = useState<Class | null>(null);
  const [adminResultsSelectedSubject, setAdminResultsSelectedSubject] = useState<string>('Mathematics');
  const [adminBulkGrades, setAdminBulkGrades] = useState<Record<string, { exam: string; ca1: string; notebook: string; mid_term: string }>>({});
  const [adminBulkGradesRefreshTrigger, setAdminBulkGradesRefreshTrigger] = useState<number>(0);
  const [selectedResultsTerm, setSelectedResultsTerm] = useState<'1st Term' | '2nd Term' | '3rd Term'>('1st Term');
  const [selectedResultsSession, setSelectedResultsSession] = useState<string>(() => localStorage.getItem('academic_session') || '2025/2026');
  const [adminClassStudents, setAdminClassStudents] = useState<Student[]>([]);
  const [selectedReportStudent, setSelectedReportStudent] = useState<Student | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<'cumulative' | 'full' | 'midterm' | null>(null);

  // --- ADMIN EDIT COMMENTS STATES ---
  const [editingCommentStudent, setEditingCommentStudent] = useState<Student | null>(null);
  const [adminTeacherCommentInput, setAdminTeacherCommentInput] = useState('');
  const [adminPrincipalCommentInput, setAdminPrincipalCommentInput] = useState('');

  // --- ADMIN EXCLUSIVE BROADSHEET & TRANSCRIPT STATES ---
  const [isBroadsheetModalOpen, setIsBroadsheetModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedTranscriptStudent, setSelectedTranscriptStudent] = useState<Student | null>(null);

  // --- CSV IMPORT MODALS STATE ---
  const [isImportStudentsModalOpen, setIsImportStudentsModalOpen] = useState(false);
  const [isImportResultsModalOpen, setIsImportResultsModalOpen] = useState(false);

  const handleOpenBroadsheet = () => {
    if (currentUser.role !== 'admin') {
      triggerToast('Access Denied: Only school administrators have permission to download class broadsheets.', true);
      return;
    }
    if (!adminSelectedClass && dbState.classes.length > 0) {
      setAdminSelectedClass(dbState.classes[0]);
    }
    setIsBroadsheetModalOpen(true);
  };

  const handleOpenTranscript = (student?: Student) => {
    if (currentUser.role !== 'admin') {
      triggerToast('Access Denied: Only school administrators have permission to download student transcripts.', true);
      return;
    }
    setSelectedTranscriptStudent(student || adminClassStudents[0] || dbState.students[0] || null);
    setIsTranscriptModalOpen(true);
  };

  // --- NEXT TERM COMMENCE STATE ---
  const [nextTermCommenceInput, setNextTermCommenceInput] = useState(() => localStorage.getItem('next_term_commence_date') || '');

  useEffect(() => {
    const handleDatabaseUpdate = () => {
      setDbState(db.getRawData());
    };
    window.addEventListener('database_updated', handleDatabaseUpdate);
    return () => {
      window.removeEventListener('database_updated', handleDatabaseUpdate);
    };
  }, []);

  // --- FORM TEACHER SIMULATED HELPER FUNCTIONS & EFFECTS ---
  useEffect(() => {
    if (dbState.classes.length > 0 && !adminSelectedClass) {
      setAdminSelectedClass(dbState.classes[0]);
    }
  }, [dbState, adminSelectedClass]);

  useEffect(() => {
    if (adminSelectedClass) {
      // Get subjects for class
      const subjects = getSubjectsForClass(adminSelectedClass.id);
      if (subjects.length > 0 && !subjects.includes(adminResultsSelectedSubject)) {
        setAdminResultsSelectedSubject(subjects[0]);
      }

      const roster = db.getStudentsInClass(adminSelectedClass.id);
      setAdminClassStudents(roster);

      const initialBulk: Record<string, { exam: string; ca1: string; notebook: string; mid_term: string }> = {};
      const latestGrades = dbState.grades;
      roster.forEach(st => {
        const studentGrades = latestGrades.filter(g => {
          if (g.studentId !== st.id || g.classId !== adminSelectedClass.id) return false;
          
          const isRightSubject = g.subjectName === adminResultsSelectedSubject || 
            g.assignmentName.toLowerCase().includes(adminResultsSelectedSubject.toLowerCase());
          if (!isRightSubject) return false;

          // Match session if present
          if (g.session && g.session !== selectedResultsSession) return false;
          if (g.assignmentName.includes('20') && !g.assignmentName.includes(selectedResultsSession)) return false;

          // Differentiate term
          if (g.term) return g.term === selectedResultsTerm;
          const hasTerm1InName = g.assignmentName.includes('1st Term');
          const hasTerm2InName = g.assignmentName.includes('2nd Term');
          const hasTerm3InName = g.assignmentName.includes('3rd Term');

          if (selectedResultsTerm === '1st Term') {
            return hasTerm1InName;
          } else if (selectedResultsTerm === '2nd Term') {
            return hasTerm2InName;
          } else { // 3rd Term
            return hasTerm3InName || (!hasTerm1InName && !hasTerm2InName);
          }
        });

        const examObj = studentGrades.find(g => g.category === 'exam');
        const ca1Obj = studentGrades.find(g => g.category === 'ca1');
        const ca2Obj = studentGrades.find(g => g.category === 'ca2');
        const caObj = studentGrades.find(g => g.category === 'ca');
        const midObj = studentGrades.find(g => g.category === 'mid_term');

        let ca1Value = '';
        let notebookValue = '';

        if (ca1Obj) {
          ca1Value = String(ca1Obj.score);
        } else if (caObj) {
          ca1Value = String(Math.min(10, Math.ceil(caObj.score / 2)));
        }

        if (ca2Obj) {
          notebookValue = String(ca2Obj.score);
        } else if (caObj) {
          notebookValue = String(Math.min(10, Math.floor(caObj.score / 2)));
        }

        initialBulk[st.id] = {
          exam: examObj ? String(examObj.score) : '',
          ca1: ca1Value,
          notebook: notebookValue,
          mid_term: midObj ? String(midObj.score) : ''
        };
      });
      setAdminBulkGrades(initialBulk);
    } else {
      setAdminClassStudents([]);
      setAdminBulkGrades({});
    }
  }, [adminSelectedClass, adminResultsSelectedSubject, selectedResultsTerm, selectedResultsSession, adminBulkGradesRefreshTrigger, dbState]);

  const getSubjectGradeDetails = (stId: string, subjectName: string, classId: string) => {
    const studentGrades = dbState.grades.filter(g => {
      if (g.studentId !== stId || g.classId !== classId) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;
      
      // Match session if present
      if (g.session && g.session !== selectedResultsSession) return false;
      if (g.assignmentName.includes('20') && !g.assignmentName.includes(selectedResultsSession)) return false;
      return true;
    });

    const getGradesForTerm = (termName: '1st Term' | '2nd Term' | '3rd Term') => {
      return studentGrades.filter(g => {
        if (g.term === termName) return true;
        const hasTerm1 = g.assignmentName.includes('1st Term');
        const hasTerm2 = g.assignmentName.includes('2nd Term');
        const hasTerm3 = g.assignmentName.includes('3rd Term');

        if (termName === '1st Term') return hasTerm1;
        if (termName === '2nd Term') return hasTerm2;
        return hasTerm3 || (!hasTerm1 && !hasTerm2);
      });
    };

    const term1Grades = getGradesForTerm('1st Term');
    const term2Grades = getGradesForTerm('2nd Term');
    const term3Grades = getGradesForTerm('3rd Term');

    const calcTermDetails = (tGrades: typeof studentGrades) => {
      const examGradeObj = tGrades.find(g => g.category === 'exam');
      const ca1Obj = tGrades.find(g => g.category === 'ca1');
      const ca2Obj = tGrades.find(g => g.category === 'ca2' || g.category === 'notebook');
      const caObj = tGrades.find(g => g.category === 'ca');
      const midObj = tGrades.find(g => g.category === 'mid_term');

      const hasUploaded = examGradeObj !== undefined || ca1Obj !== undefined || ca2Obj !== undefined || caObj !== undefined || midObj !== undefined;

      let ca1 = 0;
      let noteChecking = 0;
      let ca2 = 0;
      let exam = 0;

      if (ca1Obj !== undefined) {
        ca1 = Math.min(10, ca1Obj.score);
      } else if (caObj !== undefined) {
        ca1 = Math.min(10, Math.ceil(caObj.score / 2));
      }

      if (ca2Obj !== undefined) {
        noteChecking = Math.min(10, ca2Obj.score);
      } else if (caObj !== undefined) {
        noteChecking = Math.min(10, Math.floor(caObj.score / 2));
      }

      if (midObj !== undefined) {
        ca2 = Math.min(20, midObj.score);
      }

      if (examGradeObj !== undefined) {
        exam = Math.min(60, examGradeObj.score);
      }

      const total = ca1 + noteChecking + ca2 + exam;
      return { ca1, noteChecking, ca2, exam, total, hasUploaded };
    };

    const term1Res = calcTermDetails(term1Grades);
    const term2Res = calcTermDetails(term2Grades);
    const term3Res = calcTermDetails(term3Grades);

    const activeRes = selectedResultsTerm === '1st Term' ? term1Res : selectedResultsTerm === '2nd Term' ? term2Res : term3Res;

    const ca1 = activeRes.ca1;
    const noteChecking = activeRes.noteChecking;
    const ca2 = activeRes.ca2;
    const exam = activeRes.exam;
    const total = activeRes.total;
    const grade = getStoredLetterGrade(total);

    const hash = (stId + subjectName).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    return {
      ca1,
      noteChecking,
      ca2,
      exam,
      total,
      grade,
      term1Val: term1Res.total,
      term2Val: term2Res.total,
      term3Val: term3Res.total,
      hasTerm1: term1Res.hasUploaded,
      hasTerm2: term2Res.hasUploaded,
      hasTerm3: term3Res.hasUploaded,
      classAvg: total > 0 ? Math.round(58 + (hash % 11) - 5) : 0,
      hasUploadedScore: activeRes.hasUploaded
    };
  };

  const getSubjectComments = (stId: string, classId: string, currentTerm: string) => {
    const commentObj = dbState.reportComments?.find(
      rc => rc.studentId === stId && 
      rc.classId === classId && 
      (rc.term === currentTerm || rc.term === `${currentTerm} - ${selectedResultsSession}` || rc.term.startsWith(currentTerm)) &&
      (!rc.session || rc.session === selectedResultsSession)
    );
    return {
      teacher: commentObj?.teacherComment || "Self-directed student. Keeps high academic focus. Strongly recommended.",
      principal: commentObj?.principalComment || "An encouraging performance. Maintain consistency for higher growth."
    };
  };

  const handleSaveAdminBulkGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSelectedClass) return;

    let updateCount = 0;
    const gradesToAddOrUpdate: Grade[] = [];
    const gradeIdsToDelete: string[] = [];

    // Helper to find existing grades that matches student, class, category, subject, term and session
    const findExistingGrade = (studentId: string, category: string) => {
      return dbState.grades.find(g => {
        if (g.studentId !== studentId || g.classId !== adminSelectedClass.id || g.category !== category) return false;
        const isRightSubject = g.subjectName === adminResultsSelectedSubject || 
          g.assignmentName.toLowerCase().includes(adminResultsSelectedSubject.toLowerCase());
        if (!isRightSubject) return false;

        // Match session if present
        if (g.session && g.session !== selectedResultsSession) return false;
        if (g.assignmentName.includes('20') && !g.assignmentName.includes(selectedResultsSession)) return false;

        if (g.term) return g.term === selectedResultsTerm;
        const hasTerm1InName = g.assignmentName.includes('1st Term');
        const hasTerm2InName = g.assignmentName.includes('2nd Term');
        const hasTerm3InName = g.assignmentName.includes('3rd Term');

        if (selectedResultsTerm === '1st Term') return hasTerm1InName;
        if (selectedResultsTerm === '2nd Term') return hasTerm2InName;
        return hasTerm3InName || (!hasTerm1InName && !hasTerm2InName);
      });
    };

    adminClassStudents.forEach(st => {
      const vals = adminBulkGrades[st.id];
      if (!vals) return;

      // Handle Exam score
      if (vals.exam.trim() !== '') {
        const scoreVal = Number(vals.exam);
        if (scoreVal >= 0 && scoreVal <= 60) {
          const existingExam = findExistingGrade(st.id, 'exam');
          
          if (existingExam) {
            gradesToAddOrUpdate.push({
              ...existingExam,
              score: scoreVal,
              session: selectedResultsSession,
              term: selectedResultsTerm,
              date: new Date().toISOString().split('T')[0]
            });
          } else {
            const id = `grd-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
            gradesToAddOrUpdate.push({
              id,
              studentId: st.id,
              classId: adminSelectedClass.id,
              assignmentName: `${adminResultsSelectedSubject} - ${selectedResultsTerm} - Term End Examination (${selectedResultsSession})`,
              score: scoreVal,
              category: 'exam',
              session: selectedResultsSession,
              term: selectedResultsTerm,
              date: new Date().toISOString().split('T')[0],
              subjectName: adminResultsSelectedSubject
            });
          }
          updateCount++;
        }
      }

      // Handle separate CA1 and CA2 scores
      const hasCa1 = vals.ca1 !== undefined && vals.ca1.trim() !== '';
      const hasNotebook = vals.notebook !== undefined && vals.notebook.trim() !== '';

      if (hasCa1 || hasNotebook) {
        const existingLegacyCA = dbState.grades.find(g => 
          g.studentId === st.id && 
          g.classId === adminSelectedClass.id && 
          g.category === 'ca' &&
          (g.subjectName === adminResultsSelectedSubject || g.assignmentName.toLowerCase().includes(adminResultsSelectedSubject.toLowerCase())) &&
          (!g.session || g.session === selectedResultsSession)
        );
        if (existingLegacyCA) gradeIdsToDelete.push(existingLegacyCA.id);

        if (hasCa1) {
          const ca1Num = Number(vals.ca1);
          if (ca1Num >= 0 && ca1Num <= 10) {
            const existingCA1 = findExistingGrade(st.id, 'ca1');
            
            if (existingCA1) {
              gradesToAddOrUpdate.push({
                ...existingCA1,
                score: ca1Num,
                session: selectedResultsSession,
                term: selectedResultsTerm,
                date: new Date().toISOString().split('T')[0]
              });
            } else {
              const id = `grd-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
              gradesToAddOrUpdate.push({
                id,
                studentId: st.id,
                classId: adminSelectedClass.id,
                assignmentName: `${adminResultsSelectedSubject} - ${selectedResultsTerm} - Continuous Assessment 1 (${selectedResultsSession})`,
                score: ca1Num,
                category: 'ca1',
                session: selectedResultsSession,
                term: selectedResultsTerm,
                date: new Date().toISOString().split('T')[0],
                subjectName: adminResultsSelectedSubject
              });
            }
            updateCount++;
          }
        }

        if (hasNotebook) {
          const noteNum = Number(vals.notebook);
          if (noteNum >= 0 && noteNum <= 10) {
            const existingCA2 = findExistingGrade(st.id, 'ca2');
            
            if (existingCA2) {
              gradesToAddOrUpdate.push({
                ...existingCA2,
                score: noteNum,
                session: selectedResultsSession,
                term: selectedResultsTerm,
                date: new Date().toISOString().split('T')[0]
              });
            } else {
              const id = `grd-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
              gradesToAddOrUpdate.push({
                id,
                studentId: st.id,
                classId: adminSelectedClass.id,
                assignmentName: `${adminResultsSelectedSubject} - ${selectedResultsTerm} - Continuous Assessment 2 (${selectedResultsSession})`,
                score: noteNum,
                category: 'ca2',
                session: selectedResultsSession,
                term: selectedResultsTerm,
                date: new Date().toISOString().split('T')[0],
                subjectName: adminResultsSelectedSubject
              });
            }
            updateCount++;
          }
        }
      }

      // Handle Mid Term score
      if (vals.mid_term.trim() !== '') {
        const scoreVal = Number(vals.mid_term);
        if (scoreVal >= 0 && scoreVal <= 20) {
          const existingMid = findExistingGrade(st.id, 'mid_term');
          
          if (existingMid) {
            gradesToAddOrUpdate.push({
              ...existingMid,
              score: scoreVal,
              session: selectedResultsSession,
              term: selectedResultsTerm,
              date: new Date().toISOString().split('T')[0]
            });
          } else {
            const id = `grd-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
            gradesToAddOrUpdate.push({
              id,
              studentId: st.id,
              classId: adminSelectedClass.id,
              assignmentName: `${adminResultsSelectedSubject} - ${selectedResultsTerm} - Mid Term Standard Test (${selectedResultsSession})`,
              score: scoreVal,
              category: 'mid_term',
              session: selectedResultsSession,
              term: selectedResultsTerm,
              date: new Date().toISOString().split('T')[0],
              subjectName: adminResultsSelectedSubject
            });
          }
          updateCount++;
        }
      }
    });

    db.saveGradesBatch(gradesToAddOrUpdate, gradeIdsToDelete);
    triggerToast(`Bulk grade spreadsheet saved for ${adminResultsSelectedSubject} (${selectedResultsSession})! Logged ${updateCount} modifications.`);
    setAdminBulkGradesRefreshTrigger(prev => prev + 1);
    setDbState(db.getRawData());
  };

  const handleAdminBulkStateChange = (studentId: string, field: 'exam' | 'ca1' | 'notebook' | 'mid_term', val: string) => {
    setAdminBulkGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val
      }
    }));
  };

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password Management States
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  // --- FORM STATES ---
  // Class/Session Creation
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassTeacherId, setNewClassTeacherId] = useState('');
  const [newClassSchedule, setNewClassSchedule] = useState('');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [sessionClassCategory, setSessionClassCategory] = useState<'jss' | 'sss' | ''>('');

  // Teacher & Staff Creation
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherDept, setNewTeacherDept] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'teacher' | 'admin'>('teacher');
  const [newStaffPermissions, setNewStaffPermissions] = useState<string[]>([
    'mark_attendance',
    'upload_scores',
    'upload_notes',
    'create_assessments',
    'enter_comments',
    'view_edit_form_class',
    'view_edit_subject'
  ]);

  // Student Creation
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentBirth, setNewStudentBirth] = useState('');
  const [newStudentParentId, setNewStudentParentId] = useState('');

  // Parent Creation
  const [newParentName, setNewParentName] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentSelectedWards, setNewParentSelectedWards] = useState<string[]>([]);
  const [onboardingWardSearch, setOnboardingWardSearch] = useState('');
  const [newParentPermissions, setNewParentPermissions] = useState<string[]>([]);

  // --- ALL CLASSES TAB STATE ---
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [isArchivedStudentsOpen, setIsArchivedStudentsOpen] = useState(false);
  const [archivedStudentsSearchQuery, setArchivedStudentsSearchQuery] = useState('');
  const [activeRowMenuClassId, setActiveRowMenuClassId] = useState<string | null>(null);

  // --- STUDENT EDITING STATES ---
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentRoll, setEditStudentRoll] = useState('');
  const [editStudentBirth, setEditStudentBirth] = useState('');
  const [editStudentGrade, setEditStudentGrade] = useState('');

  // --- SUB-MODALS FOR THREE DOTS ACTIONS ---
  const [viewingClassForStudents, setViewingClassForStudents] = useState<Class | null>(null);
  const [viewingClassForSubjects, setViewingClassForSubjects] = useState<Class | null>(null);
  const [viewingClassForTeacher, setViewingClassForTeacher] = useState<Class | null>(null);
  const [viewingClassForPromotion, setViewingClassForPromotion] = useState<Class | null>(null);
  const [promotionTargetClassId, setPromotionTargetClassId] = useState<string>('');
  const [selectedStudentIdsForPromotion, setSelectedStudentIdsForPromotion] = useState<string[]>([]);
  const [promotionSearchQuery, setPromotionSearchQuery] = useState<string>('');
  const [subjectsAssignedOverride, setSubjectsAssignedOverride] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('class_subjects_override');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [searchWordForEnroll, setSearchWordForEnroll] = useState<string>('');
  
  const [newClassFee, setNewClassFee] = useState<number>(0);
  const [newClassExtraFee, setNewClassExtraFee] = useState<number>(0);
  const [newClassPromotionStatus, setNewClassPromotionStatus] = useState<string>('Auto');
  const [newClassLevelOfEducation, setNewClassLevelOfEducation] = useState<string>('Junior Secondary');

  const [editClassName, setEditClassName] = useState('');
  const [editClassCode, setEditClassCode] = useState('');
  const [editClassTeacherId, setEditClassTeacherId] = useState('');
  const [editClassSchedule, setEditClassSchedule] = useState('');
  const [editClassRoom, setEditClassRoom] = useState('');
  const [editClassFee, setEditClassFee] = useState<number>(0);
  const [editClassExtraFee, setEditClassExtraFee] = useState<number>(0);
  const [editClassPromotionStatus, setEditClassPromotionStatus] = useState('');
  const [editClassLevelOfEducation, setEditClassLevelOfEducation] = useState<string>('Junior Secondary');

  // --- TERM MANAGEMENT STATES ---
  const [sessionsSubTab, setSessionsSubTab] = useState<'term' | 'classes'>('term');
  const [term1Start, setTerm1Start] = useState(() => localStorage.getItem('term1_start_date') || '2025-09-15');
  const [term1End, setTerm1End] = useState(() => localStorage.getItem('term1_end_date') || '2025-12-08');
  const [term2Start, setTerm2Start] = useState(() => localStorage.getItem('term2_start_date') || '2026-01-05');
  const [term2End, setTerm2End] = useState(() => localStorage.getItem('term2_end_date') || '2026-04-10');
  const [term3Start, setTerm3Start] = useState(() => localStorage.getItem('term3_start_date') || '2026-04-27');
  const [term3End, setTerm3End] = useState(() => localStorage.getItem('term3_end_date') || '2026-07-24');

  const [termSessionInput, setTermSessionInput] = useState(() => localStorage.getItem('academic_session') || '2025/2026');
  const [termActiveTermInput, setTermActiveTermInput] = useState(() => localStorage.getItem('current_term') || '3rd Term');

  const [isTerm1Configured, setIsTerm1Configured] = useState(() => localStorage.getItem('term1_configured') !== 'false');
  const [isTerm2Configured, setIsTerm2Configured] = useState(() => localStorage.getItem('term2_configured') !== 'false');
  const [isTerm3Configured, setIsTerm3Configured] = useState(() => localStorage.getItem('term3_configured') !== 'false');

  // Enrollment State (Under Student Management)
  const [selectedEnrollStudentId, setSelectedEnrollStudentId] = useState('');
  const [selectedEnrollClassId, setSelectedEnrollClassId] = useState('');
  const [studentDirectorySearchQuery, setStudentDirectorySearchQuery] = useState('');
  const [enrollmentPortalSearchQuery, setEnrollmentPortalSearchQuery] = useState('');
  const [enrollSelectStudentSearch, setEnrollSelectStudentSearch] = useState('');
  const [enrollSelectClassSearch, setEnrollSelectClassSearch] = useState('');

  // --- RESULT MANAGEMENT FORM STATES ---
  const [selectedGradeClassId, setSelectedGradeClassId] = useState('');
  const [selectedGradeStudentId, setSelectedGradeStudentId] = useState('');
  const [selectedGradeSubject, setSelectedGradeSubject] = useState('');
  const [newGradeAssignmentName, setNewGradeAssignmentName] = useState('');
  const [newGradeCategory, setNewGradeCategory] = useState<GradeCategory>('ca');
  const [newGradeScore, setNewGradeScore] = useState('');
  const [newGradeFeedback, setNewGradeFeedback] = useState('');
  const [gradeSearchQuery, setGradeSearchQuery] = useState('');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [gradeClassFilter, setGradeClassFilter] = useState('');
  
  // --- RESULT MANAGEMENT SUBVIEWS ---
  const [resultsSubView, setResultsSubView] = useState<'overview' | 'ledger' | 'settings' | 'metrics'>('overview');

  // --- GRADING PARAMETERS ---
  const [weightExam, setWeightExam] = useState(() => Number(localStorage.getItem('weight_exam') || '50'));
  const [weightCa, setWeightCa] = useState(() => Number(localStorage.getItem('weight_ca') || '30'));
  const [weightMidterm, setWeightMidterm] = useState(() => Number(localStorage.getItem('weight_midterm') || '20'));
  const [metricsPassMark, setMetricsPassMark] = useState(() => Number(localStorage.getItem('metrics_pass_mark') || '60'));

  // --- GENERAL SETTINGS ---
  const [settingsSchoolName, setSettingsSchoolName] = useState(() => localStorage.getItem('settings_school_name') || 'RoyalPath College');
  const [settingsSchoolLogo, setSettingsSchoolLogo] = useState(() => localStorage.getItem('settings_school_logo') || ROYALPATH_LOGO_DATA_URL);
  const [settingsPrincipalName, setSettingsPrincipalName] = useState(() => localStorage.getItem('settings_principal_name') || 'Principal Ayanwunmi');
  const [settingsAdminEmail, setSettingsAdminEmail] = useState(() => localStorage.getItem('settings_admin_email') || 'admin@royalpath.edu');
  const [settingsPhoneNumber, setSettingsPhoneNumber] = useState(() => localStorage.getItem('settings_phone_number') || '+1 (555) 019-2831');
  const [settingsAddress, setSettingsAddress] = useState(() => localStorage.getItem('settings_address') || '1, Tony Efe, Onibudo, Off Akute Road.');
  const [settingsCity, setSettingsCity] = useState(() => localStorage.getItem('settings_city') || 'Lexington');
  const [settingsPostalCode, setSettingsPostalCode] = useState(() => localStorage.getItem('settings_postal_code') || '02421');
  const [settingsState, setSettingsState] = useState(() => localStorage.getItem('settings_state') || 'Massachusetts');
  const [settingsCountry, setSettingsCountry] = useState(() => localStorage.getItem('settings_country') || 'Nigeria');
  const [settingsAdminSignature, setSettingsAdminSignature] = useState(() => localStorage.getItem('settings_admin_signature') || '');
  const [settingsColorTheme, setSettingsColorTheme] = useState(() => localStorage.getItem('settings_color_theme') || 'indigo');
  const [settingsMaxClassesLimit, setSettingsMaxClassesLimit] = useState(() => Number(localStorage.getItem('settings_max_classes_limit') || '24'));
  const [settingsAllowClassSetup, setSettingsAllowClassSetup] = useState(() => {
    return localStorage.getItem('settings_allow_class_setup') !== 'false';
  });
  const [customSubjectCategory, setCustomSubjectCategory] = useState<'JSS' | 'SSS' | 'General'>('General');

  // --- TERM RESULTS PUBLICATION STATES ---
  const [publishedTerm1, setPublishedTerm1] = useState(() => localStorage.getItem('results_published_1st Term') !== 'false');
  const [publishedTerm2, setPublishedTerm2] = useState(() => localStorage.getItem('results_published_2nd Term') !== 'false');
  const [publishedTerm3, setPublishedTerm3] = useState(() => localStorage.getItem('results_published_3rd Term') !== 'false');

  const toggleTermPublication = (term: '1st Term' | '2nd Term' | '3rd Term') => {
    if (term === '1st Term') {
      const newVal = !publishedTerm1;
      db.saveSetting('results_published_1st Term', newVal ? 'true' : 'false');
      setPublishedTerm1(newVal);
      triggerToast(`1st Term results are now ${newVal ? 'PUBLISHED' : 'UNPUBLISHED / HIDDEN'} for parents.`);
    } else if (term === '2nd Term') {
      const newVal = !publishedTerm2;
      db.saveSetting('results_published_2nd Term', newVal ? 'true' : 'false');
      setPublishedTerm2(newVal);
      triggerToast(`2nd Term results are now ${newVal ? 'PUBLISHED' : 'UNPUBLISHED / HIDDEN'} for parents.`);
    } else {
      const newVal = !publishedTerm3;
      db.saveSetting('results_published_3rd Term', newVal ? 'true' : 'false');
      setPublishedTerm3(newVal);
      triggerToast(`3rd Term results are now ${newVal ? 'PUBLISHED' : 'UNPUBLISHED / HIDDEN'} for parents.`);
    }
  };

  // --- SCHOOL CATEGORIES & SUBJECTS ---
  const [settingsJssSubjects, setSettingsJssSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('settings_jss_subjects');
    return saved ? JSON.parse(saved) : [
      "Mathematics", "English Language", "Basic Science", "Basic Technology", "Social Studies", "Civic Education", "Agricultural Science"
    ];
  });
  const [settingsSssSubjects, setSettingsSssSubjects] = useState<string[]>(() => {
    const saved = localStorage.getItem('settings_sss_subjects');
    return saved ? JSON.parse(saved) : [
      "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Civic Education", "Geography", "Economics", "Literature in English"
    ];
  });

  const getSubjectsForClass = (classId: string): string[] => {
    const cls = dbState.classes.find(c => c.id === classId);
    if (!cls) return [];
    if (subjectsAssignedOverride && subjectsAssignedOverride[classId]) {
      return subjectsAssignedOverride[classId];
    }
    const code = cls.code || cls.name;
    const nameUpper = cls.name.toUpperCase();
    if (code.toLowerCase().includes('jss') || code.toLowerCase().includes('junior') || code.toLowerCase().includes('7') || code.toLowerCase().includes('8') || code.toLowerCase().includes('9') || nameUpper.includes('JSS') || cls.levelOfEducation === 'Junior Secondary') {
      return settingsJssSubjects;
    }
    if (code.toLowerCase().includes('primary') || cls.levelOfEducation === 'Primary') {
      return [
        "Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education", "Computer Studies", "Creative Arts"
      ];
    }
    if (code.toLowerCase().includes('nursery') || cls.levelOfEducation === 'Nursery') {
      return [
        "Numeracy", "Literacy", "Sensory Activity", "Creative Art", "Social Habit", "Health Education", "Science Experience"
      ];
    }
    return settingsSssSubjects;
  };
  const [newJssSubjectInput, setNewJssSubjectInput] = useState('');
  const [newSssSubjectInput, setNewSssSubjectInput] = useState('');

  // --- ATTENDANCE MANAGEMENT STATES ---
  const [selectedAttendanceClassId, setSelectedAttendanceClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [attendanceViewClassId, setAttendanceViewClassId] = useState('');
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<Attendance | null>(null);
  const [editAttendanceStatus, setEditAttendanceStatus] = useState<AttendanceStatus>('present');
  const [editAttendanceNotes, setEditAttendanceNotes] = useState<string>('');

  // --- SELECTED TEACHER DETAILED VIEW STATE ---
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'subjects' | 'classes'>('subjects');
  const [isAssignClassOpen, setIsAssignClassOpen] = useState(false);
  const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
  const [subjectSelectionSearch, setSubjectSelectionSearch] = useState('');
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);

  // --- IN-APP CONFIRMATION MODAL STATE ---
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    isDestructive: true,
    onConfirm: () => {},
  });

  const requestConfirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      isDestructive: options.isDestructive !== undefined ? options.isDestructive : true,
      onConfirm: options.onConfirm
    });
  };

  // Refresh local React state from Database
  const refreshState = () => {
    setDbState(db.getRawData());
  };

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const downloadCSV = (filenamePrefix: string, headers: string[], rows: any[][]) => {
    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return s;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filenamePrefix}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast(`Successfully downloaded ${filenamePrefix} as a CSV file!`);
  };

  const handleExportStudentsCSV = () => {
    const headers = [
      'Student ID',
      'Full Name',
      'Roll Number',
      'Grade Level / Class',
      'Date of Birth',
      'Gender',
      'Parent / Guardian Name',
      'Parent / Guardian Email',
      'Parent Contact Phone',
      'Classroom Enrollments Count'
    ];

    const rows = dbState.students.map(student => {
      const parent = dbState.parents.find(p => p.id === student.parentId || (p.childIds && p.childIds.includes(student.id)));
      const enrolledCount = dbState.enrollments.filter(e => e.studentId === student.id).length;
      return [
        student.id,
        student.fullName,
        student.rollNumber,
        student.gradeLevel,
        student.birthDate || 'N/A',
        student.gender || 'Unspecified',
        parent?.fullName || 'Unassigned',
        parent?.email || 'N/A',
        parent?.phone || 'N/A',
        enrolledCount
      ];
    });

    downloadCSV('students_directory_export', headers, rows);
  };

  const handleExportLedgerResultsCSV = () => {
    if (!adminSelectedClass) {
      triggerToast('Please select a classroom first to export the assessment ledger.', true);
      return;
    }

    const headers = [
      'Roll Number',
      'Student Name',
      'Class Name',
      'Subject',
      'Academic Term',
      'Academic Session',
      'Continuous Assessment 1 (20)',
      'Mid-Term Assessment (20)',
      'Notebook & Homework (20)',
      'Terminal Examination (60)',
      'Total Score (100)',
      'Letter Grade',
      'Standing'
    ];

    const rows = adminClassStudents.map(student => {
      const studentGrades = dbState.grades.filter(g => 
        g.studentId === student.id &&
        g.classId === adminSelectedClass.id &&
        (g.subjectName === adminResultsSelectedSubject || g.assignmentName.toLowerCase().includes(adminResultsSelectedSubject.toLowerCase())) &&
        (g.term || '1st Term') === selectedResultsTerm &&
        (g.session || '2025/2026') === selectedResultsSession
      );

      const ca1Grade = studentGrades.find(g => g.category === 'ca1' || g.assignmentName.toLowerCase().includes('continuous assessment 1') || g.assignmentName.toLowerCase().includes('ca1'));
      const ca2Grade = studentGrades.find(g => g.category === 'notebook' || g.assignmentName.toLowerCase().includes('continuous assessment 2') || g.assignmentName.toLowerCase().includes('ca2'));
      const midGrade = studentGrades.find(g => g.category === 'mid_term' || g.assignmentName.toLowerCase().includes('mid term') || g.assignmentName.toLowerCase().includes('midterm'));
      const examGrade = studentGrades.find(g => g.category === 'exam' || g.category === 'final' || g.assignmentName.toLowerCase().includes('term end examination'));

      const ca1Val = adminBulkGrades[student.id]?.ca1 !== undefined && adminBulkGrades[student.id]?.ca1 !== '' ? adminBulkGrades[student.id]?.ca1 : (ca1Grade ? String(ca1Grade.score) : '');
      const ca2Val = adminBulkGrades[student.id]?.notebook !== undefined && adminBulkGrades[student.id]?.notebook !== '' ? adminBulkGrades[student.id]?.notebook : (ca2Grade ? String(ca2Grade.score) : '');
      const midVal = adminBulkGrades[student.id]?.mid_term !== undefined && adminBulkGrades[student.id]?.mid_term !== '' ? adminBulkGrades[student.id]?.mid_term : (midGrade ? String(midGrade.score) : '');
      const examVal = adminBulkGrades[student.id]?.exam !== undefined && adminBulkGrades[student.id]?.exam !== '' ? adminBulkGrades[student.id]?.exam : (examGrade ? String(examGrade.score) : '');

      const nCa1 = parseFloat(ca1Val) || 0;
      const nCa2 = parseFloat(ca2Val) || 0;
      const nMid = parseFloat(midVal) || 0;
      const nExam = parseFloat(examVal) || 0;

      const hasAnyScore = ca1Val !== '' || ca2Val !== '' || midVal !== '' || examVal !== '';
      const totalScore = hasAnyScore ? Math.min(100, Math.round(nCa1 + nCa2 + nMid + nExam)) : '';
      const letterGrade = hasAnyScore ? getStoredLetterGrade(totalScore as number) : '-';
      const standing = hasAnyScore ? ((totalScore as number) >= 50 ? 'Passed' : 'Needs Improvement') : 'Ungraded';

      return [
        student.rollNumber,
        student.fullName,
        adminSelectedClass.name,
        adminResultsSelectedSubject,
        selectedResultsTerm,
        selectedResultsSession,
        ca1Val !== '' ? ca1Val : '-',
        midVal !== '' ? midVal : '-',
        ca2Val !== '' ? ca2Val : '-',
        examVal !== '' ? examVal : '-',
        totalScore !== '' ? totalScore : '-',
        letterGrade,
        standing
      ];
    });

    const cleanClass = adminSelectedClass.name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSub = adminResultsSelectedSubject.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanTerm = selectedResultsTerm.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanSession = selectedResultsSession.replace(/[^a-zA-Z0-9]/g, '_');

    downloadCSV(`results_ledger_${cleanClass}_${cleanSub}_${cleanTerm}_${cleanSession}`, headers, rows);
  };

  const handleExportGradesCSV = () => {
    const headers = [
      'Student ID',
      'Student Name',
      'Roll Number',
      'Class Name',
      'Class Code',
      'Subject Name', 
      'Academic Term',
      'Academic Session',
      'Category',
      'Assignment Name',
      'Score',
      'Letter Grade',
      'Recorded Date',
      'Teacher Feedback'
    ];

    const rows = dbState.grades.map(grade => {
      const student = dbState.students.find(s => s.id === grade.studentId);
      const classItem = dbState.classes.find(c => c.id === grade.classId);
      const subject = grade.subjectName || classItem?.name || 'N/A';
      
      return [
        grade.studentId,
        student?.fullName || 'Unknown Student',
        student?.rollNumber || 'N/A',
        classItem?.name || 'N/A',
        classItem?.code || 'N/A',
        subject,
        grade.term || '1st Term',
        grade.session || '2025/2026',
        grade.category,
        grade.assignmentName,
        grade.score,
        getStoredLetterGrade(grade.score),
        grade.date,
        grade.feedback || ''
      ];
    });

    downloadCSV('student_grades_registry_export', headers, rows);
  };

  const handleExportAttendanceCSV = () => {
    const headers = [
      'Student ID',
      'Student Name',
      'Roll Number',
      'Class Name',
      'Class Code',
      'Date',
      'Status',
      'Notes/Remarks'
    ];

    const rows = dbState.attendance.map(att => {
      const student = dbState.students.find(s => s.id === att.studentId);
      const classItem = dbState.classes.find(c => c.id === att.classId);
      
      return [
        att.studentId,
        student?.fullName || 'Unknown Student',
        student?.rollNumber || 'N/A',
        classItem?.name || 'N/A',
        classItem?.code || 'N/A',
        att.date,
        att.status,
        att.notes || ''
      ];
    });

    downloadCSV('student_attendance_log', headers, rows);
  };

  const handleExportEnrollmentCSV = () => {
    const headers = [
      'Enrollment ID',
      'Student ID',
      'Student Name',
      'Roll Number',
      'Grade Level',
      'Enrolled Class Name',
      'Enrolled Class Code',
      'Class Schedule',
      'Class Room'
    ];

    const rows = dbState.enrollments.map(enr => {
      const student = dbState.students.find(s => s.id === enr.studentId);
      const classItem = dbState.classes.find(c => c.id === enr.classId);
      
      return [
        enr.id,
        enr.studentId,
        student?.fullName || 'Unknown Student',
        student?.rollNumber || 'N/A',
        student?.gradeLevel || 'N/A',
        classItem?.name || 'N/A',
        classItem?.code || 'N/A',
        classItem?.schedule || 'N/A',
        classItem?.room || 'N/A'
      ];
    });

    downloadCSV('student_enrollment_data', headers, rows);
  };

  const handleExportTeachersCSV = () => {
    const headers = [
      'Teacher ID',
      'Full Name',
      'Email Address',
      'Department/Faculty',
      'Contact Phone',
      'Assigned Subjects',
      'Recruitment Status'
    ];

    const rows = dbState.teachers.map(t => {
      const subjectsList = t.subjects ? t.subjects.join('; ') : 'N/A';
      return [
        t.id,
        t.fullName,
        t.email,
        t.department,
        t.phone || 'N/A',
        subjectsList,
        t.status || 'Recruited/Active'
      ];
    });

    downloadCSV('teacher_recruitment_roster', headers, rows);
  };

  const [isExportingJson, setIsExportingJson] = useState(false);

  const handleExportCloudSqlJSON = async () => {
    try {
      setIsExportingJson(true);
      // Retrieve current state from Cloud SQL API or live database engine
      let exportData: DbState = db.getRawData();
      try {
        const response = await fetch('/api/db/state');
        if (response.ok) {
          const jsonRes = await response.json();
          if (jsonRes && jsonRes.data) {
            exportData = jsonRes.data;
          }
        }
      } catch (networkErr) {
        console.warn('Using live in-memory state for Cloud SQL JSON export fallback:', networkErr);
      }

      const timestamp = new Date().toISOString();
      const filenameDate = timestamp.replace(/[:.]/g, '-');
      
      const backupPayload = {
        metadata: {
          exportType: 'Full Cloud SQL Database Backup',
          engine: 'PostgreSQL (Google Cloud SQL)',
          region: 'europe-west2',
          exportedAt: timestamp,
          schoolName: settingsSchoolName || 'RoyalPath College',
          version: '2.0',
          recordCounts: {
            users: exportData.users?.length || 0,
            students: exportData.students?.length || 0,
            teachers: exportData.teachers?.length || 0,
            parents: exportData.parents?.length || 0,
            classes: exportData.classes?.length || 0,
            grades: exportData.grades?.length || 0,
            attendance: exportData.attendance?.length || 0,
            enrollments: exportData.enrollments?.length || 0,
            settingsCount: Object.keys(exportData.settings || {}).length,
          }
        },
        databaseState: exportData
      };

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `cloudsql_school_backup_${filenameDate}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerToast('Full Cloud SQL Database Backup (JSON) exported and downloaded successfully!');
    } catch (err: any) {
      console.error('Error exporting Cloud SQL JSON:', err);
      triggerToast('Failed to export Cloud SQL database backup. Please try again.', true);
    } finally {
      setIsExportingJson(false);
    }
  };

  // Pre-load attendance roster records when class or date triggers change
  React.useEffect(() => {
    if (selectedAttendanceClassId && attendanceDate) {
      const records = db.getAttendanceForClass(selectedAttendanceClassId).filter(a => a.date === attendanceDate);
      const initialMap: Record<string, { status: AttendanceStatus; notes: string }> = {};
      records.forEach(r => {
        initialMap[r.studentId] = { status: r.status, notes: r.notes || '' };
      });
      setAttendanceStatuses(initialMap);
    }
  }, [selectedAttendanceClassId, attendanceDate, dbState.attendance]);

  // --- ACTIONS ---
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (dbState.classes.length >= settingsMaxClassesLimit) {
      triggerToast(`Unable to create: You have reached the maximum class limit of ${settingsMaxClassesLimit}. You can adjust this limit in system settings.`, true);
      return;
    }
    if (!newClassName || !newClassCode || !newClassTeacherId || !newClassSchedule || !newClassRoom) {
      triggerToast('All fields are required to organize class sessions.', true);
      return;
    }
    try {
      db.createClass(newClassName, newClassCode, newClassTeacherId, newClassSchedule, newClassRoom);
      triggerToast(`Class/Session "${newClassName}" created and scheduled successfully!`);
      setNewClassName('');
      setNewClassCode('');
      setNewClassTeacherId('');
      setNewClassSchedule('');
      setNewClassRoom('');
      refreshState();
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred during class creation', true);
    }
  };

  const handleCreateClassFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (dbState.classes.length >= settingsMaxClassesLimit) {
      triggerToast(`Unable to create: You have reached the maximum class limit of ${settingsMaxClassesLimit}. You can adjust this limit in system settings.`, true);
      return;
    }
    if (!newClassName || !newClassCode) {
      triggerToast('Class name and subject code are required.', true);
      return;
    }
    try {
      db.createClass(
        newClassName, 
        newClassCode, 
        newClassTeacherId, 
        newClassSchedule || 'Mon, Wed, Fri 09:00 - 10:15', 
        newClassRoom || 'Room 101',
        newClassFee,
        newClassExtraFee,
        newClassPromotionStatus,
        newClassLevelOfEducation
      );
      triggerToast(`Class "${newClassName}" registered successfully!`);
      // Reset forms
      setNewClassName('');
      setNewClassCode('');
      setNewClassTeacherId('');
      setNewClassSchedule('');
      setNewClassRoom('');
      setNewClassFee(0);
      setNewClassExtraFee(0);
      setNewClassPromotionStatus('Auto');
      setNewClassLevelOfEducation('Junior Secondary');
      setIsAddClassModalOpen(false);
      refreshState();
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred during class creation', true);
    }
  };

  const handleSaveEditedClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassId || !editClassName || !editClassCode) {
      triggerToast('Class Name and Code are required to update.', true);
      return;
    }
    try {
      db.updateClass(editingClassId, {
        name: editClassName,
        code: editClassCode,
        teacherId: editClassTeacherId,
        schedule: editClassSchedule,
        room: editClassRoom,
        classFee: editClassFee,
        extraFee: editClassExtraFee,
        promotionStatus: editClassPromotionStatus,
        levelOfEducation: editClassLevelOfEducation
      });
      triggerToast(`Class details updated: "${editClassName}"`);
      setIsEditClassModalOpen(false);
      setEditingClassId(null);
      refreshState();
    } catch (err: any) {
      triggerToast(err.message || 'Error saving class updates.', true);
    }
  };

  const startEditingClass = (cls: Class) => {
    setEditingClassId(cls.id);
    setEditClassName(cls.name);
    setEditClassCode(cls.code);
    setEditClassTeacherId(cls.teacherId || '');
    setEditClassSchedule(cls.schedule);
    setEditClassRoom(cls.room);
    setEditClassFee(cls.classFee || 0);
    setEditClassExtraFee(cls.extraFee || 0);
    setEditClassPromotionStatus(cls.promotionStatus || 'Auto');
    setEditClassLevelOfEducation(cls.levelOfEducation || 'Junior Secondary');
    setIsEditClassModalOpen(true);
    setActiveRowMenuClassId(null);
  };

  const handleDeleteClassConfirm = (clsId: string, clsName: string) => {
    requestConfirm({
      title: 'Delete Class',
      message: `Are you sure you want to completely delete the class "${clsName}"? This will unenroll all students and remove associated records.`,
      confirmText: 'Delete Class',
      isDestructive: true,
      onConfirm: () => {
        db.deleteClass(clsId);
        triggerToast(`Class "${clsName}" deleted successfully.`);
        setActiveRowMenuClassId(null);
        refreshState();
      }
    });
  };

  const getSubjectCountForClass = (clsName: string, teacherIdStr: string, classId?: string) => {
    if (classId && subjectsAssignedOverride[classId]) {
      return subjectsAssignedOverride[classId].length;
    }
    const nameUpper = clsName.toUpperCase();
    if (nameUpper.includes('JSS') || nameUpper.includes('JUNIOR')) {
      return settingsJssSubjects.length || 15;
    }
    if (nameUpper.includes('SSS') || nameUpper.includes('SENIOR')) {
      return settingsSssSubjects.length || 26;
    }
    if (nameUpper.includes('BASIC') || nameUpper.includes('6')) {
      return 18;
    }
    const teacher = dbState.teachers.find(t => t.id === teacherIdStr);
    if (teacher && teacher.subjects) {
      return teacher.subjects.length || 12;
    }
    return 12;
  };

  const getPromotionStatus = (className: string) => {
    const name = className.toUpperCase().replace(/\s+/g, '');
    if (name.includes('BASIC6') || name.includes('GRADE6')) {
      return { label: '→ JSS 1', type: 'promote' };
    } else if (name.includes('JSS1')) {
      return { label: '→ JSS 2', type: 'promote' };
    } else if (name.includes('JSS2')) {
      return { label: '→ JSS 3', type: 'promote' };
    } else if (name.includes('JSS3')) {
      return { label: '→ SSS 1', type: 'promote' };
    } else if (name.includes('SSS1') || name.includes('SS1')) {
      return { label: '→ SSS 2', type: 'promote' };
    } else if (name.includes('SSS2') || name.includes('SS2')) {
      return { label: '→ SSS 3', type: 'promote' };
    } else if (name.includes('SSS3') || name.includes('SS3')) {
      return { label: 'Archive (Graduated / Completed)', type: 'archive' };
    } else if (name.includes('ALGEBRA')) {
      return { label: '→ Calculus AB', type: 'promote' };
    } else {
      return { label: 'Archive (Graduated / Completed)', type: 'archive' };
    }
  };

  const isFinalYearClass = (className: string) => {
    const name = className.toUpperCase().replace(/\s+/g, '');
    return (
      name.includes('SS3') ||
      name.includes('SSS3') ||
      name.includes('GRADE12') ||
      name.includes('YEAR12') ||
      name.includes('BASIC6') ||
      name.includes('FINAL')
    );
  };

  const getStudentCountForClass = (cls: Class) => {
    return db.getStudentsInClass(cls.id).length;
  };

  const getClassFeeForClass = (cls: Class) => {
    if (cls.classFee !== undefined) {
      return cls.classFee === 0 ? '₦0' : `₦${cls.classFee.toLocaleString()}`;
    }
    return '₦0';
  };

  const getExtraFeeForClass = (cls: Class) => {
    if (cls.extraFee !== undefined) {
      return cls.extraFee;
    }
    return 0;
  };

  const getTeachersDisplay = (cls: Class) => {
    const isJunior = cls.name.toUpperCase().includes('JSS') || cls.name.toUpperCase().includes('JUNIOR');
    const count = isJunior ? 2 : 1;
    return (
      <div className="flex items-center gap-1.5 text-slate-600 font-sans">
        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-700">{count}</span>
        <div className="flex items-center gap-1 ml-1">
          <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
            1P
          </span>
          {isJunior && (
            <span className="bg-purple-50 border border-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
              1A
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleBatchPromoteStudents = (sourceClassId: string, targetClassId: string, customStudentIds?: string[]) => {
    if (!sourceClassId || !targetClassId) {
      triggerToast('Please select both a source class and target destination track.', true);
      return;
    }
    if (targetClassId !== 'archive' && sourceClassId === targetClassId) {
      triggerToast('Source and target classes cannot be the same.', true);
      return;
    }

    const allEnrolledStudents = dbState.enrollments.filter(e => e.classId === sourceClassId);
    if (allEnrolledStudents.length === 0) {
      triggerToast('No students enrolled in the source class to promote or archive.', true);
      return;
    }

    const targetIds = customStudentIds !== undefined ? customStudentIds : selectedStudentIdsForPromotion;
    const studentIdsToPromote = allEnrolledStudents
      .filter(e => targetIds.includes(e.studentId))
      .map(e => e.studentId);

    if (studentIdsToPromote.length === 0) {
      triggerToast('Please select at least one student candidate.', true);
      return;
    }

    const sourceClass = dbState.classes.find(c => c.id === sourceClassId);
    if (!sourceClass) {
      triggerToast('Invalid source class specified.', true);
      return;
    }

    // Archiving / Graduation Flow
    if (targetClassId === 'archive') {
      const activeSession = db.getSetting<string>('settings_academic_session', '2026/2027');
      const graduationYear = `Class of ${activeSession?.split('/')[1] || '2027'} (${activeSession || ''})`;
      const archivedCount = db.batchArchiveStudents(studentIdsToPromote, sourceClassId, graduationYear);
      const unarchivedCount = allEnrolledStudents.length - archivedCount;
      const successMsg = unarchivedCount > 0
        ? `Successfully archived ${archivedCount} student(s) from ${sourceClass.name} upon completing the academic calendar (${unarchivedCount} retained in ${sourceClass.name}).`
        : `Successfully graduated and archived all ${archivedCount} students from ${sourceClass.name} to the permanent Archive Registry!`;

      triggerToast(successMsg);
      refreshState();
      setViewingClassForPromotion(null);
      setPromotionTargetClassId('');
      setSelectedStudentIdsForPromotion([]);
      setPromotionSearchQuery('');
      return;
    }

    const targetClass = dbState.classes.find(c => c.id === targetClassId);
    if (!targetClass) {
      triggerToast('Invalid destination class specified.', true);
      return;
    }

    // Execute atomic promotion in database service
    const promotedCount = db.batchPromoteStudents(studentIdsToPromote, sourceClassId, targetClassId);

    const unpromotedCount = allEnrolledStudents.length - promotedCount;
    const successMsg = unpromotedCount > 0
      ? `Successfully promoted ${promotedCount} student(s) from ${sourceClass.name} to ${targetClass.name} (${unpromotedCount} retained in ${sourceClass.name}).`
      : `Successfully promoted all ${promotedCount} students from ${sourceClass.name} to ${targetClass.name}!`;

    triggerToast(successMsg);
    refreshState();
    setViewingClassForPromotion(null);
    setPromotionTargetClassId('');
    setSelectedStudentIdsForPromotion([]);
    setPromotionSearchQuery('');
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const isTeacher = newStaffRole === 'teacher';
    if (!newTeacherName || !newTeacherEmail || (isTeacher && !newTeacherDept)) {
      triggerToast(isTeacher ? 'Name, Email and Department are required.' : 'Name and Email are required for Administrator.', true);
      return;
    }
    const exists = dbState.users.find(u => u.email.toLowerCase() === newTeacherEmail.toLowerCase().trim());
    if (exists) {
      triggerToast('A user with this academic email already exists.', true);
      return;
    }

    const newUser = db.signUp(newTeacherEmail, newTeacherName, newStaffRole, newStaffPermissions);
    
    if (isTeacher && newUser) {
      db.updateTeacherInfo(newUser.id, newTeacherDept, newTeacherPhone || undefined);
    }

    triggerToast(`${newStaffRole === 'admin' ? 'Administrator' : 'Teacher'} Account for "${newTeacherName}" registered successfully!`);
    setNewTeacherName('');
    setNewTeacherEmail('');
    setNewTeacherDept('');
    setNewTeacherPhone('');
    setNewStaffRole('teacher');
    setNewStaffPermissions([
      'mark_attendance',
      'upload_scores',
      'upload_notes',
      'create_assessments',
      'enter_comments',
      'view_edit_form_class',
      'view_edit_subject'
    ]);
    refreshState();
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newStudentGrade || !newStudentBirth || !newStudentRoll) {
      triggerToast('Full name, class, birth date, and roll number unique ID are required.', true);
      return;
    }

    const trimmedRoll = newStudentRoll.trim();
    const rollExists = dbState.students.some(s => s.rollNumber.toLowerCase() === trimmedRoll.toLowerCase());
    if (rollExists) {
      triggerToast(`Student with roll number "${trimmedRoll}" is already registered.`, true);
      return;
    }

    db.createStudent(
      newStudentName,
      newStudentGrade,
      trimmedRoll,
      newStudentBirth,
      newStudentParentId ? newStudentParentId : undefined
    );

    triggerToast(`Student "${newStudentName}" has been successfully admitted under ID "${trimmedRoll}".`);
    setNewStudentName('');
    setNewStudentGrade('');
    setNewStudentRoll('');
    setNewStudentBirth('');
    setNewStudentParentId('');
    refreshState();
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentId) return;

    if (!editStudentName || !editStudentGrade || !editStudentBirth || !editStudentRoll) {
      triggerToast('Full name, class, ID (Roll Number), and birth date are required.', true);
      return;
    }

    const otherRollExists = dbState.students.some(
      s => s.id !== editingStudentId && s.rollNumber.toLowerCase() === editStudentRoll.toLowerCase().trim()
    );
    if (otherRollExists) {
      triggerToast(`Another student with roll number "${editStudentRoll}" is already registered.`, true);
      return;
    }

    const updated = db.updateStudent(editingStudentId, {
      fullName: editStudentName,
      gradeLevel: editStudentGrade,
      rollNumber: editStudentRoll,
      birthDate: editStudentBirth,
    });

    if (updated) {
      triggerToast(`Student details for "${editStudentName}" updated successfully.`);
      setEditingStudentId(null);
      refreshState();
    } else {
      triggerToast('Failed to update student details.', true);
    }
  };

  const handleCreateParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParentName || !newParentEmail || !newParentPhone) {
      triggerToast('Name, email, and contact phone are required.', true);
      return;
    }

    const emailExists = dbState.users.some(u => u.email === newParentEmail.toLowerCase().trim());
    if (emailExists) {
      triggerToast('A user with this parent email already exists.', true);
      return;
    }

    db.signUp(newParentEmail, newParentName, 'parent', newParentPermissions);
    
    const raw = db.getRawData();
    const pIndex = raw.parents.findIndex(p => p.email.toLowerCase() === newParentEmail.toLowerCase().trim());
    if (pIndex !== -1) {
      const parentId = raw.parents[pIndex].id;
      raw.parents[pIndex].phone = newParentPhone;
      localStorage.setItem('school_management_system_db', JSON.stringify(raw));

      // Link onboarding selected wards
      newParentSelectedWards.forEach(studentId => {
        db.linkStudentToParent(studentId, parentId);
      });
    }

    triggerToast(`Parent login profile for "${newParentName}" activated successfully with linked wards.`);
    setNewParentName('');
    setNewParentEmail('');
    setNewParentPhone('');
    setNewParentSelectedWards([]);
    setNewParentPermissions([]);
    setOnboardingWardSearch('');
    refreshState();
  };

  const handleLinkWard = (studentId: string, parentId: string) => {
    try {
      db.linkStudentToParent(studentId, parentId);
      const studentName = dbState.students.find(s => s.id === studentId)?.fullName || 'Student';
      const parentName = dbState.parents.find(p => p.id === parentId)?.fullName || 'Parent';
      triggerToast(`Linked "${studentName}" under the custody of "${parentName}"!`);
      refreshState();
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred during linking.', true);
    }
  };

  const handleUnlinkWard = (studentId: string) => {
    try {
      const studentName = dbState.students.find(s => s.id === studentId)?.fullName || 'Student';
      db.unlinkStudentFromParent(studentId);
      triggerToast(`Removed guardian custody link for "${studentName}".`);
      refreshState();
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred during unlinking.', true);
    }
  };

  const handleDeleteParent = (parentId: string) => {
    try {
      const parent = dbState.parents.find(p => p.id === parentId);
      if (!parent) return;
      requestConfirm({
        title: 'Delete Guardian Account',
        message: `Are you sure you want to completely remove parent/guardian "${parent.fullName}"? This will delete their user login account and clear their children's custody linkages.`,
        confirmText: 'Delete Guardian',
        isDestructive: true,
        onConfirm: () => {
          db.deleteUser(parentId);
          triggerToast(`Guardian "${parent.fullName}" has been deleted.`);
          refreshState();
        }
      });
    } catch (err: any) {
      triggerToast(err.message || 'Error occurred during deletion.', true);
    }
  };

  // --- TERM MANAGEMENT HANDLERS ---
  const handleSaveTermConfig = (termNum: 1 | 2 | 3, start: string, end: string) => {
    db.saveSetting(`term${termNum}_start_date`, start);
    db.saveSetting(`term${termNum}_end_date`, end);
    db.saveSetting(`term${termNum}_configured`, 'true');
    if (termNum === 1) setIsTerm1Configured(true);
    if (termNum === 2) setIsTerm2Configured(true);
    if (termNum === 3) setIsTerm3Configured(true);
    triggerToast(`${getTermOrdinal(termNum)} Term dates saved successfully!`);
  };

  const getTermOrdinal = (n: number) => {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return '';
  };

  const displayFormattedDate = (dateStr: string, fallback: string) => {
    const d = dateStr || fallback;
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return d;
  };

  const handleActivateTermPeriod = (session: string, term: string) => {
    db.saveSetting('academic_session', session);
    db.saveSetting('current_term', term);
    db.saveSetting('next_term_commence_date', nextTermCommenceInput);
    localStorage.setItem('next_term_commence_date', nextTermCommenceInput);
    setTermSessionInput(session);
    setTermActiveTermInput(term);
    triggerToast(`Academic term updated! Active period is now ${term} of ${session}.`);
  };

  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollStudentId || !selectedEnrollClassId) {
      triggerToast('Please select both a student and a class.', true);
      return;
    }

    db.enrollStudentInClass(selectedEnrollStudentId, selectedEnrollClassId);
    
    const stud = dbState.students.find(s => s.id === selectedEnrollStudentId);
    const cls = dbState.classes.find(c => c.id === selectedEnrollClassId);
    
    triggerToast(`Enrolled "${stud?.fullName}" into "${cls?.name}" successfully.`);
    setSelectedEnrollStudentId('');
    setSelectedEnrollClassId('');
    refreshState();
  };

  const handleUnenroll = (studentId: string, classId: string) => {
    db.unenrollStudentFromClass(studentId, classId);
    triggerToast('Student unrolled from the selected course module.');
    refreshState();
  };

  // --- RESULT MANAGEMENT ACTIONS ---
  const handleAddResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradeClassId || !selectedGradeStudentId || !selectedGradeSubject || !newGradeAssignmentName || newGradeScore === '') {
      triggerToast('Required fields: Class, Student, Subject, Assignment/Grade Title & Numerical Score.', true);
      return;
    }

    const scoreNum = parseFloat(newGradeScore);
    let maxLimit = 100;
    if (newGradeCategory === 'exam') maxLimit = 60;
    if (newGradeCategory === 'ca') maxLimit = 20;
    if (newGradeCategory === 'ca1') maxLimit = 10;
    if (newGradeCategory === 'ca2') maxLimit = 10;
    if (newGradeCategory === 'mid_term' || newGradeCategory === 'midterm') maxLimit = 20;

    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > maxLimit) {
      triggerToast(`The result score must be a number between 0 and ${maxLimit} for category ${newGradeCategory}.`, true);
      return;
    }

    let finalDate = new Date().toISOString().split('T')[0];
    if (resultsSubView === 'ledger') {
      if (selectedResultsTerm === '1st Term') finalDate = term1Start;
      if (selectedResultsTerm === '2nd Term') finalDate = term2Start;
      if (selectedResultsTerm === '3rd Term') finalDate = term3Start;
    }

    db.addGrade({
      studentId: selectedGradeStudentId,
      classId: selectedGradeClassId,
      assignmentName: newGradeAssignmentName,
      score: scoreNum,
      category: newGradeCategory,
      date: finalDate,
      feedback: newGradeFeedback ? newGradeFeedback : undefined,
      subjectName: selectedGradeSubject
    });

    const stud = dbState.students.find(s => s.id === selectedGradeStudentId);
    triggerToast(`Added ${newGradeCategory} score of ${scoreNum}% for ${stud?.fullName} in ${selectedGradeSubject}!`);

    // Reset fields except Selected Class & Subject as they might key in grade for other students
    setSelectedGradeStudentId('');
    setNewGradeAssignmentName('');
    setNewGradeScore('');
    setNewGradeFeedback('');
    refreshState();
  };

  const handleDeleteResult = (gradeId: string) => {
    requestConfirm({
      title: 'Delete Grade Entry',
      message: 'Are you sure you want to delete this result entry? This cannot be undone.',
      confirmText: 'Delete Result',
      isDestructive: true,
      onConfirm: () => {
        db.deleteGrade(gradeId);
        triggerToast('Grade entry successfully deleted.');
        refreshState();
      }
    });
  };

  // --- ATTENDANCE MANAGEMENT ACTIONS ---
  const handleSaveAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendanceClassId || !attendanceDate) {
      triggerToast('Select class and target registry date first.', true);
      return;
    }

    const classStudents = db.getStudentsInClass(selectedAttendanceClassId);
    if (classStudents.length === 0) {
      triggerToast('No students enrolled in this class to record attendance.', true);
      return;
    }

    classStudents.forEach(s => {
      const formVal = attendanceStatuses[s.id] || { status: 'present', notes: '' };
      db.recordAttendance(s.id, selectedAttendanceClassId, attendanceDate, formVal.status, formVal.notes);
    });

    triggerToast(`Attendance roster updated for ${attendanceDate}!`);
    refreshState();
  };

  const setSingleAttendanceStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || ''
      }
    }));
  };

  const setSingleAttendanceNotes = (studentId: string, notes: string) => {
    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'present',
        notes
      }
    }));
  };

  const handleEditAttendanceLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendanceRecord) return;
    db.recordAttendance(
      editingAttendanceRecord.studentId,
      editingAttendanceRecord.classId,
      editingAttendanceRecord.date,
      editAttendanceStatus,
      editAttendanceNotes
    );
    triggerToast('Attendance record updated successfully!');
    setEditingAttendanceRecord(null);
    refreshState();
  };

  const handleDeleteAttendanceLog = (id: string) => {
    requestConfirm({
      title: 'Delete Attendance Log',
      message: 'Are you sure you want to delete this attendance log entry?',
      confirmText: 'Delete Log',
      isDestructive: true,
      onConfirm: () => {
        db.deleteAttendance(id);
        triggerToast('Attendance log entry deleted successfully.');
        refreshState();
      }
    });
  };

  const downloadAttendanceCSV = () => {
    const filteredLogs = dbState.attendance.filter(a => {
      return attendanceViewClassId ? a.classId === attendanceViewClassId : true;
    });

    if (filteredLogs.length === 0) {
      triggerToast('No attendance logs found in the current view to download.', true);
      return;
    }

    const headers = ['Student Name', 'Roll Number', 'Class Name', 'Class Code', 'Date', 'Status', 'Notes'];

    const rows = filteredLogs.map(rec => {
      const student = dbState.students.find(s => s.id === rec.studentId);
      const cls = dbState.classes.find(c => c.id === rec.classId);
      
      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
      
      return [
        escape(student?.fullName || 'Unknown Student'),
        escape(student?.rollNumber || ''),
        escape(cls?.name || ''),
        escape(cls?.code || ''),
        escape(rec.date),
        escape(rec.status),
        escape(rec.notes || '')
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const classNameStr = attendanceViewClassId 
      ? (dbState.classes.find(c => c.id === attendanceViewClassId)?.name || 'FilteredClass').replace(/[^a-z0-9]/gi, '_') 
      : 'All_Classes';
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Logs_${classNameStr}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerToast('Attendance CSV logs downloaded successfully!');
  };

  // Count aggregate platform metrics
  const totalClasses = dbState.classes.length;
  const totalTeachers = dbState.teachers.length;
  const totalStudents = dbState.students.length;
  const totalParents = dbState.parents.length;

  const sidebarItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard, color: 'text-indigo-500' },
    { id: 'classes', label: 'All Classes', icon: Layers, color: 'text-indigo-600 font-bold' },
    { id: 'sessions', label: 'Add New Session/Term', icon: CalendarPlus, color: 'text-violet-500' },
    { id: 'results', label: 'Result Management', icon: Award, color: 'text-emerald-500' },
    { id: 'attendance', label: 'Attendance Management', icon: ClipboardCheck, color: 'text-sky-500' },
    { id: 'teachers', label: 'Teacher Management', icon: Users, color: 'text-teal-500' },
    { id: 'students', label: 'Student Management', icon: GraduationCap, color: 'text-amber-500' },
    { id: 'parents', label: 'Parent Management', icon: Building, color: 'text-rose-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-slate-550' }
  ] as const;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast Notification Banners */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-emerald-600 border border-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-100 shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-rose-600 border border-rose-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md"
          >
            <AlertCircle className="w-5 h-5 text-rose-100 shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* SIDEBAR PANEL */}
        <div className="col-span-12 lg:col-span-3 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6 lg:sticky lg:top-4">
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-6">
            <div className={`p-2 rounded-[22px] border-2 ${getThemeColorClass(settingsColorTheme, 'border_light')} ${getThemeColorClass(settingsColorTheme, 'bg_light')} shrink-0 w-[108px] h-[108px] flex items-center justify-center overflow-hidden shadow-xs hover:scale-105 transition-transform duration-300`}>
              <SchoolLogo src={settingsSchoolLogo} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight leading-snug break-words" title={settingsSchoolName}>
                {settingsSchoolName}
              </h2>
              <p className={`text-[10px] font-mono font-extrabold ${getThemeColorClass(settingsColorTheme, 'text_primary')} uppercase tracking-wider mt-0.5`}>SMS Control Panel</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  id={`sidebar-${item.id}`}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-lg' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : item.color}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-3.5">
            <div className="flex items-center gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100/30">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={adminName}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-1.5 bg-slate-200 rounded-full text-slate-500 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-800 truncate">{settingsPrincipalName || adminName}</p>
                <p className="text-[9px] text-slate-400 truncate">Administrator Account</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              id="sidebar-btn-logout"
              className="w-full px-4 py-3 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-700 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Workspace</span>
            </button>
          </div>
        </div>

        {/* MAIN PANEL CONTENT */}
        <div className="col-span-12 lg:col-span-9 space-y-6 min-w-0">
          
          {/* HEADER / BANNER */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <div className={`flex items-center gap-2 ${getThemeColorClass(settingsColorTheme, 'text_primary')} font-mono text-xs font-bold uppercase tracking-wider mb-1`}>
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>{settingsSchoolName} Administrative Workspace</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                {sidebarItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                {settingsPrincipalName}'s centralized roster scheduling and academic data registry.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100/40 rounded-xl text-indigo-700 font-extrabold text-xs flex items-center gap-1.5 shadow-sm">
                <CalendarPlus className="w-3.5 h-3.5 text-indigo-500" />
                <span>{termActiveTermInput} ({termSessionInput})</span>
              </div>
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 font-extrabold text-xs flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Active Portal</span>
              </div>
            </div>
          </div>

          {/* VIEW CONTROLLER BLOCK */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Metric Counters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Classes Registered', value: totalClasses, icon: BookOpen, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                  { label: 'Active Faculty', value: totalTeachers, icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Admitted Students', value: totalStudents, icon: GraduationCap, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                  { label: 'Guardians List', value: totalParents, icon: Building, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div 
                      key={i} 
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow"
                    >
                      <div className={`p-4 rounded-xl border ${stat.color} hidden sm:block shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider leading-none">{stat.label}</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mt-1">{stat.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Stats & Charts block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Recent Activities Panel */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>Academic Statistics Overview</span>
                    </h3>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Automatic</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex justify-between items-center text-xs text-slate-600">
                      <span>Assigned Class Ratios:</span>
                      <strong className="text-slate-800 font-bold font-mono">{(totalClasses / (totalTeachers || 1)).toFixed(1)} modules/Faculty</strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex justify-between items-center text-xs text-slate-600">
                      <span>Students enrolled count:</span>
                      <strong className="text-slate-800 font-bold font-mono">{dbState.enrollments.length} Active</strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex justify-between items-center text-xs text-slate-600">
                      <span>Total grades recorded:</span>
                      <strong className="text-slate-800 font-bold font-mono">{dbState.grades.length} Grades</strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex justify-between items-center text-xs text-slate-600">
                      <span>Parental Linked Ratios:</span>
                      <strong className="text-slate-800 font-bold font-mono">{dbState.students.filter(s => s.parentId).length} / {totalStudents} students</strong>
                    </div>
                  </div>
                </div>

                {/* Quick Shortcuts Panel */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Quick Administrative Tasks</span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">Jump straight into custom administrative dashboards with just one click:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {[
                      { id: 'sessions', name: 'Open Sessions', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold text-xs p-2.5 rounded-xl border border-violet-100 text-center transition-all' },
                      { id: 'results', name: 'Post Grades', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs p-2.5 rounded-xl border border-emerald-100 text-center transition-all' },
                      { id: 'attendance', name: 'Mark Attendance', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-xs p-2.5 rounded-xl border border-sky-100 text-center transition-all' },
                      { id: 'students', name: 'Admit Students', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs p-2.5 rounded-xl border border-amber-100 text-center transition-all' }
                    ].map((act) => (
                      <button
                        key={act.id}
                        onClick={() => setActiveTab(act.id as TabType)}
                        className={`${act.color} cursor-pointer`}
                      >
                        {act.name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Data Portability & Backup Center */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Database className={`w-5 h-5 ${getThemeColorClass(settingsColorTheme, 'text_primary')}`} />
                      <span>Data Portability & Database Backups</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Export full Cloud SQL PostgreSQL database snapshots in JSON or download modular CSV spreadsheets.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportCloudSqlJSON}
                      disabled={isExportingJson}
                      className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 text-white shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${getThemeColorClass(settingsColorTheme, 'btn_primary')}`}
                    >
                      {isExportingJson ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>{isExportingJson ? 'Exporting...' : 'Export Cloud SQL (JSON)'}</span>
                    </button>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-full border border-slate-200/80">
                      Cloud SQL europe-west2
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      title: 'Student Grades Archive',
                      desc: 'Continuous assessments, exams, subject remarks, scores and letter grades.',
                      count: `${dbState.grades.length} Grades`,
                      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      action: handleExportGradesCSV,
                    },
                    {
                      title: 'Attendance Logs Database',
                      desc: 'Historical records of classroom check-ins, dates, active status, and comments.',
                      count: `${dbState.attendance.length} Records`,
                      badgeColor: 'bg-sky-50 text-sky-700 border-sky-100',
                      action: handleExportAttendanceCSV,
                    },
                    {
                      title: 'Enrollment Directory',
                      desc: 'Active student placements, roll numbers, class codes, scheduling, and rooms.',
                      count: `${dbState.enrollments.length} Placements`,
                      badgeColor: 'bg-violet-50 text-violet-700 border-violet-100',
                      action: handleExportEnrollmentCSV,
                    },
                    {
                      title: 'Faculty Recruitment Roster',
                      desc: 'Listing of recruited teachers, active emails, departments, and subjects.',
                      count: `${dbState.teachers.length} Faculty`,
                      badgeColor: 'bg-teal-50 text-teal-700 border-teal-100',
                      action: handleExportTeachersCSV,
                    }
                  ].map((card, i) => (
                    <div key={i} className="bg-slate-50/40 p-5 rounded-2xl border border-slate-200/50 flex flex-col justify-between hover:border-slate-300 transition-colors">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                            {card.count}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{card.title}</h4>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed text-slate-500">{card.desc}</p>
                      </div>
                      <div className="pt-4 mt-auto">
                        <button
                          onClick={card.action}
                          className={`w-full py-2 px-3 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-white cursor-pointer active:scale-95 ${getThemeColorClass(settingsColorTheme, 'btn_primary')}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* VIEW: ADD SESSIONS / TERMS */}
          {activeTab === 'sessions' && (
            <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs p-6 md:p-8 space-y-6">
              {/* Header bar matching the attachment */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Term Management</h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Configure your academic calendar and set the active term.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Clean custom pills to switch between Calendar Setup & Class Setup */}
                  <div className="bg-slate-105 bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                    <button
                      onClick={() => setSessionsSubTab('term')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${sessionsSubTab === 'term' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Calendar Setup
                    </button>
                    <button
                      onClick={() => setSessionsSubTab('classes')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${sessionsSubTab === 'classes' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Class Schedules ({dbState.classes.length})
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
                    title="Close & Return to Dashboard"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {sessionsSubTab === 'term' ? (
                /* TERM MANAGEMENT LAYOUT */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                  
                  {/* LEFT COLUMN: 1 Configure Term Dates */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border border-indigo-100 shadow-xs">
                        1
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">Configure Term Dates</h3>
                    </div>

                    {/* Term 1 Card */}
                    <div className="border border-slate-200/70 rounded-2xl p-4.5 bg-white relative transition-all space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">1st Term</span>
                        {isTerm1Configured ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            Configured
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 border border-amber-100 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 relative">
                          <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Start Date</label>
                          <div className="relative">
                            <input 
                              type="date"
                              value={term1Start}
                              onChange={(e) => setTerm1Start(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all pr-8 cursor-pointer"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1 relative">
                          <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">End Date</label>
                          <div className="relative">
                            <input 
                              type="date"
                              value={term1End}
                              onChange={(e) => setTerm1End(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all pr-8 cursor-pointer"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSaveTermConfig(1, term1Start, term1End)}
                        className="w-full bg-white text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/40 border border-indigo-200 hover:border-indigo-350 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Save 1st Term Dates
                      </button>
                    </div>

                    {/* Term 2 Card */}
                    <div className="border border-slate-200/70 rounded-2xl p-4.5 bg-white relative transition-all space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">2nd Term</span>
                        {isTerm2Configured ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            Configured
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 border border-amber-100 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 relative">
                          <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Start Date</label>
                          <div className="relative">
                            <input 
                              type="date"
                              value={term2Start}
                              onChange={(e) => setTerm2Start(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all pr-8 cursor-pointer"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1 relative">
                          <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">End Date</label>
                          <div className="relative">
                            <input 
                              type="date"
                              value={term2End}
                              onChange={(e) => setTerm2End(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all pr-8 cursor-pointer"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSaveTermConfig(2, term2Start, term2End)}
                        className="w-full bg-white text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/40 border border-indigo-200 hover:border-indigo-350 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Save 2nd Term Dates
                      </button>
                    </div>

                    {/* Term 3 Card */}
                    <div className="border border-slate-200/70 rounded-2xl p-4.5 bg-white relative transition-all space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">3rd Term</span>
                        {isTerm3Configured ? (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            Configured
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-600 border border-amber-100 font-bold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 relative">
                          <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">Start Date</label>
                          <div className="relative">
                            <input 
                              type="date"
                              value={term3Start}
                              onChange={(e) => setTerm3Start(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all pr-8 cursor-pointer"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1 relative">
                          <label className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase">End Date</label>
                          <div className="relative">
                            <input 
                              type="date"
                              value={term3End}
                              onChange={(e) => setTerm3End(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all pr-8 cursor-pointer"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSaveTermConfig(3, term3Start, term3End)}
                        className="w-full bg-white text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/40 border border-indigo-200 hover:border-indigo-350 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        Save 3rd Term Dates
                      </button>
                    </div>

                  </div>

                  {/* VERTICAL DIVIDER */}
                  <div className="hidden lg:block lg:col-span-1 border-r border-slate-100 self-stretch my-2"></div>

                  {/* RIGHT COLUMN: 2 Set Active Session */}
                  <div className="lg:col-span-4 bg-[#eff2fe]/80 border border-[#dee3fc]/70 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-white text-indigo-600 font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border border-indigo-100 shadow-xs">
                          2
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Set Active Session</h3>
                      </div>

                      <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                        Select the current academic session and term. This will update the dashboard and all school records to reflect the active period.
                      </p>

                      <div className="space-y-4 pt-2">
                        {/* Session selection */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#4f46e5]/80 uppercase tracking-wider">Academic Session</label>
                          <div className="relative">
                            <select
                              value={termSessionInput}
                              onChange={(e) => setTermSessionInput(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-700 focus:outline-[#6366f1] pr-10 appearance-none cursor-pointer"
                            >
                              {AVAILABLE_ACADEMIC_SESSIONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">▼</span>
                          </div>
                        </div>

                        {/* Current Term selection */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#4f46e5]/80 uppercase tracking-wider">Current Term</label>
                          <div className="relative">
                            <select
                              value={termActiveTermInput}
                              onChange={(e) => setTermActiveTermInput(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-700 focus:outline-[#6366f1] pr-10 appearance-none cursor-pointer"
                            >
                              <option value="1st Term">1st Term</option>
                              <option value="2nd Term">2nd Term</option>
                              <option value="3rd Term">3rd Term</option>
                            </select>
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none">▼</span>
                          </div>
                        </div>

                        {/* Next Term Commences Date */}
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-[#4f46e5]/80 uppercase tracking-wider">Next Term Commences</label>
                          <div className="relative">
                            <input
                              type="date"
                              value={nextTermCommenceInput}
                              onChange={(e) => setNextTermCommenceInput(e.target.value)}
                              className="w-full bg-white border border-slate-200 hover:border-slate-350 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 focus:outline-[#6366f1] transition-all pr-10 cursor-pointer"
                            />
                            <Calendar className="w-3.5 h-3.5 text-slate-450 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={() => handleActivateTermPeriod(termSessionInput, termActiveTermInput)}
                        className="w-full bg-[#404ce5] hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm tracking-wide transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center"
                      >
                        Activate Term
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                /* CLASS SCHEDULES LAYOUT */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                  <div className="lg:col-span-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center gap-2 mb-4">
                      <FolderPlus className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-800">Add New Session</h3>
                    </div>
                    <form onSubmit={handleCreateClass} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Curriculum Category</label>
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setSessionClassCategory('')}
                            className={`px-2 py-1 text-[10px] font-bold text-center rounded-lg transition-all cursor-pointer ${sessionClassCategory === '' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
                          >
                            General
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionClassCategory('jss')}
                            className={`px-2 py-1 text-[10px] font-bold text-center rounded-lg transition-all cursor-pointer ${sessionClassCategory === 'jss' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 hover:text-indigo-650'}`}
                          >
                            Junior Sec
                          </button>
                          <button
                            type="button"
                            onClick={() => setSessionClassCategory('sss')}
                            className={`px-2 py-1 text-[10px] font-bold text-center rounded-lg transition-all cursor-pointer ${sessionClassCategory === 'sss' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'}`}
                          >
                            Senior Sec
                          </button>
                        </div>
                      </div>

                      {sessionClassCategory !== '' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            {sessionClassCategory === 'jss' ? 'JSS' : 'SSS'} Subjects (Click to select & prefill)
                          </label>
                          <div className="flex flex-wrap gap-1 px-1.5 py-1.5 bg-white border border-slate-200/60 rounded-xl max-h-[110px] overflow-y-auto">
                            {(sessionClassCategory === 'jss' ? settingsJssSubjects : settingsSssSubjects).length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">No configured subjects. Go to Settings.</span>
                            ) : (
                              (sessionClassCategory === 'jss' ? settingsJssSubjects : settingsSssSubjects).map((sub) => (
                                <button
                                  type="button"
                                  key={sub}
                                  onClick={() => {
                                    const categoryLabel = sessionClassCategory === 'jss' ? ' (Junior)' : ' (Senior)';
                                    setNewClassName(`${sub}${categoryLabel}`);
                                    
                                    // Make a clean code from name initials
                                    const codePrefix = sub.split(' ')
                                      .map(w => w[0] || '')
                                      .join('')
                                      .replace(/[^A-Za-z]/g, '')
                                      .toUpperCase()
                                      .substring(0, 4);
                                    const suffixNum = sessionClassCategory === 'jss' ? '101' : '301';
                                    setNewClassCode(`${codePrefix}-${suffixNum}`);
                                  }}
                                  className="text-[10px] px-2 py-0.5 font-semibold rounded-md border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all text-slate-600 cursor-pointer"
                                  title={`Tap to select ${sub}`}
                                >
                                  {sub}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class Title</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Algebra I" 
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-[#404ce5]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject Code</label>
                        <input 
                          type="text" 
                          placeholder="e.g. MATH-101" 
                          value={newClassCode}
                          onChange={(e) => setNewClassCode(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 uppercase focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Faculty</label>
                        <select 
                          value={newClassTeacherId}
                          onChange={(e) => setNewClassTeacherId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="">-- Choose Instructor --</option>
                          {dbState.teachers.map((t) => (
                            <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Meeting Schedule</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Mon, Wed, Fri 09:00 - 10:15" 
                          value={newClassSchedule}
                          onChange={(e) => setNewClassSchedule(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Location / Room</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Room 201" 
                          value={newClassRoom}
                          onChange={(e) => setNewClassRoom(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Organize Code</span>
                      </button>
                    </form>
                  </div>
                  
                  <div className="lg:col-span-8 space-y-4">
                    <h3 className="text-base font-bold text-slate-800">Classrooms & Sessions List</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-slate-500 text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50">
                            <th className="py-3 px-4 font-bold uppercase tracking-wider">Course</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider">Instructor</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider">Schedule & Room</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider">Enrolled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dbState.classes.map((cls) => {
                            const teacherObj = dbState.teachers.find(t => t.id === cls.teacherId);
                            const studentCount = dbState.enrollments.filter(e => e.classId === cls.id).length;
                            return (
                              <tr key={cls.id} className="hover:bg-slate-50/30 transition-all">
                                <td className="py-4 px-4">
                                  <p className="font-bold text-slate-800">{cls.name}</p>
                                  <p className="text-xs font-mono text-slate-400 mt-0.5">{cls.code}</p>
                                </td>
                                <td className="py-4 px-4 font-semibold text-slate-700">
                                  {teacherObj ? teacherObj.fullName : <span className="text-rose-400 italic">Unassigned</span>}
                                </td>
                                <td className="py-4 px-4 text-xs font-sans text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{cls.schedule}</span>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1 text-slate-500">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{cls.room}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                    <Users className="w-3 h-3" />
                                    {studentCount} Students
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: ALL CLASSES PAGE (MATCHES IMAGE ATTACHMENT EXACTLY) */}
          {activeTab === 'classes' && (() => {
            const totalStudentsCount = dbState.classes.reduce(
              (sum, cls) => sum + getStudentCountForClass(cls),
              0
            );
            const totalSubjectsCount = dbState.classes.reduce(
              (sum, cls) => sum + getSubjectCountForClass(cls.name, cls.teacherId, cls.id),
              0
            );
            const totalClassesCount = dbState.classes.length;

            return (
              <div className="space-y-6">
                {/* Header Bar matching image */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-[#94a3b8]">Set Up</p>
                    <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight mt-0.5">Classes</h2>
                  </div>
                  
                  <div className="flex items-center gap-3 self-stretch sm:self-auto">
                    <button 
                      onClick={() => {
                        setIsArchivedStudentsOpen(true);
                        triggerToast('Opening Archived Students Registry...');
                      }}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold px-4.5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all cursor-pointer active:scale-95"
                    >
                      <Archive className="w-4 h-4 text-slate-400" />
                      <span>Archived Students</span>
                    </button>
                    <button 
                      onClick={() => setIsAddClassModalOpen(true)}
                      className="bg-[#3b44b6] hover:bg-indigo-800 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <span>Add New Class</span>
                    </button>
                  </div>
                </div>

                {/* Metric counters matching layout & numbers exactly */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Metric 1: Total Student */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Student</p>
                      <p className="text-3xl font-black text-slate-900 leading-none">{totalStudentsCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Metric 2: Total Subjects */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Subjects</p>
                      <p className="text-3xl font-black text-slate-900 leading-none">{totalSubjectsCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#36d399] flex items-center justify-center text-white shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Metric 3: Total Classes */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center justify-between shadow-xs hover:shadow-md transition-shadow">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Classes</p>
                      <p className="text-3xl font-black text-slate-900 leading-none">{totalClassesCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#ff6b6b] flex items-center justify-center text-white shrink-0">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Table card */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto font-sans">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-100/80 text-slate-400 font-bold">
                          <th className="py-4 px-6 uppercase tracking-wider text-[10px] text-slate-400 font-bold">Class Name</th>
                          <th className="py-4 px-6 uppercase tracking-wider text-[10px] text-slate-400 font-bold">Subjects</th>
                          <th className="py-4 px-6 uppercase tracking-wider text-[10px] text-slate-400 font-bold">Class Fee</th>
                          <th className="py-4 px-6 uppercase tracking-wider text-[10px] text-slate-400 font-bold">Extra Fee</th>
                          <th className="py-4 px-6 uppercase tracking-wider text-[10px] text-slate-400 font-bold">Students</th>
                          <th className="py-4 px-6 uppercase tracking-wider text-[10px] text-slate-400 font-bold">Teachers</th>
                          <th className="py-4 px-6 uppercase tracking-wider text-[10px] text-slate-400 font-bold">Promotion Status</th>
                          <th className="py-4 px-6 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
                        {dbState.classes.map((cls, index) => {
                          const promotionInfo = getPromotionStatus(cls.name);
                          const subjCount = getSubjectCountForClass(cls.name, cls.teacherId, cls.id);
                          const stCount = getStudentCountForClass(cls);
                          const displayClassFee = getClassFeeForClass(cls);
                          const displayExtraFee = getExtraFeeForClass(cls);
                          const isBottomRow = index >= Math.max(1, dbState.classes.length - 4);

                          return (
                            <tr key={cls.id} className="hover:bg-slate-50/50 transition-all group duration-150">
                              <td className="py-4.5 px-6 font-bold text-slate-805 text-sm">
                                {cls.name}
                              </td>
                              <td className="py-4.5 px-6 font-bold text-slate-700 font-mono text-xs sm:text-sm">
                                {subjCount}
                              </td>
                              <td className="py-4.5 px-6 text-slate-700 font-bold font-mono text-xs sm:text-sm">
                                {displayClassFee}
                              </td>
                              <td className="py-4.5 px-6 text-slate-705 font-medium font-mono text-xs sm:text-sm animate-fade-in">
                                {displayExtraFee}
                              </td>
                              <td className="py-4.5 px-6 text-slate-705 font-bold font-mono text-xs sm:text-sm">
                                {stCount}
                              </td>
                              <td className="py-4.5 px-6">
                                {getTeachersDisplay(cls)}
                              </td>
                              <td className="py-4.5 px-6">
                                {promotionInfo.type === 'final' ? (
                                  <span className="inline-flex items-center gap-1 bg-[#eff6ff] border border-blue-100 text-indigo-600 font-bold px-3.5 py-1 rounded-full text-xs">
                                    <ArrowLeft className="w-3.5 h-3.5 rotate-270" />
                                    <span>{promotionInfo.label}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-[#f0fdf4] border border-emerald-100 text-[#16a34a] font-bold px-3.5 py-1 rounded-full text-xs">
                                    <ArrowLeft className="w-3.5 h-3.5 rotate-270 text-[#22c55e]" />
                                    <span>{promotionInfo.label}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-4.5 px-6 text-right relative">
                                <button
                                  onClick={() => setActiveRowMenuClassId(activeRowMenuClassId === cls.id ? null : cls.id)}
                                  className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                
                                {/* Row Dropdown menu */}
                                {activeRowMenuClassId === cls.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveRowMenuClassId(null)}></div>
                                    <div className={`absolute right-6 ${isBottomRow ? 'bottom-full mb-1.5' : 'mt-1'} w-64 bg-white border border-slate-200/85 rounded-2xl shadow-xl py-2.5 z-25 text-left text-xs animate-fade-in font-sans`}>
                                      <div className="px-3.5 pb-1.5 border-b border-slate-100 mb-1.5">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Class Hub Controls</p>
                                        <p className="text-sm font-extrabold text-slate-900 mt-0.5 tracking-tight">{cls.name}</p>
                                      </div>

                                      <button
                                        onClick={() => {
                                          setViewingClassForStudents(cls);
                                          setSearchWordForEnroll('');
                                          setActiveRowMenuClassId(null);
                                        }}
                                        className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-650 flex items-center gap-2.5 font-bold transition-all cursor-pointer"
                                      >
                                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>View Students Assigned</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setViewingClassForSubjects(cls);
                                          setActiveRowMenuClassId(null);
                                        }}
                                        className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-650 flex items-center gap-2.5 font-bold transition-all cursor-pointer"
                                      >
                                        <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>View Subjects Registered</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setViewingClassForTeacher(cls);
                                          setActiveRowMenuClassId(null);
                                        }}
                                        className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-650 flex items-center gap-2.5 font-bold transition-all cursor-pointer"
                                      >
                                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>View Assigned Teacher</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setViewingClassForPromotion(cls);
                                          // Intelligent progression lookup based on class name
                                          const status = getPromotionStatus(cls.name);
                                          if (status.type === 'archive' || isFinalYearClass(cls.name)) {
                                            setPromotionTargetClassId('archive');
                                          } else {
                                            const nextClassNameStr = status.label.replace('→', '').trim();
                                            const nextClassObj = dbState.classes.find(c => c.name.toUpperCase().includes(nextClassNameStr.toUpperCase()));
                                            setPromotionTargetClassId(nextClassObj?.id || '');
                                          }
                                          const enrolledStudentIds = dbState.enrollments
                                            .filter(e => e.classId === cls.id)
                                            .map(e => e.studentId);
                                          setSelectedStudentIdsForPromotion(enrolledStudentIds);
                                          setPromotionSearchQuery('');
                                          setActiveRowMenuClassId(null);
                                        }}
                                        className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-650 flex items-center gap-2.5 font-bold transition-all cursor-pointer"
                                      >
                                        <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>Promote / Archive Students</span>
                                      </button>

                                      <div className="border-t border-slate-100 my-1.5"></div>

                                      <button
                                        onClick={() => {
                                          startEditingClass(cls);
                                          setActiveRowMenuClassId(null);
                                        }}
                                        className="w-full px-3.5 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2.5 font-semibold transition-all cursor-pointer"
                                      >
                                        <Edit3 className="w-4 h-4 text-slate-400 shrink-0" />
                                        <span>Edit Class Detail</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          handleDeleteClassConfirm(cls.id, cls.name);
                                          setActiveRowMenuClassId(null);
                                        }}
                                        className="w-full px-3.5 py-2.5 text-rose-500 hover:bg-rose-50 flex items-center gap-2.5 font-bold transition-all cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                                        <span>Delete Class</span>
                                      </button>
                                    </div>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW: RESULT MANAGEMENT */}
          {activeTab === 'results' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-6">
              
              {/* RESULTS SUBVIEW: OVERVIEW (MATCHES USER IMAGE ATTACHMENT) */}
              {resultsSubView === 'overview' && (
                <div className="space-y-8">
                  {/* Setup header section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                    <div>
                      <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-1">Set Up</div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">Result Management</h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setIsImportResultsModalOpen(true)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-full text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        id="admin_import_results_overview_btn"
                        title="Import continuous assessment and examination results from CSV file"
                      >
                        <Upload className="w-4 h-4 text-white" />
                        <span>Import Results (CSV)</span>
                      </button>

                      <button
                        onClick={handleExportGradesCSV}
                        className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-extrabold rounded-full text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                        id="admin_export_results_overview_btn"
                        title="Export all grades and score registry to CSV file"
                      >
                        <Download className="w-4 h-4 text-slate-500" />
                        <span>Export Results (CSV)</span>
                      </button>

                      <button
                        onClick={() => setResultsSubView('settings')}
                        className="px-5 py-2.5 bg-[#404ce5] hover:bg-indigo-700 text-white font-extrabold rounded-full text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Info className="w-4 h-4 text-white" />
                        <span>View Result Settings</span>
                      </button>

                      <button
                        onClick={() => setResultsSubView('metrics')}
                        className="px-5 py-2.5 bg-[#404ce5] hover:bg-indigo-700 text-white font-extrabold rounded-full text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      >
                        <Sliders className="w-4 h-4 text-white" />
                        <span>Update Result Metrics</span>
                      </button>
                    </div>
                  </div>

                  {/* Academic Session Selector Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 shadow-3xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-indigo-950 uppercase tracking-wider">Select Academic Session to View Term Results</p>
                        <p className="text-[11px] text-indigo-700 font-medium">Switch academic sessions from 2023/2024 through 2034/2035 to inspect grade registries across terms.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                      <select
                        value={selectedResultsSession}
                        onChange={(e) => setSelectedResultsSession(e.target.value)}
                        className="w-full sm:w-auto bg-white border border-indigo-200 rounded-xl px-4 py-2.5 text-xs font-extrabold text-indigo-900 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer focus:outline-none"
                        id="admin_results_session_select_overview"
                      >
                        {AVAILABLE_ACADEMIC_SESSIONS.map(s => (
                          <option key={s} value={s}>{s} Academic Session</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Three Column Term Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    
                    {/* Card: 1st Term */}
                    <div className="bg-white rounded-[28px] border border-slate-150 p-6 md:p-7 flex flex-col justify-between hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all duration-300 min-h-[260px]">
                      <div>
                        {/* Shaded list/check icon inside rounded border button */}
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl border border-blue-100 bg-blue-55/10 shadow-xs flex items-center justify-center text-[#404ce5]" id="term_1_card_icon">
                            <CheckSquare className="w-4.5 h-4.5" />
                          </div>
                          
                          <button
                            onClick={() => toggleTermPublication('1st Term')}
                            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full tracking-wider border uppercase transition-all shadow-3xs cursor-pointer ${
                              publishedTerm1 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                            title="Click to toggle parent visibility"
                          >
                            {publishedTerm1 ? '● Published' : '○ Locked (Draft)'}
                          </button>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-5">1st Term</h3>
                        
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mt-2 mb-6">
                          <span>Start: {displayFormattedDate(term1Start, '15/09/2025')}</span>
                          <span>End: {displayFormattedDate(term1End, '08/12/2025')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedResultsTerm('1st Term');
                          setResultsSubView('ledger');
                        }}
                        className="w-full bg-[#eceff7] hover:bg-[#dfe3ee] text-[#475569] font-bold py-3.5 px-4 rounded-xl text-xs tracking-wider transition-colors flex items-center justify-center cursor-pointer shadow-xs border border-slate-200"
                        id="view_term_1_btn"
                      >
                        View Term Result
                      </button>
                    </div>

                    {/* Card: 2nd Term */}
                    <div className="bg-white rounded-[28px] border border-slate-150 p-6 md:p-7 flex flex-col justify-between hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all duration-300 min-h-[260px]">
                      <div>
                        {/* Shaded list/check icon inside rounded border button */}
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl border border-blue-100 bg-blue-55/10 shadow-xs flex items-center justify-center text-[#404ce5]" id="term_2_card_icon">
                            <CheckSquare className="w-4.5 h-4.5" />
                          </div>
                          
                          <button
                            onClick={() => toggleTermPublication('2nd Term')}
                            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full tracking-wider border uppercase transition-all shadow-3xs cursor-pointer ${
                              publishedTerm2 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                            title="Click to toggle parent visibility"
                          >
                            {publishedTerm2 ? '● Published' : '○ Locked (Draft)'}
                          </button>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-5">2nd Term</h3>
                        
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mt-2 mb-6">
                          <span>Start: {displayFormattedDate(term2Start, '05/01/2026')}</span>
                          <span>End: {displayFormattedDate(term2End, '10/04/2026')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedResultsTerm('2nd Term');
                          setResultsSubView('ledger');
                        }}
                        className="w-full bg-[#eceff7] hover:bg-[#dfe3ee] text-[#475569] font-bold py-3.5 px-4 rounded-xl text-xs tracking-wider transition-colors flex items-center justify-center cursor-pointer shadow-xs border border-slate-200"
                        id="view_term_2_btn"
                      >
                        View Term Result
                      </button>
                    </div>

                    {/* Card: 3rd Term */}
                    <div className="bg-white rounded-[28px] border border-slate-150 p-6 md:p-7 flex flex-col justify-between hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.04)] hover:border-slate-300 transition-all duration-300 min-h-[260px]">
                      <div>
                        {/* Shaded list/check icon inside rounded border button */}
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl border border-blue-100 bg-blue-55/10 shadow-xs flex items-center justify-center text-[#404ce5]" id="term_3_card_icon">
                            <CheckSquare className="w-4.5 h-4.5" />
                          </div>
                          
                          <button
                            onClick={() => toggleTermPublication('3rd Term')}
                            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-full tracking-wider border uppercase transition-all shadow-3xs cursor-pointer ${
                              publishedTerm3 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                            title="Click to toggle parent visibility"
                          >
                            {publishedTerm3 ? '● Published' : '○ Locked (Draft)'}
                          </button>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-5">3rd Term</h3>
                        
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mt-2 mb-6">
                          <span>Start: {displayFormattedDate(term3Start, '27/04/2026')}</span>
                          <span>End: {displayFormattedDate(term3End, '24/07/2026')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedResultsTerm('3rd Term');
                          setResultsSubView('ledger');
                        }}
                        className="w-full bg-[#eceff7] hover:bg-[#dfe3ee] text-[#475569] font-bold py-3.5 px-4 rounded-xl text-xs tracking-wider transition-colors flex items-center justify-center cursor-pointer shadow-xs border border-slate-200"
                        id="view_term_3_btn"
                      >
                        View Term Result
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* RESULTS SUBVIEW: DETAILED TERM LEDGER (FORM TEACHER SPREADSHEEET STYLE) */}
              {resultsSubView === 'ledger' && (
                <div className="space-y-6 select-none-print">
                  {/* Subtle navigation header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div>
                      <button 
                        onClick={() => setResultsSubView('overview')}
                        className="mb-2.5 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        id="back_to_overview_btn"
                      >
                        ← Back to Terms Overview
                      </button>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        School Ledger & Results Spreadsheet
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        Displaying classroom registries like the Form Teacher's view. Check, edit, and bulk-save grades, or review comprehensive report card formats directly.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* IMPORT RESULTS CSV BUTTON */}
                      <button
                        type="button"
                        onClick={() => setIsImportResultsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        id="import_results_ledger_btn"
                        title="Import assessment marks and examination scores from CSV spreadsheet"
                      >
                        <Upload className="w-4 h-4" />
                        <div className="text-left leading-tight">
                          <span className="block font-black">Import Results (CSV)</span>
                          <span className="text-[9px] text-indigo-100 font-medium">Batch Marks & Exam Upload</span>
                        </div>
                      </button>

                      {/* EXPORT CURRENT LEDGER CSV BUTTON */}
                      <button
                        type="button"
                        onClick={handleExportLedgerResultsCSV}
                        className="bg-slate-700 hover:bg-slate-800 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        id="export_current_ledger_csv_btn"
                        title="Export current classroom subject assessment ledger to CSV spreadsheet"
                      >
                        <Download className="w-4 h-4 text-slate-200" />
                        <div className="text-left leading-tight">
                          <span className="block font-black">Export Ledger (CSV)</span>
                          <span className="text-[9px] text-slate-300 font-medium">{adminSelectedClass?.name || 'Class'} • {adminResultsSelectedSubject}</span>
                        </div>
                      </button>

                      {/* ADMIN EXCLUSIVE: DOWNLOAD BROADSHEET BUTTON */}
                      <button
                        type="button"
                        onClick={handleOpenBroadsheet}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        id="download_class_broadsheet_btn"
                        title="Download official broadsheet of entire class across all subjects (Admin Exclusive)"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <div className="text-left leading-tight">
                          <span className="block font-black">Download Broadsheet</span>
                          <span className="text-[9px] text-emerald-100 font-medium">Entire Class • All Subjects</span>
                        </div>
                      </button>

                      {/* ADMIN EXCLUSIVE: DOWNLOAD STUDENT TRANSCRIPT BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleOpenTranscript()}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        id="download_student_transcript_btn"
                        title="Download full academic transcript of any student containing all grades (Admin Exclusive)"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <div className="text-left leading-tight">
                          <span className="block font-black">Download Transcript</span>
                          <span className="text-[9px] text-amber-100 font-medium">Selected Student • All Grades</span>
                        </div>
                      </button>

                      <div className="h-7 w-px bg-slate-200 hidden sm:block mx-1"></div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Jump:</span>
                        <select
                          value={selectedResultsTerm}
                          onChange={(e) => setSelectedResultsTerm(e.target.value as any)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                          id="jump_term_select"
                        >
                          <option value="1st Term">1st Term Ledger</option>
                          <option value="2nd Term">2nd Term Ledger</option>
                          <option value="3rd Term">3rd Term Ledger</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* DROP DOWN BUTTONS FOR CLASS SELECTION, ACADEMIC SESSION, SUBJECT SELECTION & SEARCH */}
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/65 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Class Selection</label>
                      <select
                        value={adminSelectedClass?.id || ''}
                        onChange={(e) => {
                          const cls = dbState.classes.find(c => c.id === e.target.value);
                          if (cls) {
                            setAdminSelectedClass(cls);
                            setAdminBulkGradesRefreshTrigger(prev => prev + 1);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-[#171e2e] focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer focus:border-indigo-500"
                        id="admin_class_select_dropdown"
                      >
                        {dbState.classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Academic Session</label>
                      <select
                        value={selectedResultsSession}
                        onChange={(e) => {
                          setSelectedResultsSession(e.target.value);
                          setAdminBulkGradesRefreshTrigger(prev => prev + 1);
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-indigo-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer focus:border-indigo-500"
                        id="admin_session_select_dropdown"
                      >
                        {AVAILABLE_ACADEMIC_SESSIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Subject Selection</label>
                      <select
                        value={adminResultsSelectedSubject}
                        onChange={(e) => {
                          setAdminResultsSelectedSubject(e.target.value);
                          setAdminBulkGradesRefreshTrigger(prev => prev + 1);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-[#171e2e] focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer focus:border-indigo-500"
                        id="admin_sub_select_dropdown"
                      >
                        {adminSelectedClass ? (
                          getSubjectsForClass(adminSelectedClass.id).map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))
                        ) : (
                          <option value="Mathematics">Mathematics</option>
                        )}
                      </select>
                    </div>

                    <div className="relative">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Search Student Name</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={gradeSearchQuery}
                          onChange={(e) => setGradeSearchQuery(e.target.value)}
                          placeholder="Search student in class..."
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs focus:border-indigo-500 text-slate-800"
                          id="admin_grade_search"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-405 absolute left-3 top-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE GRADING REGISTRY SHEET */}
                  <form onSubmit={handleSaveAdminBulkGrades} className="space-y-5" id="admin_matrix_grades_form">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            {adminSelectedClass?.name || 'Class'} • {adminResultsSelectedSubject} Roster Spreadsheet
                          </h3>
                        </div>

                        <div className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1.5 rounded-lg border border-indigo-100">
                          {selectedResultsTerm} Term Ledger • Max CA1: 10 | Max CA2: 10 | Max Mid: 20 | Max Exam: 60
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs text-slate-550 min-w-[750px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[9px] font-black border-b border-slate-200">
                              <th className="py-3 px-4 font-black">Student Details</th>
                              <th className="py-3 px-3 text-center border-l border-slate-200 w-[11%]">CA1 (10)</th>
                              <th className="py-3 px-3 text-center border-l border-slate-200 w-[11%]">CA2 (10)</th>
                              <th className="py-3 px-3 text-center border-l border-slate-200 w-[11%]">Mid Term (20)</th>
                              <th className="py-3 px-3 text-center border-l border-slate-200 w-[11%]">Exam Score (60)</th>
                              <th className="py-3 px-4 text-center border-l border-slate-200 w-[14%] bg-indigo-50/15">Total Score (100)</th>
                              <th className="py-3 px-4 text-center border-l border-slate-200">Terminal Report Print formats</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 bg-white">
                            {(() => {
                              const filtered = adminClassStudents.filter(st => {
                                if (gradeSearchQuery.trim() === '') return true;
                                return st.fullName.toLowerCase().includes(gradeSearchQuery.toLowerCase());
                              });

                              if (filtered.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={7} className="text-center py-10 font-bold text-slate-400">
                                      No students matching the query found in this classroom roster.
                                    </td>
                                  </tr>
                                );
                              }

                              return filtered.map((st, idx) => {
                                const stateVals = adminBulkGrades[st.id] || { exam: '', ca1: '', notebook: '', mid_term: '' };
                                
                                // Compute dynamic total based on currently inputted spreadsheet values
                                const ca1Val = Number(stateVals.ca1) || 0;
                                const ca2Val = Number(stateVals.notebook) || 0;
                                const midVal = Number(stateVals.mid_term) || 0;
                                const examVal = Number(stateVals.exam) || 0;
                                const totalSum = ca1Val + ca2Val + midVal + examVal;
                                const gradeAlpha = getStoredLetterGrade(totalSum);

                                return (
                                  <tr key={`${st.id}_${idx}`} className="hover:bg-slate-50/55 transition-colors">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-xs border border-indigo-100 shrink-0 select-none">
                                          {st.fullName.split(' ').map(n=>n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                          <div className="font-bold text-slate-900">{st.fullName}</div>
                                          <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase mt-0.5">{st.rollNumber}</div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Editable CA1 Input Cell */}
                                    <td className="py-1 px-3 border-l border-slate-150">
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        placeholder="-"
                                        value={stateVals.ca1}
                                        onChange={(e) => handleAdminBulkStateChange(st.id, 'ca1', e.target.value)}
                                        className="w-full text-center bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-lg py-1.5 text-xs font-semibold text-slate-800"
                                        id={`admin_ca1_${st.id}`}
                                      />
                                    </td>

                                    {/* Editable CA2 Input Cell */}
                                    <td className="py-1 px-3 border-l border-slate-150">
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        placeholder="-"
                                        value={stateVals.notebook}
                                        onChange={(e) => handleAdminBulkStateChange(st.id, 'notebook', e.target.value)}
                                        className="w-full text-center bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-lg py-1.5 text-xs font-semibold text-slate-800"
                                        id={`admin_notebook_${st.id}`}
                                      />
                                    </td>

                                    {/* Editable Mid Test Input Cell */}
                                    <td className="py-1 px-3 border-l border-slate-150">
                                      <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        placeholder="-"
                                        value={stateVals.mid_term}
                                        onChange={(e) => handleAdminBulkStateChange(st.id, 'mid_term', e.target.value)}
                                        className="w-full text-center bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-lg py-1.5 text-xs font-semibold text-slate-800"
                                        id={`admin_mid_term_${st.id}`}
                                      />
                                    </td>

                                    {/* Editable Exam Input Cell */}
                                    <td className="py-1 px-3 border-l border-slate-150">
                                      <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        placeholder="-"
                                        value={stateVals.exam}
                                        onChange={(e) => handleAdminBulkStateChange(st.id, 'exam', e.target.value)}
                                        className="w-full text-center bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-lg py-1.5 text-xs font-semibold text-slate-850"
                                        id={`admin_exam_${st.id}`}
                                      />
                                    </td>

                                    {/* TOTAL SCORE badge with dynamic letter grading indicator */}
                                    <td className="py-1.5 px-4 text-center border-l border-slate-150 bg-indigo-500/5">
                                      <div className="font-extrabold text-[#111827] text-sm leading-none">{totalSum}</div>
                                      <div className="mt-1 leading-none">
                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ${getStoredLetterColor(gradeAlpha)}`}>
                                          Grade {gradeAlpha}
                                        </span>
                                      </div>
                                    </td>

                                    {/* ACTION BUTTONS TO SHOW THE CORRESPONDING ACCURATE REPORT CARDS */}
                                    <td className="py-1 px-4 border-l border-slate-150 text-left">
                                      <div className="flex flex-col sm:flex-row gap-1.5 items-center justify-start">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenTranscript(st)}
                                          className="text-[10px] font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer transition-all"
                                          title="View & Download official student academic transcript (Admin Exclusive)"
                                          id={`rep_transcript_${st.id}`}
                                        >
                                          <GraduationCap className="w-3 h-3 text-amber-600" />
                                          <span>Transcript</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedReportStudent(st);
                                            setSelectedReportType('cumulative');
                                          }}
                                          className="text-[10px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-all"
                                          title="View cumulative three-term overview"
                                          id={`rep_cum_${st.id}`}
                                        >
                                          <Layers className="w-3 h-3 text-emerald-650" />
                                          <span>Cumulative</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedReportStudent(st);
                                            setSelectedReportType('full');
                                          }}
                                          className="text-[10px] font-bold bg-indigo-50 text-indigo-850 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition-all"
                                          title="View Terminal Full Report Card Sheet"
                                          id={`rep_full_${st.id}`}
                                        >
                                          <Award className="w-3 h-3 text-indigo-650" />
                                          <span>Termly Format</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedReportStudent(st);
                                            setSelectedReportType('midterm');
                                          }}
                                          className="text-[10px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1 cursor-pointer transition-all"
                                          title="View Midterm evaluation checklist"
                                          id={`rep_mid_${st.id}`}
                                        >
                                          <Clock className="w-3 h-3 text-amber-655" />
                                          <span>Midterm</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (adminSelectedClass) {
                                              const savedComments = db.getReportCommentsForStudent(st.id);
                                              const activeTerm = localStorage.getItem('current_term') || '3rd Term';
                                              const activeComment = savedComments.find(
                                                c => c.classId === adminSelectedClass.id && 
                                                (c.term === activeTerm || c.term === '3rd Term - 2025/2026' || c.term.startsWith(activeTerm))
                                              );
                                              setAdminTeacherCommentInput(activeComment ? activeComment.teacherComment : '');
                                              setAdminPrincipalCommentInput(activeComment?.principalComment || '');
                                              setEditingCommentStudent(st);
                                            }
                                          }}
                                          className="text-[10px] font-bold bg-[#fae8ff] text-[#701a75] hover:bg-[#f5d0fe] px-2.5 py-1.5 rounded-lg border border-[#f5d0fe] flex items-center gap-1 cursor-pointer transition-all"
                                          title="Edit report comments for teacher and principal"
                                          id={`rep_comment_${st.id}`}
                                        >
                                          <Edit3 className="w-3 h-3 text-[#a21caf]" />
                                          <span>Comments</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setIsImportResultsModalOpen(true)}
                          className="w-full sm:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          id="ledger_bottom_import_csv_btn"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Import CSV Spreadsheet</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportLedgerResultsCSV}
                          className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                          id="ledger_bottom_export_csv_btn"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Export CSV Ledger</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setAdminBulkGradesRefreshTrigger(prev => prev + 1);
                            triggerToast('Spreadsheet reset to stored registry state.');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                          id="reset_admin_spreadsheet_btn"
                        >
                          Reset Local Changes
                        </button>

                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                          id="save_admin_spreadsheet_btn"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Spreadsheet Changes to Database</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}



              {/* RESULTS SUBVIEW: CONFIGURATION SETTINGS */}
              {resultsSubView === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <button 
                      onClick={() => setResultsSubView('overview')}
                      className="mb-2.5 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                      id="close_settings_btn"
                    >
                      ← Back to Terms Overview
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Result Parameters & Configurations
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Adjust relative weightages and active grading converting scales.
                    </p>
                  </div>

                  <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-6 space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-indigo-605 uppercase tracking-widest text-[#404ce5]">Academic Grading Weights %</h3>
                        <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                          Sum: {weightExam + weightCa + weightMidterm}% (Should equal 100%)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Exam Weight %</label>
                          <input 
                            type="number" 
                            value={weightExam} 
                            onChange={(e) => setWeightExam(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700" 
                          />
                        </div>
                        <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Continuous Assessment (CA) %</label>
                          <input 
                            type="number" 
                            value={weightCa} 
                            onChange={(e) => setWeightCa(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700" 
                          />
                        </div>
                        <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mid Term Test Weight %</label>
                          <input 
                            type="number" 
                            value={weightMidterm} 
                            onChange={(e) => setWeightMidterm(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700" 
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <h3 className="text-xs font-bold text-indigo-605 uppercase tracking-widest text-[#404ce5]">Primary Grading Scale Conversions</h3>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold tracking-wider uppercase border border-slate-205">Active Fixed Scale</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4">
                        
                        {/* A1 */}
                        <div className="bg-emerald-50/50 p-3.5 border border-emerald-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-emerald-700">
                            A1
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            75 - 100
                          </div>
                        </div>
                        
                        {/* B2 */}
                        <div className="bg-blue-50/50 p-3.5 border border-blue-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-blue-700">
                            B2
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            70 - 74
                          </div>
                        </div>

                        {/* B3 */}
                        <div className="bg-blue-50/50 p-3.5 border border-blue-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-blue-600">
                            B3
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            65 - 69
                          </div>
                        </div>

                        {/* C4 */}
                        <div className="bg-amber-50/50 p-3.5 border border-amber-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-amber-700">
                            C4
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            60 - 64
                          </div>
                        </div>

                        {/* C5 */}
                        <div className="bg-amber-50/50 p-3.5 border border-amber-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-amber-600">
                            C5
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            55 - 59
                          </div>
                        </div>

                        {/* C6 */}
                        <div className="bg-amber-50/50 p-3.5 border border-amber-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-amber-500">
                            C6
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            50 - 54
                          </div>
                        </div>

                        {/* D7 */}
                        <div className="bg-orange-50/50 p-3.5 border border-orange-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-orange-700">
                            D7
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            45 - 49
                          </div>
                        </div>

                        {/* D8 */}
                        <div className="bg-orange-50/50 p-3.5 border border-orange-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-orange-600">
                            D8
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            40 - 44
                          </div>
                        </div>

                        {/* F9 */}
                        <div className="bg-rose-50/50 p-3.5 border border-rose-100 rounded-xl space-y-1.5 text-center shadow-xs">
                          <div className="text-xs font-black text-rose-700">
                            F9
                          </div>
                          <div className="text-sm font-extrabold text-slate-800">
                            0 - 39
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="pt-2">
                       <button 
                        onClick={() => {
                          const executeSaveWeights = () => {
                            db.saveSetting('weight_exam', String(weightExam));
                            db.saveSetting('weight_ca', String(weightCa));
                            db.saveSetting('weight_midterm', String(weightMidterm));

                            triggerToast('Primary grading weights saved successfully!');
                            setResultsSubView('overview');
                          };

                          const totalWeight = weightExam + weightCa + weightMidterm;
                          if (totalWeight !== 100) {
                            requestConfirm({
                              title: 'Grading Weights Warning',
                              message: `The grading weights sum to ${totalWeight}%. It is highly recommended that they sum to exactly 100%. Are you sure you want to save?`,
                              confirmText: 'Save Anyway',
                              isDestructive: false,
                              onConfirm: executeSaveWeights
                            });
                          } else {
                            executeSaveWeights();
                          }
                        }}
                        className="bg-[#404ce5] hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
                        id="save_configurations_btn"
                      >
                        Save Configurations
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* RESULTS SUBVIEW: METRICS AND ANALYTICS CONTROLS */}
              {resultsSubView === 'metrics' && (
                <div className="space-y-6">
                  <div>
                    <button 
                      onClick={() => setResultsSubView('overview')}
                      className="mb-2.5 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                      id="close_metrics_btn"
                    >
                      ← Back to Terms Overview
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      System Result Metrics
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure baseline indices, average distributions, and visual grade indicators.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column: Index configuration slider */}
                    <div className="md:col-span-4 bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-4">
                      <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                        <Sliders className="w-4 h-4 text-[#404ce5]" />
                        <span>Configure Metrics Indices</span>
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-600">
                            <span>Passing Performance Threshold</span>
                            <span className="font-extrabold text-[#404ce5]">{metricsPassMark}%</span>
                          </div>
                          <input 
                            type="range"
                            min="40"
                            max="75"
                            value={metricsPassMark}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setMetricsPassMark(val);
                              db.saveSetting('metrics_pass_mark', String(val));
                            }}
                            className="w-full text-[#404ce5] bg-slate-200 rounded-lg appearance-none h-1 cursor-pointer"
                            id="pass_mark_slider"
                          />
                          <p className="text-[10px] text-slate-400 font-medium font-sans">
                            Scores falling below this index are flagged with warnings on parent and administrator dashboards.
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          triggerToast('Passing threshold updated successfully!');
                          setResultsSubView('overview');
                        }}
                        className="w-full bg-[#404ce5] hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
                        id="update_metric_threshold_btn"
                      >
                        Update Target Metric
                      </button>
                    </div>

                    {/* Right Column: Statistics panel */}
                    <div className="md:col-span-8 bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-4">
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Dynamic Result Ledger Analytics</h3>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                        <div className="bg-white border border-slate-200/50 rounded-xl p-4">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Ledger Index Size</p>
                          <p className="text-xl font-bold text-indigo-700 mt-1">{dbState.grades.length} Grades</p>
                        </div>
                        <div className="bg-white border border-slate-200/50 rounded-xl p-4">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Classrooms tracked</p>
                          <p className="text-xl font-bold text-indigo-700 mt-1">{dbState.classes.length} Courses</p>
                        </div>
                        <div className="bg-white border border-slate-200/50 rounded-xl p-4 col-span-2 sm:col-span-1">
                          <p className="text-[10px] uppercase font-bold text-slate-400">Schoolwide Mean</p>
                          <p className="text-xl font-bold text-indigo-700 mt-1">
                            {(() => {
                              if (dbState.grades.length === 0) return '0.0%';
                              const sum = dbState.grades.reduce((a, b) => a + b.score, 0);
                              return `${(sum / dbState.grades.length).toFixed(1)}%`;
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200/50 rounded-xl p-4 space-y-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-sans">Top Performing Assessment Categories</h4>
                        <div className="space-y-1.5 pt-1">
                          {['Exam', 'Project', 'Quiz', 'Homework'].map((cat) => {
                            const matchingGrades = dbState.grades.filter(g => g.category.toLowerCase() === cat.toLowerCase());
                            const avg = matchingGrades.length > 0 
                              ? (matchingGrades.reduce((a, b) => a + b.score, 0) / matchingGrades.length).toFixed(1)
                              : '0.0';
                            return (
                              <div key={cat} className="flex justify-between items-center text-xs text-slate-600 font-semibold border-b border-slate-100 pb-1">
                                <span className="capitalize">{cat} Average Score:</span>
                                <span className="font-extrabold text-[#404ce5]">{avg}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* VIEW: ATTENDANCE MANAGEMENT */}
          {activeTab === 'attendance' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-8">
              
              {/* Classes Attendance Progress Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-indigo-650" />
                      <span>Class Attendance Progress & Insights</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Check session metrics and presence rates across all active grade channels</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {dbState.classes.map((cls) => {
                    const enrolledCount = db.getStudentsInClass(cls.id).length;
                    const classLogs = dbState.attendance.filter(a => a.classId === cls.id);
                    const loggedDays = Array.from(new Set(classLogs.map(a => a.date))).length;
                    const presentCount = classLogs.filter(a => a.status === 'present' || a.status === 'tardy').length;
                    const rate = classLogs.length > 0 ? Math.round((presentCount * 100) / classLogs.length) : 0;

                    // Compute badge color
                    const badgeBg = rate >= 90 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                    rate >= 75 ? 'bg-sky-50 border-sky-100 text-sky-700' :
                                    rate > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                    'bg-slate-50 border-slate-100 text-slate-500';

                    return (
                      <div key={cls.id} className="bg-slate-50/40 hover:bg-slate-50 border border-slate-150 rounded-2xl p-4.5 flex flex-col justify-between transition-all group hover:shadow-2xs">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cls.code}</p>
                              <h4 className="text-sm font-extrabold text-slate-800 mt-0.5 truncate" title={cls.name}>{cls.name}</h4>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border shrink-0 ${badgeBg}`}>
                              {classLogs.length > 0 ? `${rate}% Rate` : 'No logs'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                              <span>Average Presence</span>
                              <span className="font-extrabold text-slate-700">{rate}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  rate >= 90 ? 'bg-emerald-500' :
                                  rate >= 75 ? 'bg-sky-500' :
                                  rate > 0 ? 'bg-amber-500' : 'bg-slate-200'
                                }`} 
                                style={{ width: `${rate}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-450 font-semibold font-mono">
                            <div>
                              <p className="text-slate-700 font-extrabold">{enrolledCount} Pupils</p>
                              <p className="text-[9px] text-slate-400">Class Size</p>
                            </div>
                            <div>
                              <p className="text-slate-700 font-extrabold">{loggedDays} Days</p>
                              <p className="text-[9px] text-slate-400">Logged Count</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 mt-4 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAttendanceClassId(cls.id);
                              triggerToast(`Selected ${cls.name} for active roll register recording!`);
                            }}
                            className="bg-white border border-slate-200/80 hover:border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-extrabold py-1.5 px-2 rounded-xl text-[9px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer text-center"
                          >
                            Open Editor
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAttendanceViewClassId(cls.id);
                              triggerToast(`Filtered database logs for ${cls.name}!`);
                            }}
                            className="bg-white border border-slate-200/80 hover:border-sky-200 text-sky-700 hover:bg-sky-50 font-extrabold py-1.5 px-2 rounded-xl text-[9px] uppercase tracking-wide transition-all active:scale-95 cursor-pointer text-center"
                          >
                            Filter Logs
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-slate-100"></div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Admin Attendance Recording Form */}
                <div className="lg:col-span-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                    <ClipboardCheck className="w-4 h-4 text-sky-600" />
                    <h3 className="text-sm font-bold text-slate-800">Record Register</h3>
                  </div>

                  <form onSubmit={handleSaveAttendance} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Primary Classroom</label>
                      <select 
                        value={selectedAttendanceClassId}
                        onChange={(e) => {
                          setSelectedAttendanceClassId(e.target.value);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-850 focus:outline-hidden"
                      >
                        <option value="">-- Choose Classroom --</option>
                        {dbState.classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.name} ({cls.code})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Record Date</label>
                      <input 
                        type="date" 
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-850"
                      />
                    </div>

                    {selectedAttendanceClassId && (
                      <div className="space-y-3.5 pt-2 max-h-[300px] overflow-y-auto pr-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Roster Statuses:</p>
                        
                        {db.getStudentsInClass(selectedAttendanceClassId).length === 0 ? (
                          <p className="text-xs italic text-rose-500 bg-rose-50 p-3 rounded-lg border border-rose-100">Please enroll students in this classroom first to record attendance.</p>
                        ) : (
                          db.getStudentsInClass(selectedAttendanceClassId).map((s) => {
                            const curRecord = attendanceStatuses[s.id] || { status: 'present', notes: '' };
                            return (
                              <div key={s.id} className="p-3 bg-white rounded-xl border border-slate-200/50 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-slate-800">{s.fullName}</span>
                                  <span className="text-[9px] font-mono text-slate-400">{s.rollNumber}</span>
                                </div>
                                <div className="flex gap-1.5">
                                  {(['present', 'absent', 'tardy'] as AttendanceStatus[]).map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => setSingleAttendanceStatus(s.id, st)}
                                      className={`px-2 py-1 rounded-md text-[10px] font-bold capitalize cursor-pointer transition-all ${
                                        curRecord.status === st
                                          ? st === 'present'
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : st === 'absent'
                                              ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                                          : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                                <input 
                                  type="text"
                                  placeholder="Leave optional note (e.g. excused)"
                                  value={curRecord.notes}
                                  onChange={(e) => setSingleAttendanceNotes(s.id, e.target.value)}
                                  className="w-full bg-slate-50 text-[10px] px-2 py-1 rounded-md border border-slate-200 focus:outline-hidden"
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={!selectedAttendanceClassId}
                      className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-250 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm transitions-colors duration-200 flex items-center justify-center gap-2 cursor-pointer pt-2"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Save Attendance Register</span>
                    </button>
                  </form>
                </div>

                {/* Attendance Registers Log Views */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-800">Attendance Log Database</h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={attendanceViewClassId}
                        onChange={(e) => setAttendanceViewClassId(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-850 focus:outline-hidden"
                      >
                        <option value="">Select Class to Filter Logs</option>
                        {dbState.classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={downloadAttendanceCSV}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap inline-flex items-center"
                        title="Download CSV report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-slate-500 text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50">
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Student Name</th>
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Class Title</th>
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Registry Date</th>
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Logged State</th>
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Notes</th>
                          <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {dbState.attendance.filter(a => {
                          return attendanceViewClassId ? a.classId === attendanceViewClassId : true;
                        }).map((rec) => {
                          const student = dbState.students.find(s => s.id === rec.studentId);
                          const cls = dbState.classes.find(c => c.id === rec.classId);
                          return (
                            <tr key={rec.id} className="hover:bg-slate-50/30 transition-all">
                              <td className="py-3 px-3">
                                <p className="font-bold text-slate-800">{student?.fullName || 'Unknown Student'}</p>
                                <p className="text-[9px] font-mono text-slate-400">{student?.rollNumber}</p>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-600 truncate max-w-[110px]" title={cls?.name}>
                                {cls?.name}
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-500">
                                {rec.date}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                  rec.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  rec.status === 'absent' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                  'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {rec.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 max-w-[100px] truncate text-slate-400 italic text-[11px]" title={rec.notes}>
                                {rec.notes || '—'}
                              </td>
                              <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAttendanceRecord(rec);
                                    setEditAttendanceStatus(rec.status);
                                    setEditAttendanceNotes(rec.notes || '');
                                    triggerToast(`Opened editor for ${student?.fullName || 'student'}'s entry.`);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                  title="Edit attendance state"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttendanceLog(rec.id)}
                                  className="text-rose-600 hover:text-rose-900 bg-rose-50 hover:bg-rose-100/80 p-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                                  title="Delete log"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {dbState.attendance.filter(a => attendanceViewClassId ? a.classId === attendanceViewClassId : true).length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400 italic">No attendance registries matches. Select another class filter.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* VIEW: TEACHER MANAGEMENT */}
          {activeTab === 'teachers' && (() => {
            const currentTeacher = dbState.teachers.find(t => t.id === selectedTeacherId);
            if (selectedTeacherId && currentTeacher) {
              const activeTaughtClasses = dbState.classes.filter(c => c.teacherId === currentTeacher.id);
              return (
                <div className="space-y-6">
                  {/* Back button */}
                  <div>
                    <button 
                      onClick={() => {
                        setSelectedTeacherId(null);
                        setDetailActiveTab('subjects');
                      }} 
                      className="text-slate-600 hover:text-indigo-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200/50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  </div>

                  {/* Teacher Header Profile Card (Mimicking Usman Amisu Layout) */}
                  <div className="bg-white rounded-3xl border border-slate-205 border-slate-200/80 shadow-xs p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
                          {currentTeacher.fullName}
                        </h2>
                        
                        {/* Status dropdown badge */}
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer border border-emerald-200/60"
                          >
                            <span>{currentTeacher.status || 'Active'}</span>
                            <ChevronDown className="w-3 h-3 text-emerald-600" />
                          </button>
                          {isTeacherDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsTeacherDropdownOpen(false)}></div>
                              <div className="absolute left-0 mt-1.5 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                <div className="py-1">
                                  {['Active', 'Inactive', 'On Leave'].map((st) => (
                                    <button
                                      key={st}
                                      onClick={() => {
                                        db.updateTeacherStatus(currentTeacher.id, st);
                                        refreshState();
                                        setIsTeacherDropdownOpen(false);
                                      }}
                                      className={`block w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer ${currentTeacher.status === st || (!currentTeacher.status && st === 'Active') ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-700'}`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Contact metadata */}
                      <div className="space-y-1 text-xs text-slate-500 font-medium font-mono">
                        <p className="flex items-center gap-2 hover:text-slate-800 transition-colors">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{currentTeacher.email}</span>
                        </p>
                        <p className="flex items-center gap-2 hover:text-slate-800 transition-colors">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>{currentTeacher.phone || '+234 706 915 7723'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action buttons on the right side */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setIsAssignClassOpen(true)}
                        className="px-5 py-2.5 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-2 rounded-full shadow-xs cursor-pointer active:scale-95 transition-all"
                      >
                        <span>Assign Class</span>
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setIsAssignSubjectOpen(true)}
                        className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-850 text-white font-bold text-xs flex items-center gap-2 rounded-full shadow-md cursor-pointer active:scale-95 transition-all"
                      >
                        <span>Assign Subject</span>
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          requestConfirm({
                            title: 'Remove Staff / Teacher',
                            message: `Are you sure you want to completely remove "${currentTeacher.fullName}" from the school roster? They will lose all access and assigned classes will be unallocated.`,
                            confirmText: 'Delete Staff',
                            isDestructive: true,
                            onConfirm: () => {
                              db.deleteUser(currentTeacher.id);
                              setSelectedTeacherId(null);
                              triggerToast(`Staff "${currentTeacher.fullName}" has been deleted.`);
                              refreshState();
                            }
                          });
                        }}
                        className="px-4 py-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-2 rounded-full shadow-xs cursor-pointer active:scale-95 transition-all"
                        title="Delete Teacher Account"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete Staff</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabs Area */}
                  <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                    <button
                      onClick={() => setDetailActiveTab('subjects')}
                      className={`px-5 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
                        detailActiveTab === 'subjects'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-xs'
                          : 'bg-slate-50 text-slate-450 hover:bg-slate-100 border border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Assigned Subjects
                    </button>
                    <button
                      onClick={() => setDetailActiveTab('classes')}
                      className={`px-5 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${
                        detailActiveTab === 'classes'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-xs'
                          : 'bg-slate-50 text-slate-450 hover:bg-slate-100 border border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Assigned Classes
                    </button>
                  </div>

                  {/* Tab Content Panels */}
                  <div className="min-h-[220px]">
                    {detailActiveTab === 'subjects' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syllabus Capabilities</h3>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {(currentTeacher.subjects || []).length} assigned
                          </span>
                        </div>

                        {(currentTeacher.subjects || []).length === 0 ? (
                          <div className="bg-slate-50/50 rounded-2xl p-8 text-center border border-dashed border-slate-200 space-y-2">
                            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs text-slate-400 italic">No assigned academic subjects capabilities. Specify their curriculum to track grade evaluations.</p>
                            <button
                              onClick={() => setIsAssignSubjectOpen(true)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors mt-1 inline-block cursor-pointer underline hover:no-underline"
                            >
                              Assign first subject now
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {(currentTeacher.subjects || []).map((sub, idx) => {
                              const matchObj = sub.match(/^(.*) \((JSS|SSS)\)$/);
                              const displayName = matchObj ? matchObj[1] : sub;
                              const categoryLabel = matchObj ? (matchObj[2] === 'JSS' ? 'Junior - JSS' : 'Senior - SSS') : 'General';
                              return (
                                <div key={`${sub}-${idx}`} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all group">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-xl ${getThemeColorClass(settingsColorTheme, 'bg_light')} ${getThemeColorClass(settingsColorTheme, 'text_primary')} flex items-center justify-center font-bold text-xs shrink-0`}>
                                      {displayName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 text-xs sm:text-sm truncate" title={displayName}>{displayName}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                          categoryLabel.includes('JSS') ? 'bg-indigo-50 text-indigo-700' :
                                          categoryLabel.includes('SSS') ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                        }`}>{categoryLabel}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const filtered = (currentTeacher.subjects || []).filter((_, i) => i !== idx);
                                      db.updateTeacherSubjects(currentTeacher.id, filtered);
                                      refreshState();
                                      triggerToast('Subject capability unassigned.');
                                    }}
                                    className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group-hover:text-slate-400 shrink-0"
                                    title="Remove Subject Capability"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {detailActiveTab === 'classes' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Academic Workrooms</h3>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {activeTaughtClasses.length} active
                          </span>
                        </div>

                        {activeTaughtClasses.length === 0 ? (
                          <div className="bg-slate-50/50 rounded-2xl p-8 text-center border border-dashed border-slate-200 space-y-2">
                            <Building className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs text-slate-404 italic">No assigned classes scheduled under this teacher's instruction.</p>
                            <button
                              onClick={() => setIsAssignClassOpen(true)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors mt-1 inline-block cursor-pointer underline hover:no-underline"
                            >
                              Assign class structure
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeTaughtClasses.map((cls) => {
                              const studentCount = dbState.enrollments.filter(e => e.classId === cls.id).length;
                              return (
                                <div key={cls.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all group">
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-705 px-2 py-0.5 rounded-md font-mono">
                                        {cls.code}
                                      </span>
                                      <button
                                        onClick={() => {
                                          db.unassignClassFromTeacher(cls.id);
                                          refreshState();
                                          triggerToast(`Unassigned ${cls.name} successfully.`);
                                        }}
                                        className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition-colors cursor-pointer group-hover:text-slate-400 animate-fade-in"
                                        title="Unassign Class"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm mb-3 group-hover:text-indigo-650 transition-colors">{cls.name}</h4>
                                    
                                    <div className="space-y-1.5 text-[10px] text-slate-550 font-semibold font-mono">
                                      <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>{cls.schedule || 'Schedule unassigned'}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span>Room {cls.room || 'TBD'}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Enrolled Active Roster</span>
                                    <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                      {studentCount} Students
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modals for Assignment Action */}
                  {isAssignClassOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden font-sans border border-slate-100 flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-850 text-sm">Assign Class to {currentTeacher.fullName}</h3>
                            <p className="text-[10px] text-slate-404 mt-0.5">Select an existing school academic course to link instruction</p>
                          </div>
                          <button
                            onClick={() => setIsAssignClassOpen(false)}
                            className="text-slate-400 p-1.5 hover:text-slate-655 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-3 flex-1">
                          {dbState.classes.length === 0 ? (
                            <p className="text-xs text-slate-404 italic text-center py-8">No academic classrooms are configured. Go to 'Class Schedules' to add database slots.</p>
                          ) : (
                            dbState.classes.map((cls) => {
                              const isAssignedToThis = cls.teacherId === currentTeacher.id;
                              const otherTeacher = cls.teacherId && cls.teacherId !== currentTeacher.id 
                                ? dbState.teachers.find(t => t.id === cls.teacherId) 
                                : null;
                              return (
                                <div 
                                  key={cls.id} 
                                  className={`p-3.5 border rounded-2xl flex items-center justify-between transition-all ${
                                    isAssignedToThis 
                                      ? 'bg-indigo-50/45 border-indigo-200' 
                                      : 'bg-white border-slate-100 hover:border-slate-300'
                                  }`}
                                >
                                  <div>
                                    <h4 className="font-bold text-slate-850 text-xs">{cls.name}</h4>
                                    <p className="text-[10px] text-slate-404 font-mono mt-0.5">{cls.code} • Room {cls.room || 'TBD'}</p>
                                    {otherTeacher && (
                                      <p className="text-[9px] text-amber-600 font-bold mt-1">
                                        Assigned to: {otherTeacher.fullName}
                                      </p>
                                    )}
                                    {isAssignedToThis && (
                                      <p className="text-[9px] text-indigo-705 font-bold mt-1">
                                        Currently Assigned
                                      </p>
                                    )}
                                  </div>
                                  {!isAssignedToThis && (
                                    <button
                                      onClick={() => {
                                        db.assignClassToTeacher(cls.id, currentTeacher.id);
                                        refreshState();
                                        setIsAssignClassOpen(false);
                                        triggerToast(`Successfully assigned "${cls.name}" to instruction roll.`);
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${
                                        otherTeacher 
                                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' 
                                          : 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-xs'
                                      } transition-all cursor-pointer`}
                                    >
                                      {otherTeacher ? 'Reassign' : 'Assign'}
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => setIsAssignClassOpen(false)}
                            className="text-slate-500 hover:text-slate-800 font-bold text-xs py-2 px-4 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Close Dialog
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAssignSubjectOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
                      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden font-sans border border-slate-100 flex flex-col max-h-[85vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">Assign Subject to {currentTeacher.fullName}</h3>
                            <p className="text-[10px] text-slate-404 mt-0.5">Link a predefined academic subject, or create a custom syllabus slot</p>
                          </div>
                          <button
                            onClick={() => {
                              setIsAssignSubjectOpen(false);
                              setSubjectSelectionSearch('');
                              setCustomSubjectInput('');
                            }}
                            className="text-slate-400 p-1.5 hover:text-slate-650 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                          {/* Custom Subject Input Box */}
                          <div className="space-y-3 border-b border-slate-100 pb-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Subject Freedom Tool</label>
                            <p className="text-[10px] text-slate-450 leading-relaxed font-medium">Freedom custom entry: assign absolutely any subject title with chosen category tier.</p>
                            
                            <div className="flex flex-col gap-3 mt-1.5">
                              <div className="flex gap-2.5">
                                <input
                                  type="text"
                                  placeholder="e.g. Critical Thinking, Coding, Yoruba..."
                                  value={customSubjectInput}
                                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-805 font-medium focus:outline-hidden focus:border-indigo-500 flex-1 min-w-0"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!customSubjectInput.trim()) return;
                                    const baseSubj = customSubjectInput.trim();
                                    let subj = baseSubj;
                                    if (customSubjectCategory === 'JSS') {
                                      subj = `${baseSubj} (JSS)`;
                                    } else if (customSubjectCategory === 'SSS') {
                                      subj = `${baseSubj} (SSS)`;
                                    }
                                    const existing = currentTeacher.subjects || [];
                                    if (existing.includes(subj)) {
                                      triggerToast('This subject capability is already assigned to this teacher.', true);
                                      return;
                                    }
                                    db.updateTeacherSubjects(currentTeacher.id, [...existing, subj]);
                                    refreshState();
                                    setCustomSubjectInput('');
                                    setCustomSubjectCategory('General');
                                    setIsAssignSubjectOpen(false);
                                    triggerToast(`Custom subject "${subj}" assigned successfully!`);
                                  }}
                                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-705 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                                >
                                  Assign
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Category:</span>
                                {(['JSS', 'SSS', 'General'] as const).map((cat) => {
                                  const isSel = customSubjectCategory === cat;
                                  return (
                                    <button
                                      type="button"
                                      key={cat}
                                      onClick={() => setCustomSubjectCategory(cat)}
                                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                        isSel 
                                          ? 'bg-slate-805 text-white border-slate-805 shadow-2xs' 
                                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                    >
                                      {cat === 'General' ? 'General' : cat === 'JSS' ? 'JSS (Junior)' : 'SSS (Senior)'}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Filter Predefined Pools */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syllabus Template Pools</label>
                              <input
                                type="text"
                                placeholder="Search templates..."
                                value={subjectSelectionSearch}
                                onChange={(e) => setSubjectSelectionSearch(e.target.value)}
                                className="text-[10px] px-2 py-1 border border-slate-200 rounded-md w-36 focus:outline-hidden focus:border-indigo-500 font-semibold"
                              />
                            </div>

                            {/* JSS POOL */}
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                Junior Secondary (JSS) - Assigns explicitly only to JSS
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {settingsJssSubjects
                                  .filter(s => s.toLowerCase().includes(subjectSelectionSearch.toLowerCase()))
                                  .map((subj) => {
                                    const explicitJssName = `${subj} (JSS)`;
                                    const isAssigned = (currentTeacher.subjects || []).includes(explicitJssName);
                                    return (
                                      <button
                                        key={subj}
                                        disabled={isAssigned}
                                        onClick={() => {
                                          const existing = currentTeacher.subjects || [];
                                          db.updateTeacherSubjects(currentTeacher.id, [...existing, explicitJssName]);
                                          refreshState();
                                          setIsAssignSubjectOpen(false);
                                          triggerToast(`Assigned predefined subject "${subj} (JSS)" to JSS role.`);
                                        }}
                                        className={`text-[10px] px-2.5 py-1 font-semibold rounded-lg border transition-all cursor-pointer ${
                                          isAssigned
                                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed font-bold'
                                            : 'bg-slate-50 border-slate-200 text-slate-705 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-650'
                                        }`}
                                      >
                                        {subj} {isAssigned && '✓'}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>

                            {/* SSS POOL */}
                            <div className="space-y-2 pt-2">
                              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Senior Secondary (SSS) - Assigns explicitly only to SSS
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {settingsSssSubjects
                                  .filter(s => s.toLowerCase().includes(subjectSelectionSearch.toLowerCase()))
                                  .map((subj) => {
                                    const explicitSssName = `${subj} (SSS)`;
                                    const isAssigned = (currentTeacher.subjects || []).includes(explicitSssName);
                                    return (
                                      <button
                                        key={subj}
                                        disabled={isAssigned}
                                        onClick={() => {
                                          const existing = currentTeacher.subjects || [];
                                          db.updateTeacherSubjects(currentTeacher.id, [...existing, explicitSssName]);
                                          refreshState();
                                          setIsAssignSubjectOpen(false);
                                          triggerToast(`Assigned predefined subject "${subj} (SSS)" to SSS role.`);
                                        }}
                                        className={`text-[10px] px-2.5 py-1 font-semibold rounded-lg border transition-all cursor-pointer ${
                                          isAssigned
                                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed font-bold'
                                            : 'bg-slate-50 border-slate-200 text-slate-705 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                                        }`}
                                      >
                                        {subj} {isAssigned && '✓'}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => {
                              setIsAssignSubjectOpen(false);
                              setSubjectSelectionSearch('');
                              setCustomSubjectInput('');
                            }}
                            className="text-slate-500 hover:text-slate-800 font-bold text-xs py-2 px-4 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Close Dialog
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            }

               {/* Standard fallback Roster table */}
            return (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 font-sans space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <FolderPlus className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-800">Recruit Staff & Admins</h3>
                    </div>
                    
                    <form onSubmit={handleCreateTeacher} className="space-y-4">
                      {/* Account Role Segmented Toggle */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Role</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewStaffRole('teacher')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${newStaffRole === 'teacher' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-3xs' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}
                          >
                            Teacher
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewStaffRole('admin')}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${newStaffRole === 'admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-3xs' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}
                          >
                            Administrator
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Dr. Arthur Pendelton" 
                          value={newTeacherName}
                          onChange={(e) => setNewTeacherName(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Registered Email</label>
                        <input 
                          type="email" 
                          placeholder="a.pendelton@royalpath.edu" 
                          value={newTeacherEmail}
                          onChange={(e) => setNewTeacherEmail(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                      
                      {newStaffRole === 'teacher' && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Academics Department</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Science, Mathematics" 
                            value={newTeacherDept}
                            onChange={(e) => setNewTeacherDept(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-805 focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                        <input 
                          type="text" 
                          placeholder="+234 706 123 4567" 
                          value={newTeacherPhone}
                          onChange={(e) => setNewTeacherPhone(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 font-mono"
                        />
                      </div>

                      {/* Custom Permissions Select List */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Configure System Permissions</label>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 max-h-[220px] overflow-y-auto shadow-inner">
                          {[
                            { id: 'mark_attendance', label: 'Mark Class Attendance', desc: 'Allows marking daily class registers' },
                            { id: 'upload_scores', label: 'Upload Scores', desc: 'Upload CA, notebook, tests, results' },
                            { id: 'upload_notes', label: 'Upload & Edit Notes', desc: 'Upload and edit class syllabus study materials' },
                            { id: 'create_assessments', label: 'Create Assessments', desc: 'Quizzes, homework, tests, assignments, exams' },
                            { id: 'enter_comments', label: 'Enter Teacher Comments', desc: 'Enter classroom teacher report card feedback' },
                            { id: 'view_edit_form_class', label: 'Form Teacher Record Powers', desc: 'View / edit academic record of allocated form class' },
                            { id: 'view_edit_subject', label: 'Subject-Restricted Access', desc: 'View/edit only allocated subject records' }
                          ].map(perm => {
                            const isChecked = newStaffPermissions.includes(perm.id);
                            return (
                              <label key={perm.id} className="flex gap-2.5 items-start text-xs text-slate-700 font-medium cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors border border-slate-50/50">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setNewStaffPermissions(newStaffPermissions.filter(p => p !== perm.id));
                                    } else {
                                      setNewStaffPermissions([...newStaffPermissions, perm.id]);
                                    }
                                  }}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5 w-3.5 h-3.5 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 text-xs block leading-tight">{perm.label}</span>
                                  <span className="text-[10px] text-slate-400 block leading-tight mt-0.5">{perm.desc}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add {newStaffRole === 'admin' ? 'Admins' : 'Staff/Faculty'}</span>
                      </button>
                    </form>
                  </div>
                  
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                      <h3 className="text-base font-bold text-slate-800">Department Staff & Admins Roster</h3>
                      <div className="flex items-center gap-2">
                        {/* Elegant Search Input with Search Icon */}
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="staff_roster_search_input"
                            type="text"
                            value={staffSearchQuery}
                            onChange={(e) => setStaffSearchQuery(e.target.value)}
                            placeholder="Search staff or admins..."
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl pl-9 pr-6 py-1.5 text-xs w-48 sm:w-52 focus:outline-none focus:border-indigo-500 font-medium transition-all"
                          />
                          {staffSearchQuery && (
                            <button
                              id="staff_search_clear_btn"
                              onClick={() => setStaffSearchQuery('')}
                              className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold font-sans cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-3 py-1.5 rounded-xl border border-indigo-150 shrink-0">
                          {dbState.users.filter(u => u.role === 'teacher' || u.role === 'admin').length} active records
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-slate-500 text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50">
                            <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Staff Profile Info</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Authorized Designation</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px]">Assigned Role Scope</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider text-[11px] text-right">Settings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {dbState.users
                            .filter(u => u.role === 'teacher' || u.role === 'admin')
                            .filter(u => {
                              if (!staffSearchQuery.trim()) return true;
                              const query = staffSearchQuery.toLowerCase().trim();
                              const nameMatch = u.fullName?.toLowerCase().includes(query);
                              const emailMatch = u.email?.toLowerCase().includes(query);
                              
                              let deptMatch = false;
                              if (u.role === 'teacher') {
                                const teachObj = dbState.teachers.find(t => t.id === u.id);
                                if (teachObj && teachObj.department) {
                                  deptMatch = teachObj.department.toLowerCase().includes(query);
                                }
                              }
                              
                              return nameMatch || emailMatch || deptMatch;
                            })
                            .map((u) => {
                            const isTeach = u.role === 'teacher';
                            const teachObj = isTeach ? dbState.teachers.find(t => t.id === u.id) : null;
                            const taughtClasses = isTeach ? dbState.classes.filter(c => c.teacherId === u.id) : [];
                            const permissionsUsed = u.permissions || [];

                            return (
                              <tr 
                                key={u.id} 
                                className="hover:bg-slate-50/65 transition-all group font-sans"
                              >
                                <td className="py-4 px-4 cursor-pointer" onClick={() => { if (isTeach) { setSelectedTeacherId(u.id); } else { triggerToast('Permissions can be updated in future releases or directly inside DB viewer.'); } }}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full ${isTeach ? 'bg-[#10b981]' : 'bg-[#e11d48]'}`}></div>
                                    <p className="font-bold text-slate-800 group-hover:text-indigo-650 transition-colors flex items-center gap-1.5">
                                      <span>{u.fullName}</span>
                                      {isTeach ? (
                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-650 px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                          View Capabilities
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-100">
                                          SYSTEM ADMIN
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <p className="text-xs text-slate-400 mt-0.5 font-medium">{u.email}</p>
                                  {isTeach && teachObj && teachObj.phone && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{teachObj.phone}</p>}
                                </td>
                                
                                <td className="py-4 px-4">
                                  {u.role === 'teacher' ? (
                                    <span className="px-2 py-1 bg-slate-100 font-bold text-slate-700 rounded-md text-[10px] uppercase tracking-wider">{teachObj?.department || 'General Studies'}</span>
                                  ) : (
                                    <span className="px-2 py-1 bg-slate-800 font-bold text-white rounded-md text-[10px] uppercase tracking-wider">Academic Admin</span>
                                  )}
                                </td>

                                <td className="py-4 px-4">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{permissionsUsed.length} / 7 Permissions Allowed</p>
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                      {permissionsUsed.map((p) => {
                                        const abbv: Record<string, string> = {
                                          mark_attendance: 'Att',
                                          upload_scores: 'Scrs',
                                          upload_notes: 'Nts',
                                          create_assessments: 'Asm',
                                          enter_comments: 'Cmt',
                                          view_edit_form_class: 'Form',
                                          view_edit_subject: 'Subj Only'
                                        };
                                        return (
                                          <span key={p} className="text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.2 rounded-md font-mono" title={p}>
                                            {abbv[p] || p}
                                          </span>
                                        );
                                      })}
                                    </div>
                                    {isTeach && (
                                      <div className="pt-1 select-none flex flex-wrap gap-1">
                                        {taughtClasses.length === 0 ? (
                                          <span className="text-[9px] italic text-slate-400">No rooms allocated</span>
                                        ) : (
                                          taughtClasses.map(c => (
                                            <span key={c.id} className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1 px-1.5 py-0.2 rounded-md">
                                              {c.name}
                                            </span>
                                          ))
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="py-4 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isTeach && (
                                      <button 
                                        onClick={() => setSelectedTeacherId(u.id)}
                                        className="p-1 px-2.5 text-xs text-indigo-600 font-bold bg-indigo-50 border border-indigo-150 hover:bg-slate-900 hover:text-white rounded-lg transition-all cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        if (u.id === 'usr-admin-1') {
                                          triggerToast('The primary administrator account cannot be deleted.', true);
                                          return;
                                        }
                                        requestConfirm({
                                          title: `Delete ${isTeach ? 'Teacher' : 'Staff / Admin'}`,
                                          message: `Are you sure you want to completely remove "${u.fullName}" (${u.email}) from the portal system? They will lose all access and assigned duties.`,
                                          confirmText: 'Yes, Delete',
                                          isDestructive: true,
                                          onConfirm: () => {
                                            db.deleteUser(u.id);
                                            if (selectedTeacherId === u.id) {
                                              setSelectedTeacherId(null);
                                            }
                                            triggerToast(`${isTeach ? 'Teacher' : 'Staff'} "${u.fullName}" was successfully deleted.`);
                                            refreshState();
                                          }
                                        });
                                      }}
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                                      title="Delete Staff User"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* VIEW: STUDENT MANAGEMENT */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-4">
                <div className="lg:col-span-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 font-sans">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-800">Add Student Record</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsImportStudentsModalOpen(true)}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-3xs"
                        id="quick_import_students_csv_btn"
                        title="Bulk import students via CSV spreadsheet"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Import</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportStudentsCSV}
                        className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-3xs"
                        id="quick_export_students_csv_btn"
                        title="Export registered students to CSV spreadsheet"
                      >
                        <Download className="w-3 h-3" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                  <form onSubmit={handleCreateStudent} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Penelope Scott" 
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Classes</label>
                      <select 
                        value={newStudentGrade}
                        onChange={(e) => setNewStudentGrade(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden font-medium"
                      >
                        <option value="">-- Choose Class --</option>
                        {dbState.classes.map((cls) => (
                          <option key={cls.id} value={cls.name}>{cls.name} ({cls.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Roll Number Unique ID *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. RPC-2026-001" 
                        value={newStudentRoll}
                        onChange={(e) => setNewStudentRoll(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-808 uppercase font-mono font-medium focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Please specify a unique identifier/roll number for the student.</p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Birth Date</label>
                      <input 
                        type="date" 
                        value={newStudentBirth}
                        onChange={(e) => setNewStudentBirth(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Link Parent Guardian</label>
                      <select 
                        value={newStudentParentId}
                        onChange={(e) => setNewStudentParentId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-805 focus:outline-hidden"
                      >
                        <option value="">-- Select Parent (Optional) --</option>
                        {dbState.parents.map((p) => (
                          <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm hover:bg-indigo-750 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Admit Student</span>
                    </button>
                  </form>
                </div>
                
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Student Directory</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">Search, export, and manage registered students</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsImportStudentsModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                        id="import_students_directory_btn"
                        title="Import bulk student admissions via CSV spreadsheet"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Import CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportStudentsCSV}
                        className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0"
                        id="export_students_directory_btn"
                        title="Export student directory to CSV spreadsheet"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Export CSV</span>
                      </button>

                      <div className="relative flex-1 sm:w-52 min-w-[150px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search by name, roll..."
                          value={studentDirectorySearchQuery}
                          onChange={(e) => setStudentDirectorySearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all duration-200"
                        />
                        {studentDirectorySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setStudentDirectorySearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-500 text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50">
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Registration</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Classes</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Linked Parent Guardian</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Classes Enrolled</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const query = studentDirectorySearchQuery.toLowerCase().trim();
                          const filtered = dbState.students.filter((stud) => {
                            if (!query) return true;
                            const parObj = dbState.parents.find(p => p.id === stud.parentId);
                            return (
                              stud.fullName.toLowerCase().includes(query) ||
                              stud.rollNumber.toLowerCase().includes(query) ||
                              stud.gradeLevel.toLowerCase().includes(query) ||
                              (parObj && parObj.fullName.toLowerCase().includes(query)) ||
                              (parObj && parObj.email.toLowerCase().includes(query))
                            );
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-slate-400 italic text-xs">
                                  {studentDirectorySearchQuery ? 'No students found matching your search.' : 'No registered students in directory.'}
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((stud, idx) => {
                            const parObj = dbState.parents.find(p => p.id === stud.parentId);
                            const classEnrollCount = dbState.enrollments.filter(e => e.studentId === stud.id).length;
                            return (
                              <tr key={`${stud.id}_${idx}`} className="hover:bg-slate-50/30 transition-all">
                                <td className="py-4 px-4">
                                  <p className="font-bold text-slate-800">{stud.fullName}</p>
                                  <p className="text-xs font-mono text-slate-400 mt-0.5">{stud.rollNumber}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">DOB: {stud.birthDate}</p>
                                </td>
                                <td className="py-4 px-4 font-semibold text-slate-600">
                                  <span className="px-2.5 py-1 bg-indigo-50/50 text-indigo-700 rounded-md text-xs">{stud.gradeLevel}</span>
                                </td>
                                <td className="py-4 px-4 font-semibold text-slate-700">
                                  {parObj ? (
                                    <div>
                                      <p className="text-slate-805">{parObj.fullName}</p>
                                      <p className="text-xs text-slate-404 font-light">{parObj.email}</p>
                                    </div>
                                  ) : (
                                    <span className="text-amber-500 italic text-xs">No Guardian linked</span>
                                  )}
                                </td>
                                <td className="py-4 px-4">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                                    {classEnrollCount} Enrolled
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingStudentId(stud.id);
                                      setEditStudentName(stud.fullName);
                                      setEditStudentRoll(stud.rollNumber);
                                      setEditStudentBirth(stud.birthDate);
                                      setEditStudentGrade(stud.gradeLevel);
                                    }}
                                    className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                                    title="Edit Student Details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      requestConfirm({
                                        title: 'Delete Student Permanently',
                                        message: `Are you sure you want to permanently delete student "${stud.fullName}"? This action will remove all their enrollments, grades, and attendance records.`,
                                        confirmText: 'Delete Student',
                                        isDestructive: true,
                                        onConfirm: () => {
                                          const success = db.deleteStudent(stud.id);
                                          if (success) {
                                            triggerToast(`Student "${stud.fullName}" has been permanently deleted.`);
                                          } else {
                                            triggerToast(`Failed to delete student "${stud.fullName}".`, true);
                                          }
                                          refreshState();
                                        }
                                      });
                                    }}
                                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                                    title="Delete Student Permanently"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Class Enrollments Portal */}
              <div className="border-t border-slate-100 pt-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 font-sans">
                    <div className="flex items-center gap-2 mb-4">
                      <Link2 className="w-4 h-4 text-indigo-650" />
                      <h3 className="text-sm font-bold text-slate-800">Enrollment Portal</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-4">
                      Enroll students directly into scheduled academic modules.
                    </p>
                    <form onSubmit={handleEnrollStudent} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Choose Student</label>
                          {dbState.students.length > 5 && (
                            <span className="text-[10px] text-slate-400 italic">Filterable list below</span>
                          )}
                        </div>
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Type to filter student dropdown..."
                            value={enrollSelectStudentSearch}
                            onChange={(e) => setEnrollSelectStudentSearch(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 placeholder-slate-400 transition-all font-sans"
                          />
                          {enrollSelectStudentSearch && (
                            <button
                              type="button"
                              onClick={() => setEnrollSelectStudentSearch('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <select 
                          value={selectedEnrollStudentId}
                          onChange={(e) => setSelectedEnrollStudentId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">-- Select Student --</option>
                          {dbState.students.filter(s => {
                            const q = enrollSelectStudentSearch.toLowerCase().trim();
                            if (!q) return true;
                            return s.fullName.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
                          }).map((s) => (
                            <option key={s.id} value={s.id}>{s.fullName} ({s.rollNumber})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Choose Class Module</label>
                          {dbState.classes.length > 3 && (
                            <span className="text-[10px] text-slate-400 italic">Filterable list below</span>
                          )}
                        </div>
                        <div className="relative mb-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Type to filter classes dropdown..."
                            value={enrollSelectClassSearch}
                            onChange={(e) => setEnrollSelectClassSearch(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 placeholder-slate-400 transition-all font-sans"
                          />
                          {enrollSelectClassSearch && (
                            <button
                              type="button"
                              onClick={() => setEnrollSelectClassSearch('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <select 
                          value={selectedEnrollClassId}
                          onChange={(e) => setSelectedEnrollClassId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">-- Choose Class --</option>
                          {dbState.classes.filter(cls => {
                            const q = enrollSelectClassSearch.toLowerCase().trim();
                            if (!q) return true;
                            const teacher = dbState.teachers.find(t => t.id === cls.teacherId);
                            return (
                              cls.name.toLowerCase().includes(q) ||
                              cls.code.toLowerCase().includes(q) ||
                              (teacher && teacher.fullName.toLowerCase().includes(q))
                            );
                          }).map((cls) => {
                            const teacher = dbState.teachers.find(t => t.id === cls.teacherId);
                            return (
                              <option key={cls.id} value={cls.id}>
                                {cls.name} ({cls.code}) - {teacher?.fullName}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Execute Enrollment</span>
                      </button>
                    </form>
                  </div>
                  
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 font-sans">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">Active Course Enrollments</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Search active course sign-ups currently registered</p>
                      </div>
                      <div className="relative max-w-xs w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search enrollment student or class..."
                          value={enrollmentPortalSearchQuery}
                          onChange={(e) => setEnrollmentPortalSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all duration-200"
                        />
                        {enrollmentPortalSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setEnrollmentPortalSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-slate-500 text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50">
                            <th className="py-3 px-4 font-bold uppercase tracking-wider">Class Info</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider">Student Name</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider">Classes</th>
                            <th className="py-3 px-4 font-bold uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const query = enrollmentPortalSearchQuery.toLowerCase().trim();
                            const filtered = dbState.enrollments.filter((enr) => {
                              const cls = dbState.classes.find(c => c.id === enr.classId);
                              const std = dbState.students.find(s => s.id === enr.studentId);
                              if (!cls || !std) return false;
                              if (!query) return true;
                              return (
                                cls.name.toLowerCase().includes(query) ||
                                cls.code.toLowerCase().includes(query) ||
                                std.fullName.toLowerCase().includes(query) ||
                                std.rollNumber.toLowerCase().includes(query) ||
                                std.gradeLevel.toLowerCase().includes(query)
                              );
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="py-8 text-center text-slate-404 italic text-xs">
                                    {enrollmentPortalSearchQuery ? 'No active enrollments match your criteria.' : 'No students enrolled yet.'}
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((enr) => {
                              const cls = dbState.classes.find(c => c.id === enr.classId);
                              const std = dbState.students.find(s => s.id === enr.studentId);
                              if (!cls || !std) return null;
                              return (
                                <tr key={enr.id} className="hover:bg-slate-50/30 transition-all">
                                  <td className="py-4 px-4">
                                    <p className="font-bold text-slate-800">{cls.name}</p>
                                    <p className="font-mono text-[10px] text-slate-404">{cls.code}</p>
                                  </td>
                                  <td className="py-4 px-4 font-bold text-slate-800">
                                    {std.fullName}
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                      {std.gradeLevel}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <button
                                      onClick={() => handleUnenroll(std.id, cls.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg border border-transparent hover:border-rose-100 hover:bg-rose-50/50 transition-all cursor-pointer"
                                      title="Unenroll student"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* VIEW: PARENT MANAGEMENT */}
          {activeTab === 'parents' && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 font-sans">
                  <div className="flex items-center gap-2 mb-4">
                    <FolderPlus className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-805">Register Parent Profile</h3>
                  </div>
                  <form onSubmit={handleCreateParent} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Eleanor Foley" 
                        value={newParentName}
                        onChange={(e) => setNewParentName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="eleanor@gmail.com" 
                        value={newParentEmail}
                        onChange={(e) => setNewParentEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Phone</label>
                      <input 
                        type="text" 
                        placeholder="+1 (555) 888-9999" 
                        value={newParentPhone}
                        onChange={(e) => setNewParentPhone(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Link Wards (Onboarding)</label>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                          {newParentSelectedWards.length} selected
                        </span>
                      </div>
                      
                      {/* Search Bar for Onboarding Wards */}
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search ward by name or class..."
                          value={onboardingWardSearch}
                          onChange={(e) => setOnboardingWardSearch(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="border border-slate-200 rounded-xl p-3 max-h-[160px] overflow-y-auto bg-white space-y-2">
                        {dbState.students.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No registered students found.</p>
                        ) : (
                          (() => {
                            const filtered = dbState.students.filter(stud => {
                              const q = onboardingWardSearch.toLowerCase().trim();
                              return stud.fullName.toLowerCase().includes(q) || stud.gradeLevel.toLowerCase().includes(q);
                            });
                            if (filtered.length === 0) {
                              return <p className="text-xs text-slate-400 italic">No matching students found.</p>;
                            }
                            return filtered.map((stud, idx) => {
                              const isChecked = newParentSelectedWards.includes(stud.id);
                              const currentGuardian = stud.parentId ? dbState.parents.find(p => p.id === stud.parentId)?.fullName : null;
                              return (
                                <label key={`${stud.id}_${idx}`} className="flex items-center gap-2 text-xs text-slate-705 font-medium cursor-pointer p-1 hover:bg-slate-50 rounded-lg transition-colors">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setNewParentSelectedWards(newParentSelectedWards.filter(id => id !== stud.id));
                                      } else {
                                        setNewParentSelectedWards([...newParentSelectedWards, stud.id]);
                                      }
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                  />
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-800">{stud.fullName}</span>
                                    <span className="text-[10px] text-slate-400 ml-1">({stud.gradeLevel})</span>
                                    {currentGuardian && (
                                      <span className="text-[9px] text-amber-600 italic block">Custody: {currentGuardian}</span>
                                    )}
                                  </div>
                                </label>
                              );
                            });
                          })()
                        )}
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Onboard Guardian</span>
                    </button>
                  </form>
                </div>
                
                <div className="lg:col-span-8 space-y-4">
                  <h3 className="text-base font-bold text-slate-800">Guardians Directory</h3>
                  <p className="text-xs text-slate-400">
                    Parents can authenticate to view academic statistics, latest exam results, feedback, and class attendance registers for their linked children.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-slate-500 text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 bg-slate-50/50">
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Parents Info</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Contact Phone</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Associated Children</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider">Linked Users Code</th>
                          <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dbState.parents.map((par) => {
                          const associatedStudents = dbState.students.filter(s => s.parentId === par.id);
                          return (
                            <tr key={par.id} className="hover:bg-slate-50/30 transition-all font-sans">
                              <td className="py-4 px-4">
                                <p className="font-bold text-slate-800">{par.fullName}</p>
                                <p className="text-xs text-slate-404 mt-0.5">{par.email}</p>
                              </td>
                              <td className="py-4 px-4 font-mono text-slate-600 text-xs">
                                {par.phone}
                              </td>
                              <td className="py-4 px-4">
                                <div className="space-y-2">
                                  {associatedStudents.length === 0 ? (
                                    <p className="text-rose-400 italic text-xs">No children linked yet</p>
                                  ) : (
                                    <div className="flex flex-col gap-1.55">
                                      {associatedStudents.map((child, cIdx) => (
                                        <div key={`${child.id}_${cIdx}`} className="flex items-center justify-between gap-2 border-l-2 border-slate-200 pl-2 py-0.5">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-slate-800 text-xs">{child.fullName}</span>
                                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded font-mono">{child.gradeLevel}</span>
                                          </div>
                                          <button
                                            onClick={() => handleUnlinkWard(child.id)}
                                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50 transition-all cursor-pointer"
                                            title={`Unlink ${child.fullName}`}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div className="pt-1.5 border-t border-slate-100/65">
                                    <select
                                      defaultValue=""
                                      onChange={(e) => {
                                        const studId = e.target.value;
                                        if (studId) {
                                          handleLinkWard(studId, par.id);
                                          e.target.value = "";
                                        }
                                      }}
                                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[10px] text-slate-600 focus:outline-hidden max-w-[150px] cursor-pointer"
                                    >
                                      <option value="">+ Link a child</option>
                                      {dbState.students
                                        .filter(s => s.parentId !== par.id)
                                        .map(s => (
                                          <option key={s.id} value={s.id}>
                                            {s.fullName} ({s.gradeLevel})
                                          </option>
                                        ))}
                                    </select>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 font-mono text-[10px] text-slate-400">
                                {par.id}
                              </td>
                              <td className="py-4 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteParent(par.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-100 inline-flex items-center justify-center"
                                  title="Delete Parent/Guardian"
                                >
                                  <Trash2 className="w-4 h-4 ml-auto" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <ProfileAvatarManager 
                userId={adminId}
                userFullName={adminName}
                onAvatarUpdated={onRefreshUserSession}
              />

              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">General Portal & School Settings</h2>
                  <p className="text-xs text-slate-400">Configure branding identity, contact directories, signature validation, and portal color theme presets.</p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${getThemeColorClass(settingsColorTheme, 'border_light')} ${getThemeColorClass(settingsColorTheme, 'bg_light')} ${getThemeColorClass(settingsColorTheme, 'accent_text')}`}>
                    Active Color: {settingsColorTheme}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: BRANDING (LOGO & SIGNATURE) */}
                <div className="lg:col-span-4 space-y-6">
                  {/* SCHOOL LOGO BRANDING */}
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 font-sans space-y-4">
                    <div className="flex items-center gap-2">
                      <Image className={`w-4 h-4 ${getThemeColorClass(settingsColorTheme, 'text_primary')}`} />
                      <h3 className="text-xs font-bold text-slate-705 uppercase tracking-wider">School Logo Branding</h3>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-white space-y-3">
                      <div className="relative group w-36 h-36 flex items-center justify-center border border-slate-100 rounded-2xl p-2 bg-white shadow-xs">
                        <SchoolLogo src={settingsSchoolLogo} className="w-full h-full object-contain" />
                        {settingsSchoolLogo && settingsSchoolLogo !== ROYALPATH_LOGO_DATA_URL && (
                          <button 
                            type="button"
                            onClick={() => {
                              setSettingsSchoolLogo(ROYALPATH_LOGO_DATA_URL);
                              localStorage.removeItem('settings_school_logo');
                              triggerToast('School logo reset to official RoyalPath College crest.', true);
                            }}
                            className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-transform cursor-pointer hover:scale-105"
                            title="Reset to official crest"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <label className="block">
                        <span className="sr-only">Choose File</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSettingsSchoolLogo(reader.result as string);
                                triggerToast('School logo successfully uploaded!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-xs text-slate-500
                            file:mr-2 file:py-1.5 file:px-3
                            file:rounded-full file:border-0
                            file:text-[10px] file:font-bold
                            file:bg-slate-100 file:text-slate-700
                            hover:file:bg-slate-200 cursor-pointer"
                        />
                      </label>
                      <p className="text-[9px] text-slate-400 text-center">SVG, PNG, or JPG up to 1MB</p>
                    </div>
                  </div>

                  {/* ADMISTRATOR DIGITAL SIGNATURE */}
                  <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 font-sans space-y-4">
                    <div className="flex items-center gap-2">
                      <Sliders className={`w-4 h-4 ${getThemeColorClass(settingsColorTheme, 'text_primary')}`} />
                      <h3 className="text-xs font-bold text-slate-705 uppercase tracking-wider">Report Card Signature</h3>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-white space-y-3">
                      {settingsAdminSignature ? (
                        <div className="relative group w-full h-16 flex items-center justify-center border border-slate-100 rounded-lg p-1 bg-white">
                          <img src={settingsAdminSignature} alt="Principal Signature" className="max-h-full max-w-full object-contain" />
                          <button 
                            type="button"
                            onClick={() => {
                              setSettingsAdminSignature('');
                              localStorage.removeItem('settings_admin_signature');
                              triggerToast('Digital signature cleared.', true);
                            }}
                            className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg transition-transform cursor-pointer hover:scale-105"
                            title="Delete signature"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <div className="w-12 h-6 border-b border-slate-300 border-dashed mx-auto mb-2 flex items-center justify-center">
                            <span className="text-[9px] text-slate-300 italic">Signature</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold">No signature uploaded</p>
                        </div>
                      )}

                      <label className="block">
                        <span className="sr-only">Choose File</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSettingsAdminSignature(reader.result as string);
                                triggerToast('Principal signature uploaded successfully!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="block w-full text-xs text-slate-500
                            file:mr-2 file:py-1.5 file:px-3
                            file:rounded-full file:border-0
                            file:text-[10px] file:font-bold
                            file:bg-slate-100 file:text-slate-700
                            hover:file:bg-slate-200 cursor-pointer"
                        />
                      </label>
                      <p className="text-[9px] text-slate-400 text-center">Transparent background signature recommended</p>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: INFORMATION & THEME COLOR */}
                <div className="lg:col-span-8 space-y-6">
                  {/* SCHOOL PROFILE FORM */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Institution Profile & Contact Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Institution Name</label>
                        <div className="relative">
                          <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            value={settingsSchoolName}
                            onChange={(e) => setSettingsSchoolName(e.target.value)}
                            placeholder="e.g. RoyalPath College"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-805 font-semibold focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Principal's Full Name</label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            value={settingsPrincipalName}
                            onChange={(e) => setSettingsPrincipalName(e.target.value)}
                            placeholder="e.g. Principal Ayanwunmi"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-805 font-semibold focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Administrative Email Address</label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="email" 
                            value={settingsAdminEmail}
                            onChange={(e) => setSettingsAdminEmail(e.target.value)}
                            placeholder="admin@oakridge.edu"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-805 font-semibold focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Contact Line</label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            value={settingsPhoneNumber}
                            onChange={(e) => setSettingsPhoneNumber(e.target.value)}
                            placeholder="+1 (555) 012-3456"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-805 font-semibold focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Street Address</label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            value={settingsAddress}
                            onChange={(e) => setSettingsAddress(e.target.value)}
                            placeholder="100 Scholar Way"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-805 font-semibold focus:outline-hidden focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">City</label>
                        <input 
                          type="text" 
                          value={settingsCity}
                          onChange={(e) => setSettingsCity(e.target.value)}
                          placeholder="Lexington"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-805 font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">State / Province</label>
                        <input 
                          type="text" 
                          value={settingsState}
                          onChange={(e) => setSettingsState(e.target.value)}
                          placeholder="Massachusetts"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-850 font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Postal Code</label>
                        <input 
                          type="text" 
                          value={settingsPostalCode}
                          onChange={(e) => setSettingsPostalCode(e.target.value)}
                          placeholder="02421"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-805 font-semibold focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Country</label>
                        <input 
                          type="text" 
                          value={settingsCountry}
                          onChange={(e) => setSettingsCountry(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-805 font-semibold focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SYSTEM CAPACITY & CLASS LIMITS */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Capacity & Class Limits</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">Define the maximum number of classes the institution is permitted to operate.</p>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100/60 font-semibold px-2.5 py-1 rounded-full text-[10px]">
                        Active Limit: {settingsMaxClassesLimit} Classes
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Configure Maximum Permitted Classes</label>
                        <p className="text-[11px] text-slate-400">Increase class capacity to accommodate curriculum expansion (supported: 7 to 24 classes).</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="range" 
                          min="7" 
                          max="24" 
                          value={settingsMaxClassesLimit}
                          onChange={(e) => setSettingsMaxClassesLimit(Number(e.target.value))}
                          className="w-32 accent-indigo-650 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="number"
                          min="7"
                          max="24"
                          value={settingsMaxClassesLimit}
                          onChange={(e) => {
                            const val = Math.min(24, Math.max(7, Number(e.target.value) || 7));
                            setSettingsMaxClassesLimit(val);
                          }}
                          className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-805 font-mono font-semibold text-center focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SCHOOL CATEGORIES & SUBJECTS CURRICULUM */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">School Categories & Curriculum</h3>
                      <p className="text-[11px] text-slate-400">Configure distinct subject pools for Junior Secondary and Senior Secondary categories with full custom capability.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* JUNIOR SECONDARY SCHOOL */}
                      <div className="border border-slate-100 rounded-2xl p-4 space-y-4 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${getThemeColorClass(settingsColorTheme, 'bullet')} block`}></span>
                            Junior Secondary School (JSS)
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getThemeColorClass(settingsColorTheme, 'bg_light')} ${getThemeColorClass(settingsColorTheme, 'accent_text')}`}>
                            {settingsJssSubjects.length} Subjects
                          </span>
                        </div>

                        {/* Subject list */}
                        <div className="flex flex-wrap gap-2 min-h-[100px] p-2.5 bg-white border border-slate-200/60 rounded-xl max-h-[220px] overflow-y-auto">
                          {settingsJssSubjects.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic m-auto">No subjects configured. Add one below.</span>
                          ) : (
                            settingsJssSubjects.map((sub, index) => (
                              <div key={`${sub}-${index}`} className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-705 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-slate-250 border-slate-200 transition-colors">
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSettingsJssSubjects(settingsJssSubjects.filter((_, i) => i !== index));
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title={`Remove ${sub}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Subject Row */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add JSS subject..."
                            value={newJssSubjectInput}
                            onChange={(e) => setNewJssSubjectInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newJssSubjectInput.trim()) {
                                  if (settingsJssSubjects.includes(newJssSubjectInput.trim())) {
                                    triggerToast('Subject is already listed.', true);
                                  } else {
                                    setSettingsJssSubjects([...settingsJssSubjects, newJssSubjectInput.trim()]);
                                    setNewJssSubjectInput('');
                                  }
                                }
                              }
                            }}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-805 font-medium focus:outline-hidden focus:border-indigo-500 flex-1 min-w-0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newJssSubjectInput.trim()) {
                                if (settingsJssSubjects.includes(newJssSubjectInput.trim())) {
                                  triggerToast('Subject is already listed.', true);
                                } else {
                                  setSettingsJssSubjects([...settingsJssSubjects, newJssSubjectInput.trim()]);
                                  setNewJssSubjectInput('');
                                }
                              }
                            }}
                            className={`py-1.5 px-3.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap ${getThemeColorClass(settingsColorTheme, 'btn_primary')}`}
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* SENIOR SECONDARY SCHOOL */}
                      <div className="border border-slate-100 rounded-2xl p-4 space-y-4 bg-slate-50/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                            Senior Secondary School (SSS)
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700`}>
                            {settingsSssSubjects.length} Subjects
                          </span>
                        </div>

                        {/* Subject list */}
                        <div className="flex flex-wrap gap-2 min-h-[100px] p-2.5 bg-white border border-slate-200/60 rounded-xl max-h-[220px] overflow-y-auto">
                          {settingsSssSubjects.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic m-auto">No subjects configured. Add one below.</span>
                          ) : (
                            settingsSssSubjects.map((sub, index) => (
                              <div key={`${sub}-${index}`} className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-705 font-bold text-[11px] px-2.5 py-1 rounded-lg border border-slate-250 border-slate-200 transition-colors">
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSettingsSssSubjects(settingsSssSubjects.filter((_, i) => i !== index));
                                  }}
                                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title={`Remove ${sub}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Subject Row */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add SSS subject..."
                            value={newSssSubjectInput}
                            onChange={(e) => setNewSssSubjectInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newSssSubjectInput.trim()) {
                                  if (settingsSssSubjects.includes(newSssSubjectInput.trim())) {
                                    triggerToast('Subject is already listed.', true);
                                  } else {
                                    setSettingsSssSubjects([...settingsSssSubjects, newSssSubjectInput.trim()]);
                                    setNewSssSubjectInput('');
                                  }
                                }
                              }
                            }}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-805 font-medium focus:outline-hidden focus:border-indigo-500 flex-1 min-w-0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newSssSubjectInput.trim()) {
                                if (settingsSssSubjects.includes(newSssSubjectInput.trim())) {
                                  triggerToast('Subject is already listed.', true);
                                } else {
                                  setSettingsSssSubjects([...settingsSssSubjects, newSssSubjectInput.trim()]);
                                  setNewSssSubjectInput('');
                                }
                              }
                            }}
                            className={`py-1.5 px-3.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap ${getThemeColorClass(settingsColorTheme, 'btn_primary')}`}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>

                  {/* PORTAL THEME SELECTION */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Portal Theme Accent Color</h3>
                      <span className="text-[9px] font-bold text-slate-400">Selects general color highlights across panel states</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {[
                        { id: 'indigo', name: 'Indigo Core', class: 'bg-[#404ce5]' },
                        { id: 'blue', name: 'Ocean Blue', class: 'bg-blue-600' },
                        { id: 'emerald', name: 'Emerald', class: 'bg-emerald-600' },
                        { id: 'rose', name: 'Ruby Rose', class: 'bg-rose-600' },
                        { id: 'amber', name: 'Gold Amber', class: 'bg-amber-500' },
                        { id: 'violet', name: 'Deep Violet', class: 'bg-violet-600' },
                        { id: 'slate', name: 'Dark Slate', class: 'bg-slate-700' }
                      ].map((th) => {
                        const isSel = settingsColorTheme === th.id;
                        return (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => setSettingsColorTheme(th.id)}
                            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                              isSel ? 'border-slate-850 bg-slate-50/50 ring-2 ring-slate-800/10' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full inline-block ${th.class} shadow-inner flex items-center justify-center`}>
                              {isSel && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                            </span>
                            <span className="text-[10px] whitespace-nowrap font-bold text-slate-705">{th.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LOG IN SECURITY: PASSWORD CONFIGURATION */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Login Security Credentials</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                      Configure a secure login password for your profile. Once saved/added, you will be required to log in using both your email and this password next time. Set to blank or empty to revert to email-only login.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Password</label>
                        <input
                          type="password"
                          value={adminNewPassword}
                          onChange={(e) => setAdminNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-805 font-medium focus:outline-none focus:border-indigo-505"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
                        <input
                          type="password"
                          value={adminConfirmPassword}
                          onChange={(e) => setAdminConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-805 font-medium focus:outline-none focus:border-indigo-505"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!adminNewPassword) {
                            db.updateUserPassword(adminId, '');
                            setDbState(db.getRawData());
                            setAdminNewPassword('');
                            setAdminConfirmPassword('');
                            triggerToast('Login password removed successfully. Email-only login restored.');
                            return;
                          }
                          if (adminNewPassword !== adminConfirmPassword) {
                            triggerToast('Passwords do not match. Please verify.', true);
                            return;
                          }
                          if (adminNewPassword.length < 4) {
                            triggerToast('Password must be at least 4 characters long.', true);
                            return;
                          }
                          
                          db.updateUserPassword(adminId, adminNewPassword);
                          setDbState(db.getRawData());
                          setAdminNewPassword('');
                          setAdminConfirmPassword('');
                          triggerToast('Your secure login password has been successfully configured!');
                        }}
                        className="bg-indigo-650 hover:bg-indigo-700 hover:text-white text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Update Password</span>
                      </button>
                    </div>
                  </div>

                  {/* SAVE ACTION BUTTON */}
                  <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <span className="text-[11px] text-slate-400 font-semibold italic">Remember to save to apply updates permanently.</span>
                    <button
                      type="button"
                      onClick={() => {
                        db.saveSetting('settings_school_name', settingsSchoolName);
                        db.saveSetting('settings_school_logo', settingsSchoolLogo);
                        db.saveSetting('settings_principal_name', settingsPrincipalName);
                        db.saveSetting('settings_admin_email', settingsAdminEmail);
                        db.saveSetting('settings_phone_number', settingsPhoneNumber);
                        db.saveSetting('settings_address', settingsAddress);
                        db.saveSetting('settings_city', settingsCity);
                        db.saveSetting('settings_postal_code', settingsPostalCode);
                        db.saveSetting('settings_state', settingsState);
                        db.saveSetting('settings_country', settingsCountry);
                        db.saveSetting('settings_admin_signature', settingsAdminSignature);
                        db.saveSetting('settings_color_theme', settingsColorTheme);
                        db.saveSetting('settings_jss_subjects', settingsJssSubjects);
                        db.saveSetting('settings_sss_subjects', settingsSssSubjects);
                        db.saveSetting('settings_allow_class_setup', String(settingsAllowClassSetup));
                        db.saveSetting('settings_max_classes_limit', String(settingsMaxClassesLimit));

                        // Broadcast theme / school name change if registered
                        const customEvent = new CustomEvent('school_settings_changed', {
                          detail: { name: settingsSchoolName, theme: settingsColorTheme, logo: settingsSchoolLogo }
                        });
                        window.dispatchEvent(customEvent);

                        // Custom alert toast
                        triggerToast('General school settings, categories curriculum, and color theme saved successfully!');
                      }}
                      className={`font-semibold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md ${getThemeColorClass(settingsColorTheme, 'btn_primary')}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
              </div>

              {/* SYSTEM EXPORTS AND PORTABILITY BACKUPS */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 md:p-8 space-y-6 animate-slide-in">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Database className={`w-5 h-5 ${getThemeColorClass(settingsColorTheme, 'text_primary')}`} />
                    <span>Administrative Backup & Cloud SQL Export Utilities</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Download immediate JSON snapshots of the complete Cloud SQL database or export modular CSV files for offline backups and disaster recovery.</p>
                </div>

                {/* Primary Full Cloud SQL JSON Backup Hero Banner */}
                <div className="bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <Server className="w-5 h-5" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Complete Cloud SQL Database Backup</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                            PostgreSQL europe-west2
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Exports all records (Users, Students, Teachers, Parents, Classes, Grades, Attendance, Enrollments, and Settings) into a formatted <code className="text-emerald-400 font-mono text-[11px]">.json</code> backup archive.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-300 font-mono pt-1">
                      <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700">Users: {dbState.users.length}</span>
                      <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700">Students: {dbState.students.length}</span>
                      <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700">Classes: {dbState.classes.length}</span>
                      <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700">Grades: {dbState.grades.length}</span>
                      <span className="bg-slate-800/80 px-2 py-1 rounded border border-slate-700">Attendance: {dbState.attendance.length}</span>
                    </div>
                  </div>

                  <div className="self-stretch md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={handleExportCloudSqlJSON}
                      disabled={isExportingJson}
                      className="w-full md:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isExportingJson ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{isExportingJson ? 'Exporting Cloud SQL JSON...' : 'Download Full Backup (.json)'}</span>
                    </button>
                  </div>
                </div>
                
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Modular CSV Spreadsheet Exports</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      type="button"
                      onClick={handleExportGradesCSV}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 hover:border-slate-300 rounded-2xl text-left transition-all space-y-3 cursor-pointer group flex flex-col justify-between h-full"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:bg-emerald-105 group-hover:bg-emerald-100 transition-colors">
                          <Award className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">{dbState.grades.length} items</span>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-805">Student Grades</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Continuous assessment lists, midterms, exam scores, and teacher comments.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportAttendanceCSV}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 hover:border-slate-300 rounded-2xl text-left transition-all space-y-3 cursor-pointer group flex flex-col justify-between h-full"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 group-hover:bg-sky-105 group-hover:bg-sky-100 transition-colors">
                          <ClipboardCheck className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">{dbState.attendance.length} items</span>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-805">Attendance Database</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Historical logs of classroom roll-calls, student statuses, and notes.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportEnrollmentCSV}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 hover:border-slate-300 rounded-2xl text-left transition-all space-y-3 cursor-pointer group flex flex-col justify-between h-full"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="p-2 rounded-xl bg-violet-50 text-violet-700 border border-violet-100 group-hover:bg-violet-105 group-hover:bg-violet-100 transition-colors">
                          <Layers className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">{dbState.enrollments.length} items</span>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-805">Student Enrolment</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Active class schedules, room placements, and student registries.</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportTeachersCSV}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/50 hover:border-slate-300 rounded-2xl text-left transition-all space-y-3 cursor-pointer group flex flex-col justify-between h-full"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 group-hover:bg-teal-105 group-hover:bg-teal-100 transition-colors">
                          <Users className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">{dbState.teachers.length} items</span>
                      </div>
                      <div className="pt-2">
                        <h4 className="text-xs font-bold text-slate-850">Teacher Recruitment</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Staff directories, emails, department catalogs, and assigned scopes.</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* CLASS MANAGEMENT UTILITIES & SYSTEM DIALOGS */}
          {isAddClassModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#0f172a] text-base">Add New Class</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Register a brand new course • <span className="font-bold text-indigo-600 font-sans">{dbState.classes.length} / {settingsMaxClassesLimit} Classes used</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddClassModalOpen(false)}
                    className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateClassFromModal} className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Basic 6 or JSS 1" 
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject Code / Code Prefix *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MTH-101" 
                      value={newClassCode}
                      onChange={(e) => setNewClassCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 uppercase font-medium focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Teacher (Optional)</label>
                    <select 
                      value={newClassTeacherId}
                      onChange={(e) => setNewClassTeacherId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                    >
                      <option value="">-- Select Instructor --</option>
                      {dbState.teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class Fee (₦)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={newClassFee === 0 ? '' : newClassFee}
                        onChange={(e) => setNewClassFee(Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-hidden transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Extra Fee (₦)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={newClassExtraFee === 0 ? '' : newClassExtraFee}
                        onChange={(e) => setNewClassExtraFee(Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Room Location</label>
                      <input 
                        type="text" 
                        placeholder="Room 101" 
                        value={newClassRoom}
                        onChange={(e) => setNewClassRoom(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Schedule Times</label>
                      <input 
                        type="text" 
                        placeholder="MWF 9:00 - 10:15" 
                        value={newClassSchedule}
                        onChange={(e) => setNewClassSchedule(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Promotion Target Status</label>
                    <select 
                      value={newClassPromotionStatus}
                      onChange={(e) => setNewClassPromotionStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                    >
                      <option value="Auto">Auto-calculate from name</option>
                      <option value="→ JSS 1">→ JSS 1</option>
                      <option value="→ JSS 2">→ JSS 2</option>
                      <option value="→ JSS 2B">→ JSS 2B</option>
                      <option value="→ JSS 3">→ JSS 3</option>
                      <option value="→ JSS 3B">→ JSS 3B</option>
                      <option value="→ SSS 1">→ SSS 1</option>
                      <option value="→ SSS 1B">→ SSS 1B</option>
                      <option value="→ SSS 2">→ SSS 2</option>
                      <option value="→ SSS 2B">→ SSS 2B</option>
                      <option value="→ SSS 3">→ SSS 3</option>
                      <option value="Final Class">Final Class (Graduation Track)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Level of Education *</label>
                    <select 
                      value={newClassLevelOfEducation}
                      onChange={(e) => setNewClassLevelOfEducation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      required
                    >
                      <option value="Junior Secondary">Junior Secondary</option>
                      <option value="Senior Secondary">Senior Secondary</option>
                      <option value="Primary">Primary</option>
                      <option value="Nursery">Nursery</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddClassModalOpen(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4.5 rounded-xl text-xs transition-colors cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition-all cursor-pointer font-sans"
                    >
                      Create Course
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isEditClassModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#0f172a] text-base">Edit Class Details</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Modify settings and fee criteria for this track</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditClassModalOpen(false);
                      setEditingClassId(null);
                    }}
                    className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedClass} className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class Name *</label>
                    <input 
                      type="text" 
                      value={editClassName}
                      onChange={(e) => setEditClassName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject Code / Code Prefix *</label>
                    <input 
                      type="text" 
                      value={editClassCode}
                      onChange={(e) => setEditClassCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 uppercase font-medium focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Instructor *</label>
                    <select 
                      value={editClassTeacherId || ''}
                      onChange={(e) => setEditClassTeacherId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      required
                    >
                      <option value="">-- Choose Instructor --</option>
                      {dbState.teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class Fee (₦)</label>
                      <input 
                        type="number" 
                        value={editClassFee}
                        onChange={(e) => setEditClassFee(Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono font-medium focus:outline-hidden transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Extra Fee (₦)</label>
                      <input 
                        type="number" 
                        value={editClassExtraFee}
                        onChange={(e) => setEditClassExtraFee(Number(e.target.value) || 0)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-805 font-mono font-medium focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Room Location</label>
                      <input 
                        type="text" 
                        value={editClassRoom}
                        onChange={(e) => setEditClassRoom(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Schedule Times</label>
                      <input 
                        type="text" 
                        value={editClassSchedule}
                        onChange={(e) => setEditClassSchedule(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Promotion Target Status</label>
                    <select 
                      value={editClassPromotionStatus}
                      onChange={(e) => setEditClassPromotionStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-[#1e293b] font-medium focus:outline-hidden transition-all"
                    >
                      <option value="Auto">Auto-calculate from name</option>
                      <option value="→ JSS 1">→ JSS 1</option>
                      <option value="→ JSS 2">→ JSS 2</option>
                      <option value="→ JSS 2B">→ JSS 2B</option>
                      <option value="→ JSS 3">→ JSS 3</option>
                      <option value="→ JSS 3B">→ JSS 3B</option>
                      <option value="→ SSS 1">→ SSS 1</option>
                      <option value="→ SSS 1B">→ SSS 1B</option>
                      <option value="→ SSS 2">→ SSS 2</option>
                      <option value="→ SSS 2B">→ SSS 2B</option>
                      <option value="→ SSS 3">→ SSS 3</option>
                      <option value="Final Class">Final Class (Graduation Track)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Level of Education *</label>
                    <select 
                      value={editClassLevelOfEducation}
                      onChange={(e) => setEditClassLevelOfEducation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-[#1e293b] font-medium focus:outline-hidden transition-all"
                      required
                    >
                      <option value="Junior Secondary">Junior Secondary</option>
                      <option value="Senior Secondary">Senior Secondary</option>
                      <option value="Primary">Primary</option>
                      <option value="Nursery">Nursery</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditClassModalOpen(false);
                        setEditingClassId(null);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4.5 rounded-xl text-xs transition-colors cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition-all cursor-pointer font-sans"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {editingStudentId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
              <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-[#0f172a] text-base">Edit Student Details</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Modify student credentials and class designation</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingStudentId(null);
                    }}
                    className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleUpdateStudent} className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input 
                      type="text" 
                      value={editStudentName}
                      onChange={(e) => setEditStudentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class / Grade Level *</label>
                    <select 
                      value={editStudentGrade}
                      onChange={(e) => setEditStudentGrade(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      required
                    >
                      <option value="">-- Choose Class --</option>
                      {dbState.classes.map((cls) => (
                        <option key={cls.id} value={cls.name}>{cls.name} ({cls.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID / Roll Number *</label>
                    <input 
                      type="text" 
                      value={editStudentRoll}
                      onChange={(e) => setEditStudentRoll(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date of Birth *</label>
                    <input 
                      type="date" 
                      value={editStudentBirth}
                      onChange={(e) => setEditStudentBirth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      required
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudentId(null);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4.5 rounded-xl text-xs transition-colors cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-xs transition-all cursor-pointer font-sans"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isArchivedStudentsOpen && (() => {
            const archivedStudents = db.getArchivedStudents();
            const filteredArchived = archivedStudents.filter(st => {
              if (!archivedStudentsSearchQuery.trim()) return true;
              const q = archivedStudentsSearchQuery.toLowerCase();
              return (
                st.fullName.toLowerCase().includes(q) ||
                (st.rollNumber && st.rollNumber.toLowerCase().includes(q)) ||
                (st.archivedYear && st.archivedYear.toLowerCase().includes(q)) ||
                (st.archivedFromClass && st.archivedFromClass.toLowerCase().includes(q))
              );
            });

            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-[#0f172a] text-base flex items-center gap-2">
                        <Archive className="w-5 h-5 text-amber-600" />
                        <span>Archived Students Registry</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                          {archivedStudents.length} {archivedStudents.length === 1 ? 'Record' : 'Records'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Students who graduated or completed the academic calendar in senior classes (e.g. SS3A, SS3B)
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsArchivedStudentsOpen(false);
                        setArchivedStudentsSearchQuery('');
                      }}
                      className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    {/* Search bar */}
                    {archivedStudents.length > 0 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search archived students by name, roll number, or graduating class..."
                          value={archivedStudentsSearchQuery}
                          onChange={(e) => setArchivedStudentsSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-800 focus:outline-hidden transition-all"
                        />
                        {archivedStudentsSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setArchivedStudentsSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {archivedStudents.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-600">No archived students yet</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                          When you advance SS3A, SS3B, or other graduating classes, select <strong>Archive</strong> in the Destination Track to archive them here.
                        </p>
                      </div>
                    ) : filteredArchived.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-400 italic">
                        No archived students matching "{archivedStudentsSearchQuery}".
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredArchived.map((st) => (
                          <div key={st.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                                {st.fullName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-800 truncate">{st.fullName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span>{st.rollNumber}</span>
                                  <span>•</span>
                                  <span className="font-sans font-semibold text-slate-600">
                                    {st.archivedFromClass ? `Archived from ${st.archivedFromClass}` : 'Senior Secondary (Graduated)'}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="bg-amber-50 text-amber-800 border border-amber-200/90 font-semibold px-2.5 py-1 rounded-full text-[10px]">
                                {st.archivedYear || 'Class Completed'}
                              </span>
                              <button
                                type="button"
                                title="Restore student to active status"
                                onClick={() => {
                                  requestConfirm({
                                    title: 'Restore Student to Active Register',
                                    message: `Are you sure you want to restore ${st.fullName} back to active students?`,
                                    confirmText: 'Restore Student',
                                    isDestructive: false,
                                    onConfirm: () => {
                                      db.unarchiveStudent(st.id);
                                      triggerToast(`Successfully restored ${st.fullName} to active student registry.`);
                                      refreshState();
                                    }
                                  });
                                }}
                                className="text-[10px] text-slate-500 hover:text-indigo-650 hover:bg-white border border-transparent hover:border-slate-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                Restore
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium pl-2">
                      Academic graduation archives
                    </span>
                    <button
                      onClick={() => {
                        setIsArchivedStudentsOpen(false);
                        setArchivedStudentsSearchQuery('');
                      }}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors cursor-pointer font-sans"
                    >
                      Close Registry
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {viewingClassForStudents && (() => {
            const cls = viewingClassForStudents;
            const enrolled = dbState.enrollments
              .filter(e => e.classId === cls.id)
              .map(e => dbState.students.find(s => s.id === e.studentId))
              .filter((s): s is Student => !!s);

            const available = dbState.students.filter(s => {
              const isAlreadyEnrolled = dbState.enrollments.some(e => e.studentId === s.id && e.classId === cls.id);
              if (isAlreadyEnrolled) return false;
              if (searchWordForEnroll) {
                const q = searchWordForEnroll.toLowerCase();
                return s.fullName.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q);
              }
              return true;
            });

            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-extrabold text-[#0f172a] text-lg">Enrolled Students</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">
                        Currently assigned to <span className="font-bold text-slate-700">{cls.name}</span> ({enrolled.length} active students)
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingClassForStudents(null)}
                      className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200/65">
                      <h4 className="text-xs font-bold text-slate-700 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                        <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                        <span>Quick Enroll Student</span>
                      </h4>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Type student name or ID to search and enroll..."
                            value={searchWordForEnroll}
                            onChange={(e) => setSearchWordForEnroll(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-all font-medium"
                          />
                        </div>
                      </div>

                      {searchWordForEnroll && (
                        <div className="mt-2.5 bg-white border border-slate-150 rounded-xl overflow-hidden max-h-40 overflow-y-auto shadow-sm divide-y divide-slate-50">
                          {available.length === 0 ? (
                            <p className="p-3 text-xs text-slate-400 italic text-center">No unassigned results matching search criteria</p>
                          ) : (
                            available.map((st, idx) => (
                              <div key={`${st.id}_${idx}`} className="p-2.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                                <div>
                                  <p className="text-xs font-extrabold text-slate-800">{st.fullName}</p>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{st.rollNumber} • {st.gradeLevel}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    db.enrollStudentInClass(st.id, cls.id);
                                    triggerToast(`Enrolled "${st.fullName}" into ${cls.name} successfully!`);
                                    setSearchWordForEnroll('');
                                    refreshState();
                                  }}
                                  className="bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-650 hover:text-white font-extrabold px-3 py-1 rounded-lg text-[10px] transition-all cursor-pointer active:scale-95"
                                >
                                  Enroll Student
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Roster</p>
                      
                      {enrolled.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200/80 rounded-2xl p-8 text-center text-slate-400 italic font-medium">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs">No students are currently assigned to this course track.</p>
                        </div>
                      ) : (
                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                          {enrolled.map((st, idx) => (
                            <div key={`${st.id}_${idx}`} className="p-3.5 bg-white flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                              <div>
                                <p className="font-extrabold text-slate-800 text-sm">{st.fullName}</p>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">{st.rollNumber} • Class: {st.gradeLevel}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  requestConfirm({
                                    title: 'Unenroll Student',
                                    message: `Are you sure you want to unenroll student "${st.fullName}" from ${cls.name}?`,
                                    confirmText: 'Unenroll',
                                    isDestructive: true,
                                    onConfirm: () => {
                                      db.unenrollStudentFromClass(st.id, cls.id);
                                      triggerToast(`Unenrolled "${st.fullName}" from ${cls.name}.`);
                                      refreshState();
                                    }
                                  });
                                }}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer"
                                title="Unenroll student"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setViewingClassForStudents(null)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {viewingClassForSubjects && (() => {
            const cls = viewingClassForSubjects;
            const nameUpper = cls.name.toUpperCase();

            const masterSubjects = Array.from(new Set([
              ...settingsJssSubjects,
              ...settingsSssSubjects,
              'Mathematics', 'English Language', 'Basic Science', 'Physical & Health Education',
              'Social Studies', 'Agricultural Science', 'Home Economics', 'Business Studies',
              'Civic Education', 'Computer Studies', 'Creative Arts', 'French', 'Yoruba', 'Igbo', 'Hausa'
            ]));

            const currentSelected = subjectsAssignedOverride[cls.id] || (
              nameUpper.includes('JSS') || nameUpper.includes('JUNIOR') ? settingsJssSubjects : 
              nameUpper.includes('SSS') || nameUpper.includes('SENIOR') ? settingsSssSubjects : 
              ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Computer Studies', 'Creative Arts']
            );

            const handleToggleSubject = (sub: string) => {
              let updated: string[];
              if (currentSelected.includes(sub)) {
                updated = currentSelected.filter(s => s !== sub);
              } else {
                updated = [...currentSelected, sub];
              }
              const newOverrides = { ...subjectsAssignedOverride, [cls.id]: updated };
              setSubjectsAssignedOverride(newOverrides);
              db.saveSetting('class_subjects_override', newOverrides);
              triggerToast(`Updated registered subjects for ${cls.name}`);
            };

            const handleResetSubjects = () => {
              const newOverrides = { ...subjectsAssignedOverride };
              delete newOverrides[cls.id];
              setSubjectsAssignedOverride(newOverrides);
              db.saveSetting('class_subjects_override', newOverrides);
              triggerToast(`Reset ${cls.name} to curriculum defaults successfully!`);
            };

            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-extrabold text-[#0f172a] text-lg">Registered Subjects</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">
                        Academic curriculum and active courses for <span className="font-bold text-slate-700">{cls.name}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingClassForSubjects(null)}
                      className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Selected: <span className="text-indigo-650 font-black text-sm font-mono">{currentSelected.length}</span> Course Modules
                      </p>
                      <button
                        type="button"
                        onClick={handleResetSubjects}
                        className="text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-100/50 transition-all active:scale-95"
                      >
                        Reset Defaults
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                      {masterSubjects.map((sub) => {
                        const isChecked = currentSelected.includes(sub);
                        return (
                          <div
                            key={sub}
                            onClick={() => handleToggleSubject(sub)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isChecked
                                ? 'bg-indigo-50/50 border-indigo-250 text-indigo-900 shadow-3xs'
                                : 'bg-slate-50/40 border-slate-150 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <span className="text-xs font-bold font-sans">{sub}</span>
                            <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center border transition-all ${
                              isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3px]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setViewingClassForSubjects(null)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {viewingClassForTeacher && (() => {
            const cls = viewingClassForTeacher;
            const currentTeacher = dbState.teachers.find(t => t.id === cls.teacherId);
            
            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-extrabold text-[#0f172a] text-lg">Assigned Teacher</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">
                        Lead instructor profile for <span className="font-bold text-slate-700">{cls.name}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingClassForTeacher(null)}
                      className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {currentTeacher ? (
                      <div className="bg-slate-50/50 p-5 rounded-2.5xl border border-slate-200/65 flex flex-col items-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-650 font-black text-xl">
                          {currentTeacher.fullName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-800">{currentTeacher.fullName}</h4>
                          <p className="text-xs text-slate-500 font-semibold">{currentTeacher.department} Department</p>
                        </div>
                        <div className="w-full border-t border-slate-100 pt-3 flex flex-col gap-1.5 text-left text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Email</span>
                            <span className="font-semibold text-slate-705">{currentTeacher.email}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Phone</span>
                            <span className="font-semibold text-slate-750 font-mono">{currentTeacher.phone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 text-amber-850 p-4.5 rounded-2xl text-xs space-y-2 text-center">
                        <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                        <p className="font-bold">No Teacher Active</p>
                        <p className="text-slate-500 font-medium">This class does not currently have any primary class teacher assigned.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reassign Class Teacher</label>
                      <select
                        value={cls.teacherId || ''}
                        onChange={(e) => {
                          const newTeacherId = e.target.value;
                          if (newTeacherId) {
                            db.updateClass(cls.id, { teacherId: newTeacherId });
                            const found = dbState.teachers.find(t => t.id === newTeacherId);
                            triggerToast(`Assigned Class Teacher to ${found?.fullName || 'new teacher'} successfully!`);
                            setViewingClassForTeacher({ ...cls, teacherId: newTeacherId });
                            refreshState();
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      >
                        <option value="">-- Choose Instructor --</option>
                        {dbState.teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.fullName} ({t.department})
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">
                        Any updates will reflect in the school directory immediately.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-150 flex justify-end">
                    <button
                      onClick={() => setViewingClassForTeacher(null)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {viewingClassForPromotion && (() => {
            const cls = viewingClassForPromotion;
            const isFinalClass = isFinalYearClass(cls.name);
            const enrolled = dbState.enrollments
              .filter(e => e.classId === cls.id)
              .map(e => dbState.students.find(s => s.id === e.studentId))
              .filter((s): s is Student => !!s);

            const potentialTargetClasses = dbState.classes.filter(c => c.id !== cls.id);

            const toggleStudentPromotion = (studentId: string) => {
              setSelectedStudentIdsForPromotion(prev => 
                prev.includes(studentId)
                  ? prev.filter(id => id !== studentId)
                  : [...prev, studentId]
              );
            };

            const selectAllStudents = () => {
              setSelectedStudentIdsForPromotion(enrolled.map(s => s.id));
            };

            const deselectAllStudents = () => {
              setSelectedStudentIdsForPromotion([]);
            };

            const filteredEnrolled = enrolled.filter(st => {
              if (!promotionSearchQuery.trim()) return true;
              const q = promotionSearchQuery.toLowerCase();
              return st.fullName.toLowerCase().includes(q) || (st.rollNumber && st.rollNumber.toLowerCase().includes(q));
            });

            const isAllSelected = enrolled.length > 0 && selectedStudentIdsForPromotion.length === enrolled.length;
            const isNoneSelected = selectedStudentIdsForPromotion.length === 0;

            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[88vh]">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {isFinalClass ? (
                          <Archive className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-indigo-500" />
                        )}
                        <h3 className="font-extrabold text-[#0f172a] text-lg">
                          {isFinalClass ? 'Promote & Archive Students' : 'Promote Students'}
                        </h3>
                        {isFinalClass && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                            🎓 Final Year Track
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">
                        {isFinalClass
                          ? `Advance or archive graduating students of ${cls.name} after completing the academic calendar`
                          : `Advance students of ${cls.name} to the next academic level`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setViewingClassForPromotion(null);
                        setPromotionTargetClassId('');
                        setSelectedStudentIdsForPromotion([]);
                        setPromotionSearchQuery('');
                      }}
                      className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {promotionTargetClassId === 'archive' ? (
                      <div className="bg-amber-50/90 border border-amber-200/90 p-4 rounded-2xl flex items-start gap-3 animate-fade-in shadow-2xs">
                        <Archive className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-950 font-medium space-y-1">
                          <p className="font-bold text-amber-900 flex items-center gap-1.5">
                            <span>🎓 Archive & Graduate Candidates</span>
                            <span className="text-[9px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-mono font-bold uppercase">
                              Academic Calendar Complete
                            </span>
                          </p>
                          <p className="text-amber-800 leading-relaxed text-[11px]">
                            Selected students from <strong className="text-amber-950 font-bold">{cls.name}</strong> will complete their academic cycle, be unenrolled from active class registers, and safely preserved in the <strong className="text-amber-950 font-bold">Archived Students Directory</strong> with full graduation credentials, term scores, and attendance records.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-indigo-950 font-medium">
                          <p className="font-bold mb-0.5">How Class Promotion Works:</p>
                          <p className="text-indigo-800 leading-relaxed">
                            Only selected students will be moved into the destination track and updated to the new academic grade. 
                            Unchecked students remain safely enrolled in <span className="font-bold text-indigo-950">{cls.name}</span>.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          1. Target Destination Track *
                        </label>
                        {isFinalClass && (
                          <span className="text-[10px] text-amber-700 font-bold">
                            🎓 SS3 / Graduation Level
                          </span>
                        )}
                      </div>
                      <select
                        value={promotionTargetClassId}
                        onChange={(e) => setPromotionTargetClassId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all cursor-pointer"
                        required
                      >
                        <option value="">-- Choose Destination Track --</option>
                        
                        {/* Archive Option for graduating/completing students */}
                        <option value="archive" className="font-bold text-amber-900 bg-amber-50">
                          📦 Archive (Graduated / Completed Academic Calendar)
                        </option>

                        <optgroup label="Academic Class Streams">
                          {potentialTargetClasses.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                        </optgroup>
                      </select>

                      {promotionTargetClassId !== 'archive' && getPromotionStatus(cls.name).type !== 'archive' ? (
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                          <span>💡</span> Suggested Next Level: <span className="underline">{getPromotionStatus(cls.name).label}</span>
                        </p>
                      ) : promotionTargetClassId !== 'archive' && isFinalClass ? (
                        <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-1">
                          <span>💡</span> Notice: <strong className="text-slate-800">{cls.name}</strong> is the final secondary class. Select <span className="underline font-bold text-amber-900">Archive (Graduated / Completed)</span> to archive students after completing the academic calendar.
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                              2. Select Candidates to {promotionTargetClassId === 'archive' ? 'Archive / Graduate' : 'Promote'} *
                            </label>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              selectedStudentIdsForPromotion.length > 0 
                                ? promotionTargetClassId === 'archive'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200/70' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {selectedStudentIdsForPromotion.length} of {enrolled.length} selected
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Toggle checkboxes to select or deselect students for {promotionTargetClassId === 'archive' ? 'archiving upon completing the academic calendar' : 'promotion'}.
                          </p>
                        </div>

                        {enrolled.length > 0 && (
                          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={selectAllStudents}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                isAllSelected 
                                  ? promotionTargetClassId === 'archive'
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                    : 'bg-indigo-600 text-white border-indigo-600 shadow-2xs' 
                                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={deselectAllStudents}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                isNoneSelected 
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' 
                                  : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-300'
                              }`}
                            >
                              Deselect All
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Search filter for students */}
                      {enrolled.length > 2 && (
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filter candidates by name or roll number..."
                            value={promotionSearchQuery}
                            onChange={(e) => setPromotionSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-800 focus:outline-hidden transition-all"
                          />
                          {promotionSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setPromotionSearchQuery('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {enrolled.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 italic font-medium text-xs">
                          No active students currently enrolled in this class.
                        </div>
                      ) : filteredEnrolled.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-slate-400 italic font-medium text-xs">
                          No students matching "{promotionSearchQuery}".
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/40">
                          {filteredEnrolled.map((st, idx) => {
                            const isSelected = selectedStudentIdsForPromotion.includes(st.id);
                            return (
                              <div 
                                key={`${st.id}_${idx}`} 
                                onClick={() => toggleStudentPromotion(st.id)}
                                className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                  isSelected 
                                    ? promotionTargetClassId === 'archive'
                                      ? 'bg-amber-50/50 hover:bg-amber-50/80 border-l-4 border-l-amber-600'
                                      : 'bg-indigo-50/40 hover:bg-indigo-50/70 border-l-4 border-l-indigo-600' 
                                    : 'bg-white hover:bg-slate-100/70 border-l-4 border-l-transparent opacity-80'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // Handled by row onClick
                                    className={`w-4 h-4 rounded border-slate-300 cursor-pointer shrink-0 ${
                                      promotionTargetClassId === 'archive'
                                        ? 'text-amber-600 focus:ring-amber-500 accent-amber-600'
                                        : 'text-indigo-600 focus:ring-indigo-500 accent-indigo-600'
                                    }`}
                                  />
                                  <div className={`w-7 h-7 rounded-full border text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected && promotionTargetClassId === 'archive'
                                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                                      : 'bg-slate-100 border-slate-200'
                                  }`}>
                                    {st.fullName.charAt(0)}
                                  </div>
                                  <div className="min-w-0 truncate">
                                    <p className={`text-xs font-bold truncate ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                      {st.fullName}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-slate-400 font-mono">{st.rollNumber}</span>
                                      {st.gradeLevel && (
                                        <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                          {st.gradeLevel}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5">
                                  {isSelected ? (
                                    promotionTargetClassId === 'archive' ? (
                                      <span className="bg-amber-50 text-amber-800 border border-amber-200/90 font-bold px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1">
                                        <Archive className="w-3 h-3 text-amber-700" />
                                        Archive & Graduate
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        Promote
                                      </span>
                                    )
                                  ) : (
                                    <span className="bg-slate-100 text-slate-500 border border-slate-200 font-medium px-2.5 py-1 rounded-full text-[10px]">
                                      Retain in Class
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 pb-6 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500 font-medium">
                      {selectedStudentIdsForPromotion.length > 0 ? (
                        <span>
                          <strong className="text-slate-800">{selectedStudentIdsForPromotion.length}</strong> candidate{selectedStudentIdsForPromotion.length === 1 ? '' : 's'} staged
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">No candidates selected</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingClassForPromotion(null);
                          setPromotionTargetClassId('');
                          setSelectedStudentIdsForPromotion([]);
                          setPromotionSearchQuery('');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4.5 rounded-xl text-xs transition-colors cursor-pointer font-sans"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={selectedStudentIdsForPromotion.length === 0 || !promotionTargetClassId}
                        onClick={() => handleBatchPromoteStudents(cls.id, promotionTargetClassId, selectedStudentIdsForPromotion)}
                        className={`font-semibold py-2.5 px-5 rounded-xl text-xs shadow-xs transition-all cursor-pointer flex items-center gap-2 ${
                          selectedStudentIdsForPromotion.length === 0 || !promotionTargetClassId
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'
                            : promotionTargetClassId === 'archive'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white font-extrabold hover:scale-102 font-sans shadow-amber-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold hover:scale-102 font-sans'
                        }`}
                      >
                        {promotionTargetClassId === 'archive' ? (
                          <>
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive Candidates ({selectedStudentIdsForPromotion.length})</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Execute Promotion ({selectedStudentIdsForPromotion.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {editingAttendanceRecord && (() => {
            const student = dbState.students.find(s => s.id === editingAttendanceRecord.studentId);
            const cls = dbState.classes.find(c => c.id === editingAttendanceRecord.classId);
            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
                <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-extrabold text-[#0f172a] text-lg">Edit Attendance Entry</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">
                        Modifying record log for <span className="font-bold text-slate-700">{student?.fullName || 'Unknown Student'}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingAttendanceRecord(null)}
                      className="text-slate-400 p-1.5 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleEditAttendanceLogSubmit} className="p-6 space-y-5">
                    <div className="bg-slate-50 p-4 rounded-xl space-y-1.5 border border-slate-150 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Classroom:</span>
                        <span className="font-semibold text-slate-700 font-sans">{cls?.name || 'Classroom Deleted'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Registry Date:</span>
                        <span className="font-semibold text-slate-700 font-mono">{editingAttendanceRecord.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">Student Roll No:</span>
                        <span className="font-semibold text-slate-700 font-mono">{student?.rollNumber || '—'}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance Status *</label>
                      <div className="flex gap-2">
                        {(['present', 'absent', 'tardy'] as AttendanceStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setEditAttendanceStatus(st)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                              editAttendanceStatus === st
                                ? st === 'present'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : st === 'absent'
                                    ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Optional note</label>
                      <input
                        type="text"
                        value={editAttendanceNotes}
                        onChange={(e) => setEditAttendanceNotes(e.target.value)}
                        placeholder="e.g. Excused, medical leave, late bus"
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-hidden transition-all"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setEditingAttendanceRecord(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2 px-4.5 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Admin Comments Editor Modal Overlay */}
        <AnimatePresence>
          {editingCommentStudent && adminSelectedClass && (
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 text-left"
              >
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Edit Student Comments</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{editingCommentStudent.fullName} ({editingCommentStudent.rollNumber})</p>
                  </div>
                  <button
                    onClick={() => setEditingCommentStudent(null)}
                    className="p-1 px-2 rounded-xl text-xs hover:bg-slate-105 font-bold transition-colors bg-slate-50 text-slate-500 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-widest">Form Teacher's Remarks *</label>
                    <textarea
                      rows={3}
                      value={adminTeacherCommentInput}
                      onChange={(e) => setAdminTeacherCommentInput(e.target.value)}
                      placeholder="Enter classroom form teacher assessment..."
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-hidden transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-widest">Principal's Remarks & Endorsement</label>
                    <textarea
                      rows={3}
                      value={adminPrincipalCommentInput}
                      onChange={(e) => setAdminPrincipalCommentInput(e.target.value)}
                      placeholder="Enter principal feedback and final recommendation..."
                      className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-hidden transition-all text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCommentStudent(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const activeTerm = localStorage.getItem('current_term') || '3rd Term';
                      const activeSession = localStorage.getItem('academic_session') || '2025/2026';
                      const termKey = `${activeTerm} - ${activeSession}`;

                      const savedComments = db.getReportCommentsForStudent(editingCommentStudent.id);
                      const activeComment = savedComments.find(c => c.classId === adminSelectedClass.id);

                      db.saveReportComment(
                        editingCommentStudent.id,
                        adminSelectedClass.id,
                        termKey,
                        adminTeacherCommentInput,
                        adminPrincipalCommentInput || undefined,
                        activeComment?.attentiveness || 'Excellent',
                        activeComment?.cooperation || 'Excellent',
                        activeComment?.attitudeToWork || 'Good',
                        activeComment?.socialIntegration || 'Excellent'
                      );

                      triggerToast(`Comments saved on report card for ${editingCommentStudent.fullName}!`);
                      setDbState(db.getRawData());
                      setEditingCommentStudent(null);
                    }}
                    className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
                  >
                    Save Comments
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Printable Report Modal Overlay */}
        <AnimatePresence>
          {selectedReportStudent && selectedReportType && adminSelectedClass && (
            <PrintableReportModal
              selectedReportStudent={selectedReportStudent}
              selectedReportType={selectedReportType}
              selectedClass={adminSelectedClass}
              selectedTerm={selectedResultsTerm}
              selectedSession={selectedResultsSession}
              dbState={dbState}
              onClose={() => {
                setSelectedReportStudent(null);
                setSelectedReportType(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* Master Class Broadsheet Modal (Admin Exclusive) */}
        <AnimatePresence>
          {isBroadsheetModalOpen && adminSelectedClass && (
            <ClassBroadsheetModal
              selectedClass={adminSelectedClass}
              selectedTerm={selectedResultsTerm}
              selectedSession={selectedResultsSession}
              dbState={dbState}
              currentUser={currentUser}
              getSubjectsForClass={getSubjectsForClass}
              onClose={() => setIsBroadsheetModalOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Official Student Academic Transcript Modal (Admin Exclusive) */}
        <AnimatePresence>
          {isTranscriptModalOpen && (
            <StudentTranscriptModal
              initialStudent={selectedTranscriptStudent}
              allStudents={dbState.students}
              allClasses={dbState.classes}
              selectedSession={selectedResultsSession}
              dbState={dbState}
              currentUser={currentUser}
              getSubjectsForClass={getSubjectsForClass}
              onClose={() => {
                setIsTranscriptModalOpen(false);
                setSelectedTranscriptStudent(null);
              }}
            />
          )}
        </AnimatePresence>

        {/* CSV Import Students Modal */}
        <ImportStudentsCSVModal
          isOpen={isImportStudentsModalOpen}
          onClose={() => setIsImportStudentsModalOpen(false)}
          onSuccess={(count) => {
            setDbState(db.getRawData());
            triggerToast(`Successfully imported and registered ${count} student${count === 1 ? '' : 's'} via CSV.`);
          }}
          dbState={dbState}
        />

        {/* CSV Import Results Modal */}
        <ImportResultsCSVModal
          isOpen={isImportResultsModalOpen}
          onClose={() => setIsImportResultsModalOpen(false)}
          onSuccess={(count) => {
            setDbState(db.getRawData());
            setAdminBulkGradesRefreshTrigger(prev => prev + 1);
            triggerToast(`Successfully ingested and saved ${count} grade record${count === 1 ? '' : 's'} via CSV.`);
          }}
          dbState={dbState}
          defaultClassId={adminSelectedClass?.id}
          defaultSubject={adminResultsSelectedSubject}
          defaultTerm={selectedResultsTerm}
          defaultSession={selectedResultsSession}
        />

        {/* Universal Confirmation Modal Overlay */}
        <AnimatePresence>
          {confirmDialog.isOpen && (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-left"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-2xl shrink-0 ${confirmDialog.isDestructive ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 text-base leading-tight">
                      {confirmDialog.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {confirmDialog.message}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {confirmDialog.cancelText || 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                      confirmDialog.onConfirm();
                    }}
                    className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer text-white ${
                      confirmDialog.isDestructive
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {confirmDialog.confirmText || 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
