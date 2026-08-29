import React, { useState, useEffect, useRef } from 'react';
import { Student, DbState, Teacher } from '../types';
import { MessageSquare, Send, CheckCheck, HelpCircle, Phone, Mail, Award, AlertCircle } from 'lucide-react';

interface ParentMessagingViewProps {
  selectedChild: Student;
  dbState: DbState;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  childId: string;
  text: string;
  timestamp: string;
  fromUser: boolean; // true if sent by the parent
}

export default function ParentMessagingView({ selectedChild, dbState }: ParentMessagingViewProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Resolve child's teachers from enrollments (courses)
  useEffect(() => {
    if (selectedChild && dbState) {
      const enrollments = dbState.enrollments.filter(e => e.studentId === selectedChild.id);
      const enrolledClasses = dbState.classes.filter(c => enrollments.some(e => e.classId === c.id));
      
      const teacherList: Teacher[] = [];
      const teacherIdsSeen = new Set<string>();

      enrolledClasses.forEach(cls => {
        if (cls.teacherId && !teacherIdsSeen.has(cls.teacherId)) {
          teacherIdsSeen.add(cls.teacherId);
          const t = dbState.teachers.find(teacher => teacher.id === cls.teacherId);
          if (t) {
            teacherList.push(t);
          }
        }
      });

      // Simple fallback if no teachers found
      if (teacherList.length === 0 && dbState.teachers.length > 0) {
        teacherList.push(dbState.teachers[0]);
      }

      setTeachers(teacherList);
      if (teacherList.length > 0) {
        setSelectedTeacher(teacherList[0]);
      } else {
        setSelectedTeacher(null);
      }
    }
  }, [selectedChild, dbState]);

  // 2. Load or seed messages for the selected child + selected teacher combo
  useEffect(() => {
    if (selectedChild && selectedTeacher) {
      const msgKey = `parent_messages_${selectedChild.id}_${selectedTeacher.id}`;
      const saved = localStorage.getItem(msgKey);
      
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        // Seed unique friendly initial dialogue thread
        const hash = (selectedChild.id + selectedTeacher.id).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const dept = selectedTeacher.department || 'Aesthetics';
        
        const welcomeMsgs: ChatMessage[] = [
          {
            id: `msg-seed-1-${hash}`,
            senderId: selectedTeacher.id,
            senderName: selectedTeacher.fullName,
            receiverId: selectedChild.parentId || 'parent-user',
            childId: selectedChild.id,
            text: `Hello! I wanted to touch base regarding ${selectedChild.fullName}'s development in our ${dept} modules. Overall, participation in class discussions has been stellar!`,
            timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' - 3 days ago',
            fromUser: false
          },
          {
            id: `msg-seed-2-${hash}`,
            senderId: selectedChild.parentId || 'parent-user',
            senderName: 'Parent',
            receiverId: selectedTeacher.id,
            childId: selectedChild.id,
            text: `Thank you for reaching out, ${selectedTeacher.fullName}. We are very glad to hear that! Are there any specific areas we should reinforce at home?`,
            timestamp: new Date(Date.now() - 3600000 * 24 * 2).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' - 2 days ago',
            fromUser: true
          },
          {
            id: `msg-seed-3-${hash}`,
            senderId: selectedTeacher.id,
            senderName: selectedTeacher.fullName,
            receiverId: selectedChild.parentId || 'parent-user',
            childId: selectedChild.id,
            text: `Excellent question! Just review the current weekly assignment sheets. Encouraging them to practice double-checking calculations or reading comprehension exercises will make a big difference.`,
            timestamp: new Date(Date.now() - 3600000 * 12).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' - 12 hours ago',
            fromUser: false
          }
        ];
        setMessages(welcomeMsgs);
        localStorage.setItem(msgKey, JSON.stringify(welcomeMsgs));
      }
    } else {
      setMessages([]);
    }
  }, [selectedChild, selectedTeacher]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle message dispatch
  const handleSendMessage = (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed || !selectedChild || !selectedTeacher) return;

    const msgKey = `parent_messages_${selectedChild.id}_${selectedTeacher.id}`;
    
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      senderId: selectedChild.parentId || 'parent',
      senderName: 'Parent',
      receiverId: selectedTeacher.id,
      childId: selectedChild.id,
      text: trimmed,
      timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' (Today)',
      fromUser: true
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem(msgKey, JSON.stringify(updated));
    setInputText('');

    // Trigger funny simulation typing feedback
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      
      // Determine auto-revert answer based on input key words
      let replyText = "Understood. Thank you for your feedback! I've logged this in our academic review notes.";
      const low = trimmed.toLowerCase();
      if (low.includes('help') || low.includes('difficult') || low.includes('fail') || low.includes('low')) {
        replyText = `Thank you for sharing your concerns regarding ${selectedChild.fullName}'s difficulties. I will schedule a short review session to help clear their bottlenecks after school this week.`;
      } else if (low.includes('thank') || low.includes('appreciate') || low.includes('glad')) {
        replyText = "The pleasure is entirely mine! We love having them in class. Feel free to connect anytime.";
      } else if (low.includes('attendance') || low.includes('absent') || low.includes('sick')) {
        replyText = `Thank you for the notification. I have noted down the attendance updates. Let's make sure they review the PDF resources once they are back in full strength!`;
      }

      const replyMsg: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        senderId: selectedTeacher.id,
        senderName: selectedTeacher.fullName,
        receiverId: selectedChild.parentId || 'parent',
        childId: selectedChild.id,
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' (Today)',
        fromUser: false
      };

      const finalAll = [...updated, replyMsg];
      setMessages(finalAll);
      localStorage.setItem(msgKey, JSON.stringify(finalAll));
    }, 1800);
  };

  // Preset replies array
  const quickResponses = [
    "Thank you! We will practice this together tonight.",
    "Can we arrange a brief call on Friday to discuss this?",
    "Could you clarify the grading criteria for this project?",
    "Thank you for the updates! We really appreciate your guidance."
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="messaging-view-container">
      {/* View Header */}
      <div>
        <h2 className="text-2xl font-black text-indigo-950 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#4f46e5]" />
          <span>Parent-Teacher Contact Hub</span>
        </h2>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          Communicate directly with {selectedChild.fullName}'s instructors in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl border border-slate-100 shadow-3xs overflow-hidden h-[620px]">
        
        {/* 1. LEFT COLUMN: Instructors/Teachers list */}
        <div className="lg:col-span-4 border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-slate-100 bg-white">
            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Child's Instructors ({teachers.length})</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Select a supervisor below to begin a message thread.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 scrollbar-thin">
            {teachers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 italic">
                No active class instructors registered for this student.
              </div>
            ) : (
              teachers.map(t => {
                const isActive = selectedTeacher?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacher(t)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                      isActive 
                        ? 'bg-indigo-600/90 border-indigo-600 text-white shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase shadow-3xs ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {t.fullName.slice(0, 2)}
                    </div>
                    
                    <div className="min-w-0 flex-1 leading-tight">
                      <h4 className="text-xs font-black truncate">{t.fullName}</h4>
                      <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {t.department} Advisor
                      </p>
                      <p className={`text-[10px] truncate mt-1 ${isActive ? 'text-indigo-150' : 'text-slate-500'}`}>
                        {t.email}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 2. RIGHT COLUMN: Realtime message logger */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white">
          {selectedTeacher ? (
            <>
              {/* Active Teacher Card Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs uppercase shadow-3xs">
                    {selectedTeacher.fullName.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-800 leading-tight">{selectedTeacher.fullName}</h3>
                    <span className="text-[10px] font-mono font-bold text-[#4f46e5] bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {selectedTeacher.department} Instructor
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 no-print">
                  <a href={`mailto:${selectedTeacher.email}`} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-710 transition-colors cursor-pointer" title="Send Direct Email">
                    <Mail className="w-4 h-4" />
                  </a>
                  {selectedTeacher.phone && (
                    <a href={`tel:${selectedTeacher.phone}`} className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-715 transition-colors cursor-pointer" title="Direct Phone Call">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Chat Thread Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/30 space-y-4 scrollbar-thin">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.fromUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 shadow-4xs ${
                      msg.fromUser 
                        ? 'bg-[#4f46e5] text-white rounded-tr-none' 
                        : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                      <div className="flex justify-between items-center gap-6 select-none mb-1">
                        <span className={`text-[8px] font-black uppercase tracking-wider ${msg.fromUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {msg.fromUser ? 'You (Guardian)' : msg.senderName}
                        </span>
                        <span className={`text-[8px] font-mono ${msg.fromUser ? 'text-indigo-200/80' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed break-words font-semibold">
                        {msg.text}
                      </p>
                      
                      {msg.fromUser && (
                        <div className="flex justify-end mt-0.5">
                          <CheckCheck className="w-3.5 h-3.5 text-indigo-200/90" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-3 shadow-4xs text-xs text-slate-404 flex items-center gap-1.5 italic font-bold">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      <span>{selectedTeacher.fullName} is writing...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Quick Presets & Input Fields */}
              <div className="p-4 border-t border-slate-100 bg-white space-y-3.5 no-print">
                {/* Quick Presets tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin select-none">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 shrink-0 bg-slate-100 px-1.5 py-1 rounded">Quick:</span>
                  {quickResponses.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(r)}
                      className="text-[10px] font-bold text-slate-655 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/50 rounded-full px-3 py-1 shrink-0 transition-colors cursor-pointer"
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Form input field */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Type response or query to ${selectedTeacher.fullName}...`}
                    className="flex-1 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-xl px-4 py-3 text-xs font-semibold text-slate-800"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-3.5 bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl transition-all duration-200 cursor-pointer shadow-3xs flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <h4 className="text-sm font-black text-slate-700">No Instructor Selected</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Select an instructor from the left panel to begin your direct communication log.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Instructional Banner info */}
      <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl text-[11px] text-emerald-900 font-semibold flex items-start gap-2 max-w-3xl leading-relaxed">
        <Award className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <strong>Curriculum Advisor Note:</strong> This correspondence has direct oversight under school counselors. If you wish to register official medical exemptions, transport changes, or fee adjustments, please file from portal settings or visit the administration offices directly.
        </div>
      </div>
    </div>
  );
}
