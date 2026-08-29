import React, { useState, useEffect } from 'react';
import { Student, Class, DbState } from '../types';
import { CBTItem, CBTQuestion, seedCBTItems } from '../parentPortalData';
import { db } from '../database';
import { Laptop, CalendarCheck, Clock, BookOpen, AlertCircle, FileText, CheckCircle2, Sliders, ChevronRight, UploadCloud, Play, X, Eye, HelpCircle } from 'lucide-react';

interface ParentCbtViewProps {
  selectedChild: Student;
  dbState: DbState;
  onGradeSubmitted: () => void;
}

interface SavedSubmission {
  itemId: string;
  submittedAt: string;
  textContent: string;
  fileName?: string;
  fileSize?: string;
  score?: number;
  totalQuestions?: number;
  answers?: Record<string, number>;
}

export default function ParentCbtView({ selectedChild, dbState, onGradeSubmitted }: ParentCbtViewProps) {
  const [activeCbtTab, setActiveCbtTab] = useState<'quiz' | 'assignment' | 'test' | 'exam'>('quiz');
  
  // Find subclasses of student
  const enrollments = dbState.enrollments.filter(e => e.studentId === selectedChild.id);
  const enrolledClasses = dbState.classes.filter(c => enrollments.some(e => e.classId === c.id));
  
  // Generate unified CBT lists for student classes
  const [allCbts, setAllCbts] = useState<CBTItem[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, SavedSubmission>>({});
  
  // MCQ state
  const [activeTest, setActiveTest] = useState<CBTItem | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 mins
  const [timerIntervalId, setTimerIntervalId] = useState<any>(null);

  // Written submission modal state
  const [activeSubmissionTarget, setActiveSubmissionTarget] = useState<CBTItem | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // View submission modal
  const [activeViewSubmission, setActiveViewSubmission] = useState<{ item: CBTItem; submission: SavedSubmission } | null>(null);

  // 1. Initial Seeding of CBT List & loading local submissions
  useEffect(() => {
    if (selectedChild) {
      const list = seedCBTItems(enrolledClasses);
      
      // Core mapped teacher published tests & quizzes
      const teacherTests = (dbState.tests || []).filter(test => 
        enrolledClasses.some(c => c.id === test.classId)
      );

      const getQuestionsForSubject = (subj: string, testId: string) => {
        const formattedSubj = subj.toLowerCase();
        if (formattedSubj.includes('math') || formattedSubj.includes('quant')) {
          return [
            {
              id: `${testId}-q1`,
              questionText: 'Which of the following describes the roots of a quadratic equation when the discriminant is positive?',
              options: ['Two distinct real roots', 'Two equal real roots', 'No real roots', 'One imaginary root'],
              correctIndex: 0
            },
            {
              id: `${testId}-q2`,
              questionText: 'Solve for x if: 3x - 7 = 14.',
              options: ['x = 5', 'x = 6', 'x = 7', 'x = 8'],
              correctIndex: 2
            },
            {
              id: `${testId}-q3`,
              questionText: 'What is the sum of angles in a triangle?',
              options: ['90 degrees', '180 degrees', '270 degrees', '360 degrees'],
              correctIndex: 1
            }
          ];
        }
        return [
          {
            id: `${testId}-q1`,
            questionText: 'What is the primary objective of this study topic?',
            options: ['To analyze basic concepts and definitions', 'To memorize formulas without context', 'To skip evaluation guidelines', 'To isolate research fields'],
            correctIndex: 0
          },
          {
            id: `${testId}-q2`,
            questionText: 'Which tool or approach is most recommended for continuous assessments?',
            options: ['Peer review and consistent study', 'Last-minute cramming', 'Leaving blanks', 'Unprepared evaluations'],
            correctIndex: 0
          }
        ];
      };

      const mappedTeacherTests: CBTItem[] = teacherTests.map(t => {
        const isMcq = t.category === 'Objective';
        return {
          id: t.id,
          classId: t.classId,
          subjectName: t.subject || 'Mathematics',
          type: isMcq ? 'quiz' : 'test',
          title: t.title,
          dueDate: t.date || 'Immediate',
          estimatedTime: isMcq ? '15 mins' : '45 mins',
          instructions: t.instructions,
          maxScore: t.maxScore || 20,
          questions: isMcq ? getQuestionsForSubject(t.subject || 'Mathematics', t.id) : undefined
        };
      });

      list.push(...mappedTeacherTests);
      setAllCbts(list);
      
      const saved = localStorage.getItem(`parent_cbt_submissions_${selectedChild.id}`);
      if (saved) {
        setSubmissions(JSON.parse(saved));
      } else {
        setSubmissions({});
      }
      
      // Clean test states
      setActiveTest(null);
      setActiveSubmissionTarget(null);
      setActiveViewSubmission(null);
    }
  }, [selectedChild, dbState]);

  // 2. Timer effect for MCQ
  useEffect(() => {
    if (activeTest) {
      const id = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(id);
            // Auto submit
            handleMcqSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerIntervalId(id);
      return () => clearInterval(id);
    } else {
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
    }
  }, [activeTest]);

  // Submit helper for MCQ
  const handleMcqSubmit = (isTimeOut = false) => {
    if (!activeTest) return;
    if (timerIntervalId) clearInterval(timerIntervalId);

    const questions = activeTest.questions || [];
    let correctCount = 0;

    questions.forEach((q, idx) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const scorePercent = Math.round((correctCount / questions.length) * 100);
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Instantly persist grading record in SQLite/localStorage mock database!
    db.addGrade({
      studentId: selectedChild.id,
      classId: activeTest.classId,
      assignmentName: activeTest.title,
      score: scorePercent,
      category: activeTest.type === 'test' ? 'mid_term' : 'ca',
      date: new Date().toISOString().split('T')[0],
      feedback: `CBT Electronic assessment score: ${correctCount}/${questions.length} (${scorePercent}%).`
    });

    // Save submission status in portal local storage records
    const newSubmission: SavedSubmission = {
      itemId: activeTest.id,
      submittedAt: dateStr,
      textContent: `Online CBT assessment answers locked. Correct results size: ${correctCount}/${questions.length}`,
      score: scorePercent,
      totalQuestions: questions.length,
      answers: selectedAnswers
    };

    const updatedSubmissions = {
      ...submissions,
      [activeTest.id]: newSubmission
    };

    setSubmissions(updatedSubmissions);
    localStorage.setItem(`parent_cbt_submissions_${selectedChild.id}`, JSON.stringify(updatedSubmissions));

    // Notify main database wrapper and force reload GPA indices
    onGradeSubmitted();

    // Show completed summary sheet
    alert(`CBT Completed! Score: ${scorePercent}% (${correctCount}/${questions.length} Correct). Your grade is now integrated in your academic records.`);
    
    setActiveTest(null);
  };

  // Submit helper for written Assignment
  const handleWrittenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionTarget) return;

    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    
    // Fallback if no file uploaded
    const chosenName = uploadedFile ? uploadedFile.name : 'written_essay.docx';
    const chosenSize = uploadedFile ? uploadedFile.size : '45 KB';

    const newSubmission: SavedSubmission = {
      itemId: activeSubmissionTarget.id,
      submittedAt: dateStr,
      textContent: submissionText || 'No typed description supplied.',
      fileName: chosenName,
      fileSize: chosenSize
    };

    const updatedSubmissions = {
      ...submissions,
      [activeSubmissionTarget.id]: newSubmission
    };

    setSubmissions(updatedSubmissions);
    localStorage.setItem(`parent_cbt_submissions_${selectedChild.id}`, JSON.stringify(updatedSubmissions));

    // Seed a visual attendance / grading placeholder for the teacher review
    db.addGrade({
      studentId: selectedChild.id,
      classId: activeSubmissionTarget.classId,
      assignmentName: activeSubmissionTarget.title,
      score: 85, // Default graded average pending review
      category: 'ca',
      date: new Date().toISOString().split('T')[0],
      feedback: 'Secure Assignment Document uploaded via Parent Portal. Score graded as default submission placeholder.'
    });

    onGradeSubmitted();

    alert('Assignment securely uploaded! Your classroom form advisor will write physical remarks following verification.');

    // Clear submission form states
    setSubmissionText('');
    setUploadedFile(null);
    setActiveSubmissionTarget(null);
  };

  // Drag-and-drop helpers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeKB = Math.round(file.size / 1024);
      setUploadedFile({
        name: file.name,
        size: `${sizeKB} KB`
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeKB = Math.round(file.size / 1024);
      setUploadedFile({
        name: file.name,
        size: `${sizeKB} KB`
      });
    }
  };

  // Filter CBTs by active type tab
  const filteredCbts = allCbts.filter(c => c.type === activeCbtTab);

  return (
    <div className="space-y-6" id="parent-cbt-root">
      
      {/* Informational banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4.5 rounded-2xl border border-indigo-100 flex items-center gap-3.5 no-print">
        <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
          <Laptop className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">CBT Standardized Testing Vault</h4>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Take live multiple-choice quizzes/midterm tests, and upload assignments or view schedules. Real-time MCQ results instantly sync with grade records.
          </p>
        </div>
      </div>

      {/* CBT navigation type tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl justify-start gap-1 no-print">
        {(['quiz', 'assignment', 'test', 'exam'] as const).map(tab => {
          const isActive = activeCbtTab === tab;
          const count = allCbts.filter(c => c.type === tab).length;
          return (
            <button
              key={tab}
              id={`tab-cbt-${tab}`}
              onClick={() => {
                setActiveCbtTab(tab);
                setActiveTest(null);
                setActiveSubmissionTarget(null);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              <span>{tab}s</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-650'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Main active view container: split between Test-taker and Core Lists card */}
      {activeTest ? (
        /* MCQ TESTING AREA VIEW */
        <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6 animate-fadeIn" id="cbt-active-test-taker">
          
          {/* Header metadata row */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-[#fbbf24] font-black">ACTIVE ONLINE ASSESSMENT</span>
              <h3 className="text-lg font-black mt-1 leading-tight">{activeTest.title}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Subject: {activeTest.subjectName}</p>
            </div>

            {/* Countdown circular box */}
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 font-mono">
              <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="text-xs font-bold">
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Diagnostic warnings */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 flex items-start gap-2.5 text-[10px] text-slate-400 leading-normal">
            <AlertCircle className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
            <span>Do not leave this page or toggle browsers during active evaluation. Scores are automatically logged in terminal reports upon submitting or when time expires.</span>
          </div>

          {/* Question Slide Card */}
          {activeTest.questions && activeTest.questions.length > 0 && (
            <div className="space-y-4" id={`q-slide-${currentQIndex}`}>
              <div className="flex items-center justify-between text-xs font-bold text-slate-450">
                <span>QUESTION {currentQIndex + 1} OF {activeTest.questions.length}</span>
                <span className="text-indigo-400">{Math.round(((currentQIndex + 1) / activeTest.questions.length) * 100)}% Complete</span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / activeTest.questions.length) * 100}%` }}
                />
              </div>

              {/* Question Text wrapper */}
              <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800">
                <p className="text-sm font-bold leading-relaxed">{activeTest.questions[currentQIndex].questionText}</p>
              </div>

              {/* Choices radio lists */}
              <div className="grid grid-cols-1 gap-2.5">
                {activeTest.questions[currentQIndex].options.map((option, oIdx) => {
                  const qId = activeTest.questions![currentQIndex].id;
                  const isChecked = selectedAnswers[qId] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      id={`opt-btn-${currentQIndex}-${oIdx}`}
                      onClick={() => setSelectedAnswers({ ...selectedAnswers, [qId]: oIdx })}
                      className={`w-full text-left p-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isChecked 
                          ? 'bg-indigo-650 border-indigo-500 text-white shadow-md' 
                          : 'bg-slate-950/30 border-slate-800 text-slate-355 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-black uppercase text-center ${
                          isChecked ? 'bg-white text-indigo-750' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{option}</span>
                      </div>
                      
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isChecked ? 'bg-white border-transparent' : 'border-slate-700'}`}>
                        {isChecked && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Nav controls rows */}
              <div className="flex items-center justify-between pt-4">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-xs font-bold text-slate-351 disabled:opacity-50 cursor-pointer hover:bg-slate-800"
                >
                  Back
                </button>

                {currentQIndex < activeTest.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                  >
                    Next Question <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleMcqSubmit(false)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer transition-all"
                  >
                    Submit Assessment Test
                  </button>
                )}
              </div>

            </div>
          )}

        </div>
      ) : activeSubmissionTarget ? (
        /* ASSIGNMENT TYPE HANDLER SUBMISSION WRAPPER */
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4 animate-fadeIn" id="cbt-active-submission-pane">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 bg-slate-50 border rounded-md">ASSIGNMENT REGISTRATION</span>
              <h3 className="text-base font-black text-slate-800 mt-1">{activeSubmissionTarget.title}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Subject: {activeSubmissionTarget.subjectName} • Due Date: {activeSubmissionTarget.dueDate}</p>
            </div>
            
            <button 
              onClick={() => setActiveSubmissionTarget(null)}
              className="p-1.5 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleWrittenSubmit} className="space-y-4">
            {/* Instructions box */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <strong>Instructions:</strong> {activeSubmissionTarget.instructions}
            </div>

            {/* Main content textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Written Solutions / Comments:</label>
              <textarea
                value={submissionText}
                id="cbt-sub-textbox"
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Examine and type your step-by-step workbook solutions or summaries here..."
                required
                rows={6}
                className="w-full border border-slate-200 outline-none p-3.5 rounded-xl font-mono text-xs focus:ring-1 focus:ring-indigo-500 bg-slate-50/20"
              />
            </div>

            {/* Custom drag drag container */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Attach Document Worksheet (Optional):</label>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center select-none cursor-pointer transition-all ${
                  dragActive ? 'bg-indigo-50/50 border-indigo-400' : 'bg-slate-50/30 border-slate-220 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-picker')?.click()}
              >
                <input 
                  type="file" 
                  id="file-picker" 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                
                <UploadCloud className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-slate-600">Drag & Drop file worksheets here, or <span className="text-indigo-600 underline">browse</span></p>
                <p className="text-[9px] text-slate-400 mt-1">Conforms to PDF, DOCX, PNG, or JPG formats up to 10MB</p>
              </div>

              {/* Show attached file profile status */}
              {uploadedFile && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl mt-2 font-bold text-xs animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>{uploadedFile.name} ({uploadedFile.size})</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-50">
              <button
                type="button"
                onClick={() => setActiveSubmissionTarget(null)}
                className="px-4 py-2 border border-slate-250 font-bold text-slate-500 rounded-xl text-xs cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-confirm-cbt-submission"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                Confirm Submission File
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* TRADITIONAL CORE SEED LISTING PANE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="cbt-items-list-grid">
          {filteredCbts.length === 0 ? (
            <div className="col-span-full bg-white p-8 border border-slate-100 border-dashed rounded-2xl text-center text-slate-400 text-xs">
              No CBT tests or evaluations listed under the selected "{activeCbtTab}s" criteria directory.
            </div>
          ) : (
            filteredCbts.map(item => {
              const submission = submissions[item.id];
              const isSubmitted = !!submission;
              return (
                <div 
                  key={item.id} 
                  id={`cbt-card-${item.id}`}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between hover:shadow-xs transition-all"
                >
                  <div className="space-y-2.5">
                    
                    {/* Status badge and metadata info */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                        {item.subjectName}
                      </span>
                      
                      {isSubmitted ? (
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          submission.score !== undefined ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {submission.score !== undefined ? `Graded: ${submission.score}%` : 'Submitted'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 animate-pulse">
                          Pending Submission
                        </span>
                      )}
                    </div>

                    {/* Standard title */}
                    <h4 className="text-xs font-black text-slate-900 tracking-tight leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 font-bold leading-normal truncate">{item.instructions}</p>
                    
                  </div>

                  {/* Meta items clock / score */}
                  <div className="pt-4 border-t border-slate-50 mt-4.5 flex items-center justify-between text-[11px] font-bold text-slate-450 leading-none">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.estimatedTime}</span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[10px]">
                      <span>Due:</span>
                      <span className="text-slate-600">{item.dueDate}</span>
                    </div>
                  </div>

                  {/* Actions trigger */}
                  <div className="pt-3 mt-3">
                    {isSubmitted ? (
                      /* Submitted card View details button */
                      <button
                        onClick={() => setActiveViewSubmission({ item, submission })}
                        id={`btn-view-submission-${item.id}`}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-150 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-slate-200/40"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Submission details</span>
                      </button>
                    ) : item.type === 'quiz' || item.type === 'test' ? (
                      /* Online Interactive MCQ CBT Launch */
                      <button
                        onClick={() => {
                          setActiveTest(item);
                          setCurrentQIndex(0);
                          setSelectedAnswers({});
                          setTimerSeconds(300);
                        }}
                        id={`btn-start-cbt-${item.id}`}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Take interactive MCQ {item.type}</span>
                      </button>
                    ) : item.type === 'assignment' ? (
                      /* Written Solutions Attach File Upload trigger */
                      <button
                        onClick={() => {
                          setActiveSubmissionTarget(item);
                          setSubmissionText('');
                          setUploadedFile(null);
                        }}
                        id={`btn-attach-homework-${item.id}`}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-955 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload worksheet replies</span>
                      </button>
                    ) : (
                      /* Exam status info */
                      <div className="w-full text-center py-2 bg-slate-50 text-slate-400 font-mono text-[9px] uppercase border rounded-xl border-slate-100">
                        Exam Locked • Runs in Hall Conditions
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW SUBMISSION MODAL */}
      {activeViewSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn" id="submission-details-lightbox-overlay">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-2xl space-y-4 font-sans relative">
            
            <button
              onClick={() => setActiveViewSubmission(null)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[8px] tracking-widest font-black uppercase text-indigo-500 block">SUBMISSION HISTORIC TRANSCRIPT</span>
              <h3 className="text-base font-black text-slate-900 leading-snug mt-1">{activeViewSubmission.item.title}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Date Delivered: {activeViewSubmission.submission.submittedAt}</p>
            </div>

            <div className="border border-slate-150 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
              
              {activeViewSubmission.submission.score !== undefined ? (
                /* Scoring indicators layout */
                <div className="flex items-center justify-between border-b pb-3 mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Automated MCQ Score:</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-black rounded-full font-mono text-xs">
                    {activeViewSubmission.submission.score}% Correct
                  </span>
                </div>
              ) : null}

              {/* Text submission description */}
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Delivered text response:</span>
                <p className="text-slate-700 italic font-medium leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                  "{activeViewSubmission.submission.textContent}"
                </p>
              </div>

              {/* Attachments status */}
              {activeViewSubmission.submission.fileName && (
                <div className="border-t pt-3 mt-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Attached asset workbook:</span>
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] font-bold text-slate-650">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>{activeViewSubmission.submission.fileName}</span>
                    <span className="text-slate-400 font-mono text-[9px]">({activeViewSubmission.submission.fileSize})</span>
                  </div>
                </div>
              )}

            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveViewSubmission(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Dismiss transcript
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
