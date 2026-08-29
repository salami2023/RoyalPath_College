import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Printer, FileSpreadsheet, Layers, BookOpen, User, Award, CheckCircle2, ChevronDown } from 'lucide-react';
import { Class, Student, DbState, Grade, getStoredLetterGrade, getStoredLetterColor } from '../types';
import { SchoolLogo, ROYALPATH_LOGO_DATA_URL } from '../assets/logo';
import royalPathLogo from '../assets/images/royalpath_logo.svg';

interface BroadsheetModalProps {
  selectedClass: Class;
  selectedTerm: '1st Term' | '2nd Term' | '3rd Term';
  dbState: DbState;
  activeSubject?: string;
  onClose: () => void;
}

export const BroadsheetModal: React.FC<BroadsheetModalProps> = ({
  selectedClass,
  selectedTerm,
  dbState,
  activeSubject,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'all_subjects' | 'single_subject'>('all_subjects');
  const [currentSubject, setCurrentSubject] = useState<string>(activeSubject || 'Mathematics');

  const schoolName = localStorage.getItem('settings_school_name') || 'RoyalPath College';
  const schoolLogo = localStorage.getItem('settings_school_logo') || ROYALPATH_LOGO_DATA_URL;
  const schoolMotto = localStorage.getItem('settings_school_motto') || 'Excellence & Moral Discipline';
  const schoolAddress = localStorage.getItem('settings_school_address') || 'Km 12, Education Boulevard, Lagos, Nigeria';
  const academicSession = localStorage.getItem('current_academic_session') || '2025/2026 Academic Session';

  // Retrieve subjects for this class
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
        "Mathematics", "English language", "Basic Science and Technology", "Religious and National Value",
        "Business Studies", "Prevocational Studies", "History", "French", "Digital Technologies", "Music"
      ];
    } else if (level === 'Senior Secondary') {
      const saved = localStorage.getItem('settings_sss_subjects');
      return saved ? JSON.parse(saved) : [
        "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Civic Education", "Geography", "Economics"
      ];
    } else if (level === 'Primary') {
      return ["Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education", "Computer Studies"];
    } else {
      return ["Numeracy", "Literacy", "Sensory Activity", "Creative Art", "Social Habit"];
    }
  };

  const classSubjects = getSubjectsForClass(selectedClass);
  const studentsInClass = dbState.students.filter(st => {
    // Check enrollment
    const isEnrolled = dbState.enrollments.some(e => e.studentId === st.id && e.classId === selectedClass.id);
    if (isEnrolled) return true;
    // Fallback: match by gradeLevel/name if enrollment is not populated
    return st.gradeLevel === selectedClass.name || st.gradeLevel === selectedClass.code;
  });

  // Calculate subject grade breakdown for a student
  const getStudentSubjectBreakdown = (studentId: string, subjectName: string) => {
    const studentGrades = dbState.grades.filter(g => {
      if (g.studentId !== studentId || g.classId !== selectedClass.id) return false;
      const isRightSubject = g.subjectName === subjectName || 
        g.assignmentName.toLowerCase().includes(subjectName.toLowerCase());
      if (!isRightSubject) return false;

      const hasTerm1 = g.assignmentName.includes('1st Term');
      const hasTerm2 = g.assignmentName.includes('2nd Term');
      const hasTerm3 = g.assignmentName.includes('3rd Term');

      if (selectedTerm === '1st Term') return hasTerm1;
      if (selectedTerm === '2nd Term') return hasTerm2;
      return hasTerm3 || (!hasTerm1 && !hasTerm2);
    });

    const examObj = studentGrades.find(g => g.category === 'exam');
    const ca1Obj = studentGrades.find(g => g.category === 'ca1');
    const ca2Obj = studentGrades.find(g => g.category === 'ca2' || g.category === 'notebook');
    const caObj = studentGrades.find(g => g.category === 'ca');
    const midObj = studentGrades.find(g => g.category === 'mid_term');

    let ca1 = ca1Obj ? Math.min(10, Number(ca1Obj.score) || 0) : (caObj ? Math.min(10, Math.ceil((Number(caObj.score) || 0) / 2)) : 0);
    let ca2 = ca2Obj ? Math.min(10, Number(ca2Obj.score) || 0) : (caObj ? Math.min(10, Math.floor((Number(caObj.score) || 0) / 2)) : 0);
    let mid = midObj ? Math.min(20, Number(midObj.score) || 0) : 0;
    let exam = examObj ? Math.min(60, Number(examObj.score) || 0) : 0;

    const total = ca1 + ca2 + mid + exam;
    const letter = getStoredLetterGrade(total);

    return { ca1, ca2, mid, exam, total, letter };
  };

  // Compile full broadsheet matrix data
  const studentRecords = studentsInClass.map(student => {
    let grandTotal = 0;
    let subjectsCount = 0;
    const subjectMap: Record<string, { ca1: number; ca2: number; mid: number; exam: number; total: number; letter: string }> = {};

    classSubjects.forEach(sub => {
      const breakdown = getStudentSubjectBreakdown(student.id, sub);
      subjectMap[sub] = breakdown;
      if (breakdown.total > 0) {
        grandTotal += breakdown.total;
        subjectsCount++;
      }
    });

    const subjectsEvaluated = classSubjects.length || 1;
    const average = Math.round((grandTotal / subjectsEvaluated) * 10) / 10;
    const overallGrade = getStoredLetterGrade(average);

    return {
      student,
      subjectMap,
      grandTotal,
      average,
      overallGrade,
      subjectsCount,
      rank: 0,
    };
  });

  // Calculate ranks based on grandTotal descending
  studentRecords.sort((a, b) => b.grandTotal - a.grandTotal);
  studentRecords.forEach((record, index) => {
    record.rank = index + 1;
  });

  // Helper for rank suffix
  const getRankSuffix = (rank: number) => {
    const j = rank % 10;
    const k = rank % 100;
    if (j === 1 && k !== 11) return `${rank}st`;
    if (j === 2 && k !== 12) return `${rank}nd`;
    if (j === 3 && k !== 13) return `${rank}rd`;
    return `${rank}th`;
  };

  // CSV Export: All Subjects Broadsheet
  const handleDownloadAllSubjectsCSV = () => {
    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return s;
    };

    const headers: string[] = ['Rank', 'Roll Number', 'Student Full Name', 'Gender'];
    classSubjects.forEach(sub => {
      headers.push(`${sub} (CA1:10)`);
      headers.push(`${sub} (CA2:10)`);
      headers.push(`${sub} (Mid:20)`);
      headers.push(`${sub} (Exam:60)`);
      headers.push(`${sub} (Total:100)`);
      headers.push(`${sub} (Grade)`);
    });
    headers.push('Grand Total', 'Average %', 'Overall Grade', 'Class Position');

    const rows = studentRecords.map(rec => {
      const row: any[] = [
        rec.rank,
        rec.student.rollNumber,
        rec.student.fullName,
        rec.student.gender || 'N/A'
      ];
      classSubjects.forEach(sub => {
        const bd = rec.subjectMap[sub];
        row.push(bd.ca1, bd.ca2, bd.mid, bd.exam, bd.total, bd.letter);
      });
      row.push(rec.grandTotal, `${rec.average}%`, rec.overallGrade, getRankSuffix(rec.rank));
      return row;
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Master_Broadsheet_${selectedClass.name.replace(/\s+/g, '_')}_${selectedTerm.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export: Single Subject Broadsheet
  const handleDownloadSingleSubjectCSV = () => {
    const escapeCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      const s = String(val).replace(/"/g, '""');
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s}"`;
      }
      return s;
    };

    const headers = ['S/N', 'Roll Number', 'Student Full Name', 'CA1 (10)', 'CA2 (10)', 'Mid-Term (20)', 'Exam (60)', 'Total (100)', 'Letter Grade', 'Remarks'];

    const rows = studentRecords.map((rec, idx) => {
      const bd = rec.subjectMap[currentSubject] || { ca1: 0, ca2: 0, mid: 0, exam: 0, total: 0, letter: 'F' };
      let remark = 'Excellent';
      if (bd.total < 40) remark = 'Fail';
      else if (bd.total < 50) remark = 'Pass';
      else if (bd.total < 60) remark = 'Credit';
      else if (bd.total < 75) remark = 'Good';

      return [
        idx + 1,
        rec.student.rollNumber,
        rec.student.fullName,
        bd.ca1,
        bd.ca2,
        bd.mid,
        bd.exam,
        bd.total,
        bd.letter,
        remark
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `Broadsheet_${selectedClass.name.replace(/\s+/g, '_')}_${currentSubject.replace(/\s+/g, '_')}_${selectedTerm.replace(/\s+/g, '_')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl max-w-7xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Modal Top Control Bar */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none-print">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider">
                Admin Exclusive Authority
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-slate-600">{academicSession}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              <span>Official Academic Broadsheet — {selectedClass.name}</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('all_subjects')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'all_subjects' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Subjects Master Matrix</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('single_subject')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'single_subject' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Single Subject Ledger</span>
              </button>
            </div>

            {viewMode === 'single_subject' && (
              <select
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {classSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            )}

            {/* Action Buttons */}
            <button
              type="button"
              onClick={viewMode === 'all_subjects' ? handleDownloadAllSubjectsCSV : handleDownloadSingleSubjectCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              id="download_broadsheet_csv_btn"
              title="Download full CSV broadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Broadsheet (CSV)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              id="print_broadsheet_btn"
              title="Print formal broadsheet document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              id="close_broadsheet_modal_btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Broadsheet Document Sheet */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100/50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 min-w-[900px] text-slate-900 print:shadow-none print:border-0 print:p-2">
            
            {/* Formal Institutional Header */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  <SchoolLogo src={schoolLogo} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                    {schoolName}
                  </h1>
                  <p className="text-xs font-bold text-slate-600 tracking-wide">{schoolMotto}</p>
                  <p className="text-[11px] text-slate-500">{schoolAddress}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-900 text-white text-xs font-black uppercase px-3 py-1 rounded tracking-wider mb-1">
                  OFFICIAL CLASS BROADSHEET
                </div>
                <div className="text-xs font-bold text-slate-800">{selectedClass.name} • {selectedTerm}</div>
                <div className="text-[11px] font-semibold text-slate-500">{academicSession}</div>
              </div>
            </div>

            {/* Content Mode 1: All Subjects Master Matrix */}
            {viewMode === 'all_subjects' ? (
              <div>
                <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>Class Enrolled Roster: <b className="text-slate-900">{studentsInClass.length} Students</b></span>
                  <span>Total Curriculum Subjects: <b className="text-slate-900">{classSubjects.length} Subjects</b></span>
                  <span>Scoring Standard: <b className="text-slate-900">CA1(10) + CA2(10) + Mid(20) + Exam(60) = 100%</b></span>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-xl">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black uppercase text-[9px] tracking-wider">
                        <th className="py-2.5 px-2 border-r border-slate-700 text-center w-10">Pos</th>
                        <th className="py-2.5 px-3 border-r border-slate-700 min-w-[150px]">Student Name</th>
                        <th className="py-2.5 px-2 border-r border-slate-700 text-center w-16">Roll No</th>
                        {classSubjects.map(sub => (
                          <th key={sub} className="py-2.5 px-2 border-r border-slate-700 text-center min-w-[65px]" title={sub}>
                            {sub.length > 9 ? sub.slice(0, 8) + '…' : sub}
                          </th>
                        ))}
                        <th className="py-2.5 px-2 border-r border-slate-700 text-center bg-indigo-900 w-16">Total</th>
                        <th className="py-2.5 px-2 border-r border-slate-700 text-center bg-indigo-950 w-14">Avg %</th>
                        <th className="py-2.5 px-2 text-center bg-indigo-900 w-14">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentRecords.map((rec) => (
                        <tr key={rec.student.id} className="hover:bg-slate-50 transition-colors even:bg-slate-50/40">
                          <td className="py-2 px-2 text-center font-black text-slate-800 border-r border-slate-200">
                            {getRankSuffix(rec.rank)}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 border-r border-slate-200">
                            {rec.student.fullName}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-500 border-r border-slate-200">
                            {rec.student.rollNumber}
                          </td>
                          {classSubjects.map(sub => {
                            const scoreObj = rec.subjectMap[sub] || { total: 0, letter: 'F' };
                            return (
                              <td key={sub} className="py-2 px-1 text-center font-bold border-r border-slate-200">
                                <span className="text-slate-900">{scoreObj.total}</span>
                                <span className={`ml-1 text-[8px] font-black px-1 py-0.2 rounded ${getStoredLetterColor(scoreObj.letter)}`}>
                                  {scoreObj.letter}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-2 px-2 text-center font-black text-indigo-950 bg-indigo-50/40 border-r border-slate-200">
                            {rec.grandTotal}
                          </td>
                          <td className="py-2 px-2 text-center font-black text-indigo-900 bg-indigo-50/40 border-r border-slate-200">
                            {rec.average}%
                          </td>
                          <td className="py-2 px-2 text-center font-black bg-indigo-50/40">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${getStoredLetterColor(rec.overallGrade)}`}>
                              {rec.overallGrade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Class Performance Metrics Summary */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Class Top Aggregate</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {studentRecords[0]?.grandTotal || 0} pts ({studentRecords[0]?.student.fullName || 'N/A'})
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Class Highest Average</div>
                    <div className="text-base font-black text-emerald-600 mt-0.5">
                      {studentRecords[0]?.average || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Overall Class Mean</div>
                    <div className="text-base font-black text-indigo-600 mt-0.5">
                      {studentRecords.length > 0 ? Math.round((studentRecords.reduce((acc, r) => acc + r.average, 0) / studentRecords.length) * 10) / 10 : 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Class Pass Rate</div>
                    <div className="text-base font-black text-slate-900 mt-0.5">
                      {studentRecords.length > 0 ? Math.round((studentRecords.filter(r => r.average >= 50).length / studentRecords.length) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Content Mode 2: Single Subject Ledger */
              <div>
                <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-700 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                  <span>Subject: <b className="text-indigo-900 text-sm">{currentSubject}</b></span>
                  <span>Class: <b className="text-indigo-900">{selectedClass.name}</b></span>
                  <span>Session & Term: <b className="text-indigo-900">{academicSession} • {selectedTerm}</b></span>
                </div>

                <div className="overflow-x-auto border border-slate-300 rounded-xl">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-3 border-r border-slate-700 text-center w-12">S/N</th>
                        <th className="py-3 px-3 border-r border-slate-700 text-center w-24">Roll No</th>
                        <th className="py-3 px-4 border-r border-slate-700 min-w-[200px]">Student Full Name</th>
                        <th className="py-3 px-3 border-r border-slate-700 text-center w-20">CA 1 (10)</th>
                        <th className="py-3 px-3 border-r border-slate-700 text-center w-20">CA 2 (10)</th>
                        <th className="py-3 px-3 border-r border-slate-700 text-center w-24">Mid-Term (20)</th>
                        <th className="py-3 px-3 border-r border-slate-700 text-center w-24">Exam (60)</th>
                        <th className="py-3 px-3 border-r border-slate-700 text-center bg-indigo-900 w-28">Total (100)</th>
                        <th className="py-3 px-3 border-r border-slate-700 text-center w-20">Grade</th>
                        <th className="py-3 px-4 text-left w-32">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentRecords.map((rec, idx) => {
                        const bd = rec.subjectMap[currentSubject] || { ca1: 0, ca2: 0, mid: 0, exam: 0, total: 0, letter: 'F' };
                        let remark = 'Excellent';
                        if (bd.total < 40) remark = 'Fail';
                        else if (bd.total < 50) remark = 'Pass';
                        else if (bd.total < 60) remark = 'Credit';
                        else if (bd.total < 75) remark = 'Good';

                        return (
                          <tr key={rec.student.id} className="hover:bg-slate-50 even:bg-slate-50/40">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600 border-r border-slate-200">{rec.student.rollNumber}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">{rec.student.fullName}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">{bd.ca1}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">{bd.ca2}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">{bd.mid}</td>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">{bd.exam}</td>
                            <td className="py-2.5 px-3 text-center font-black text-indigo-950 bg-indigo-50/50 border-r border-slate-200 text-sm">{bd.total}</td>
                            <td className="py-2.5 px-3 text-center font-bold border-r border-slate-200">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black ${getStoredLetterColor(bd.letter)}`}>
                                {bd.letter}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-xs font-semibold text-slate-600">{remark}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Official Certification Signature Footer */}
            <div className="mt-12 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-800">
              <div>
                <div className="h-10 flex items-end justify-center font-cursive italic text-slate-600">Form Teacher Sign</div>
                <div className="border-t border-slate-400 pt-1 text-[11px] uppercase tracking-wider text-slate-600">Form Teacher Signature & Date</div>
              </div>
              <div>
                <div className="h-10 flex items-end justify-center font-cursive italic text-indigo-700 font-bold">Exam Officer</div>
                <div className="border-t border-slate-400 pt-1 text-[11px] uppercase tracking-wider text-slate-600">Examination Officer</div>
              </div>
              <div>
                <div className="h-10 flex items-end justify-center font-cursive italic text-indigo-900 font-bold text-sm">Approved by Principal</div>
                <div className="border-t border-slate-400 pt-1 text-[11px] uppercase tracking-wider text-slate-600">Principal's Official Stamp & Seal</div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};
