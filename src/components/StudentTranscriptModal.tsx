import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, Printer, GraduationCap, Award, ShieldCheck, 
  Search, BookOpen, Calendar, CheckCircle2, User, FileText,
  AlertTriangle, ChevronRight, Check
} from 'lucide-react';
import { Student, Class, DbState, Grade, getStoredLetterGrade, getStoredLetterColor, User as PortalUser } from '../types';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from '../assets/logo';
import royalPathLogo from '../assets/images/royalpath_logo.svg';

interface StudentTranscriptModalProps {
  initialStudent?: Student | null;
  allStudents: Student[];
  allClasses: Class[];
  dbState: DbState;
  onClose: () => void;
  currentUser: PortalUser;
  getSubjectsForClass?: (classId: string) => string[];
}

export const StudentTranscriptModal: React.FC<StudentTranscriptModalProps> = ({
  initialStudent,
  allStudents,
  allClasses,
  dbState,
  onClose,
  currentUser,
  getSubjectsForClass,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(initialStudent || allStudents[0] || null);
  const [studentSearch, setStudentSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Enforce Admin Access Check
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    document.body.classList.add('transcript-modal-open');
    return () => {
      document.body.classList.remove('transcript-modal-open');
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
            Only school administrators have permission to access and download official student academic transcripts.
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

  const currentClass = selectedStudent ? allClasses.find(c => {
    const isEnrolled = dbState.enrollments.some(e => e.studentId === selectedStudent.id && e.classId === c.id);
    const matchesName = selectedStudent.gradeLevel.toLowerCase().trim() === c.name.toLowerCase().trim();
    return isEnrolled || matchesName;
  }) : null;

  // Gather all grades for this student across the entire school history
  const studentGrades = selectedStudent ? dbState.grades.filter(g => g.studentId === selectedStudent.id) : [];

  // Group grades by Term
  const termsList: ('1st Term' | '2nd Term' | '3rd Term')[] = ['1st Term', '2nd Term', '3rd Term'];
  const sessionYear = localStorage.getItem('school_session_year') || '2025/2026';

  // Helper to compile a term's subject table
  const compileTermRecords = (termName: '1st Term' | '2nd Term' | '3rd Term') => {
    if (!selectedStudent) return [];

    // Filter grades for this term
    const termGrades = studentGrades.filter(g => {
      const hasTerm1 = g.assignmentName.includes('1st Term');
      const hasTerm2 = g.assignmentName.includes('2nd Term');
      const hasTerm3 = g.assignmentName.includes('3rd Term');

      if (termName === '1st Term') return hasTerm1;
      if (termName === '2nd Term') return hasTerm2;
      return hasTerm3 || (!hasTerm1 && !hasTerm2);
    });

    // Extract unique subjects
    const subjectNames = new Set<string>();
    termGrades.forEach(g => {
      if (g.subjectName) subjectNames.add(g.subjectName);
      else {
        // Fallback extract
        const name = g.assignmentName.replace(/(1st Term|2nd Term|3rd Term|Exam|CA|Mid Term|Test)/gi, '').trim();
        if (name) subjectNames.add(name);
      }
    });

    // If currentClass has standard subjects, include them
    if (getSubjectsForClass && currentClass) {
      getSubjectsForClass(currentClass.id).forEach(s => subjectNames.add(s));
    }

    const compiled = Array.from(subjectNames).map(subject => {
      const subjectGrades = termGrades.filter(g => 
        (g.subjectName && g.subjectName.toLowerCase() === subject.toLowerCase()) ||
        g.assignmentName.toLowerCase().includes(subject.toLowerCase())
      );

      const examObj = subjectGrades.find(g => g.category === 'exam');
      const ca1Obj = subjectGrades.find(g => g.category === 'ca1');
      const ca2Obj = subjectGrades.find(g => g.category === 'ca2' || g.category === 'notebook');
      const caObj = subjectGrades.find(g => g.category === 'ca');
      const midObj = subjectGrades.find(g => g.category === 'mid_term');

      let ca1 = ca1Obj ? Math.min(10, ca1Obj.score) : (caObj ? Math.min(10, Math.ceil(caObj.score / 2)) : 0);
      let ca2 = ca2Obj ? Math.min(10, ca2Obj.score) : (caObj ? Math.min(10, Math.floor(caObj.score / 2)) : 0);
      let mid = midObj ? Math.min(20, midObj.score) : 0;
      let exam = examObj ? Math.min(60, examObj.score) : 0;

      const caTotal = ca1 + ca2 + mid;
      const total = caTotal + exam;
      const letterGrade = getStoredLetterGrade(total);

      // Nigerian / British Grade Point conversion
      let gradePoint = 0;
      if (total >= 75) gradePoint = 4.0; // A1
      else if (total >= 70) gradePoint = 3.5; // B2
      else if (total >= 65) gradePoint = 3.0; // B3
      else if (total >= 60) gradePoint = 2.5; // C4
      else if (total >= 55) gradePoint = 2.25; // C5
      else if (total >= 50) gradePoint = 2.0; // C6
      else if (total >= 45) gradePoint = 1.5; // D7
      else if (total >= 40) gradePoint = 1.0; // D8
      else gradePoint = 0.0; // F9

      return {
        subject,
        ca1,
        ca2,
        mid,
        caTotal,
        exam,
        total,
        letterGrade,
        gradePoint,
        creditUnits: 3, // Standard secondary school subject credit
        status: total >= 50 ? 'Passed' : (total >= 40 ? 'Pass' : 'Credit Failed')
      };
    });

    return compiled;
  };

  const term1Data = compileTermRecords('1st Term');
  const term2Data = compileTermRecords('2nd Term');
  const term3Data = compileTermRecords('3rd Term');

  // Overall Cumulative Calculations
  const allAttempted = [...term1Data, ...term2Data, ...term3Data].filter(i => i.total > 0);
  const totalScoreSum = allAttempted.reduce((sum, i) => sum + i.total, 0);
  const cumulativeAverage = allAttempted.length > 0 ? parseFloat((totalScoreSum / allAttempted.length).toFixed(1)) : 0;
  
  const totalCreditUnits = allAttempted.reduce((sum, i) => sum + i.creditUnits, 0);
  const totalWeightedPoints = allAttempted.reduce((sum, i) => sum + (i.gradePoint * i.creditUnits), 0);
  const cumulativeGPA = totalCreditUnits > 0 ? parseFloat((totalWeightedPoints / totalCreditUnits).toFixed(2)) : 0;

  const passedSubjectsCount = allAttempted.filter(i => i.total >= 50).length;

  let academicStanding = 'Good Standing';
  if (cumulativeAverage >= 75) academicStanding = 'First Class Distinction / Principal\'s Honors';
  else if (cumulativeAverage >= 65) academicStanding = 'Upper Credit Standing';
  else if (cumulativeAverage >= 50) academicStanding = 'Satisfactory Progress';
  else if (cumulativeAverage >= 40) academicStanding = 'Academic Probation';
  else academicStanding = 'Critical Academic Review';

  // Grade Distribution Counts
  const gradeCounts = {
    A1: allAttempted.filter(i => i.letterGrade === 'A1').length,
    B2_B3: allAttempted.filter(i => ['B2', 'B3'].includes(i.letterGrade)).length,
    C4_C6: allAttempted.filter(i => ['C4', 'C5', 'C6'].includes(i.letterGrade)).length,
    D7_D8: allAttempted.filter(i => ['D7', 'D8'].includes(i.letterGrade)).length,
    F9: allAttempted.filter(i => i.letterGrade === 'F9').length,
  };

  // CSV EXPORT FUNCTION
  const handleDownloadTranscriptCSV = () => {
    if (!selectedStudent) return;

    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return `"${s}"`;
    };

    const csvRows: string[] = [];

    // Header metadata
    csvRows.push(['ROYALPATH COLLEGE - OFFICIAL ACADEMIC TRANSCRIPT'].map(escapeCSV).join(','));
    csvRows.push([`Student Name: ${selectedStudent.fullName}`, `Roll Number: ${selectedStudent.rollNumber}`, `Gender: ${selectedStudent.gender || 'N/A'}`, `Class Level: ${selectedStudent.gradeLevel}`].map(escapeCSV).join(','));
    csvRows.push([`Date of Birth: ${selectedStudent.birthDate || 'N/A'}`, `Academic Session: ${sessionYear}`, `Transcript Issue Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`].map(escapeCSV).join(','));
    csvRows.push([`Cumulative Average: ${cumulativeAverage}%`, `CGPA: ${cumulativeGPA} / 4.00`, `Academic Standing: ${academicStanding}`, `Authorized By: Office of the Registrar & Principal`].map(escapeCSV).join(','));
    csvRows.push(''); // Empty line

    // Iterate each term
    const termBlocks: { term: string; data: typeof term1Data }[] = [
      { term: '1st Term', data: term1Data },
      { term: '2nd Term', data: term2Data },
      { term: '3rd Term', data: term3Data },
    ];

    termBlocks.forEach(({ term, data }) => {
      csvRows.push([`--- ACADEMIC PERFORMANCE: ${term.toUpperCase()} (${sessionYear}) ---`].map(escapeCSV).join(','));
      csvRows.push(['Subject Name', 'CA 1 (10)', 'CA 2 (10)', 'Mid-Term (20)', 'Total CA (40)', 'Exam (60)', 'Terminal Total (100)', 'Letter Grade', 'Grade Point', 'Status'].map(escapeCSV).join(','));

      data.forEach(item => {
        csvRows.push([
          item.subject,
          String(item.ca1),
          String(item.ca2),
          String(item.mid),
          String(item.caTotal),
          String(item.exam),
          String(item.total),
          item.letterGrade,
          String(item.gradePoint),
          item.status
        ].map(escapeCSV).join(','));
      });

      const termSum = data.reduce((s, i) => s + i.total, 0);
      const termAvg = data.length > 0 ? (termSum / data.length).toFixed(1) : '0';
      csvRows.push([`Term Average: ${termAvg}%`, '', '', '', '', '', `Term Total: ${termSum}/${data.length * 100}`, '', '', ''].map(escapeCSV).join(','));
      csvRows.push('');
    });

    // Summary Section
    csvRows.push(['--- CUMULATIVE ACADEMIC SUMMARY ---'].map(escapeCSV).join(','));
    csvRows.push(['Total Assessment Records', String(allAttempted.length)].map(escapeCSV).join(','));
    csvRows.push(['Total Courses Passed (≥ 50%)', String(passedSubjectsCount)].map(escapeCSV).join(','));
    csvRows.push(['Cumulative Average Score', `${cumulativeAverage}%`].map(escapeCSV).join(','));
    csvRows.push(['Cumulative Grade Point Average (CGPA)', `${cumulativeGPA} on a 4.00 Scale`].map(escapeCSV).join(','));
    csvRows.push(['Final Standing / Classification', academicStanding].map(escapeCSV).join(','));

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanStudentName = selectedStudent.fullName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `Official_Transcript_${cleanStudentName}_${selectedStudent.rollNumber}_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredStudents = allStudents.filter(st => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase();
    return st.fullName.toLowerCase().includes(q) || st.rollNumber.toLowerCase().includes(q) || st.gradeLevel.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-[95vw] xl:max-w-[1200px] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {/* MODAL CONTROL HEADER (Hidden on Print) */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Official Student Academic Transcript Generator
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin Authorized
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive historical transcript containing all grades recorded across all terms and academic sessions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* DOWNLOAD CSV BUTTON */}
            <button
              onClick={handleDownloadTranscriptCSV}
              disabled={!selectedStudent}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              id="download_transcript_csv_btn"
              title="Download Complete Academic Transcript as CSV"
            >
              <Download className="w-4 h-4" />
              <span>Download Transcript (CSV)</span>
            </button>

            {/* PRINT / SAVE PDF BUTTON */}
            <button
              onClick={handlePrint}
              disabled={!selectedStudent}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
              id="print_transcript_btn"
              title="Print or Save Official PDF Transcript"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              id="close_transcript_modal_btn"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STUDENT SELECTION TOOLBAR (Hidden on Print) */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Select Student:</span>
            
            <div className="relative flex-1 sm:w-80">
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-400 shadow-2xs"
                id="student_transcript_select_trigger"
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">{selectedStudent ? `${selectedStudent.fullName} (${selectedStudent.gradeLevel})` : 'Select a student...'}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto p-1">
                  <div className="p-1.5 border-b border-slate-100 sticky top-0 bg-white">
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Search name, roll number, class..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div className="py-1">
                    {filteredStudents.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">No students found.</div>
                    ) : (
                      filteredStudents.map((st, idx) => (
                        <div
                          key={`${st.id}_${idx}`}
                          onClick={() => {
                            setSelectedStudent(st);
                            setIsDropdownOpen(false);
                          }}
                          className={`px-3 py-2 rounded-lg flex items-center justify-between text-xs cursor-pointer hover:bg-indigo-50/70 transition-colors ${selectedStudent?.id === st.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                        >
                          <div>
                            <div className="font-bold">{st.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{st.rollNumber} • {st.gradeLevel}</div>
                          </div>
                          {selectedStudent?.id === st.id && (
                            <Check className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedStudent && (
            <div className="flex items-center gap-2 text-slate-600">
              <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-100">
                CGPA: {cumulativeGPA} / 4.00
              </span>
              <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg border border-emerald-100">
                Average: {cumulativeAverage}%
              </span>
              <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg">
                Total Assessments: {allAttempted.length}
              </span>
            </div>
          )}
        </div>

        {/* OFFICIAL TRANSCRIPT DOCUMENT (Printable) */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 font-sans print:p-4 text-slate-900 bg-white">
          {!selectedStudent ? (
            <div className="py-20 text-center text-slate-400 font-bold">
              Please select a student from the dropdown above to view and download their transcript.
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* OFFICIAL CREST & INSTITUTIONAL HEADER */}
              <div className="border-b-4 border-indigo-950 pb-5">
                <div className="flex items-center justify-between gap-6">
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                    <SchoolLogo className="w-full h-full object-contain" />
                  </div>
                  <div className="text-center flex-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight uppercase">
                      ROYALPATH COLLEGE
                    </h1>
                    <p className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                      GOVERNMENT APPROVED • SANGO OTA, OGUN STATE, NIGERIA
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                      OFFICE OF THE REGISTRAR & ACADEMIC RECORDS
                    </p>
                    <div className="inline-block mt-2 bg-indigo-950 text-white text-xs font-black px-4 py-1 rounded-full uppercase tracking-widest">
                      OFFICIAL ACADEMIC TRANSCRIPT
                    </div>
                  </div>
                  <div className="text-right text-[11px] space-y-1 shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-400 uppercase text-[9px]">Transcript Ref:</div>
                    <div className="font-mono font-black text-indigo-900">
                      TR-{selectedStudent.rollNumber.replace(/[^a-zA-Z0-9]/g, '')}-{new Date().getFullYear()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Issued: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>

              {/* STUDENT BIOGRAPHICAL DETAILS */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Student Name</span>
                  <span className="font-black text-slate-900 text-sm">{selectedStudent.fullName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Admission / Roll No</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedStudent.rollNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Current Grade Level</span>
                  <span className="font-bold text-slate-800">{selectedStudent.gradeLevel}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Gender / Birth Date</span>
                  <span className="font-bold text-slate-800">{selectedStudent.gender || 'Not Specified'} • {selectedStudent.birthDate || 'N/A'}</span>
                </div>
              </div>

              {/* TRANSCRIPT TERMS RECORD TABLES */}
              {[
                { termName: '1st Term', data: term1Data },
                { termName: '2nd Term', data: term2Data },
                { termName: '3rd Term', data: term3Data },
              ].map(({ termName, data }) => {
                const termScoreSum = data.reduce((s, i) => s + i.total, 0);
                const termAverage = data.length > 0 ? parseFloat((termScoreSum / data.length).toFixed(1)) : 0;

                return (
                  <div key={termName} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between font-bold text-xs">
                      <span>{termName.toUpperCase()} — {sessionYear} ACADEMIC SESSION</span>
                      <span className="text-indigo-200 text-[11px]">
                        Term Average: <strong className="text-white">{termAverage}%</strong> • Grade: <strong className="text-amber-300">{getStoredLetterGrade(termAverage)}</strong>
                      </span>
                    </div>

                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 font-extrabold uppercase text-[9px] border-b border-slate-200">
                          <th className="py-2.5 px-3">Subject Name</th>
                          <th className="py-2.5 px-2 text-center w-14">CA (40)</th>
                          <th className="py-2.5 px-2 text-center w-14">Exam (60)</th>
                          <th className="py-2.5 px-2 text-center w-16 bg-indigo-50/40">Total (100)</th>
                          <th className="py-2.5 px-2 text-center w-14">Grade</th>
                          <th className="py-2.5 px-2 text-center w-14">GP</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 bg-white">
                        {data.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-4 text-center text-slate-400 italic">
                              No grade records entered for this term yet.
                            </td>
                          </tr>
                        ) : (
                          data.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-bold text-slate-900">{item.subject}</td>
                              <td className="py-2 px-2 text-center font-mono text-slate-600">{item.caTotal}</td>
                              <td className="py-2 px-2 text-center font-mono text-slate-600">{item.exam}</td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-indigo-950 bg-indigo-50/20">{item.total}</td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${getStoredLetterColor(item.letterGrade)}`}>
                                  {item.letterGrade}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">{item.gradePoint.toFixed(1)}</td>
                              <td className="py-2 px-3 text-right font-bold">
                                <span className={`text-[10px] ${item.total >= 50 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}

              {/* CUMULATIVE PERFORMANCE SUMMARY & GRADING KEY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Left Box: Cumulative Metrics */}
                <div className="bg-indigo-950 text-white rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-indigo-200 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    Cumulative Academic Summary
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-900/60 p-3 rounded-xl border border-indigo-800/40">
                      <span className="block text-[10px] text-indigo-300 uppercase font-bold">Cumulative Average</span>
                      <span className="text-xl font-black text-white">{cumulativeAverage}%</span>
                    </div>
                    <div className="bg-indigo-900/60 p-3 rounded-xl border border-indigo-800/40">
                      <span className="block text-[10px] text-indigo-300 uppercase font-bold">Cumulative GPA</span>
                      <span className="text-xl font-black text-amber-300">{cumulativeGPA} <span className="text-xs text-indigo-300 font-normal">/ 4.00</span></span>
                    </div>
                    <div className="bg-indigo-900/60 p-3 rounded-xl border border-indigo-800/40">
                      <span className="block text-[10px] text-indigo-300 uppercase font-bold">Subjects Passed</span>
                      <span className="text-lg font-bold text-emerald-400">{passedSubjectsCount} / {allAttempted.length}</span>
                    </div>
                    <div className="bg-indigo-900/60 p-3 rounded-xl border border-indigo-800/40">
                      <span className="block text-[10px] text-indigo-300 uppercase font-bold">Honor Standing</span>
                      <span className="text-xs font-bold text-amber-200 block truncate" title={academicStanding}>{academicStanding}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-indigo-300 flex items-center justify-between border-t border-indigo-900 pt-2">
                    <span>Grade Breakdown:</span>
                    <span>A1: {gradeCounts.A1} | B2-B3: {gradeCounts.B2_B3} | C4-C6: {gradeCounts.C4_C6} | D7-D8: {gradeCounts.D7_D8} | F9: {gradeCounts.F9}</span>
                  </div>
                </div>

                {/* Right Box: Standard Grading Scale */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Official Grading Key & Conversion
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex justify-between p-1 bg-white rounded-md border border-slate-200 font-mono">
                      <span>75 - 100%: <strong>A1 (Distinction)</strong></span>
                      <span className="text-slate-500">4.0 GP</span>
                    </div>
                    <div className="flex justify-between p-1 bg-white rounded-md border border-slate-200 font-mono">
                      <span>70 - 74%: <strong>B2 (Very Good)</strong></span>
                      <span className="text-slate-500">3.5 GP</span>
                    </div>
                    <div className="flex justify-between p-1 bg-white rounded-md border border-slate-200 font-mono">
                      <span>65 - 69%: <strong>B3 (Good)</strong></span>
                      <span className="text-slate-500">3.0 GP</span>
                    </div>
                    <div className="flex justify-between p-1 bg-white rounded-md border border-slate-200 font-mono">
                      <span>50 - 64%: <strong>C4 - C6 (Credit)</strong></span>
                      <span className="text-slate-500">2.0 - 2.5</span>
                    </div>
                    <div className="flex justify-between p-1 bg-white rounded-md border border-slate-200 font-mono">
                      <span>40 - 49%: <strong>D7 - D8 (Pass)</strong></span>
                      <span className="text-slate-500">1.0 - 1.5</span>
                    </div>
                    <div className="flex justify-between p-1 bg-white rounded-md border border-slate-200 font-mono">
                      <span>0 - 39%: <strong>F9 (Fail)</strong></span>
                      <span className="text-slate-500">0.0 GP</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    Continuous Assessment (CA) accounts for 40% (CA1 + CA2 + Midterm) and Terminal Examination accounts for 60% of total score.
                  </p>
                </div>
              </div>

              {/* OFFICIAL CERTIFICATION & SEAL BLOCK */}
              <div className="mt-10 pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b-2 border-slate-400 h-12 w-56 mx-auto mb-1"></div>
                  <p className="font-black text-slate-900">MR. O. ADENIRAN</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Academic Registrar & Records</p>
                </div>

                <div>
                  <div className="border-b-2 border-slate-400 h-12 w-56 mx-auto mb-1"></div>
                  <p className="font-black text-slate-900">PRINCIPAL AYANWUNMI</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Principal / Head of Institution (Seal)</p>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-mono pt-4 border-t border-slate-100">
                Official document issued without alterations. Valid only with the authorized seal of RoyalPath College.
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
