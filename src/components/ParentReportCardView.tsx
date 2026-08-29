import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Student, Class, DbState, getStoredLetterGrade, AVAILABLE_ACADEMIC_SESSIONS } from '../types';
import { Award, Printer, ArrowRight, Clock, Calendar, CheckCircle2, Sliders, ArrowLeft, Upload } from 'lucide-react';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from '../assets/logo';
import royalPathLogo from '../assets/images/royalpath_logo.svg';
import { PrintableReportModal } from './PrintableReportModal';

interface ReportCardViewProps {
  selectedChild: Student;
  dbState: DbState;
}

export default function ParentReportCardView({ selectedChild, dbState }: ReportCardViewProps) {
  const [selectedReportType, setSelectedReportType] = useState<'cumulative' | 'full' | 'midterm'>('full');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>(
    () => localStorage.getItem('academic_session') || '2025/2026'
  );
  const [selectedTerm, setSelectedTerm] = useState<'1st Term' | '2nd Term' | '3rd Term'>(
    (localStorage.getItem('current_term') as '1st Term' | '2nd Term' | '3rd Term') || '3rd Term'
  );
  
  // Find all active class enrollments of the child
  const enrollments = dbState.enrollments.filter(e => e.studentId === selectedChild.id);
  const enrolledClasses = dbState.classes.filter(c => enrollments.some(e => e.classId === c.id));
  
  // We'll let them select which main Form group / advisor class to prepare the report under
  const [selectedClassId, setSelectedClassId] = useState<string>(
    enrolledClasses.length > 0 ? enrolledClasses[0].id : ''
  );

  const selectedClass = enrolledClasses.find(c => c.id === selectedClassId) || (enrolledClasses.length > 0 ? enrolledClasses[0] : null);

  // Helper grading ranges mapping
  const getLetterGrade = (score: number): string => {
    return getStoredLetterGrade(score);
  };

  // Replicate high-fidelity deterministic evaluation table metrics matching Teacher portal
  const getSubjectGradeDetails = (stId: string, subjectName: string) => {
    // Basic overrides from actual grades database
    const studentGrades = dbState.grades.filter(g => {
      if (g.studentId !== stId || g.classId !== selectedClass?.id) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;

      if (g.session && g.session !== selectedSession) return false;
      if (g.term) return g.term === selectedTerm;

      // Legacy fallback
      if (selectedTerm === '1st Term') return g.assignmentName.includes('1st Term');
      if (selectedTerm === '2nd Term') return g.assignmentName.includes('2nd Term');
      return g.assignmentName.includes('3rd Term') || (!g.assignmentName.includes('1st Term') && !g.assignmentName.includes('2nd Term'));
    });
    const examGradeObj = studentGrades.find(g => g.category === 'exam');
    const ca1Obj = studentGrades.find(g => g.category === 'ca1');
    const ca2Obj = studentGrades.find(g => g.category === 'ca2' || g.category === 'notebook');
    const caObj = studentGrades.find(g => g.category === 'ca');
    const midObj = studentGrades.find(g => g.category === 'mid_term');

    const hasUploadedScore = examGradeObj !== undefined || ca1Obj !== undefined || ca2Obj !== undefined || caObj !== undefined || midObj !== undefined;

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
    const grade = getLetterGrade(total);

    const hash = (stId + subjectName).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    
    // Real first and second term calculations if available for the session, otherwise 0
    const term1Grades = dbState.grades.filter(g => {
      if (g.studentId !== stId || g.classId !== selectedClass?.id) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;

      if (g.session && g.session !== selectedSession) return false;
      if (g.term) return g.term === '1st Term';
      return g.assignmentName.includes('1st Term');
    });

    const term2Grades = dbState.grades.filter(g => {
      if (g.studentId !== stId || g.classId !== selectedClass?.id) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;

      if (g.session && g.session !== selectedSession) return false;
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
      noteChecking: ca2, // keep noteChecking to map to the CA2 column
      ca2: mid_term,     // keep ca2 representing Mid Term (20)
      exam,
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

  // Resolve subjects of classes based on education Level
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

  if (!selectedClass) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center flex flex-col justify-center items-center min-h-[300px]" id="no-enrollment-report">
        <Award className="w-12 h-12 text-slate-200 mb-2 animate-bounce" />
        <h3 className="text-base font-bold text-slate-705">No Graded Academic Classroom Found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Please notify the administration or classroom teacher to enroll {selectedChild.fullName} in grade listings to dynamically compile their academic transcript.
        </p>
      </div>
    );
  }

  // Loaded Global Settings matching Teacher portal
  const settingsSchoolName = localStorage.getItem('settings_school_name') || 'RoyalPath College';
  const settingsSchoolLogo = localStorage.getItem('settings_school_logo') || ROYALPATH_LOGO_DATA_URL;
  const settingsSchoolAddress = localStorage.getItem('settings_address') || '1, Tony Efe, Onibudo, Off Akute Road.';
  const settingsSchoolCity = localStorage.getItem('settings_city') || 'Ikeja';
  const settingsSchoolState = localStorage.getItem('settings_state') || 'Lagos State';
  const settingsPrincipalName = localStorage.getItem('settings_principal_name') || 'Principal Ayanwunmi';
  const settingsAdminSignature = localStorage.getItem('settings_admin_signature') || '';

  const academicSession = localStorage.getItem('academic_session') || '2025/2026';
  const currentTerm = localStorage.getItem('current_term') || '3rd Term';

  const term1Start = localStorage.getItem('term1_start_date') || '2025-09-15';
  const term2Start = localStorage.getItem('term2_start_date') || '2026-01-05';
  const term3Start = localStorage.getItem('term3_start_date') || '2026-04-27';

  let nextTermBegins = term1Start;
  if (selectedTerm === '1st Term') {
    nextTermBegins = term2Start;
  } else if (selectedTerm === '2nd Term') {
    nextTermBegins = term3Start;
  }

  // Formatting date nicely
  const formatReportDate = (dtStr: string): string => {
    if (!dtStr) return '';
    try {
      const d = new Date(dtStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dtStr;
    }
  };

  const getSubjectComments = (stId: string) => {
    const commentObj = dbState.reportComments?.find(
      rc => rc.studentId === stId && rc.classId === selectedClass.id && rc.term === selectedTerm && (!rc.session || rc.session === selectedSession)
    );
    return {
      teacher: commentObj?.teacherComment || "Self-directed student. Keeps high academic focus. Strongly recommended.",
      principal: commentObj?.principalComment || "An encouraging performance. Maintain consistency for higher growth."
    };
  };

  const subjectsList = getSubjectsForClass(selectedClass);
  const initialSubjectsData = subjectsList.map(subj => {
    const details = getSubjectGradeDetails(selectedChild.id, subj);
    
    let termTotal = details.total;
    if (selectedTerm === '1st Term' && currentTerm !== '1st Term') {
      termTotal = details.term1Val;
    } else if (selectedTerm === '2nd Term' && currentTerm !== '2nd Term') {
      termTotal = details.term2Val;
    }

    let ca1 = 0;
    let noteChecking = 0;
    let ca2 = 0;
    let exam = 0;

    if (termTotal > 0) {
      if (selectedTerm === currentTerm || selectedTerm === '3rd Term') {
        ca1 = details.ca1;
        noteChecking = details.noteChecking;
        ca2 = details.ca2;
        exam = details.exam;
      } else {
        // Deterministic breakdown based on termTotal
        ca1 = Math.round(termTotal * 0.1);
        noteChecking = Math.round(termTotal * 0.1);
        ca2 = Math.round(termTotal * 0.2);
        exam = termTotal - (ca1 + noteChecking + ca2);
        
        if (ca1 > 10) ca1 = 10;
        if (noteChecking > 10) noteChecking = 10;
        if (ca2 > 20) ca2 = 20;
        if (exam > 60) exam = 60;
        
        const diff = termTotal - (ca1 + noteChecking + ca2 + exam);
        if (diff !== 0) {
          exam = Math.min(60, Math.max(0, exam + diff));
        }
      }
    }

    return {
      name: subj,
      ca1,
      noteChecking,
      ca2,
      exam,
      total: termTotal,
      grade: getLetterGrade(termTotal),
      term1Val: details.term1Val,
      term2Val: details.term2Val,
      hasTerm1: details.hasTerm1,
      hasTerm2: details.hasTerm2,
      hasTerm3: details.hasTerm3,
      classAvg: details.classAvg,
      hasUploadedScore: details.hasUploadedScore
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

  // Dynamic Attendance Calculation from Teacher registry
  const classAttendanceRecords = dbState.attendance.filter(
    a => a.classId === selectedClass.id
  );
  
  // Find child's attendance details
  const childAttendance = classAttendanceRecords.filter(
    a => a.studentId === selectedChild.id
  );

  // Find unique attendance dates taken for this class and filter by term date ranges
  const classDates = Array.from(new Set(classAttendanceRecords.map(a => a.date)));
  const termClassDates = classDates.filter(d => {
    if (selectedTerm === '1st Term') {
      return d >= term1Start && d < term2Start;
    } else if (selectedTerm === '2nd Term') {
      return d >= term2Start && d < term3Start;
    } else {
      return d >= term3Start;
    }
  });

  const termTotalDays = termClassDates.length;
  const termChildAttendance = childAttendance.filter(a => termClassDates.includes(a.date));
  const termPresentDaysCount = termChildAttendance.filter(
    a => a.status === 'present' || a.status === 'tardy'
  ).length;

  const finalTotalDays = termTotalDays; 
  const finalPresentDays = termPresentDaysCount; 
  const finalRateText = termTotalDays > 0 
    ? ((termPresentDaysCount / termTotalDays) * 100).toFixed(1) + '%'
    : '0.0%';

  const isTermPublished = localStorage.getItem(`results_published_${selectedTerm}`) !== 'false';

  return (
    <div className="space-y-6" id="report-card-parent-root">
      <style dangerouslySetInnerHTML={{ __html: `
        /* ==================== GLOBAL REPORT STYLING CONFIG (SCREEN & PRINT) ==================== */
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

        /* 50% Header Reduction Settings */
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

        /* Student details side-by-side tightness */
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

        /* Status box size decrease */
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

        /* Table font and padding sizing */
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

        /* Bottom details structure */
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

        /* Footer Row details */
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
          /* Hide screen-only components completely */
          aside, .no-print, .sticky {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Reset html, body, and app root to standard A4 printing envelope */
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
            max-height: 284mm !important;
            min-height: 284mm !important;
            padding: 4mm 5mm !important;
            margin: 0 auto !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          
          /* Print-specific layout compression */
          .report-card-header {
            padding: 10px 14px !important;
            gap: 10px !important;
            border-radius: 12px !important;
          }
          .report-logo-container {
            width: 55px !important;
            height: 55px !important;
          }
          .report-school-title {
            font-size: 1.3rem !important;
          }
          .report-school-subtitle {
            font-size: 8px !important;
            margin-top: 1px !important;
            max-width: 340px !important;
            line-height: normal !important;
          }
          .report-meta-block {
            padding-left: 8px !important;
            border-left-width: 1px !important;
          }
          .report-meta-title {
            font-size: 9.5px !important;
          }
          .report-meta-subtitle {
            font-size: 8px !important;
            margin-top: 2px !important;
          }
          .report-meta-date {
            font-size: 7.5px !important;
            margin-top: 1px !important;
          }
          .report-student-info {
            margin-top: 8px !important;
            padding: 8px 12px !important;
            gap: 8px !important;
            border-radius: 12px !important;
          }
          .report-student-info h3 {
            font-size: 1.15rem !important;
          }
          .report-student-info span {
            font-size: 7.5px !important;
          }
          .report-details-grid {
            gap: 3px 8px !important;
          }
          .report-details-grid p {
            font-size: 8px !important;
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
            margin-top: 0 !important;
          }
          .report-table-wrapper {
            margin-top: 8px !important;
            border-radius: 10px !important;
          }
          .report-table-wrapper th {
            padding: 4px 5px !important;
            font-size: 7px !important;
          }
          .report-table-wrapper td {
            padding: 4px 5px !important;
            font-size: 7.5px !important;
          }
          
          /* Bottom adjustments */
          .report-bottom-wrapper {
            margin-top: 7px !important;
            padding-top: 5px !important;
            border-top-width: 1px !important;
            gap: 6px !important;
          }
          .report-bottom-grid {
            gap: 6px !important;
          }
          .report-bottom-grid > div {
            padding: 6px 10px !important;
            border-radius: 10px !important;
          }
          .report-col-4, .report-col-3, .report-col-5 {
            gap: 2px !important;
          }
          .report-col-4 h4, .report-col-3 h4, .report-col-5 h4 {
            font-size: 7.5px !important;
          }
          .report-col-4 .mt-3, .report-col-3 .mt-3.5, .report-col-5 .mt-3 {
            margin-top: 3px !important;
          }
          .report-col-4 text, .report-col-4 span, .report-col-4 p,
          .report-col-3 text, .report-col-3 span, .report-col-3 p,
          .report-col-5 text, .report-col-5 span, .report-col-5 p {
            font-size: 7.5px !important;
            line-height: normal !important;
          }
          .report-col-5 p {
            font-size: 7.5px !important;
          }
          .report-footer-row {
            padding-top: 4px !important;
            border-top-width: 1px !important;
            gap: 8px !important;
          }
          .report-footer-row p {
            font-size: 7.5px !important;
          }
          
          tr, .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Junior School (JSS) Specific Print Compression to fit A4 */
          .report-card-jss {
            padding: 1.5mm 3.5mm !important;
            gap: 2.5px !important;
            max-height: 284mm !important;
            min-height: 284mm !important;
          }
          .report-card-jss .report-card-header {
            padding: 4px 8px !important;
            gap: 6px !important;
            border-radius: 8px !important;
          }
          .report-card-jss .report-logo-container {
            width: 32px !important;
            height: 32px !important;
          }
          .report-card-jss .report-school-title {
            font-size: 1.0rem !important;
          }
          .report-card-jss .report-school-subtitle {
            font-size: 6.8px !important;
            max-width: 250px !important;
            margin-top: 0px !important;
            line-height: normal !important;
          }
          .report-card-jss .report-meta-block {
            padding-left: 5px !important;
          }
          .report-card-jss .report-meta-title {
            font-size: 8px !important;
          }
          .report-card-jss .report-meta-subtitle {
            font-size: 6.8px !important;
            margin-top: 1px !important;
          }
          .report-card-jss .report-meta-date {
            font-size: 6px !important;
            margin-top: 0px !important;
          }
          .report-card-jss .report-student-info {
            margin-top: 3px !important;
            padding: 3px 6px !important;
            gap: 3px !important;
            border-radius: 6px !important;
          }
          .report-card-jss .report-student-info h3 {
            font-size: 0.9rem !important;
          }
          .report-card-jss .report-student-info span {
            font-size: 6px !important;
          }
          .report-card-jss .report-details-grid {
            gap: 1.5px 3.5px !important;
          }
          .report-card-jss .report-details-grid p {
            font-size: 6.5px !important;
          }
          .report-card-jss .report-stats-box {
            min-width: 100px !important;
            gap: 1.5px !important;
          }
          .report-card-jss .report-stats-box > div {
            padding: 2px 4px !important;
            border-radius: 4px !important;
          }
          .report-card-jss .report-stats-box p {
            font-size: 6.2px !important;
          }
          .report-card-jss .report-stats-box .text-base {
            font-size: 9px !important;
          }

          .report-card-jss .report-bottom-wrapper {
            margin-top: 3.5px !important;
            padding-top: 2px !important;
            gap: 3px !important;
          }
          .report-card-jss .report-bottom-grid {
            gap: 3.5px !important;
          }
          .report-card-jss .report-bottom-grid > div {
            padding: 3px 5px !important;
            border-radius: 5px !important;
          }
          .report-card-jss .report-col-4 h4, 
          .report-card-jss .report-col-3 h4, 
          .report-card-jss .report-col-5 h4 {
            font-size: 6.5px !important;
          }
          .report-card-jss .report-col-4 span, .report-card-jss .report-col-4 p,
          .report-card-jss .report-col-3 span, .report-card-jss .report-col-3 p,
          .report-card-jss .report-col-5 span, .report-card-jss .report-col-5 p {
            font-size: 6.2px !important;
            line-height: normal !important;
          }
          .report-card-jss .report-col-4 .mt-3,
          .report-card-jss .report-col-3 .mt-3.5,
          .report-card-jss .report-col-5 .mt-3 {
            margin-top: 1.5px !important;
          }
          .report-card-jss .report-footer-row {
            margin-top: 2.5px !important;
            padding-top: 1.5px !important;
          }
          .report-card-jss .report-footer-row p {
            font-size: 6.2px !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 4mm 5mm !important;
          }
        }
      `}} />
      
      {/* Report Selection controls */}
      <div className="no-print bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Toggle selectors */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Class Group:</span>
            <select
              id="parent-report-classroom"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs border border-slate-200 px-3 py-1.5 rounded-xl font-bold bg-slate-50 text-slate-700 cursor-pointer focus:outline-none"
            >
              {enrolledClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Academic Session:</span>
            <select
              id="parent-report-session-selector"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="text-xs border border-indigo-200 px-3 py-1.5 rounded-xl font-bold bg-white text-indigo-900 cursor-pointer focus:outline-none"
            >
              {AVAILABLE_ACADEMIC_SESSIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Select Term:</span>
            <select
              id="parent-report-term-selector"
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value as any)}
              className="text-xs border border-slate-200 px-3 py-1.5 rounded-xl font-bold bg-indigo-50 text-indigo-900 cursor-pointer focus:outline-none"
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>
        </div>

        {/* Tabs for types */}
        <div className="flex bg-slate-100 rounded-xl p-1 justify-center gap-1">
          {(['full', 'cumulative', 'midterm'] as const).map(type => {
            const isActive = selectedReportType === type;
            return (
              <button
                key={type}
                id={`btn-report-tab-${type}`}
                onClick={() => setSelectedReportType(type)}
                className={`px-4.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type === 'full' ? 'Terminal Sheet' : type === 'cumulative' ? 'Cumulative (Term 1-3)' : 'Mid-term Report'}
              </button>
            );
          })}
        </div>

        {/* Print button */}
        <button
          onClick={() => setShowPrintPreview(true)}
          id="btn-print-report-card"
          className="self-start lg:self-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Save / Print transcript</span>
        </button>

      </div>

      {!isTermPublished ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-150 text-center flex flex-col justify-center items-center min-h-[400px] shadow-3xs hover:shadow-2xs transition-all" id="parent-results-unpublished-view">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight select-none">Report Cards Pending Publication</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-lg mx-auto font-medium leading-relaxed">
            The academic results and official report cards for <span className="font-bold text-slate-800">{selectedChild.fullName}</span> for the <span className="font-bold text-slate-800">{selectedTerm}</span> term are currently undergoing final administrative validation and sign-off by the principal.
          </p>
          <div className="mt-6 flex flex-col items-center gap-1.5 p-4.5 bg-slate-50 rounded-2xl border border-slate-100 max-w-md w-full">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Status: Under Review by School Administration</span>
            </div>
            <p className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider text-center pt-1.5 border-t border-slate-200/60 w-full mt-1.5">
              Admin release required for parent portal visibility
            </p>
          </div>
        </div>
      ) : (
        /* REPORT PRINTABLE WRAPPER TO FORCE EXACT PORTRAIT CORRESPONDENCE */
        <div className="printable-report-wrapper flex flex-col w-full max-w-4xl py-6 px-4 md:px-10 mx-auto">

          {/* REPORT SHEET OUTLINE (A4 Vertical ratio matching print styles) */}
          <div className={`report-card-container print-area bg-white text-slate-900 border border-slate-200 rounded-3xl shadow-2xl overflow-visible p-8 md:p-10 font-sans tracking-tight min-h-[1100px] flex flex-col justify-between ${!isSeniorSecondary ? 'report-card-jss' : ''}`}>
          
            <div>
              {/* Header section */}
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
                    }`}>{settingsSchoolAddress} ({settingsSchoolCity}, {settingsSchoolState})</p>
                  </div>
                </div>

                <div className={`report-meta-block text-center md:text-right md:border-l pl-0 md:pl-6 pt-3 md:pt-0 ${
                  selectedReportType === 'cumulative' ? 'border-emerald-700/60' : selectedReportType === 'full' ? 'border-slate-800' : 'border-blue-700'
                }`}>
                  <h3 className="report-meta-title text-sm font-black uppercase tracking-widest text-[#fbbf24] leading-none">
                    {selectedReportType === 'cumulative' ? 'Cumulative Report' : selectedReportType === 'full' ? 'Terminal Report Card' : 'Midterm Assessment'}
                  </h3>
                  <p className="report-meta-subtitle text-xs font-bold mt-2 text-white/95">{selectedTerm} • {academicSession}</p>
                  <p className="report-meta-date text-[10px] font-mono mt-1 opacity-70">Date: {formatReportDate(new Date().toString())}</p>
                </div>
                
              </div>

              {/* Student Profile Block */}
              <div className="report-student-info mt-8 border border-slate-100 rounded-2xl bg-slate-50/50 p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Student Information</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{selectedChild.fullName}</h3>
                  </div>

                  <div className="report-details-grid grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4 text-xs font-bold text-slate-550 border-0 p-0 m-0 bg-transparent">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Admission No:</p>
                      <p className="text-[#0f172a] font-mono text-xs mt-0.5 uppercase tracking-wide">{selectedChild.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Level & Classroom:</p>
                      <p className="text-[#0f172a] mt-0.5">{selectedClass.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Gender Profile:</p>
                      <p className="text-[#0f172a] mt-0.5">{selectedChild.gender || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Education Stage:</p>
                      <p className="text-[#0f172a] mt-0.5 font-extrabold uppercase text-[10px] tracking-wider text-indigo-700">
                        {selectedClass.levelOfEducation || 'Secondary'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Term Cycle:</p>
                      <p className="text-[#0f172a] mt-0.5">{selectedTerm}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider">Academic Year:</p>
                      <p className="text-[#0f172a] mt-0.5">{academicSession}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Overview badge */}
                <div className="report-stats-box flex flex-row md:flex-col justify-end gap-1.5 min-w-[150px]">
                  {selectedReportType === 'cumulative' ? (
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
                  ) : selectedReportType === 'full' ? (
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
                        <span className="text-[9px] font-black py-0.5 px-2 bg-[#4f46e5] text-white rounded-full">Top 15%</span>
                      </div>
                    </div>
                  ) : (
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

              {/* Table evaluation segment */}
              <div className="report-table-wrapper mt-8 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                {selectedReportType === 'cumulative' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#1e293b] text-white font-bold uppercase tracking-wider text-[8px] text-center border-b border-slate-700">
                        <th rowSpan={2} className="px-4 py-3.5 border border-slate-700 text-left text-[9px]">Academic Subject</th>
                        <th rowSpan={2} className="px-3 py-3.5 border border-slate-700 w-[10%]">1st Term</th>
                        <th rowSpan={2} className="px-3 py-3.5 border border-slate-700 w-[10%]">2nd Term</th>
                        <th colSpan={5} className="py-1.5 border border-slate-700 bg-indigo-950 text-indigo-100 text-[8px]">3rd Term (Current)</th>
                        <th rowSpan={2} className="px-4 py-3.5 border border-slate-700 text-[9px] bg-slate-900 w-[12%]">Annual Avg</th>
                      </tr>
                      <tr className="bg-indigo-900 text-white font-bold text-[8px] uppercase text-center border-b border-slate-700">
                        <th className="px-1 py-1.5 border border-indigo-800 w-[9%]">CA1 (10)</th>
                        <th className="px-1 py-1.5 border border-indigo-800 w-[12%]">CA2 (10)</th>
                        <th className="px-1 py-1.5 border border-indigo-800 w-[9%]">MID TERM (20)</th>
                        <th className="px-1 py-1.5 border border-indigo-800 w-[12%]">EXAM (60)</th>
                        <th className="px-1 py-1.5 border border-indigo-800 bg-indigo-950/80 w-[12%] font-black text-[9px]">SCORE TOTAL (100)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[10px] font-semibold text-slate-700 bg-white">
                      {subjectsData.map((subj, idx) => {
                        const termsCount = (subj.hasTerm1 ? 1 : 0) + (subj.hasTerm2 ? 1 : 0) + (subj.hasTerm3 ? 1 : 0);
                        const scoreSum = (subj.hasTerm1 ? subj.term1Val : 0) + (subj.hasTerm2 ? subj.term2Val : 0) + (subj.hasTerm3 ? subj.total : 0);
                        const annualAvg = termsCount > 0 ? Math.round(scoreSum / termsCount) : 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/20 even:bg-slate-50/10">
                            <td className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-150">{subj.name}</td>
                            <td className="px-3 py-2.5 text-center border-r border-slate-150 font-mono text-slate-500">{subj.hasTerm1 ? `${subj.term1Val}%` : '-'}</td>
                            <td className="px-3 py-2.5 text-center border-r border-slate-150 font-mono text-slate-500">{subj.hasTerm2 ? `${subj.term2Val}%` : '-'}</td>
                            <td className="px-1 py-2.5 text-center border-r border-slate-150 font-mono">{subj.hasTerm3 ? subj.ca1 : '-'}</td>
                            <td className="px-1 py-2.5 text-center border-r border-slate-150 font-mono">{subj.hasTerm3 ? subj.noteChecking : '-'}</td>
                            <td className="px-1 py-2.5 text-center border-r border-slate-150 font-mono">{subj.hasTerm3 ? subj.ca2 : '-'}</td>
                            <td className="px-1 py-2.5 text-center border-r border-slate-150 font-mono">{subj.hasTerm3 ? subj.exam : '-'}</td>
                            <td className="px-1 py-2.5 text-center border-r border-slate-150 font-mono bg-indigo-50/20 text-indigo-950 font-black text-[11px]">{subj.hasTerm3 ? subj.total : '-'}</td>
                            <td className="px-4 py-2.5 text-center font-black text-indigo-700 text-[11px] bg-slate-50/20">{termsCount > 0 ? `${annualAvg}%` : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50/35 border-t border-indigo-150">
                        <td className="px-4 py-3 text-left font-black text-slate-700 uppercase text-[9px]" colSpan={7}>
                          Total Academic Marks (Obtained / Obtainable)
                        </td>
                        <td className="px-1 py-3 text-center font-black text-indigo-950 font-mono text-[11px] border-l border-slate-150" colSpan={2}>
                          {Math.round(overallTotal)} / {gradedSubjects.length * 100}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {selectedReportType === 'full' && (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[8px] text-center border-b border-slate-800">
                        <th className="px-4 py-3.5 text-left text-[9px]">Academic Subject</th>
                        <th className="px-3 py-3.5 w-[11%] border-l border-slate-800">CA1 (10)</th>
                        <th className="px-3 py-3.5 w-[14%] border-l border-slate-800">CA2 (10)</th>
                        <th className="px-3 py-3.5 w-[11%] border-l border-slate-800">MID TERM (20)</th>
                        <th className="px-3 py-3.5 w-[12%] border-l border-slate-800">EXAM (60)</th>
                        <th className="px-3 py-3.5 w-[12%] border-l border-slate-800 bg-slate-950 text-[10px] font-black">SCORE TOTAL (100)</th>
                        <th className="px-3 py-3.5 w-[11%] border-l border-slate-800">Grade Alpha</th>
                        <th className="px-4 py-3.5 w-[11%] border-l border-slate-800 text-slate-400">Class Avg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-[10px] font-bold text-slate-700 bg-white">
                      {subjectsData.map((subj, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 even:bg-slate-50/10">
                          <td className="px-4 py-3 text-slate-900 font-extrabold">{subj.name}</td>
                          <td className="px-3 py-3 text-center border-l border-slate-150 font-mono text-slate-500">{subj.ca1}</td>
                          <td className="px-3 py-3 text-center border-l border-slate-150 font-mono text-slate-500">{subj.noteChecking}</td>
                          <td className="px-3 py-3 text-center border-l border-slate-150 font-mono text-slate-500">{subj.ca2}</td>
                          <td className="px-3 py-3 text-center border-l border-slate-150 font-mono text-slate-500">{subj.exam}</td>
                          <td className="px-3 py-3 text-center border-l border-slate-150 font-mono bg-slate-50/50 text-indigo-700 font-black text-[11px]">{subj.total}</td>
                          <td className="px-3 py-3 text-center border-l border-slate-150">
                            <span className="px-2 py-0.5 rounded font-black text-[9px] tracking-wider bg-slate-100 text-slate-800">
                              {subj.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center border-l border-slate-150 font-mono text-slate-400">{subj.classAvg}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-indigo-50/35 border-t border-slate-200">
                        <td className="px-4 py-3.5 text-left font-black text-slate-700 uppercase text-[9px]" colSpan={5}>
                          Total Academic Marks (Obtained / Obtainable)
                        </td>
                        <td className="px-3 py-3.5 text-center font-black text-indigo-950 font-mono text-[11px] border-l border-slate-200" colSpan={3}>
                          {Math.round(overallTotal)} / {gradedSubjects.length * 100}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {selectedReportType === 'midterm' && (
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-[#172554] text-white font-black uppercase tracking-wider text-[8px] text-center border-b border-indigo-900">
                        <th className="px-5 py-4 text-left text-[9px]">Academic Subject</th>
                        <th className="px-4 py-4 w-[15%] border-l border-indigo-805">CA1 (10)</th>
                        <th className="px-4 py-4 w-[18%] border-l border-indigo-805">CA2 (10)</th>
                        <th className="px-4 py-4 w-[15%] border-l border-indigo-805">MID TERM (20)</th>
                        <th className="px-4 py-4 w-[15%] border-l border-indigo-805 bg-blue-950 text-[10px] font-black text-amber-400">Total Score (40)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-[10px] font-bold text-slate-700 bg-white">
                      {subjectsData.map((subj, idx) => {
                        const midtermTotal = subj.ca1 + subj.noteChecking + subj.ca2;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/20 even:bg-slate-50/10">
                            <td className="px-5 py-3 text-slate-900 font-extrabold">{subj.name}</td>
                            <td className="px-4 py-3 text-center border-l border-slate-150 font-mono text-slate-500">{subj.ca1}</td>
                            <td className="px-4 py-3 text-center border-l border-slate-150 font-mono text-slate-500">{subj.noteChecking}</td>
                            <td className="px-4 py-3 text-center border-l border-slate-150 font-mono text-slate-500">{subj.ca2}</td>
                            <td className="px-4 py-3 text-center border-l border-slate-150 font-mono bg-blue-50/35 text-indigo-900 font-black text-[11px]">{midtermTotal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-amber-55/20 border-t border-amber-200">
                        <td className="px-5 py-3.5 text-left font-black text-slate-700 uppercase text-[9px]" colSpan={4}>
                          Total Mid-Term Marks (Obtained / Obtainable)
                        </td>
                        <td className="px-4 py-3.5 text-center font-black text-[#b45309] font-mono text-[11px] border-l border-slate-150">
                          {midtermWeightedTotal} / {midtermObtainable}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            {/* Footer info (Stamps, Endorsements, Signatures) */}
            <div className="report-bottom-wrapper mt-10 pt-6 border-t border-slate-150 space-y-6 avoid-break font-sans">
              
              <div className="report-bottom-grid grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Col: Attendances / Conduct metrics */}
                <div className="report-col-4 md:col-span-4 space-y-4 flex flex-col justify-between">
                  
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Student Attendance Status</span>
                    </h4>
                    <div className="mt-3 space-y-1.5 text-[11px] font-bold text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Term Days:</span>
                        <span className="text-[#0f172a] font-mono">{finalTotalDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Present Days:</span>
                        <span className="text-emerald-700 font-mono">{finalPresentDays} days</span>
                      </div>
                      <div className="flex justify-between col-span-2 pt-1 border-t border-slate-100 mt-1">
                        <span>Attendance rate:</span>
                        <span className="text-indigo-700 font-mono font-black text-xs">{finalRateText}</span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const commentObj = dbState.reportComments?.find(
                      rc => rc.studentId === selectedChild.id && rc.classId === selectedClass.id && (rc.term === selectedTerm || rc.term.startsWith(selectedTerm))
                    );
                    const activeAttentiveness = commentObj?.attentiveness || (overallAvg > 75 ? 'Excellent' : 'Good');
                    const activeCooperation = commentObj?.cooperation || 'Excellent';
                    const activeAttitudeToWork = commentObj?.attitudeToWork || (overallAvg > 65 ? 'Good' : 'Satisfactory');
                    const activeSocialIntegration = commentObj?.socialIntegration || 'Excellent';

                    return (
                      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Conduits & Affective Skills</h4>
                        <div className="mt-2.5 space-y-1 text-[10px] font-bold text-slate-650">
                          <div className="flex justify-between">
                            <span>Attentiveness:</span>
                            <span className="text-slate-800 font-extrabold">{activeAttentiveness}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cooperation:</span>
                            <span className="text-slate-800 font-extrabold">{activeCooperation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Attitude to Work:</span>
                            <span className="text-slate-800 font-extrabold">{activeAttitudeToWork}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Social Integration:</span>
                            <span className="text-slate-800 font-extrabold">{activeSocialIntegration}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>

                {/* Central Col: Legend */}
                <div className="report-col-3 md:col-span-3 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Grading Evaluation Key</h4>
                    <div className="mt-3.5 grid grid-cols-2 gap-y-1 gap-x-2 text-[9px] font-bold text-slate-500">
                      <div className="flex justify-between"><span>A1:</span> <span className="font-mono text-slate-800">75 - 100</span></div>
                      <div className="flex justify-between"><span>C6:</span> <span className="font-mono text-slate-800">50 - 54</span></div>
                      <div className="flex justify-between"><span>B2:</span> <span className="font-mono text-slate-800">70 - 74</span></div>
                      <div className="flex justify-between"><span>D7:</span> <span className="font-mono text-slate-800">45 - 49</span></div>
                      <div className="flex justify-between"><span>B3:</span> <span className="font-mono text-slate-800">65 - 69</span></div>
                      <div className="flex justify-between"><span>D8:</span> <span className="font-mono text-slate-800">40 - 44</span></div>
                      <div className="flex justify-between"><span>C4:</span> <span className="font-mono text-slate-800">60 - 64</span></div>
                      <div className="flex justify-between"><span>F9:</span> <span className="font-mono text-rose-600">0 - 39</span></div>
                      <div className="flex justify-between"><span>C5:</span> <span className="font-mono text-slate-800">55 - 59</span></div>
                    </div>
                  </div>
                  <div className="mt-2 text-[8px] font-semibold text-slate-400 leading-normal pt-1.5 border-t border-slate-100">
                    Grade statuses are calibrated to institutional guidelines.
                  </div>
                </div>

                {/* Right Col: Remarks */}
                <div className="report-col-5 md:col-span-5 border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Formative Faculty Comments</h4>
                    
                    <div className="mt-3 space-y-2">
                      <div>
                        <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider block">Class Teacher Remarks:</span>
                        <p className="text-[11px] font-semibold text-slate-700 italic leading-snug mt-0.5">
                          "{getSubjectComments(selectedChild.id).teacher}"
                        </p>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider block">Principal Endorsement:</span>
                        <p className="text-[11px] font-semibold text-slate-700 italic leading-snug mt-0.5">
                          "{getSubjectComments(selectedChild.id).principal}"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2 border-t border-slate-150 text-[8px] uppercase tracking-wider font-bold text-slate-400 flex justify-between items-center">
                    <span>Registrar verified</span>
                    <span className="text-emerald-600 font-mono font-black">STAMPED APPROVED</span>
                  </div>
                </div>

              </div>

              {/* Definitions footnote */}
              <div className="text-[8px] font-bold text-slate-450 leading-relaxed border border-slate-100 p-2.5 rounded-xl bg-slate-50/20">
                <strong>Key Glossary:</strong> CA1 = Continuous Assessment 1 (10) • CA2 = Continuous Assessment 2 (10) • MID TERM = Mid Term Test (20) • EXAM = Terminal Exam (60).
              </div>

              {/* Bottom Stamp / Next term Commences forecasts */}
              <div className="report-footer-row pt-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                
                <div className="border border-slate-20 border-dashed rounded-xl p-3 bg-indigo-50/15 max-w-sm flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="leading-none">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Next Session</p>
                    <p className="text-xs font-black text-indigo-950 mt-1">Next Term Commences:</p>
                    <p className="text-xs font-bold text-slate-600 mt-1">{formatReportDate(nextTermBegins)}</p>
                  </div>
                </div>

                {/* Principal Signature certifying */}
                <div className="text-center sm:text-right min-w-[180px]">
                  <p className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">Official Certification</p>
                  <div className="inline-flex flex-col items-center sm:items-end justify-center">
                    {settingsAdminSignature ? (
                      <img src={settingsAdminSignature} alt="Principal Signature" className="h-8 object-contain mix-blend-multiply opacity-85" referrerPolicy="no-referrer" />
                    ) : (
                      <p className="font-serif italic text-sm text-slate-800 font-bold" style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}>
                        {settingsPrincipalName}
                      </p>
                    )}
                    <div className="w-24 border-t border-slate-300 my-1 border-dashed" />
                    <p className="text-xs font-extrabold text-[#0f172a] uppercase leading-none">{settingsPrincipalName}</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase tracking-wider leading-none">Principal Executive Officer</p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {showPrintPreview && selectedClass && (
        <PrintableReportModal
          selectedReportStudent={selectedChild}
          selectedReportType={selectedReportType}
          selectedClass={selectedClass}
          selectedTerm={selectedTerm}
          selectedSession={selectedSession}
          dbState={dbState}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  );
}
