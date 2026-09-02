import React, { useState, useRef } from 'react';
import { 
  Upload, X, CheckCircle2, AlertCircle, FileSpreadsheet, 
  Download, Award, ArrowRight, Check, AlertTriangle, RefreshCw, Loader2, BookOpen
} from 'lucide-react';
import { Student, Class, Grade, GradeCategory, DbState, AVAILABLE_ACADEMIC_SESSIONS } from '../types';
import { db } from '../database';

interface ImportResultsCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  dbState: DbState;
  defaultClassId?: string;
  defaultSubject?: string;
  defaultTerm?: string;
  defaultSession?: string;
  themeColor?: string;
}

interface ParsedResultItem {
  rowNumber: number;
  studentId: string;
  studentName: string;
  studentRoll: string;
  classId: string;
  className: string;
  subjectName: string;
  term: string;
  session: string;
  ca1: number | null;
  midTerm: number | null;
  notebook: number | null;
  exam: number | null;
  totalComputed: number;
  feedback?: string;
  isValid: boolean;
  validationError?: string;
}

export function ImportResultsCSVModal({
  isOpen,
  onClose,
  onSuccess,
  dbState,
  defaultClassId,
  defaultSubject = 'Mathematics',
  defaultTerm = '1st Term',
  defaultSession = '2025/2026',
  themeColor = 'indigo'
}: ImportResultsCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedResultItem[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fallback defaults if not provided in CSV
  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || dbState.classes[0]?.id || ''
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(defaultSubject);
  const [selectedTerm, setSelectedTerm] = useState<string>(defaultTerm);
  const [selectedSession, setSelectedSession] = useState<string>(defaultSession);

  if (!isOpen) return null;

  const currentClass = dbState.classes.find(c => c.id === selectedClassId) || dbState.classes[0];

  // Helper to parse line accounting for quotes
  const parseLine = (line: string, delim: string) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delim && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSVContent = (content: string) => {
    try {
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setErrorMsg('The CSV file is empty or missing data rows.');
        return;
      }

      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semiCount = (firstLine.match(/;/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      let delimiter = ',';
      if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
      else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

      const rawHeaders = parseLine(lines[0], delimiter).map(h => 
        h.replace(/^["']|["']$/g, '').trim().toLowerCase().replace(/[\s_-]+/g, '')
      );

      // Detect column indices
      const studentIndex = rawHeaders.findIndex(h => 
        h.includes('roll') || h.includes('reg') || h.includes('studentid') || h.includes('admission') || h.includes('student') || h.includes('name')
      );
      const caIndex = rawHeaders.findIndex(h => h === 'ca' || h === 'ca1' || h === 'continuousassessment' || h.includes('ca1') || h === 'test1');
      const midIndex = rawHeaders.findIndex(h => h.includes('mid') || h.includes('midterm') || h.includes('project') || h === 'ca2');
      const notebookIndex = rawHeaders.findIndex(h => h.includes('notebook') || h.includes('assignment') || h.includes('quiz') || h === 'note');
      const examIndex = rawHeaders.findIndex(h => h.includes('exam') || h.includes('examination') || h.includes('final'));
      const subjectIndex = rawHeaders.findIndex(h => h.includes('subject') || h.includes('course'));
      const classIndex = rawHeaders.findIndex(h => h.includes('class') || h.includes('grade'));
      const termIndex = rawHeaders.findIndex(h => h.includes('term') || h.includes('semester'));
      const sessionIndex = rawHeaders.findIndex(h => h.includes('session') || h.includes('academicyear') || h.includes('year'));
      const scoreIndex = rawHeaders.findIndex(h => h === 'score' || h === 'mark' || h === 'grade' || h === 'total');
      const categoryIndex = rawHeaders.findIndex(h => h.includes('category') || h.includes('type'));

      if (studentIndex === -1 && examIndex === -1 && scoreIndex === -1) {
        setErrorMsg('Could not detect student identifier or score columns in CSV header. Check column names.');
        return;
      }

      const results: ParsedResultItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i], delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
        if (values.every(v => !v)) continue;

        const rawStudentKey = studentIndex !== -1 ? values[studentIndex] : '';
        const rawSubject = subjectIndex !== -1 && values[subjectIndex] ? values[subjectIndex] : selectedSubject;
        const rawClass = classIndex !== -1 && values[classIndex] ? values[classIndex] : (currentClass?.name || 'JSS 1');
        const rawTerm = termIndex !== -1 && values[termIndex] ? values[termIndex] : selectedTerm;
        const rawSession = sessionIndex !== -1 && values[sessionIndex] ? values[sessionIndex] : selectedSession;

        // Match Class
        const targetClass = dbState.classes.find(c => 
          c.name.toLowerCase() === rawClass.toLowerCase() ||
          c.code.toLowerCase() === rawClass.toLowerCase() ||
          c.id === rawClass
        ) || currentClass;

        // Match Student (by roll number, id, or full name)
        const targetStudent = dbState.students.find(s => 
          s.rollNumber.toLowerCase() === rawStudentKey.toLowerCase() ||
          s.id.toLowerCase() === rawStudentKey.toLowerCase() ||
          s.fullName.toLowerCase() === rawStudentKey.toLowerCase() ||
          s.fullName.toLowerCase().includes(rawStudentKey.toLowerCase())
        );

        let caVal: number | null = null;
        let midVal: number | null = null;
        let noteVal: number | null = null;
        let examVal: number | null = null;

        // Multi-column ledger check
        if (caIndex !== -1 && values[caIndex] !== undefined && values[caIndex] !== '') {
          const parsed = parseFloat(values[caIndex]);
          if (!isNaN(parsed)) caVal = parsed;
        }
        if (midIndex !== -1 && values[midIndex] !== undefined && values[midIndex] !== '') {
          const parsed = parseFloat(values[midIndex]);
          if (!isNaN(parsed)) midVal = parsed;
        }
        if (notebookIndex !== -1 && values[notebookIndex] !== undefined && values[notebookIndex] !== '') {
          const parsed = parseFloat(values[notebookIndex]);
          if (!isNaN(parsed)) noteVal = parsed;
        }
        if (examIndex !== -1 && values[examIndex] !== undefined && values[examIndex] !== '') {
          const parsed = parseFloat(values[examIndex]);
          if (!isNaN(parsed)) examVal = parsed;
        }

        // Single score column check
        if (scoreIndex !== -1 && values[scoreIndex] !== undefined && values[scoreIndex] !== '') {
          const singleScore = parseFloat(values[scoreIndex]);
          if (!isNaN(singleScore)) {
            const cat = categoryIndex !== -1 ? values[categoryIndex].toLowerCase() : 'exam';
            if (cat.includes('ca1') || cat === 'ca') caVal = singleScore;
            else if (cat.includes('mid')) midVal = singleScore;
            else if (cat.includes('note') || cat.includes('quiz')) noteVal = singleScore;
            else examVal = singleScore;
          }
        }

        let isValid = true;
        let validationError = '';

        if (!targetStudent) {
          isValid = false;
          validationError = `Student "${rawStudentKey}" not found in database directory`;
        } else if (caVal === null && midVal === null && noteVal === null && examVal === null) {
          isValid = false;
          validationError = 'No numerical scores provided for this row';
        } else {
          // Check bounds
          if (caVal !== null && (caVal < 0 || caVal > 20)) {
            isValid = false;
            validationError = `CA score (${caVal}) out of bounds (0-20)`;
          } else if (midVal !== null && (midVal < 0 || midVal > 20)) {
            isValid = false;
            validationError = `Mid-term score (${midVal}) out of bounds (0-20)`;
          } else if (noteVal !== null && (noteVal < 0 || noteVal > 20)) {
            isValid = false;
            validationError = `Notebook score (${noteVal}) out of bounds (0-20)`;
          } else if (examVal !== null && (examVal < 0 || examVal > 60)) {
            isValid = false;
            validationError = `Exam score (${examVal}) out of bounds (0-60)`;
          }
        }

        const totalComputed = (caVal || 0) + (midVal || 0) + (noteVal || 0) + (examVal || 0);

        results.push({
          rowNumber: i,
          studentId: targetStudent ? targetStudent.id : '',
          studentName: targetStudent ? targetStudent.fullName : (rawStudentKey || `Row ${i}`),
          studentRoll: targetStudent ? targetStudent.rollNumber : 'N/A',
          classId: targetClass ? targetClass.id : selectedClassId,
          className: targetClass ? targetClass.name : rawClass,
          subjectName: rawSubject,
          term: rawTerm,
          session: rawSession,
          ca1: caVal,
          midTerm: midVal,
          notebook: noteVal,
          exam: examVal,
          totalComputed,
          isValid,
          validationError,
        });
      }

      if (results.length === 0) {
        setErrorMsg('No valid result rows found in the CSV file.');
        return;
      }

      setParsedRows(results);
      setErrorMsg(null);
      setStep('preview');
    } catch (err: any) {
      console.error('Error parsing Results CSV:', err);
      setErrorMsg(`Failed to parse CSV spreadsheet: ${err.message || 'Unknown format'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSVContent(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.type.includes('csv') || droppedFile.type.includes('text')) {
        setFile(droppedFile);
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          parseCSVContent(text);
        };
        reader.readAsText(droppedFile);
      } else {
        setErrorMsg('Please upload a valid .csv spreadsheet file.');
      }
    }
  };

  const handleDownloadSampleCSV = () => {
    const activeClass = currentClass?.name || 'JSS 1 A';
    const sampleHeaders = ['Roll Number', 'Student Name', 'Class', 'Subject', 'Term', 'Academic Session', 'CA 1 (10)', 'Mid Term (20)', 'Notebook (10)', 'Exam (60)'];
    
    // Use first 3 students from current class if available
    const classStudents = dbState.students.filter(s => 
      s.gradeLevel.toLowerCase() === activeClass.toLowerCase() ||
      dbState.enrollments.some(e => e.studentId === s.id && e.classId === currentClass?.id)
    ).slice(0, 4);

    const sampleRows = classStudents.length > 0 
      ? classStudents.map((st, i) => [
          st.rollNumber,
          st.fullName,
          activeClass,
          selectedSubject,
          selectedTerm,
          selectedSession,
          String(8 + (i % 3)),
          String(16 + (i % 4)),
          String(8 + (i % 2)),
          String(48 + (i % 10))
        ])
      : [
          ['RPC-2026-001', 'Penelope Scott', activeClass, selectedSubject, selectedTerm, selectedSession, '9', '18', '9', '52'],
          ['RPC-2026-002', 'Liam Davies', activeClass, selectedSubject, selectedTerm, selectedSession, '8', '15', '8', '46'],
          ['RPC-2026-003', 'Zara Hassan', activeClass, selectedSubject, selectedTerm, selectedSession, '10', '19', '10', '58']
        ];

    const csvContent = [
      sampleHeaders.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sample_results_template_${activeClass.replace(/\s+/g, '_')}_${selectedSubject}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('No valid result entries to import. Please review errors.');
      return;
    }

    setIsProcessing(true);
    try {
      const gradesToAddOrUpdate: Grade[] = [];
      const gradeIdsToDelete: string[] = [];
      const currentDate = new Date().toISOString().split('T')[0];

      validRows.forEach((row) => {
        const student = dbState.students.find(s => s.id === row.studentId);
        if (!student) return;

        // Categories to update
        const updates: { category: GradeCategory; score: number | null; name: string }[] = [
          { category: 'ca1', score: row.ca1, name: 'Continuous Assessment 1' },
          { category: 'mid_term', score: row.midTerm, name: 'Mid-Term Assessment' },
          { category: 'notebook', score: row.notebook, name: 'Notebook & Projects' },
          { category: 'exam', score: row.exam, name: 'Terminal Examination' }
        ];

        updates.forEach(u => {
          if (u.score !== null) {
            // Check for existing grade record for this student, class, subject, term, category, session
            const existingGrade = dbState.grades.find(g => 
              g.studentId === student.id &&
              g.classId === row.classId &&
              (g.subjectName || '').toLowerCase() === row.subjectName.toLowerCase() &&
              (g.term || '1st Term') === row.term &&
              (g.session || '2025/2026') === row.session &&
              g.category === u.category
            );

            if (existingGrade) {
              gradesToAddOrUpdate.push({
                ...existingGrade,
                score: u.score,
                date: currentDate,
              });
            } else {
              gradesToAddOrUpdate.push({
                id: `grd-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
                studentId: student.id,
                classId: row.classId,
                assignmentName: u.name,
                score: u.score,
                category: u.category,
                date: currentDate,
                subjectName: row.subjectName,
                term: row.term,
                session: row.session
              });
            }
          }
        });
      });

      // Save to database
      db.saveBulkGrades(gradesToAddOrUpdate, gradeIdsToDelete);

      onSuccess(validRows.length);
      onClose();
    } catch (err: any) {
      console.error('Error importing result scores:', err);
      setErrorMsg(`Error during score import: ${err.message || 'Database error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Import Student Results & Grades via CSV</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Bulk Grade Ingestion
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload continuous assessments, midterm evaluation marks, and final exam results spreadsheet logs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Validation Alert</p>
                <p className="text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-6">
              {/* Target Context Selectors (Default values for CSV rows that omit them) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Default Registry Target (Applied if not specified inside CSV)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Class</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                    >
                      {dbState.classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="English Language">English Language</option>
                      <option value="Basic Science">Basic Science</option>
                      <option value="Social Studies">Social Studies</option>
                      <option value="Civic Education">Civic Education</option>
                      <option value="Agricultural Science">Agricultural Science</option>
                      <option value="Computer Studies (ICT)">Computer Studies (ICT)</option>
                      <option value="Business Studies">Business Studies</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Economics">Economics</option>
                      <option value="Government">Government</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Term</label>
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="1st Term">1st Term</option>
                      <option value="2nd Term">2nd Term</option>
                      <option value="3rd Term">3rd Term</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Session</label>
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden"
                    >
                      {AVAILABLE_ACADEMIC_SESSIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' 
                    : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Click to select or drag & drop results CSV spreadsheet'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                  Supports flexible spreadsheets with headers: <code className="font-mono text-emerald-600 text-[11px]">Roll Number, CA 1, Mid Term, Notebook, Exam, Subject, Class, Term, Session</code>
                </p>
              </div>

              {/* Sample Template & Help Box */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download Ready-Made Grade Ledger Template</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pre-populated with active students from {currentClass?.name || 'your class'} and subject columns.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample (.csv)</span>
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">File:</span>
                  <span className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {file?.name || 'grades.csv'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{validCount} Ready for Database Ingestion</span>
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{invalidCount} Errors (Skipped)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Student & Roll</th>
                      <th className="py-2.5 px-3">Class & Subject</th>
                      <th className="py-2.5 px-3">Term / Session</th>
                      <th className="py-2.5 px-2 text-center">CA 1</th>
                      <th className="py-2.5 px-2 text-center">Mid</th>
                      <th className="py-2.5 px-2 text-center">Note</th>
                      <th className="py-2.5 px-2 text-center">Exam</th>
                      <th className="py-2.5 px-2 text-center">Total</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr 
                        key={idx}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/30'}
                      >
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{row.rowNumber}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-800">{row.studentName}</p>
                          <p className="text-[10px] font-mono text-slate-400">{row.studentRoll}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-700">{row.className}</p>
                          <p className="text-[10px] text-indigo-600 font-medium">{row.subjectName}</p>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          <span>{row.term}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{row.session}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">{row.ca1 !== null ? row.ca1 : '-'}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{row.midTerm !== null ? row.midTerm : '-'}</td>
                        <td className="py-2.5 px-2 text-center font-mono">{row.notebook !== null ? row.notebook : '-'}</td>
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-indigo-700">{row.exam !== null ? row.exam : '-'}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-900 bg-slate-50 font-mono">
                          {row.totalComputed}%
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              <Check className="w-3 h-3" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span 
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100"
                              title={row.validationError}
                            >
                              <AlertCircle className="w-3 h-3" />
                              <span>{row.validationError || 'Invalid'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Upload another file button */}
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => { setStep('upload'); setParsedRows([]); setFile(null); }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload a different results spreadsheet</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {step === 'preview' && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={validCount === 0 || isProcessing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isProcessing ? 'Ingesting Grades...' : `Save & Ingest ${validCount} Student Grade Records`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
