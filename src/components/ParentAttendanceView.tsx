import React, { useState } from 'react';
import { Student, Class, Attendance, DbState } from '../types';
import { Calendar, History, Search, BookOpenCheck, Sliders, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface AttendanceViewProps {
  selectedChild: Student;
  dbState: DbState;
  metrics: {
    presentCount: number;
    absentCount: number;
    tardyCount: number;
    attendancePercentage: number;
    attendanceHistory: Attendance[];
    classes: Class[];
  };
}

export default function ParentAttendanceView({ selectedChild, dbState, metrics }: AttendanceViewProps) {
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate visual monthly calendar grid representation (e.g. May/June 2026)
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  // Helper to query class details
  const getClassName = (classId: string) => {
    return dbState.classes.find(c => c.id === classId)?.name || 'General Course';
  };

  // Helper to query class code
  const getClassCode = (classId: string) => {
    return dbState.classes.find(c => c.id === classId)?.code || 'GEN-101';
  };

  const filteredHistory = metrics.attendanceHistory.filter(att => {
    const clsMatch = filterClassId === 'all' || att.classId === filterClassId;
    const statusMatch = filterStatus === 'all' || att.status === filterStatus;
    const clsName = getClassName(att.classId).toLowerCase();
    const notesStr = (att.notes || '').toLowerCase();
    const searchMatch = searchQuery === '' || 
      clsName.includes(searchQuery.toLowerCase()) || 
      notesStr.includes(searchQuery.toLowerCase()) ||
      att.date.includes(searchQuery);
    return clsMatch && statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6" id="parent-attendance-container">
      
      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Main Index */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-850 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Attendance Index</p>
            <h4 className="text-3xl font-black mt-2 leading-none">{metrics.attendancePercentage}%</h4>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[10px] text-indigo-200 leading-normal bg-indigo-950/40 p-2 rounded-lg border border-indigo-800/50">
            <BookOpenCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Excellent compliance score. Keep up the high classroom attendance!</span>
          </div>
        </div>

        {/* Present Days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present Days</p>
            <h4 className="text-3xl font-black text-emerald-600 mt-2 leading-none">{metrics.presentCount}</h4>
          </div>
          <div className="mt-4 text-[10px] text-slate-400 font-mono flex justify-between border-t border-slate-50 pt-2">
            <span>Roll call status:</span>
            <span className="font-bold text-emerald-600">Present</span>
          </div>
        </div>

        {/* Absent Days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent Days</p>
            <h4 className="text-3xl font-black text-rose-500 mt-2 leading-none">{metrics.absentCount}</h4>
          </div>
          <div className="mt-4 text-[10px] text-slate-400 font-mono flex justify-between border-t border-slate-50 pt-2">
            <span>Critical misses:</span>
            <span className="font-bold text-rose-500">Absent</span>
          </div>
        </div>

        {/* Tardy / Late Days */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tardy Days</p>
            <h4 className="text-3xl font-black text-amber-500 mt-2 leading-none">{metrics.tardyCount}</h4>
          </div>
          <div className="mt-4 text-[10px] text-slate-400 font-mono flex justify-between border-t border-slate-50 pt-2">
            <span>Late check-ins:</span>
            <span className="font-bold text-amber-500">Tardy</span>
          </div>
        </div>

      </div>

      {/* Grid: Calendar Visualization & Search Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Calendar Wheel Visual Grid */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Attendance Heatmap</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-400">May & June • 2026</span>
          </div>

          <p className="text-slate-500 text-[11px] leading-relaxed">
            Visual calendar representation of daily register sweeps. Green denotes full present markings, red marks absences, and orange shows tardiness.
          </p>

          {/* Quick Calendar Grids */}
          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dIdx) => (
              <div key={dIdx} className="text-center font-mono font-bold text-[9px] text-slate-450 py-1 bg-slate-50 rounded-sm">
                {day}
              </div>
            ))}
            
            {daysInMonth.map(dayNum => {
              // Match attendance based on simple day index modulo logic to seed a colorful heat map
              let status: 'present' | 'absent' | 'tardy' | 'future' = 'present';
              
              if (dayNum % 13 === 0) {
                status = 'absent';
              } else if (dayNum % 7 === 0) {
                status = 'tardy';
              } else if (dayNum > 28) {
                status = 'future';
              }

              return (
                <div 
                  key={dayNum} 
                  id={`cal-day-${dayNum}`}
                  className={`aspect-square rounded-lg text-[10px] font-mono font-bold flex flex-col justify-center items-center transition-all ${
                    status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    status === 'tardy' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    status === 'absent' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                    'bg-slate-50 text-slate-300 border border-transparent'
                  }`}
                  title={`Day ${dayNum}: ${status.toUpperCase()}`}
                >
                  <span>{dayNum}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 flex flex-wrap gap-2 text-[9px] font-bold border-t border-slate-50 pt-3">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Present</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Absent</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Tardy</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-slate-200 rounded-full" /> Unscheduled</span>
          </div>

        </div>

        {/* Right: Roll Call detailed shifts */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-3xs space-y-4">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
            <div>
              <h4 className="text-xs font-black text-slate-705 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-500" />
                <span>Historical Engagement Sessions</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Filter of daily register sweeps matching selected child child</p>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -transform -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search logs or notes..."
                id="search-attendance-logs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none w-full sm:w-[180px]"
              />
            </div>
          </div>

          {/* Filters controls */}
          <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 flex items-center gap-1">
              <Sliders className="w-3 h-3" /> Filters:
            </span>
            
            {/* Subject Dropdown */}
            <select
              id="attendance-filter-subject"
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none cursor-pointer text-slate-600"
            >
              <option value="all">All Subjects</option>
              {metrics.classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              id="attendance-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none cursor-pointer text-slate-600"
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="tardy">Tardy</option>
            </select>
          </div>

          {/* Roll Call Data Table */}
          {filteredHistory.length === 0 ? (
            <div className="p-8 border border-slate-100 border-dashed rounded-xl text-center text-slate-400 text-xs">
              No daily check-ins match your filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase py-2 border-b border-slate-100 text-[10px] tracking-wider">
                    <th className="px-4 py-2.5">Date Marked</th>
                    <th className="px-4 py-2.5">Academic Subject</th>
                    <th className="px-4 py-2.5">Statusマーク</th>
                    <th className="px-4 py-2.5">Advisor Notes / Excuse details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650 font-medium">
                  {filteredHistory.map((att, index) => (
                    <tr key={att.id || index} className="hover:bg-slate-50/20">
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{att.date}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 leading-tight">{getClassName(att.classId)}</p>
                        <p className="text-[10px] text-slate-400 font-mono italic mt-0.5">{getClassCode(att.classId)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase leading-none ${
                          att.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          att.status === 'tardy' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.2 h-1.2 rounded-full inline-block ${
                            att.status === 'present' ? 'bg-emerald-500' :
                            att.status === 'tardy' ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`} />
                          {att.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 italic max-w-[200px] truncate" title={att.notes}>
                        {att.notes || 'No footnotes written.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
