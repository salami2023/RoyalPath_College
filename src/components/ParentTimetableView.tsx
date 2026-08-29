import React, { useState, useEffect } from 'react';
import { Student, DbState, Class } from '../types';
import { Calendar, Clock, MapPin, AlertCircle, Sparkles, Printer, Clipboard, Bell } from 'lucide-react';

interface ParentTimetableViewProps {
  selectedChild: Student;
  dbState: DbState;
}

interface TermEvent {
  id: string;
  title: string;
  date: string;
  category: 'academic' | 'pta' | 'holiday' | 'exam' | 'sports';
  description: string;
}

export default function ParentTimetableView({ selectedChild, dbState }: ParentTimetableViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'timetable' | 'events'>('timetable');
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);
  const [timetableDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  // Pre-configured list of school terminal events
  const [eventsList] = useState<TermEvent[]>([
    {
      id: 'evt-1',
      title: 'Active Midterm CBT Evaluations',
      date: '2026-06-15',
      category: 'exam',
      description: 'Standard computer-based diagnostics across math, sciences, and literacy sectors.'
    },
    {
      id: 'evt-2',
      title: 'General PTA Meeting & General Assembly',
      date: '2026-06-20',
      category: 'pta',
      description: 'Host discussion on school performance metrics, fee updates, and technology investments.'
    },
    {
      id: 'evt-3',
      title: 'Annual Inter-House Sports Festival',
      date: '2026-07-04',
      category: 'sports',
      description: 'Track and field qualifications, high-jumps, and group relay events. Attendance is mandatory.'
    },
    {
      id: 'evt-4',
      title: 'Noxious Science Exhibition Showcase',
      date: '2026-07-18',
      category: 'academic',
      description: 'Students present creative projects, logic models, and robotic builds to supervisors.'
    },
    {
      id: 'evt-5',
      title: 'Democracy National Public Holiday',
      date: '2026-06-12',
      category: 'holiday',
      description: 'Institution closed. Academic lectures resume on the follow-up work week.'
    }
  ]);

  useEffect(() => {
    if (selectedChild && dbState) {
      const enrollments = dbState.enrollments.filter(e => e.studentId === selectedChild.id);
      const classes = dbState.classes.filter(c => enrollments.some(e => e.classId === c.id));
      setEnrolledClasses(classes);
    }
  }, [selectedChild, dbState]);

  // Color mapping per subject Name to make the timetable beautiful
  const getSubjectColorStyle = (subjName: string) => {
    const l = subjName.toLowerCase();
    if (l.includes('math') || l.includes('calc') || l.includes('algebra')) {
      return 'bg-blue-50/70 border-blue-200 text-blue-800 hover:bg-blue-50';
    } else if (l.includes('science') || l.includes('chem') || l.includes('physics') || l.includes('bio')) {
      return 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-50';
    } else if (l.includes('english') || l.includes('lit') || l.includes('diction')) {
      return 'bg-indigo-50/70 border-indigo-200 text-indigo-800 hover:bg-indigo-50';
    } else if (l.includes('civic') || l.includes('social') || l.includes('history')) {
      return 'bg-amber-50/70 border-amber-200 text-amber-800 hover:bg-amber-50';
    } else if (l.includes('art') || l.includes('creative') || l.includes('music')) {
      return 'bg-rose-50/70 border-rose-200 text-rose-800 hover:bg-rose-50';
    } else {
      return 'bg-purple-50/70 border-purple-200 text-purple-800 hover:bg-purple-50';
    }
  };

  // Parse custom classroom schedules to place correctly in day-of-week slots
  const getSchedulesForDay = (day: string) => {
    // Standard weekly schedules. Match words in Class.schedule like "Mon", "Tue" etc.
    const mapping: Record<string, string> = {
      'Monday': 'mon',
      'Tuesday': 'tue',
      'Wednesday': 'wed',
      'Thursday': 'thu',
      'Friday': 'fri'
    };
    
    const needle = mapping[day];
    return enrolledClasses.filter(cls => {
      const scheduleString = (cls.schedule || '').toLowerCase();
      return scheduleString.includes(needle);
    });
  };

  // Custom print handler for printable view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="timetable-view-container">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-[#4f46e5]" />
            <span>Class Timetable & Events</span>
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Monitor {selectedChild.fullName}'s daily academic schedules, meeting hours, and school events.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:border-slate-350 text-slate-651 hover:text-slate-800 bg-white rounded-xl text-xs font-bold shadow-3xs cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Grid</span>
          </button>
        </div>
      </div>

      {/* Sub tabs Toggle Navigation */}
      <div className="flex border-b border-slate-100 no-print select-none">
        <button
          onClick={() => setActiveSubTab('timetable')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'timetable' 
              ? 'border-indigo-650 text-indigo-950 font-black' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Weekly Timetable Grid
        </button>
        <button
          onClick={() => setActiveSubTab('events')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'events' 
              ? 'border-indigo-650 text-indigo-950 font-black' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
        >
          Calendar events & PTA ({eventsList.length})
        </button>
      </div>

      {/* --- RENDER 1: WEEKLY TIMETABLE GRID --- */}
      {activeSubTab === 'timetable' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/50 p-4 rounded-2xl text-[11px] text-amber-900 font-semibold flex gap-2.5 leading-snug no-print">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Weekly Course Layout Notice:</strong> The timetable layout derives dynamically from academic enrollments configured on the core database registrar. Classroom listings include supervisor, location room, and weekly sequence.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {timetableDays.map(day => {
              const dayClasses = getSchedulesForDay(day);
              return (
                <div key={day} className="bg-slate-50/50 rounded-2xl border border-slate-100/80 p-4 flex flex-col min-h-[360px] " id={`timetable-day-${day.toLowerCase()}`}>
                  <h3 className="text-xs font-black text-indigo-950 border-b border-slate-200 pb-2 mb-3 tracking-wide">{day}</h3>
                  
                  <div className="flex-1 space-y-3">
                    {dayClasses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center h-full text-slate-400 italic text-[11px]">
                        No active lectures scheduled.
                      </div>
                    ) : (
                      dayClasses.map(cls => {
                        const styleClass = getSubjectColorStyle(cls.name);
                        const teacherObj = dbState.teachers.find(t => t.id === cls.teacherId);
                        
                        // Extract time from schedule string if formatted like Mon, Wed 09:00 - 10:15
                        const timePart = cls.schedule.split(' ').slice(-3).join(' ') || '09:00 - 10:30';

                        return (
                          <div
                            key={cls.id}
                            className={`p-3 rounded-xl border transition-all duration-200 shadow-4xs ${styleClass}`}
                          >
                            <h4 className="font-extrabold text-[12px] truncate leading-tight">{cls.name}</h4>
                            <span className="text-[9px] font-mono font-bold tracking-wider uppercase block mt-1 opacity-70">
                              {cls.code}
                            </span>
                            
                            <div className="space-y-1 mt-2.5 text-[9px] font-semibold opacity-90 leading-tight">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 shrink-0 opacity-70" />
                                <span>{timePart}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0 opacity-70" />
                                <span>Room: {cls.room || 'TBA'}</span>
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between">
                              <span className="text-[8px] font-extrabold truncate uppercase block opacity-85">
                                {teacherObj?.fullName || 'Advisor'}
                              </span>
                              <span className="text-[8px] font-mono px-1 bg-white/60 text-slate-700 font-bold rounded">
                                Wkly
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- RENDER 2: SCHOOL EVENT CALENDAR --- */}
      {activeSubTab === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Events list */}
          <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl p-5 md:p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 select-none">Upcoming Term Circulars</h3>
            
            <div className="space-y-3">
              {eventsList.map(evt => {
                const isHoliday = evt.category === 'holiday';
                const isExam = evt.category === 'exam';
                const isPTA = evt.category === 'pta';

                // Display badge coloring
                const badgeStyle = isHoliday 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : isExam 
                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                    : isPTA 
                      ? 'bg-amber-50 text-amber-750 border-amber-200' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200';

                return (
                  <div key={evt.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 animate-slide-up">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-full ${badgeStyle}`}>
                          {evt.category}
                        </span>
                        <h4 className="text-xs md:text-sm font-black text-slate-800 leading-tight block">{evt.title}</h4>
                      </div>
                      <p className="text-xs text-slate-404 leading-relaxed font-semibold">
                        {evt.description}
                      </p>
                    </div>

                    <div className="flex items-center sm:flex-col justify-between sm:text-right shrink-0 py-2 border-t sm:border-t-0 border-slate-100 pt-2 border-dotted gap-1.5 select-none font-semibold">
                      <span className="text-[10px] text-slate-400">Scheduled Date:</span>
                      <span className="text-xs font-mono font-bold text-slate-700">{evt.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Notice Widget */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#4f46e5]" />
              <span>PTA Reminder Panel</span>
            </h4>
            
            <p className="text-xs text-slate-450 leading-relaxed font-semibold">
              The Parent-Teacher Association holds standard termly feedback meetings. Ensure to submit any grading or curricular inquiries via the <strong>Teacher Messaging Hub</strong> prior to general PTA schedules.
            </p>

            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-2 text-[10px] text-indigo-950 font-bold">
              <Clipboard className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>General school updates sync with student terminal report records automatically.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
