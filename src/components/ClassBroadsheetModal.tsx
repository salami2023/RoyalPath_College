import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Printer, Layers, Award, TrendingUp, Filter, 
  CheckCircle2, ShieldCheck, FileSpreadsheet, Users, BookOpen, 
  ChevronDown, Search, ArrowUpDown, AlertTriangle
} from 'lucide-react';
import { Class, Student, DbState, getStoredLetterGrade, getStoredLetterColor, User as PortalUser } from '../types';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from '../assets/logo';
import royalPathLogo from '../assets/images/royalpath_logo.svg';

interface ClassBroadsheetModalProps {
  selectedClass: Class;
  selectedTerm: '1st Term' | '2nd Term' | '3rd Term';
  dbState: DbState;
  onClose: () => void;
  currentUser: PortalUser;
  getSubjectsForClass: (classId: string) => string[];
}

export function getOrdinalSuffix(i: number): string {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return i + 'st';
  if (j === 2 && k !== 12) return i + 'nd';
  if (j === 3 && k !== 13) return i + 'rd';
  return i + 'th';
}

export const ClassBroadsheetModal: React.FC<ClassBroadsheetModalProps> = ({
  selectedClass,
  selectedTerm: initialTerm,
  dbState,
  onClose,
  currentUser,
  getSubjectsForClass,
}) => {
  const [activeTerm, setActiveTerm] = useState<'1st Term' | '2nd Term' | '3rd Term' | 'Annual Broadsheet'>(initialTerm);
  const [sortBy, setSortBy] = useState<'rank' | 'name' | 'roll'>('rank');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');

  // Verify Admin Permission
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    document.body.classList.add('broadsheet-modal-open');
    return () => {
      document.body.classList.remove('broadsheet-modal-open');
    };
  }, []);

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Permission Denied</h3>
          <p className="text-xs text-slate-500 mt-2">
            Only school administrators have permission to generate and download official class broadsheets.
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-slate-900 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Get all students enrolled in this class
  const classStudents = dbState.students.filter(st => {
    // Check direct gradeLevel match or enrollments
    const isEnrolled = dbState.enrollments.some(e => e.studentId === st.id && e.classId === selectedClass.id);
    const matchesName = st.gradeLevel.toLowerCase().trim() === selectedClass.name.toLowerCase().trim();
    return isEnrolled || matchesName;
  });

  const subjects = getSubjectsForClass(selectedClass.id);

  // Helper to get detailed scores for a student in a subject for the active term
  const getStudentSubjectScores = (stId: string, subjectName: string) => {
    const studentGrades = dbState.grades.filter(g => {
      if (g.studentId !== stId || g.classId !== selectedClass.id) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;

      if (activeTerm === 'Annual Broadsheet') {
        return true;
      }

      const hasTerm1 = g.assignmentName.includes('1st Term');
      const hasTerm2 = g.assignmentName.includes('2nd Term');
      const hasTerm3 = g.assignmentName.includes('3rd Term');

      if (activeTerm === '1st Term') return hasTerm1;
      if (activeTerm === '2nd Term') return hasTerm2;
      return hasTerm3 || (!hasTerm1 && !hasTerm2);
    });

    if (activeTerm === 'Annual Broadsheet') {
      // Aggregate across all 3 terms
      const term1Grades = studentGrades.filter(g => g.assignmentName.includes('1st Term'));
      const term2Grades = studentGrades.filter(g => g.assignmentName.includes('2nd Term'));
      const term3Grades = studentGrades.filter(g => g.assignmentName.includes('3rd Term') || (!g.assignmentName.includes('1st Term') && !g.assignmentName.includes('2nd Term')));

      const calcTermScore = (grades: typeof studentGrades) => {
        if (grades.length === 0) return 0;
        const exam = grades.find(g => g.category === 'exam')?.score || 0;
        const ca1 = grades.find(g => g.category === 'ca1')?.score || 0;
        const ca2 = grades.find(g => g.category === 'ca2' || g.category === 'notebook')?.score || 0;
        const mid = grades.find(g => g.category === 'mid_term')?.score || 0;
        const ca = grades.find(g => g.category === 'ca')?.score || 0;
        const caTotal = ca1 || ca2 || mid ? (Math.min(10, ca1) + Math.min(10, ca2) + Math.min(20, mid)) : Math.min(40, ca * 2);
        return caTotal + Math.min(60, exam);
      };

      const t1 = calcTermScore(term1Grades);
      const t2 = calcTermScore(term2Grades);
      const t3 = calcTermScore(term3Grades);
      
      const counts = [t1 > 0, t2 > 0, t3 > 0].filter(Boolean).length || 1;
      const annualAvg = Math.round((t1 + t2 + t3) / counts);
      
      return {
        ca: Math.round(annualAvg * 0.4),
        exam: Math.round(annualAvg * 0.6),
        total: annualAvg,
        grade: getStoredLetterGrade(annualAvg),
        t1, t2, t3
      };
    }

    const examObj = studentGrades.find(g => g.category === 'exam');
    const ca1Obj = studentGrades.find(g => g.category === 'ca1');
    const ca2Obj = studentGrades.find(g => g.category === 'ca2' || g.category === 'notebook');
    const caObj = studentGrades.find(g => g.category === 'ca');
    const midObj = studentGrades.find(g => g.category === 'mid_term');

    let ca1 = ca1Obj ? Math.min(10, ca1Obj.score) : (caObj ? Math.min(10, Math.ceil(caObj.score / 2)) : 0);
    let ca2 = ca2Obj ? Math.min(10, ca2Obj.score) : (caObj ? Math.min(10, Math.floor(caObj.score / 2)) : 0);
    let mid = midObj ? Math.min(20, midObj.score) : 0;
    let exam = examObj ? Math.min(60, examObj.score) : 0;

    const caTotal = ca1 + ca2 + mid;
    const total = caTotal + exam;
    const grade = getStoredLetterGrade(total);

    return {
      ca: caTotal,
      exam,
      total,
      grade,
      ca1,
      ca2,
      mid
    };
  };

  // Compile full broadsheet matrix with student totals and rankings
  const compiledStudents = classStudents.map(st => {
    let grandTotal = 0;
    const subjectMap: Record<string, ReturnType<typeof getStudentSubjectScores>> = {};

    subjects.forEach(sub => {
      const scores = getStudentSubjectScores(st.id, sub);
      subjectMap[sub] = scores;
      grandTotal += scores.total;
    });

    const maxMarks = subjects.length * 100;
    const average = subjects.length > 0 ? parseFloat((grandTotal / subjects.length).toFixed(1)) : 0;
    const overallGrade = getStoredLetterGrade(average);

    let decision = 'Pass';
    if (average >= 75) decision = 'Distinction (Promoted with Honors)';
    else if (average >= 65) decision = 'Credit (Promoted)';
    else if (average >= 50) decision = 'Pass (Promoted)';
    else if (average >= 40) decision = 'Fair (Promoted on Trial)';
    else decision = 'Needs Improvement (Advised to Repeat)';

    return {
      student: st,
      subjectMap,
      grandTotal,
      maxMarks,
      average,
      overallGrade,
      decision,
      rank: 0,
    };
  });

  // Sort by grandTotal descending to compute positions/ranks
  const sortedForRanking = [...compiledStudents].sort((a, b) => b.grandTotal - a.grandTotal);
  sortedForRanking.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Calculate subject-level class stats (highest, lowest, average, pass count)
  const subjectStats: Record<string, { highest: number; lowest: number; avg: number; passCount: number; passRate: number }> = {};
  subjects.forEach(sub => {
    const scores = compiledStudents.map(s => s.subjectMap[sub]?.total || 0);
    if (scores.length > 0) {
      const highest = Math.max(...scores);
      const nonZeroScores = scores.filter(s => s > 0);
      const lowest = nonZeroScores.length > 0 ? Math.min(...nonZeroScores) : 0;
      const sum = scores.reduce((a, b) => a + b, 0);
      const avg = parseFloat((sum / scores.length).toFixed(1));
      const passCount = scores.filter(s => s >= 50).length;
      const passRate = parseFloat(((passCount / scores.length) * 100).toFixed(1));
      subjectStats[sub] = { highest, lowest, avg, passCount, passRate };
    } else {
      subjectStats[sub] = { highest: 0, lowest: 0, avg: 0, passCount: 0, passRate: 0 };
    }
  });

  // Filter & sort for display
  let displayedStudents = compiledStudents.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.student.fullName.toLowerCase().includes(q) || item.student.rollNumber.toLowerCase().includes(q);
  });

  if (sortBy === 'rank') {
    displayedStudents.sort((a, b) => a.rank - b.rank);
  } else if (sortBy === 'name') {
    displayedStudents.sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
  } else if (sortBy === 'roll') {
    displayedStudents.sort((a, b) => a.student.rollNumber.localeCompare(b.student.rollNumber));
  }

  // DOWNLOAD CSV BROADSHEET FUNCTION
  const handleDownloadBroadsheetCSV = () => {
    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return `"${s}"`;
    };

    const sessionYear = localStorage.getItem('school_session_year') || '2025/2026';
    const csvRows: string[] = [];

    // Header metadata
    csvRows.push(['ROYALPATH COLLEGE - OFFICIAL MASTER BROADSHEET'].map(escapeCSV).join(','));
    csvRows.push([`Class: ${selectedClass.name}`, `Academic Term: ${activeTerm}`, `Academic Session: ${sessionYear}`, `Total Enrolled Students: ${classStudents.length}`].map(escapeCSV).join(','));
    csvRows.push([`Generated On: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, `Authorized By: Principal / Admin Office`].map(escapeCSV).join(','));
    csvRows.push(''); // Empty line

    // Column Headers
    const headers = [
      'Rank',
      'Roll Number',
      'Student Full Name',
      'Gender'
    ];

    subjects.forEach(sub => {
      headers.push(`${sub} (CA 40)`);
      headers.push(`${sub} (Exam 60)`);
      headers.push(`${sub} (Total 100)`);
      headers.push(`${sub} (Grade)`);
    });

    headers.push('Grand Total Score');
    headers.push('Max Marks');
    headers.push('Class Average (%)');
    headers.push('Overall Grade');
    headers.push('Class Standing / Decision');

    csvRows.push(headers.map(escapeCSV).join(','));

    // Data rows sorted by rank
    const sortedForCsv = [...compiledStudents].sort((a, b) => a.rank - b.rank);
    sortedForCsv.forEach(item => {
      const row = [
        getOrdinalSuffix(item.rank),
        item.student.rollNumber,
        item.student.fullName,
        item.student.gender || 'N/A'
      ];

      subjects.forEach(sub => {
        const s = item.subjectMap[sub] || { ca: 0, exam: 0, total: 0, grade: 'F9' };
        row.push(String(s.ca));
        row.push(String(s.exam));
        row.push(String(s.total));
        row.push(s.grade);
      });

      row.push(String(item.grandTotal));
      row.push(String(item.maxMarks));
      row.push(`${item.average}%`);
      row.push(item.overallGrade);
      row.push(item.decision);

      csvRows.push(row.map(escapeCSV).join(','));
    });

    // Summary Statistics Rows
    csvRows.push('');
    csvRows.push(['--- CLASS SUBJECT PERFORMANCE STATISTICS ---'].map(escapeCSV).join(','));

    // Highest Marks row
    const highestRow = ['STATISTICS', 'HIGHEST SUBJECT SCORE', '', ''];
    subjects.forEach(sub => {
      const stats = subjectStats[sub];
      highestRow.push('-');
      highestRow.push('-');
      highestRow.push(String(stats?.highest || 0));
      highestRow.push(getStoredLetterGrade(stats?.highest || 0));
    });
    highestRow.push('-', '-', '-', '-', '-');
    csvRows.push(highestRow.map(escapeCSV).join(','));

    // Lowest Marks row
    const lowestRow = ['STATISTICS', 'LOWEST SUBJECT SCORE', '', ''];
    subjects.forEach(sub => {
      const stats = subjectStats[sub];
      lowestRow.push('-');
      lowestRow.push('-');
      lowestRow.push(String(stats?.lowest || 0));
      lowestRow.push(getStoredLetterGrade(stats?.lowest || 0));
    });
    lowestRow.push('-', '-', '-', '-', '-');
    csvRows.push(lowestRow.map(escapeCSV).join(','));

    // Subject Average row
    const avgRow = ['STATISTICS', 'SUBJECT CLASS AVERAGE', '', ''];
    subjects.forEach(sub => {
      const stats = subjectStats[sub];
      avgRow.push('-');
      avgRow.push('-');
      avgRow.push(`${stats?.avg || 0}%`);
      avgRow.push(getStoredLetterGrade(stats?.avg || 0));
    });
    avgRow.push('-', '-', '-', '-', '-');
    csvRows.push(avgRow.map(escapeCSV).join(','));

    // Pass Rate row
    const passRow = ['STATISTICS', 'SUBJECT PASS RATE (%)', '', ''];
    subjects.forEach(sub => {
      const stats = subjectStats[sub];
      passRow.push('-');
      passRow.push('-');
      passRow.push(`${stats?.passRate || 0}%`);
      passRow.push(`${stats?.passCount || 0} passed`);
    });
    passRow.push('-', '-', '-', '-', '-');
    csvRows.push(passRow.map(escapeCSV).join(','));

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanClassName = selectedClass.name.replace(/\s+/g, '_');
    const cleanTerm = activeTerm.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `Class_Broadsheet_${cleanClassName}_${cleanTerm}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-[98vw] xl:max-w-[95vw] 2xl:max-w-[1600px] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* MODAL CONTROL HEADER (Hidden on Print) */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Official Class Broadsheet Master Matrix
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Authorized
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedClass.name} • {activeTerm} • {subjects.length} Subjects across {classStudents.length} Students
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Term Switcher */}
            <select
              value={activeTerm}
              onChange={(e) => setActiveTerm(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              id="broadsheet_term_select"
            >
              <option value="1st Term">1st Term Broadsheet</option>
              <option value="2nd Term">2nd Term Broadsheet</option>
              <option value="3rd Term">3rd Term Broadsheet</option>
              <option value="Annual Broadsheet">Annual Cumulative Broadsheet</option>
            </select>

            {/* DOWNLOAD CSV BUTTON */}
            <button
              onClick={handleDownloadBroadsheetCSV}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              id="download_broadsheet_csv_btn"
              title="Download Master Broadsheet as CSV Spreadsheet"
            >
              <Download className="w-4 h-4" />
              <span>Download Broadsheet (CSV)</span>
            </button>

            {/* PRINT / SAVE PDF BUTTON */}
            <button
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              id="print_broadsheet_btn"
              title="Print or Save PDF of Master Broadsheet"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              id="close_broadsheet_modal_btn"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TOOLBAR FOR SEARCH & SORTING (Hidden on Print) */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or roll number..."
                className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-56 sm:w-64"
                id="broadsheet_search_input"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort by:</span>
              <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                <button
                  onClick={() => setSortBy('rank')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${sortBy === 'rank' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Position (Rank)
                </button>
                <button
                  onClick={() => setSortBy('name')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${sortBy === 'name' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortBy('roll')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${sortBy === 'roll' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Roll No
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-600 font-semibold">
            <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
              Total Class Capacity: {classStudents.length} Students
            </span>
            <span className="bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
              Subjects Computed: {subjects.length}
            </span>
          </div>
        </div>

        {/* PRINTABLE BROADSHEET DOCUMENT CONTAINER */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1 font-sans print:p-2">
          
          {/* OFFICIAL SCHOOL HEADER (Visible on Print & Screen) */}
          <div className="border-b-2 border-indigo-900 pb-4 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  <SchoolLogo className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight uppercase">
                    ROYALPATH COLLEGE
                  </h1>
                  <p className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                    KILOMETRE 7, IDIROKO ROAD, SANGO OTA, OGUN STATE, NIGERIA
                  </p>
                  <p className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-widest mt-0.5">
                    OFFICIAL CLASS BROADSHEET & ACADEMIC MASTER SPREADSHEET
                  </p>
                </div>
              </div>

              <div className="text-right text-xs space-y-0.5 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="font-extrabold text-slate-900">
                  CLASS: <span className="text-indigo-700 font-black">{selectedClass.name}</span>
                </div>
                <div className="font-bold text-slate-600">
                  TERM: <span className="text-slate-900">{activeTerm}</span>
                </div>
                <div className="font-bold text-slate-600">
                  SESSION: <span className="text-slate-900">{localStorage.getItem('school_session_year') || '2025/2026'}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  DATE: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>

          {/* MASTER MATRIX TABLE */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full border-collapse text-left text-[11px] min-w-[1100px]">
              <thead>
                {/* Level 1 Header: Main categories */}
                <tr className="bg-slate-900 text-white text-center font-bold">
                  <th className="py-2.5 px-2 border-r border-slate-700 w-10 shrink-0" rowSpan={2}>POS</th>
                  <th className="py-2.5 px-3 border-r border-slate-700 w-28 text-left" rowSpan={2}>ROLL NO</th>
                  <th className="py-2.5 px-4 border-r border-slate-700 min-w-[160px] text-left" rowSpan={2}>STUDENT FULL NAME</th>
                  <th className="py-2.5 px-2 border-r border-slate-700 w-12" rowSpan={2}>GEN</th>

                  {/* Subject headers */}
                  {subjects.map(sub => (
                    <th key={sub} className="py-2 px-2 border-r border-slate-700 font-extrabold text-indigo-200 bg-slate-850" colSpan={4}>
                      <span className="block truncate max-w-[130px] mx-auto" title={sub}>{sub}</span>
                    </th>
                  ))}

                  {/* Whole Subject Summary Header */}
                  <th className="py-2.5 px-3 border-r border-slate-700 bg-indigo-900 text-white" colSpan={4}>
                    WHOLE SUBJECT OVERALL SUMMARY
                  </th>
                  <th className="py-2.5 px-3 bg-slate-900 text-white min-w-[130px]" rowSpan={2}>
                    REMARK / DECISION
                  </th>
                </tr>

                {/* Level 2 Header: Subject Sub-columns (CA, Exam, Total, Grade) */}
                <tr className="bg-slate-800 text-slate-200 text-center font-bold text-[9px] uppercase tracking-wider border-b border-slate-400">
                  {subjects.map(sub => (
                    <React.Fragment key={sub + '_cols'}>
                      <th className="py-1 px-1 border-r border-slate-700 w-9 bg-slate-800 text-slate-300">CA (40)</th>
                      <th className="py-1 px-1 border-r border-slate-700 w-9 bg-slate-800 text-slate-300">EX (60)</th>
                      <th className="py-1 px-1 border-r border-slate-700 w-10 bg-indigo-950 text-indigo-200 font-black">TOT</th>
                      <th className="py-1 px-1 border-r border-slate-600 w-8 bg-slate-750 text-amber-300 font-black">GRD</th>
                    </React.Fragment>
                  ))}

                  {/* Overall columns */}
                  <th className="py-1 px-2 border-r border-slate-700 bg-indigo-950 text-white">GRAND TOT</th>
                  <th className="py-1 px-2 border-r border-slate-700 bg-indigo-950 text-white">AVG %</th>
                  <th className="py-1 px-2 border-r border-slate-700 bg-indigo-950 text-amber-300">GRADE</th>
                  <th className="py-1 px-2 border-r border-slate-700 bg-indigo-950 text-emerald-300">RANK</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {displayedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4 + (subjects.length * 4) + 5} className="py-12 text-center text-slate-400 font-bold">
                      No students found matching your criteria in this class broadsheet.
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((item, idx) => {
                    const isTopThree = item.rank <= 3;
                    return (
                      <tr 
                        key={item.student.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                      >
                        {/* Position */}
                        <td className="py-2 px-2 text-center font-black border-r border-slate-200">
                          <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] ${
                            item.rank === 1 ? 'bg-amber-100 text-amber-800 font-black' :
                            item.rank === 2 ? 'bg-slate-200 text-slate-800 font-black' :
                            item.rank === 3 ? 'bg-amber-50 text-amber-700 font-black' :
                            'text-slate-600'
                          }`}>
                            {getOrdinalSuffix(item.rank)}
                          </span>
                        </td>

                        {/* Roll Number */}
                        <td className="py-2 px-3 font-mono font-bold text-slate-600 border-r border-slate-200 text-[10px]">
                          {item.student.rollNumber}
                        </td>

                        {/* Student Name */}
                        <td className="py-2 px-4 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{item.student.fullName}</span>
                            {isTopThree && (
                              <Award className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="py-2 px-2 text-center text-slate-500 font-semibold border-r border-slate-200 text-[10px]">
                          {item.student.gender?.[0]?.toUpperCase() || 'M'}
                        </td>

                        {/* Subject columns */}
                        {subjects.map(sub => {
                          const scores = item.subjectMap[sub] || { ca: 0, exam: 0, total: 0, grade: 'F9' };
                          const isDistinction = scores.total >= 75;
                          const isFail = scores.total < 40;

                          return (
                            <React.Fragment key={sub + '_' + item.student.id}>
                              <td className="py-1.5 px-1 text-center font-mono text-slate-600 border-r border-slate-200">
                                {scores.ca}
                              </td>
                              <td className="py-1.5 px-1 text-center font-mono text-slate-600 border-r border-slate-200">
                                {scores.exam}
                              </td>
                              <td className={`py-1.5 px-1 text-center font-mono font-bold border-r border-slate-200 ${
                                isDistinction ? 'bg-emerald-50 text-emerald-800' :
                                isFail ? 'bg-rose-50 text-rose-700' :
                                'bg-indigo-50/20 text-slate-900'
                              }`}>
                                {scores.total}
                              </td>
                              <td className={`py-1.5 px-1 text-center font-black border-r border-slate-300 text-[10px] ${getStoredLetterColor(scores.grade)}`}>
                                {scores.grade}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        {/* Overall Summary Columns */}
                        <td className="py-2 px-2 text-center font-black text-indigo-950 border-r border-slate-200 bg-indigo-50/15">
                          {item.grandTotal} <span className="text-[9px] text-slate-400 font-normal">/{item.maxMarks}</span>
                        </td>
                        <td className="py-2 px-2 text-center font-black text-slate-900 border-r border-slate-200 bg-indigo-50/25">
                          {item.average}%
                        </td>
                        <td className={`py-2 px-2 text-center font-black border-r border-slate-200 ${getStoredLetterColor(item.overallGrade)}`}>
                          {item.overallGrade}
                        </td>
                        <td className="py-2 px-2 text-center font-black text-indigo-700 border-r border-slate-200 bg-indigo-50/30">
                          {getOrdinalSuffix(item.rank)}
                        </td>

                        {/* Remark / Decision */}
                        <td className="py-2 px-3 font-bold text-slate-800 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-md ${
                            item.average >= 70 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            item.average >= 50 ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                            'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}>
                            {item.decision}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* CLASS SUMMARY FOOTER (Highest, Lowest, Average, Pass Rate) */}
              <tfoot className="bg-slate-100 border-t-2 border-slate-400 font-bold text-[10px] text-slate-700">
                {/* Highest Row */}
                <tr className="border-b border-slate-200">
                  <td colSpan={4} className="py-2 px-3 text-right font-black uppercase text-indigo-900 border-r border-slate-300">
                    Subject Highest Mark
                  </td>
                  {subjects.map(sub => {
                    const stats = subjectStats[sub];
                    return (
                      <React.Fragment key={'high_' + sub}>
                        <td colSpan={2} className="py-1 text-center font-mono text-slate-400 border-r border-slate-200">-</td>
                        <td className="py-1 text-center font-mono font-black text-emerald-800 bg-emerald-50 border-r border-slate-200">
                          {stats?.highest || 0}
                        </td>
                        <td className="py-1 text-center font-black text-emerald-800 bg-emerald-50 border-r border-slate-300">
                          {getStoredLetterGrade(stats?.highest || 0)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td colSpan={5} className="bg-slate-100"></td>
                </tr>

                {/* Lowest Row */}
                <tr className="border-b border-slate-200">
                  <td colSpan={4} className="py-2 px-3 text-right font-black uppercase text-indigo-900 border-r border-slate-300">
                    Subject Lowest Mark
                  </td>
                  {subjects.map(sub => {
                    const stats = subjectStats[sub];
                    return (
                      <React.Fragment key={'low_' + sub}>
                        <td colSpan={2} className="py-1 text-center font-mono text-slate-400 border-r border-slate-200">-</td>
                        <td className="py-1 text-center font-mono font-bold text-rose-800 bg-rose-50 border-r border-slate-200">
                          {stats?.lowest || 0}
                        </td>
                        <td className="py-1 text-center font-black text-rose-800 bg-rose-50 border-r border-slate-300">
                          {getStoredLetterGrade(stats?.lowest || 0)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td colSpan={5} className="bg-slate-100"></td>
                </tr>

                {/* Class Average Row */}
                <tr className="border-b border-slate-200 bg-slate-200/70">
                  <td colSpan={4} className="py-2 px-3 text-right font-black uppercase text-indigo-950 border-r border-slate-300">
                    Subject Class Average
                  </td>
                  {subjects.map(sub => {
                    const stats = subjectStats[sub];
                    return (
                      <React.Fragment key={'avg_' + sub}>
                        <td colSpan={2} className="py-1 text-center font-mono text-slate-400 border-r border-slate-200">-</td>
                        <td className="py-1 text-center font-mono font-black text-indigo-900 bg-indigo-50 border-r border-slate-200">
                          {stats?.avg || 0}%
                        </td>
                        <td className="py-1 text-center font-black text-indigo-900 bg-indigo-50 border-r border-slate-300">
                          {getStoredLetterGrade(stats?.avg || 0)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td colSpan={5} className="bg-slate-200/70"></td>
                </tr>

                {/* Pass Rate Row */}
                <tr>
                  <td colSpan={4} className="py-2 px-3 text-right font-black uppercase text-indigo-950 border-r border-slate-300">
                    Pass Rate (% ≥ 50)
                  </td>
                  {subjects.map(sub => {
                    const stats = subjectStats[sub];
                    return (
                      <React.Fragment key={'pass_' + sub}>
                        <td colSpan={2} className="py-1 text-center font-mono text-slate-400 border-r border-slate-200">-</td>
                        <td colSpan={2} className="py-1 text-center font-mono font-black text-slate-800 bg-slate-150 border-r border-slate-300">
                          {stats?.passRate || 0}% ({stats?.passCount || 0}/{classStudents.length})
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td colSpan={5} className="bg-slate-100"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* OFFICIAL CERTIFICATION SIGNATURE BLOCK */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 h-10 w-48 mx-auto"></div>
              <p className="font-bold text-slate-800 mt-1">Form Teacher's Signature & Date</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 w-48 mx-auto"></div>
              <p className="font-bold text-slate-800 mt-1">Academic Officer / Registrar</p>
            </div>
            <div>
              <div className="border-b border-slate-400 h-10 w-48 mx-auto"></div>
              <p className="font-black text-indigo-950 mt-1">Principal's Official Stamp & Seal</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
