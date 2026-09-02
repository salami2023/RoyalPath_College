import React, { useState, useRef } from 'react';
import { 
  Upload, X, CheckCircle2, AlertCircle, FileSpreadsheet, 
  Download, Users, ArrowRight, Check, AlertTriangle, RefreshCw, Loader2 
} from 'lucide-react';
import { Student, Class, Parent, DbState } from '../types';
import { db } from '../database';

interface ImportStudentsCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedCount: number) => void;
  dbState: DbState;
  themeColor?: string;
}

interface ParsedStudentRow {
  rowNumber: number;
  fullName: string;
  rollNumber: string;
  gradeLevel: string;
  birthDate: string;
  gender: string;
  parentEmail: string;
  isValid: boolean;
  validationError?: string;
  matchedClassId?: string;
  matchedParentId?: string;
  isDuplicateRoll: boolean;
}

export function ImportStudentsCSVModal({
  isOpen,
  onClose,
  onSuccess,
  dbState,
  themeColor = 'indigo'
}: ImportStudentsCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Function to parse CSV content
  const parseCSVContent = (content: string) => {
    try {
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        setErrorMsg('The CSV file is empty or missing data rows.');
        return;
      }

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

      const firstLine = lines[0];
      const commaCount = (firstLine.match(/,/g) || []).length;
      const semiCount = (firstLine.match(/;/g) || []).length;
      const tabCount = (firstLine.match(/\t/g) || []).length;
      let delimiter = ',';
      if (semiCount > commaCount && semiCount > tabCount) delimiter = ';';
      else if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';

      const headers = parseLine(lines[0], delimiter).map(h => 
        h.replace(/^["']|["']$/g, '').trim().toLowerCase().replace(/[\s_-]+/g, '')
      );

      // Find header indices
      const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('fullname') || h.includes('studentname'));
      const rollIndex = headers.findIndex(h => h.includes('roll') || h.includes('reg') || h.includes('id') || h.includes('studentid') || h.includes('admissionno'));
      const classIndex = headers.findIndex(h => h.includes('class') || h.includes('grade') || h.includes('level') || h.includes('gradelevel'));
      const dobIndex = headers.findIndex(h => h.includes('birth') || h.includes('dob') || h.includes('birthdate') || h.includes('dateofbirth'));
      const genderIndex = headers.findIndex(h => h.includes('gender') || h.includes('sex'));
      const parentEmailIndex = headers.findIndex(h => h.includes('parent') || h.includes('guardian') || h.includes('email') || h.includes('parentemail'));

      if (nameIndex === -1 && rollIndex === -1) {
        setErrorMsg('Could not detect "Full Name" or "Roll Number" columns in the CSV header. Please check column titles.');
        return;
      }

      const existingRollNumbers = new Set(dbState.students.map(s => s.rollNumber.toUpperCase().trim()));
      const seenBatchRolls = new Set<string>();
      const rows: ParsedStudentRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const rawValues = parseLine(lines[i], delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
        if (rawValues.every(v => !v)) continue; // skip blank row

        const fullName = nameIndex !== -1 && rawValues[nameIndex] ? rawValues[nameIndex] : `Student ${i}`;
        let rollNumber = rollIndex !== -1 && rawValues[rollIndex] ? rawValues[rollIndex].toUpperCase() : '';
        if (!rollNumber) {
          rollNumber = `RPC-${new Date().getFullYear()}-${String(1000 + i).slice(1)}`;
        }

        const gradeLevel = classIndex !== -1 && rawValues[classIndex] ? rawValues[classIndex] : (dbState.classes[0]?.name || 'JSS 1');
        const birthDate = dobIndex !== -1 && rawValues[dobIndex] ? rawValues[dobIndex] : '2012-05-15';
        const gender = genderIndex !== -1 && rawValues[genderIndex] ? rawValues[genderIndex] : 'Unspecified';
        const parentEmail = parentEmailIndex !== -1 && rawValues[parentEmailIndex] ? rawValues[parentEmailIndex] : '';

        // Match Class
        const matchedClass = dbState.classes.find(c => 
          c.name.toLowerCase() === gradeLevel.toLowerCase() ||
          c.code.toLowerCase() === gradeLevel.toLowerCase() ||
          c.id.toLowerCase() === gradeLevel.toLowerCase()
        );

        // Match Parent
        const matchedParent = parentEmail ? dbState.parents.find(p => 
          p.email.toLowerCase() === parentEmail.toLowerCase() ||
          p.fullName.toLowerCase() === parentEmail.toLowerCase()
        ) : undefined;

        const isDuplicateInDb = existingRollNumbers.has(rollNumber.trim().toUpperCase());
        const isDuplicateInBatch = seenBatchRolls.has(rollNumber.trim().toUpperCase());
        seenBatchRolls.add(rollNumber.trim().toUpperCase());

        let isValid = true;
        let validationError = '';

        if (!fullName || fullName.length < 2) {
          isValid = false;
          validationError = 'Missing student full name';
        } else if (isDuplicateInDb) {
          isValid = false;
          validationError = `Roll ID "${rollNumber}" already exists in directory`;
        } else if (isDuplicateInBatch) {
          isValid = false;
          validationError = `Duplicate Roll ID "${rollNumber}" inside CSV file`;
        }

        rows.push({
          rowNumber: i,
          fullName,
          rollNumber,
          gradeLevel: matchedClass ? matchedClass.name : gradeLevel,
          birthDate,
          gender,
          parentEmail,
          isValid,
          validationError,
          matchedClassId: matchedClass?.id,
          matchedParentId: matchedParent?.id,
          isDuplicateRoll: isDuplicateInDb || isDuplicateInBatch,
        });
      }

      if (rows.length === 0) {
        setErrorMsg('No valid data rows found in the uploaded CSV file.');
        return;
      }

      setParsedRows(rows);
      setErrorMsg(null);
      setStep('preview');
    } catch (err: any) {
      console.error('CSV Parsing Error:', err);
      setErrorMsg(`Failed to parse CSV file: ${err.message || 'Unknown format error'}`);
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
    const sampleHeaders = ['Full Name', 'Roll Number', 'Class', 'Birth Date', 'Gender', 'Parent Guardian Email'];
    const sampleRows = [
      ['Chukwudi Obi', 'RPC-2026-041', 'JSS 1 A', '2013-04-12', 'Male', 'guardian.obi@example.com'],
      ['Fatima Abubakar', 'RPC-2026-042', 'JSS 1 A', '2013-08-22', 'Female', 'abubakar.parent@example.com'],
      ['Blessing Adeleke', 'RPC-2026-043', 'JSS 2 B', '2012-11-05', 'Female', 'adeleke.family@example.com'],
      ['Emmanuel Okafor', 'RPC-2026-044', 'SSS 1 Gold', '2010-02-18', 'Male', '']
    ];

    const csvContent = [
      sampleHeaders.join(','),
      ...sampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_student_admissions_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('No valid rows available to import. Please review validation errors.');
      return;
    }

    setIsProcessing(true);
    try {
      const newStudentsData = validRows.map(row => ({
        fullName: row.fullName,
        gradeLevel: row.gradeLevel,
        rollNumber: row.rollNumber,
        birthDate: row.birthDate,
        parentId: row.matchedParentId
      }));

      const imported = db.createStudentsBulk(newStudentsData);

      onSuccess(imported.length);
      onClose();
    } catch (err: any) {
      console.error('Import execution error:', err);
      setErrorMsg(`Error during student import: ${err.message || 'Database error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Import Students via CSV</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Bulk Admissions
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Batch register new student profiles, unique roll numbers, and classroom enrollments.
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Validation Issue</p>
                <p className="text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-6">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                    : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 shadow-inner">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {file ? file.name : 'Click to browse or drag & drop student CSV'}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Supports standard CSV files with headers: <code className="font-mono text-indigo-600 text-[11px]">Full Name, Roll Number, Class, Birth Date, Gender, Parent Guardian Email</code>
                </p>
              </div>

              {/* Sample Template & Help Guidelines */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Need a structured format template?</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Download our sample admissions CSV pre-filled with demo column headers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template (.csv)</span>
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Parsed File:</span>
                  <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {file?.name || 'students.csv'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{validCount} Ready to Import</span>
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
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Roll ID</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Birth Date</th>
                      <th className="py-2.5 px-3">Parent Link</th>
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
                        <td className="py-2.5 px-3 font-bold text-slate-800">{row.fullName}</td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{row.rollNumber}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {row.gradeLevel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">{row.birthDate}</td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {row.matchedParentId ? (
                            <span className="text-emerald-700 font-medium">✓ Guardian Linked</span>
                          ) : row.parentEmail ? (
                            <span className="text-slate-400 italic">No existing parent match</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
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
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload a different file</span>
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
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>
                {isProcessing ? 'Admitting Students...' : `Confirm & Admit ${validCount} Student${validCount === 1 ? '' : 's'}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
