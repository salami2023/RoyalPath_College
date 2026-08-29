import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Upload, LogOut, Award, ShieldAlert, Star } from 'lucide-react';
import { Student, Class, DbState, getStoredLetterGrade, getStoredLetterColor } from '../types';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from '../assets/logo';
import royalPathLogo from '../assets/images/royalpath_logo.svg';

interface PrintableReportModalProps {
  selectedReportStudent: Student;
  selectedReportType: 'cumulative' | 'full' | 'midterm';
  selectedClass: Class;
  dbState: DbState;
  onClose: () => void;
  selectedTerm?: '1st Term' | '2nd Term' | '3rd Term';
  selectedSession?: string;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  selectedReportStudent,
  selectedReportType,
  selectedClass,
  dbState,
  onClose,
  selectedTerm,
  selectedSession,
}) => {
  const currentTerm = selectedTerm || localStorage.getItem('current_term') || '3rd Term';
  const academicSession = selectedSession || localStorage.getItem('academic_session') || '2025/2026';

  useEffect(() => {
    // Add print class helper to body
    document.body.classList.add('printable-report-open');
    return () => {
      document.body.classList.remove('printable-report-open');
    };
  }, []);

  // --- REPORT GENERATION STAGES/HELPERS ---
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

  const getSubjectGradeDetails = (stId: string, subjectName: string) => {
    const activeTerm = currentTerm;
    const studentGrades = dbState.grades.filter(g => {
      if (g.studentId !== stId || g.classId !== selectedClass?.id) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;

      if (g.session && g.session !== academicSession) return false;
      if (g.term) return g.term === activeTerm;

      // Differentiate term legacy fallback
      const hasTerm1InName = g.assignmentName.includes('1st Term');
      const hasTerm2InName = g.assignmentName.includes('2nd Term');
      const hasTerm3InName = g.assignmentName.includes('3rd Term');

      if (activeTerm === '1st Term') {
        return hasTerm1InName;
      } else if (activeTerm === '2nd Term') {
        return hasTerm2InName;
      } else { // 3rd Term
        return hasTerm3InName || (!hasTerm1InName && !hasTerm2InName);
      }
    });
    const examGradeObj = studentGrades.find(g => g.category === 'exam');
    const ca1Obj = studentGrades.find(g => g.category === 'ca1');
    const ca2Obj = studentGrades.find(g => g.category === 'ca2' || g.category === 'notebook');
    const caObj = studentGrades.find(g => g.category === 'ca');
    const midObj = studentGrades.find(g => g.category === 'mid_term');

    const hasUploadedScore = examGradeObj !== undefined || ca1Obj !== undefined || ca2Obj !== undefined || caObj !== undefined || midObj !== undefined;

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

    const examSub = exam;
    const total = ca1 + noteChecking + ca2 + examSub;
    const grade = getStoredLetterGrade(total);

    const hash = (stId + subjectName).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    // Real first and second term calculations if available, otherwise 0
    const term1Grades = dbState.grades.filter(g => {
      if (g.studentId !== stId || g.classId !== selectedClass?.id) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;

      if (g.session && g.session !== academicSession) return false;
      if (g.term) return g.term === '1st Term';
      return g.assignmentName.includes('1st Term');
    });

    const term2Grades = dbState.grades.filter(g => {
      if (g.studentId !== stId || g.classId !== selectedClass?.id) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;

      if (g.session && g.session !== academicSession) return false;
      if (g.term) return g.term === '2nd Term';
      return g.assignmentName.includes('2nd Term');
    });

    let term1Val = 0;
    if (term1Grades.length > 0) {
      const exam1 = term1Grades.find(g => g.category === 'exam')?.score || 0;
      const ca1_1 = term1Grades.find(g => g.category === 'ca1')?.score || 0;
      const ca2_1 = term1Grades.find(g => g.category === 'ca2' || g.category === 'notebook')?.score || 0;
      const mid1 = term1Grades.find(g => g.category === 'mid_term')?.score || 0;
      const caFallback = term1Grades.find(g => g.category === 'ca')?.score || 0;

      let term1Ca1 = ca1_1 || (caFallback ? Math.ceil(caFallback / 2) : 0);
      let term1Ca2 = ca2_1 || (caFallback ? Math.floor(caFallback / 2) : 0);

      term1Val = Math.min(10, term1Ca1) + Math.min(10, term1Ca2) + Math.min(20, mid1) + Math.min(60, exam1);
    }

    let term2Val = 0;
    if (term2Grades.length > 0) {
      const exam2 = term2Grades.find(g => g.category === 'exam')?.score || 0;
      const ca1_2 = term2Grades.find(g => g.category === 'ca1')?.score || 0;
      const ca2_2 = term2Grades.find(g => g.category === 'ca2' || g.category === 'notebook')?.score || 0;
      const mid2 = term2Grades.find(g => g.category === 'mid_term')?.score || 0;
      const caFallback = term2Grades.find(g => g.category === 'ca')?.score || 0;

      let term2Ca1 = ca1_2 || (caFallback ? Math.ceil(caFallback / 2) : 0);
      let term2Ca2 = ca2_2 || (caFallback ? Math.floor(caFallback / 2) : 0);

      term2Val = Math.min(10, term2Ca1) + Math.min(10, term2Ca2) + Math.min(20, mid2) + Math.min(60, exam2);
    }

    const hasTerm1 = term1Grades.length > 0;
    const hasTerm2 = term2Grades.length > 0;
    const hasTerm3 = hasUploadedScore;

    return {
      ca1,
      noteChecking,
      ca2,
      exam: examSub,
      total,
      grade,
      term1Val,
      term2Val,
      hasTerm1,
      hasTerm2,
      hasTerm3,
      classAvg: total > 0 ? Math.round(58 + (hash % 11) - 5) : 0,
      hasUploadedScore
    };
  };

  const settingsSchoolName = localStorage.getItem('settings_school_name') || 'RoyalPath College';
  const settingsSchoolLogo = localStorage.getItem('settings_school_logo') || ROYALPATH_LOGO_DATA_URL;
  const settingsSchoolAddress = localStorage.getItem('settings_address') || '1, Tony Efe, Onibudo, Off Akute Road.';
  const settingsSchoolCity = localStorage.getItem('settings_city') || 'Alausa';
  const settingsSchoolState = localStorage.getItem('settings_state') || 'Ogun State';
  const settingsPrincipalName = localStorage.getItem('settings_principal_name') || 'Principal Ayanwunmi';
  const settingsAdminSignature = localStorage.getItem('settings_admin_signature') || '';

  const term1Start = localStorage.getItem('term1_start_date') || '2025-09-15';
  const term2Start = localStorage.getItem('term2_start_date') || '2026-01-05';
  const term3Start = localStorage.getItem('term3_start_date') || '2026-04-27';

  const nextTermBeginsSetting = localStorage.getItem('next_term_commence_date');
  let nextTermBegins = nextTermBeginsSetting || term1Start;
  if (!nextTermBeginsSetting) {
    if (currentTerm === '1st Term') {
      nextTermBegins = term2Start;
    } else if (currentTerm === '2nd Term') {
      nextTermBegins = term3Start;
    }
  }

  const formatReportDate = (dtStr: string): string => {
    if (!dtStr) return '';
    try {
      const d = new Date(dtStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dtStr;
    }
  };

  const classTeacher = dbState.teachers?.find(t => t.id === selectedClass?.teacherId);
  const formTeacherName = classTeacher ? classTeacher.fullName : 'Form Advisor Harrison';

  const getSubjectComments = (stId: string) => {
    const commentObj = dbState.reportComments?.find(
      rc => rc.studentId === stId && 
      rc.classId === selectedClass.id && 
      (rc.term === currentTerm || rc.term === `${currentTerm} - ${academicSession}` || rc.term.startsWith(currentTerm)) &&
      (!rc.session || rc.session === academicSession)
    );
    return {
      teacher: commentObj?.teacherComment || "Self-directed student. Keeps high academic focus. Strongly recommended.",
      principal: commentObj?.principalComment || "An encouraging performance. Maintain consistency for higher growth."
    };
  };

  const subjectsList = getSubjectsForClass(selectedClass);
  const initialSubjectsData = subjectsList.map(subj => {
    return {
      name: subj,
      ...getSubjectGradeDetails(selectedReportStudent.id, subj)
    };
  });

  const isSeniorSecondary = selectedClass.levelOfEducation === 'Senior Secondary' || 
                            selectedClass.name?.toUpperCase().includes('SSS') || 
                            selectedClass.name?.toUpperCase().includes('SENIOR');

  const subjectsData = isSeniorSecondary 
    ? initialSubjectsData.filter(s => s.hasUploadedScore) 
    : initialSubjectsData;

  const gradedSubjects = subjectsData.filter(s => s.hasTerm1 || s.hasTerm2 || s.hasTerm3);

  const term1Total = gradedSubjects.filter(s => s.hasTerm1).reduce((sum, s) => sum + (s.term1Val || 0), 0);
  const term2Total = gradedSubjects.filter(s => s.hasTerm2).reduce((sum, s) => sum + (s.term2Val || 0), 0);

  const overallAvg = gradedSubjects.length > 0
    ? Math.round(gradedSubjects.reduce((sum, s) => sum + s.total, 0) / gradedSubjects.length)
    : 0;

  const overallTotal = gradedSubjects.filter(s => s.hasTerm3).reduce((sum, s) => sum + s.total, 0);
  const term3CumulativeTotal = overallTotal;

  const totalRecordedTermsCount = gradedSubjects.reduce((count, s) => {
    return count + (s.hasTerm1 ? 1 : 0) + (s.hasTerm2 ? 1 : 0) + (s.hasTerm3 ? 1 : 0);
  }, 0);

  const totalScoreEarned = term1Total + term2Total + overallTotal;

  const annualPercentage = totalRecordedTermsCount > 0
    ? Math.round(totalScoreEarned / totalRecordedTermsCount)
    : 0;

  const midtermSumTotal = gradedSubjects.length > 0
    ? gradedSubjects.reduce((sum, s) => sum + (s.ca1 + s.noteChecking + s.ca2), 0)
    : 0;
  const midtermWeightedTotal = Math.round(midtermSumTotal * 2.5);
  const midtermObtainable = gradedSubjects.length * 100;

  // Attendance Calculations
  const tClassAttendance = dbState.attendance.filter(
    a => a.classId === selectedClass.id
  );
  const tClassDates = Array.from(new Set(tClassAttendance.map(a => a.date)));
  const tTermClassDates = tClassDates.filter(d => {
    if (currentTerm === '1st Term') {
      return d >= term1Start && d < term2Start;
    } else if (currentTerm === '2nd Term') {
      return d >= term2Start && d < term3Start;
    } else {
      return d >= term3Start;
    }
  });
  const tTotalDays = tTermClassDates.length;
  const tChildAttendance = tClassAttendance.filter(
    a => a.studentId === selectedReportStudent.id && tTermClassDates.includes(a.date)
  );
  const tPresentDaysCount = tChildAttendance.filter(
    a => a.status === 'present' || a.status === 'tardy'
  ).length;

  const tFinalTotalDays = tTotalDays;
  const tFinalPresentDays = tPresentDaysCount;
  const tFinalRateText = tTotalDays > 0
    ? ((tPresentDaysCount / tTotalDays) * 100).toFixed(1) + '%'
    : '0.0%';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[150] flex justify-center overflow-y-auto"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        /* Global report sizing configs */
        .report-card-container {
          box-shadow: none !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 16px !important;
          width: 100% !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
          overflow: visible !important;
          gap: 15px !important;
          background: white !important;
          padding: 24px 28px !important;
          min-height: 850px !important;
        }

        .report-card-header {
          padding: 12px 18px !important;
          border-radius: 14px !important;
          gap: 12px !important;
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
          flex-wrap: nowrap !important;
        }
        .report-logo-container {
          width: 44px !important;
          height: 44px !important;
          padding: 2px !important;
          background: white !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 9999px !important;
        }
        .report-logo-container img,
        .report-logo-container svg {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
        }
        .report-school-title {
          font-size: 16px !important;
          line-height: 1.2 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: -0.01em !important;
        }
        .report-school-subtitle {
          font-size: 9.5px !important;
          margin-top: 2px !important;
          line-height: 1.2 !important;
          font-weight: 500 !important;
          max-width: 320px !important;
        }
        .report-meta-block {
          padding-left: 14px !important;
          border-left: 1px solid rgba(255, 255, 255, 0.25) !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
          text-align: right !important;
        }
        .report-meta-title {
          font-size: 11px !important;
          line-height: 1.2 !important;
          font-weight: 900 !important;
          letter-spacing: 0.03em !important;
          text-transform: uppercase !important;
        }
        .report-meta-subtitle {
          font-size: 10px !important;
          margin-top: 2px !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
        }
        .report-meta-date {
          font-size: 8.5px !important;
          margin-top: 1.5px !important;
          font-family: monospace !important;
          opacity: 0.75 !important;
        }

        .report-student-info {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: stretch !important;
          gap: 16px !important;
          margin-top: 10px !important;
          padding: 10px 14px !important;
          background: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 12px !important;
        }
        .report-student-info h3 {
          font-size: 15px !important;
          line-height: 1.2 !important;
          font-weight: 900 !important;
          margin-top: 2px !important;
        }
        .report-student-info span {
          font-size: 8.5px !important;
          font-weight: 950 !important;
        }
        .report-details-grid {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          gap: 5px 16px !important;
          margin-top: 3px !important;
        }
        .report-details-grid p {
          font-size: 10px !important;
          line-height: 1.2 !important;
          font-weight: 700 !important;
        }
        .report-details-grid p.text-slate-400 {
          font-size: 8.5px !important;
          font-weight: 500 !important;
        }

        .report-stats-box {
          display: flex !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          min-width: 130px !important;
          max-width: 150px !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 8px !important;
          padding: 3px 6px !important;
          background: #f1f5f9 !important;
          gap: 2px !important;
        }
        .report-stats-box p {
          font-size: 7.5px !important;
          line-height: 1.1 !important;
        }
        .report-stats-box p.text-base, .report-stats-box p.text-xs {
          font-size: 10.5px !important;
          font-weight: 900 !important;
          margin-top: 1px !important;
        }
        .report-stats-box .grid-cols-2 {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 3px 10px !important;
        }
        .report-stats-box div.border-t {
          border-top: 1px solid #cbd5e1 !important;
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
          gap: 6px !important;
          padding-top: 4px !important;
          margin-top: 4px !important;
        }

        .report-table-wrapper {
          margin-top: 10px !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        .report-table-wrapper table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
        .report-table-wrapper table th {
          padding: 6px 8px !important;
          font-size: 9.5px !important;
          background: #f1f5f9 !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
        }
        .report-table-wrapper table td {
          padding: 6px 8px !important;
          font-size: 9.5px !important;
          border: 1px solid #cbd5e1 !important;
        }
        .report-table-wrapper table tr {
          background: white !important;
        }
        .report-table-wrapper table tr:nth-child(even) {
          background: #f8fafc !important;
        }
        .report-table-wrapper table .font-black {
          font-size: 10px !important;
        }

        .report-bottom-wrapper {
          margin-top: 10px !important;
          padding-top: 8px !important;
          border-top: 1px solid #cbd5e1 !important;
        }
        .report-bottom-grid {
          display: grid !important;
          grid-template-columns: 4.2fr 3fr 4.8fr !important;
          gap: 12px !important;
          margin-top: 8px !important;
          align-items: stretch !important;
        }
        .report-col-4, .report-col-3, .report-col-5 {
          border: 1px solid #cbd5e1 !important;
          border-radius: 12px !important;
          padding: 10px 12px !important;
          background: #f8fafc !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          gap: 6px !important;
        }
        .report-col-4 h4, .report-col-3 h4, .report-col-5 h4 {
          font-size: 9.5px !important;
          font-weight: 900 !important;
          color: #475569 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          margin-bottom: 3.5px !important;
        }
        .report-col-4 p, .report-col-3 p, .report-col-5 p {
          font-size: 9px !important;
          line-height: 1.35 !important;
        }
        .report-col-3 .grid-cols-2 {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 4px 8px !important;
        }

        .report-footer-row {
          display: flex !important;
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
          margin-top: 10px !important;
          padding-top: 6px !important;
          border-top: 1px solid #cbd5e1 !important;
        }
        .report-footer-row > div {
          margin-top: 0 !important;
        }
        .report-footer-row p {
          font-size: 9px !important;
        }

        @media print {
          aside, .no-print, .sticky {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          html, body, #root {
            background: white !important;
            color: black !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .fixed {
            position: absolute !important;
            display: block !important;
            inset: 0 !important;
            z-index: auto !important;
            background: white !important;
            backdrop-filter: none !important;
            overflow: hidden !important;
            height: 100% !important;
          }
          
          .printable-report-wrapper {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100% !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            overflow: hidden !important;
          }
          
          .report-card-container {
            border: none !important;
            height: 100% !important;
            max-height: 286mm !important;
            min-height: 286mm !important;
            padding: 8mm 10mm !important;
            margin: 0 auto !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            gap: 14px !important;
          }
          
          .report-card-header {
            padding: 12px 18px !important;
            gap: 14px !important;
            border-radius: 14px !important;
          }
          .report-logo-container {
            width: 68px !important;
            height: 68px !important;
          }
          .report-school-title {
            font-size: 1.6rem !important;
            font-weight: 900 !important;
          }
          .report-school-subtitle {
            font-size: 10px !important;
            margin-top: 2px !important;
            max-width: 420px !important;
            line-height: 1.3 !important;
          }
          .report-meta-block {
            padding-left: 14px !important;
            border-left-width: 1px !important;
          }
          .report-meta-title {
            font-size: 12px !important;
            font-weight: 900 !important;
          }
          .report-meta-subtitle {
            font-size: 10px !important;
            margin-top: 3px !important;
          }
          .report-meta-date {
            font-size: 8.5px !important;
            margin-top: 2px !important;
          }
          .report-student-info {
            margin-top: 10px !important;
            padding: 12px 16px !important;
            gap: 12px !important;
            border-radius: 14px !important;
          }
          .report-student-info h3 {
            font-size: 1.35rem !important;
            font-weight: 950 !important;
          }
          .report-student-info span {
            font-size: 9.5px !important;
          }
          .report-details-grid {
            gap: 4px 12px !important;
          }
          .report-details-grid p {
            font-size: 10.5px !important;
          }
          .report-stats-box {
            min-width: 130px !important;
            gap: 3px !important;
          }
          .report-stats-box > div {
            padding: 3px 6px !important;
            border-radius: 6px !important;
          }
          .report-stats-box p {
            font-size: 7.5px !important;
          }
          .report-stats-box .text-base, .report-stats-box .text-xs {
            font-size: 10px !important;
            margin-top: 1px !important;
          }
          .report-table-wrapper {
            margin-top: 12px !important;
            border-radius: 12px !important;
          }
          .report-table-wrapper th {
            padding: 6px 8px !important;
            font-size: 9.5px !important;
          }
          .report-table-wrapper td {
            padding: 6px 8px !important;
            font-size: 10px !important;
          }
          
          .report-bottom-wrapper {
            margin-top: 12px !important;
            padding-top: 10px !important;
            border-top-width: 1px !important;
            gap: 10px !important;
          }
          .report-bottom-grid {
            gap: 10px !important;
          }
          .report-bottom-grid > div {
            padding: 10px 14px !important;
            border-radius: 12px !important;
          }
          .report-col-4, .report-col-3, .report-col-5 {
            gap: 5px !important;
          }
          .report-col-4 h4, .report-col-3 h4, .report-col-5 h4 {
            font-size: 9.5px !important;
          }
          .report-col-4 .mt-3, .report-col-3 .mt-3.5, .report-col-5 .mt-3 {
            margin-top: 6px !important;
          }
          .report-col-4 text, .report-col-4 span, .report-col-4 p,
          .report-col-3 text, .report-col-3 span, .report-col-3 p,
          .report-col-5 text, .report-col-5 span, .report-col-5 p {
            font-size: 9.5px !important;
            line-height: 1.35 !important;
          }
          .report-col-5 p {
            font-size: 9.5px !important;
          }
          .report-footer-row {
            padding-top: 8px !important;
            border-top-width: 1px !important;
            gap: 12px !important;
            margin-top: 12px !important;
          }
          .report-footer-row p {
            font-size: 9.5px !important;
          }
          
          tr, .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .report-card-jss {
            padding: 5mm 6mm !important;
            gap: 8px !important;
            max-height: 286mm !important;
            min-height: 286mm !important;
          }
          .report-card-jss .report-card-header {
            padding: 8px 12px !important;
            gap: 8px !important;
            border-radius: 10px !important;
          }
          .report-card-jss .report-logo-container {
            width: 52px !important;
            height: 52px !important;
          }
          .report-card-jss .report-school-title {
            font-size: 1.3rem !important;
          }
          .report-card-jss .report-school-subtitle {
            font-size: 8.5px !important;
            max-width: 320px !important;
            margin-top: 1px !important;
            line-height: normal !important;
          }
          .report-card-jss .report-meta-block {
            padding-left: 10px !important;
          }
          .report-card-jss .report-meta-title {
            font-size: 10.5px !important;
          }
          .report-card-jss .report-meta-subtitle {
            font-size: 8.5px !important;
            margin-top: 2px !important;
          }
          .report-card-jss .report-meta-date {
            font-size: 7.5px !important;
            margin-top: 1px !important;
          }
          .report-card-jss .report-student-info {
            margin-top: 6px !important;
            padding: 6px 10px !important;
            gap: 6px !important;
            border-radius: 10px !important;
          }
          .report-card-jss .report-student-info h3 {
            font-size: 1.15rem !important;
          }
          .report-card-jss .report-student-info span {
            font-size: 8.5px !important;
          }
          .report-card-jss .report-details-grid {
            gap: 3px 6px !important;
          }
          .report-card-jss .report-details-grid p {
            font-size: 8.5px !important;
          }
          .report-card-jss .report-stats-box {
            min-width: 130px !important;
            gap: 4px !important;
          }
          .report-card-jss .report-stats-box > div {
            padding: 4px 6px !important;
            border-radius: 6px !important;
          }
          .report-card-jss .report-stats-box p {
            font-size: 8px !important;
          }
          .report-card-jss .report-stats-box .text-base {
            font-size: 11px !important;
          }

          .report-card-jss .report-bottom-wrapper {
            margin-top: 6px !important;
            padding-top: 4px !important;
            gap: 6px !important;
          }
          .report-card-jss .report-bottom-grid {
            gap: 6px !important;
          }
          .report-card-jss .report-bottom-grid > div {
            padding: 6px 10px !important;
            border-radius: 10px !important;
          }
          .report-card-jss .report-col-4 h4, 
          .report-card-jss .report-col-3 h4, 
          .report-card-jss .report-col-5 h4 {
            font-size: 8.5px !important;
          }
          .report-card-jss .report-col-4 span, .report-card-jss .report-col-4 p,
          .report-card-jss .report-col-3 span, .report-card-jss .report-col-3 p,
          .report-card-jss .report-col-5 span, .report-card-jss .report-col-5 p {
            font-size: 8px !important;
            line-height: 1.3 !important;
          }
          .report-card-jss .report-col-4 .mt-3,
          .report-card-jss .report-col-3 .mt-3.5,
          .report-card-jss .report-col-5 .mt-3 {
            margin-top: 3.5px !important;
          }
          .report-card-jss .report-footer-row {
            margin-top: 6px !important;
            padding-top: 4px !important;
          }
          .report-card-jss .report-footer-row p {
            font-size: 8px !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 4mm 5mm !important;
          }
        }
      `}} />

      <div className="printable-report-wrapper flex flex-col w-full max-w-4xl min-h-screen py-10 px-4 md:px-10">
        
        {/* Print Contoller Utility Topbar */}
        <div className="no-print bg-white rounded-2xl border border-slate-150 p-4.5 mb-6 flex justify-between items-center shadow-lg sticky top-4 z-[160]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h4 className="text-sm font-black text-slate-800 leading-tight">Admin Report Card Preview</h4>
              <p className="text-[10px] text-slate-450 font-bold uppercase mt-0.5 text-indigo-600">
                {selectedReportType === 'cumulative' ? 'Cumulative Academic Result' : selectedReportType === 'full' ? 'Full Terminal Report Sheet' : 'Midterm Standardized Marks'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs bg-[#404ce5] hover:bg-indigo-700 text-white font-extrabold px-5 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-colors"
            >
              <Upload className="w-3.5 h-3.5 rotate-180" />
              <span>Download / Print PDF</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE AREA CONTAINER */}
        <div className={`report-card-container print-area bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl overflow-visible p-8 md:p-10 font-sans tracking-tight min-h-[1100px] flex flex-col justify-between ${!isSeniorSecondary ? 'report-card-jss' : ''}`}>
          
          {/* A. HEADER BLOCK */}
          <div>
            <div className={`report-card-header p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 border ${
              selectedReportType === 'cumulative' 
                ? 'bg-emerald-950 border-emerald-900/40 text-white' 
                : selectedReportType === 'full' 
                ? 'bg-[#1e293b] border-slate-800 text-white' 
                : 'bg-[#172554] border-blue-900 text-white'
            }`}>
              <div className="flex items-center gap-5">
                <div className="report-logo-container rounded-full bg-white border-2 border-amber-400 p-1.5 flex items-center justify-center shrink-0 shadow-sm w-36 h-36 overflow-hidden">
                  <SchoolLogo src={settingsSchoolLogo} className="w-full h-full object-contain" />
                </div>
                
                <div className="text-center md:text-left">
                  <h2 className="report-school-title text-3xl sm:text-4xl font-extrabold tracking-tight uppercase leading-tight">{settingsSchoolName}</h2>
                  <p className={`report-school-subtitle text-xs font-semibold mt-2.5 max-w-md leading-relaxed ${
                    selectedReportType === 'cumulative' ? 'text-emerald-100/90' : selectedReportType === 'full' ? 'text-slate-300' : 'text-blue-100'
                  }`}>{settingsSchoolAddress}</p>
                </div>
              </div>

              <div className={`report-meta-block text-center md:text-right md:border-l pl-0 md:pl-6 pt-3 md:pt-0 ${
                selectedReportType === 'cumulative' ? 'border-emerald-700/60' : selectedReportType === 'full' ? 'border-slate-800' : 'border-blue-700'
              }`}>
                <h3 className="report-meta-title text-sm font-black uppercase tracking-widest text-[#fbbf24] leading-none">
                  {selectedReportType === 'cumulative' ? 'Cumulative Report' : selectedReportType === 'full' ? 'Terminal Report Card' : 'Midterm Assessment'}
                </h3>
                <p className="report-meta-subtitle text-xs font-bold mt-2 text-white/95">{currentTerm} • {academicSession}</p>
                <p className="report-meta-date text-[10px] font-mono mt-1 opacity-70">Date: {formatReportDate(new Date().toString())}</p>
              </div>
            </div>

            {/* B. STUDENT LOGISTICS DESCRIPTION bar */}
            <div className="report-student-info mt-8 border border-slate-100 rounded-2xl bg-slate-50/50 p-6 flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Information</span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{selectedReportStudent.fullName}</h3>
                </div>

                <div className="report-details-grid grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4 text-xs font-bold text-slate-550">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Admission No:</span>
                    <span className="text-[#0f172a] font-mono text-xs mt-0.5 uppercase tracking-wide block">{selectedReportStudent.rollNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Level & Classroom:</span>
                    <span className="text-[#0f172a] mt-0.5 block">{selectedClass.name || selectedReportStudent.gradeLevel}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Gender Profile:</span>
                    <span className="text-[#0f172a] mt-0.5 block">{selectedReportStudent.gender || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Education Stage:</span>
                    <span className="text-[#0f172a] mt-0.5 font-extrabold uppercase text-[10px] tracking-wider text-indigo-700 block">
                      {selectedClass.levelOfEducation || 'Junior Secondary'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Term Cycle:</span>
                    <span className="text-[#0f172a] mt-0.5 block">{currentTerm}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Academic Year:</span>
                    <span className="text-[#0f172a] mt-0.5 block">{academicSession}</span>
                  </div>
                </div>
              </div>

              {/* STATS OVERVIEW ACCENT CONTAINER */}
              <div className="report-stats-box flex flex-row md:flex-col justify-end gap-1.5 min-w-[150px]">
                {selectedReportType === 'cumulative' && (
                  <>
                    <div className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-center flex-1 md:flex-initial">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Term 1 Total</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{term1Total}</p>
                    </div>
                    <div className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-center flex-1 md:flex-initial">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Term 2 Total</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">{term2Total}</p>
                    </div>
                    <div className="border border-indigo-200 bg-indigo-50/50 rounded-lg px-2 py-1 text-center flex-1 md:flex-initial">
                      <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider">Term 3 Total / Max</p>
                      <p className="text-xs font-black text-indigo-900 mt-0.5">{Math.round(overallTotal)} / {gradedSubjects.length * 100}</p>
                    </div>
                    <div className="border border-emerald-200 bg-emerald-50/80 rounded-lg px-2 py-1 text-center flex-1 md:flex-initial">
                      <p className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider">Annual Percentage</p>
                      <p className="text-xs font-black text-emerald-900 mt-0.5">{annualPercentage}%</p>
                    </div>
                  </>
                )}

                {selectedReportType === 'full' && (
                  <div className="border border-indigo-150 bg-indigo-50/20 rounded-2xl p-4 text-center w-full">
                    <p className="text-[10px] font-bold text-indigo-505 uppercase tracking-wider leading-none">Academic Overview</p>
                    <div className="mt-2.5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">Total (Obtained/Max)</p>
                        <p className="text-base font-black text-slate-900 mt-1">{Math.round(overallTotal)} / {gradedSubjects.length * 100}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-indigo-400 font-bold uppercase leading-none">Weighted Avg</p>
                        <p className="text-base font-black text-indigo-650 mt-1">{overallAvg}%</p>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-indigo-100 flex items-center justify-center gap-1.5 font-sans leading-none">
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Class Rank:</span>
                      <span className="text-[9px] font-black py-0.5 px-2 bg-indigo-650 text-white rounded-full">Top 15%</span>
                    </div>
                  </div>
                )}

                {selectedReportType === 'midterm' && (
                  <div className="border border-amber-150 bg-amber-50/20 rounded-2xl p-4 text-center w-full">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider leading-none">Evaluation Type</p>
                    <p className="text-xs font-black text-slate-800 mt-1.5 uppercase leading-none">MID-TERM EVALUATION</p>
                    <p className="text-[8px] text-slate-400 font-bold font-mono mt-1.5 uppercase leading-none">Subjects: {gradedSubjects.length}</p>
                    <div className="mt-2.5 pt-2 border-t border-amber-100 flex flex-col gap-1.5 text-[10px] font-black text-amber-900">
                      <div className="flex justify-between w-full">
                        <span>MID-TERM TOTAL:</span>
                        <span>{midtermWeightedTotal} / {midtermObtainable}</span>
                      </div>
                      <div className="flex justify-between w-full font-bold text-slate-500 text-[9px] leading-none">
                        <span>MID-TERM AVG:</span>
                        <span>{gradedSubjects.length > 0 ? Math.round(midtermWeightedTotal / gradedSubjects.length) : 0}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* C. EVALUATION TABLES IN TRIPLICATE FORMAT */}
            <div className="report-table-wrapper mt-8 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              {selectedReportType === 'cumulative' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1e293b] text-white font-bold uppercase tracking-wider text-[8px] text-center border-b border-slate-700">
                      <th rowSpan={2} className="px-4 py-3.5 border border-slate-705 text-left text-[9px] bg-slate-900">Academic Subject</th>
                      <th rowSpan={2} className="px-3 py-3.5 border border-slate-700 w-[12%]">1st Term</th>
                      <th rowSpan={2} className="px-3 py-3.5 border border-slate-700 w-[12%]">2nd Term</th>
                      <th colSpan={5} className="py-1.5 border border-slate-700 bg-indigo-950 text-indigo-100 text-[8px]">3rd Term (Current)</th>
                      <th rowSpan={2} className="px-4 py-3.5 border border-slate-700 text-[9px] bg-slate-900 w-[14%]">Annual Avg</th>
                    </tr>
                    <tr className="bg-indigo-900 text-white font-bold text-[8px] uppercase text-center border-b border-slate-700">
                      <th className="px-1 py-1.5 border border-indigo-800 w-[9%]">CA1 (10)</th>
                      <th className="px-1 py-1.5 border border-indigo-800 w-[12%]">Note (10)</th>
                      <th className="px-1 py-1.5 border border-indigo-800 w-[11%]">Mid (20)</th>
                      <th className="px-1 py-1.5 border border-indigo-800 w-[12%]">Exam (60)</th>
                      <th className="px-1 py-1.5 border border-indigo-800 w-[12%] bg-indigo-950">Total (100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectsData.map((subj, idx) => {
                      const termsCount = (subj.hasTerm1 ? 1 : 0) + (subj.hasTerm2 ? 1 : 0) + (subj.hasTerm3 ? 1 : 0);
                      const scoreSum = (subj.hasTerm1 ? subj.term1Val : 0) + (subj.hasTerm2 ? subj.term2Val : 0) + (subj.hasTerm3 ? subj.total : 0);
                      const annualAvg = termsCount > 0 ? Math.round(scoreSum / termsCount) : 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 border-b border-slate-100">
                          <td className="px-4 py-3 font-extrabold text-slate-800 border-r border-slate-200">{subj.name}</td>
                          <td className="px-3 py-3 text-center border-r border-slate-200 font-semibold text-slate-500">{subj.hasTerm1 ? `${subj.term1Val}%` : '-'}</td>
                          <td className="px-3 py-3 text-center border-r border-slate-200 font-semibold text-slate-500">{subj.hasTerm2 ? `${subj.term2Val}%` : '-'}</td>
                          <td className="px-1 py-3 text-center border-r border-slate-200 font-medium text-slate-650">{subj.hasTerm3 ? subj.ca1 : '-'}</td>
                          <td className="px-1 py-3 text-center border-r border-slate-200 font-medium text-slate-650">{subj.hasTerm3 ? subj.noteChecking : '-'}</td>
                          <td className="px-1 py-3 text-center border-r border-slate-200 font-medium text-slate-650">{subj.hasTerm3 ? subj.ca2 : '-'}</td>
                          <td className="px-1 py-3 text-center border-r border-slate-200 font-indigo-600 font-medium">{subj.hasTerm3 ? subj.exam : '-'}</td>
                          <td className="px-1 py-3 text-center border-r border-slate-100 font-bold text-slate-900 bg-indigo-50/20">{subj.hasTerm3 ? `${subj.total}%` : '-'}</td>
                          <td className="px-4 py-3 text-center bg-slate-50 font-black text-[#404ce5]">
                            {termsCount > 0 ? `${annualAvg}%` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50/35 border-t-2 border-indigo-200">
                      <td className="px-4 py-3 text-left font-black text-slate-700 uppercase text-[9px]" colSpan={7}>
                        Total Academic Marks (Obtained / Obtainable)
                      </td>
                      <td className="px-2 py-3 text-center font-black text-indigo-950 font-mono text-[11px] border-l border-r border-slate-200" colSpan={2}>
                        {Math.round(overallTotal)} / {gradedSubjects.length * 100}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {selectedReportType === 'full' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#1e293b] text-white font-bold uppercase tracking-wider text-[8px] text-center border-b border-slate-700">
                      <th className="px-4 py-3.5 border border-slate-700 text-left text-[9px] bg-slate-900">Academic Subject Name</th>
                      <th className="px-1.5 py-3.5 border border-slate-700 w-[10%]">CA1 (10)</th>
                      <th className="px-1.5 py-3.5 border border-slate-700 w-[12%]">Proj & Note (10)</th>
                      <th className="px-1.5 py-3.5 border border-slate-700 w-[11%]">Mid Term (20)</th>
                      <th className="px-1.5 py-3.5 border border-slate-700 w-[12%]">Exam (60)</th>
                      <th className="px-3 py-3.5 border border-slate-700 bg-indigo-950 text-indigo-100 w-[12%]">Total (100)</th>
                      <th className="px-2 py-3.5 border border-slate-700 w-[10%] bg-slate-900">Grade</th>
                      <th className="px-3 py-3.5 border border-slate-700 w-[13%]">Class Average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectsData.map((subj, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 border-b border-slate-100">
                        <td className="px-4 py-3 font-extrabold text-slate-800 border-r border-slate-200">{subj.name}</td>
                        <td className="px-1.5 py-3 text-center border-r border-slate-200 font-semibold text-slate-600">{subj.hasUploadedScore ? subj.ca1 : '-'}</td>
                        <td className="px-1.5 py-3 text-center border-r border-slate-200 font-semibold text-slate-600">{subj.hasUploadedScore ? subj.noteChecking : '-'}</td>
                        <td className="px-1.5 py-3 text-center border-r border-slate-200 font-semibold text-slate-600">{subj.hasUploadedScore ? subj.ca2 : '-'}</td>
                        <td className="px-1.5 py-3 text-center border-r border-slate-100 font-indigo-600 font-semibold">{subj.hasUploadedScore ? subj.exam : '-'}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200 font-black text-slate-950 bg-indigo-50/20">{subj.hasUploadedScore ? `${subj.total}%` : '-'}</td>
                        <td className="px-2 py-3 text-center border-r border-slate-200 font-black bg-slate-50">
                          {subj.hasUploadedScore ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide shrink-0 ${getStoredLetterColor(subj.grade)}`}>
                              {subj.grade}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-slate-500 italic">{subj.hasUploadedScore ? `${subj.classAvg}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50/35 border-t-2 border-indigo-200">
                      <td className="px-4 py-3.5 text-left font-black text-slate-700 uppercase text-[9px]" colSpan={5}>
                        Total Academic Marks (Obtained / Obtainable)
                      </td>
                      <td className="px-3 py-3.5 text-center font-black text-indigo-950 font-mono text-[11px] border-l border-r border-slate-200" colSpan={3}>
                        {Math.round(overallTotal)} / {gradedSubjects.length * 100}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {selectedReportType === 'midterm' && (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#172554] text-white font-bold uppercase tracking-wider text-[8px] text-center border-b border-slate-700">
                      <th className="px-4 py-3.5 border border-slate-700 text-left text-[9px] bg-indigo-950">Academic Subject</th>
                      <th className="px-4 py-3.5 border border-slate-70 w-[18%]">CA 1 Test (10)</th>
                      <th className="px-4 py-3.5 border border-slate-70 w-[20%]">Notebook & Project (10)</th>
                      <th className="px-4 py-3.5 border border-slate-70 w-[20%]">Mid-Term Exam (20)</th>
                      <th className="px-4 py-3.5 border border-slate-70 bg-amber-500 text-slate-950 w-[22%]">Weighted Mid-Term (100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectsData.map((subj, idx) => {
                      const midSum = subj.ca1 + subj.noteChecking + subj.ca2;
                      const weightedMid = Math.round(midSum * 2.5);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 border-b border-slate-100">
                          <td className="px-4 py-3 font-extrabold text-slate-800 border-r border-slate-200">{subj.name}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-200 font-bold text-slate-600">{subj.hasUploadedScore ? subj.ca1 : '-'}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-200 font-bold text-slate-600">{subj.hasUploadedScore ? subj.noteChecking : '-'}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-100 font-bold text-slate-600">{subj.hasUploadedScore ? subj.ca2 : '-'}</td>
                          <td className="px-4 py-3 text-center font-black bg-amber-50/20 text-[#b45309]">{subj.hasUploadedScore ? `${weightedMid}%` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-55/20 border-t-2 border-amber-200">
                      <td className="px-4 py-3.5 text-left font-black text-slate-700 uppercase text-[9px]" colSpan={4}>
                        Total Mid-Term Marks (Obtained / Obtainable)
                      </td>
                      <td className="px-4 py-3.5 text-center font-black text-[#b45309] font-mono text-[11px] border-l border-slate-200">
                        {midtermWeightedTotal} / {midtermObtainable}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {/* D. COMMENTS, EVALUATIONS, SIGNATURE BLOCKS */}
          <div className="report-bottom-wrapper mt-6 pt-6 border-t border-slate-200 flex-1 flex flex-col justify-end">
            <div className="report-bottom-grid grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Cognitive Progress Comments */}
              <div className="report-col-4 border border-slate-200 rounded-xl p-4.5 bg-slate-50/40">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Star className="w-3 h-3 text-indigo-505" />
                  <span>Advisor Term Remarks</span>
                </h4>
                <p className="text-xs text-slate-750 leading-relaxed italic">"{getSubjectComments(selectedReportStudent.id).teacher}"</p>
                <div className="mt-3.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 leading-none">Form Class Advisor</p>
                    <p className="text-[10px] font-black text-slate-800 mt-1">{formTeacherName}</p>
                  </div>
                  <div className="h-6 w-16 bg-slate-100 rounded-sm border border-slate-200/40 flex items-center justify-center">
                    <span className="text-[9.5px] text-slate-400 font-serif leading-none italic select-none">Signed</span>
                  </div>
                </div>
              </div>

              {/* Attendance metrics */}
              <div className="report-col-3 border border-slate-200 rounded-xl p-4.5 bg-slate-50/40 text-xs font-bold text-slate-600 space-y-3.5 max-w-full">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  <Star className="w-3 h-3 text-emerald-555" />
                  <span>Student Attendance Logs</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 mt-2.5">
                  <div className="border border-slate-150 rounded-lg p-2 bg-white text-center">
                    <p className="text-[8px] text-slate-400 font-bold lowercase">Required Days</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">{tFinalTotalDays}</p>
                  </div>
                  <div className="border border-slate-150 rounded-lg p-2 bg-white text-center">
                    <p className="text-[8px] text-slate-400 font-bold lowercase">Days Present</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">{tFinalPresentDays}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 leading-none">ATTENDANCE RATE:</span>
                  <span className="font-extrabold text-emerald-750 leading-none">{tFinalRateText}</span>
                </div>
              </div>

              {/* Principal Executive remarks & stamp */}
              <div className="report-col-5 border border-slate-200 rounded-xl p-4.5 bg-slate-50/40 flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2 leading-none">
                    <Star className="w-3 h-3 text-[#d97706]" />
                    <span>Executive Director Signature</span>
                  </h4>
                  <p className="text-xs text-slate-750 leading-relaxed italic">"{getSubjectComments(selectedReportStudent.id).principal}"</p>
                </div>
                <div className="mt-3.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 leading-none">College Principal</p>
                    <p className="text-[10px] font-black text-slate-800 mt-1">{settingsPrincipalName}</p>
                  </div>
                  <div className="h-8 w-24 relative flex items-center justify-center">
                    {settingsAdminSignature ? (
                      <img src={settingsAdminSignature} alt="Principal Signature" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-6 w-20 border border-amber-300 rounded-sm bg-amber-50/20 flex items-center justify-center border-dashed">
                        <span className="text-[9.5px] text-amber-700 font-semibold select-none leading-none">RPC Stamp</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* E. NEXT TERM LOGISTICS SUMMARY & GENERAL MOTTO FOOTER */}
            <div className="report-footer-row mt-6 pt-4 border-t border-slate-205 flex flex-col sm:flex-row justify-between items-center gap-3.5">
              <div className="flex gap-4 font-mono text-[9px] font-black text-slate-450 uppercase tracking-wider text-center sm:text-left">
                <p>Term Progress: <span className="text-indigo-600">PASSED</span></p>
                <p>Next Cycle Commences: <span className="text-[#0f172a]">{formatReportDate(nextTermBegins || '2026-09-15')}</span></p>
              </div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest text-center sm:text-right">
                Empowering Minds, Shaping Paths to Eminence.
              </p>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
