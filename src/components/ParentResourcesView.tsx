import React, { useState, useEffect } from 'react';
import { Student, Class, DbState } from '../types';
import { ResourceItem, seedResourcesList } from '../parentPortalData';
import { Library, FolderOpen, Play, Pause, Music, Sliders, PlusCircle, FileText, ImageIcon, Video, Search, BookOpen, Volume2, Eye, Download, X, HelpCircle } from 'lucide-react';

interface ParentResourcesViewProps {
  selectedChild: Student;
  dbState: DbState;
}

export default function ParentResourcesView({ selectedChild, dbState }: ParentResourcesViewProps) {
  const [activeMediaFilter, setActiveMediaFilter] = useState<'all' | 'notes' | 'video_link' | 'mp3' | 'video' | 'pdf' | 'image'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Unified List of Resources
  const [resources, setResources] = useState<ResourceItem[]>([]);

  // Add Resource Modal states
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customClassId, setCustomClassId] = useState('');
  const [customType, setCustomType] = useState<ResourceItem['type']>('notes');
  const [customUrl, setCustomUrl] = useState('');

  // Immersive Dialog states
  const [activeAudio, setActiveAudio] = useState<ResourceItem | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(35); // simulated progress percent
  const [audioCurrentTime, setAudioCurrentTime] = useState(48); // simulated seconds

  const [activeDoc, setActiveDoc] = useState<ResourceItem | null>(null);
  const [docZoomLevel, setDocZoomLevel] = useState<number>(100);

  const [activeVideo, setActiveVideo] = useState<ResourceItem | null>(null);
  const [activeImage, setActiveImage] = useState<ResourceItem | null>(null);

  // Find kid classes
  const enrollments = dbState.enrollments.filter(e => e.studentId === selectedChild.id);
  const enrolledClasses = dbState.classes.filter(c => enrollments.some(e => e.classId === c.id));

  // 1. Load resources and merge custom added items
  const loadResourcesList = () => {
    const list = seedResourcesList(enrolledClasses);
    
    // Core mapped teacher published lesson notes and media links
    const teacherNotes = (dbState.lessonNotes || []).filter(note => 
      enrolledClasses.some(c => c.id === note.classId)
    );

    const mappedTeacherResources: ResourceItem[] = [];
    teacherNotes.forEach(n => {
      // Main text summary (notes)
      mappedTeacherResources.push({
        id: `${n.id}-text`,
        classId: n.classId,
        subjectName: n.subject || 'Mathematics',
        type: 'notes',
        title: `${n.topic} (Notes)`,
        description: `Objectives: ${n.objectives}`,
        url: '#',
        documentContent: n.body,
        fileName: 'LessonNotes.pdf',
        fileSize: `${Math.round(n.body.length / 150) + 1} KB`
      });

      // Video link
      if (n.videoLink) {
        mappedTeacherResources.push({
          id: `${n.id}-video`,
          classId: n.classId,
          subjectName: n.subject || 'Mathematics',
          type: 'video',
          title: `${n.topic} (Video Guide)`,
          description: `Teacher Video: ${n.objectives}`,
          url: n.videoLink,
          fileName: 'Watch Video.mp4',
          fileSize: '34.5 MB'
        });
      }

      // Audio link
      if (n.mp3Link) {
        mappedTeacherResources.push({
          id: `${n.id}-audio`,
          classId: n.classId,
          subjectName: n.subject || 'Mathematics',
          type: 'mp3',
          title: `${n.topic} (Audio Lecture)`,
          description: `Teacher Audio: ${n.objectives}`,
          url: n.mp3Link,
          fileName: 'Listen Audio.mp3',
          fileSize: '4.8 MB'
        });
      }

      // Image link
      if (n.imageLink) {
        mappedTeacherResources.push({
          id: `${n.id}-image`,
          classId: n.classId,
          subjectName: n.subject || 'Mathematics',
          type: 'image',
          title: `${n.topic} (Diagram)`,
          description: `Teacher Illustration: ${n.objectives}`,
          url: n.imageLink,
          fileName: 'Diagram.png',
          fileSize: '1.2 MB'
        });
      }
    });

    list.push(...mappedTeacherResources);
    
    // Load local custom added items
    const customSaved = localStorage.getItem(`parent_custom_resources_${selectedChild.id}`);
    if (customSaved) {
      try {
        const parsed = JSON.parse(customSaved) as ResourceItem[];
        // Filter out anything invalid and format properly
        list.push(...parsed);
      } catch (e) {
        console.error("Failed loading custom parent resources", e);
      }
    }
    
    setResources(list);
  };

  useEffect(() => {
    if (selectedChild) {
      loadResourcesList();
      // Reset modes
      setActiveAudio(null);
      setActiveDoc(null);
      setActiveVideo(null);
      setActiveImage(null);
    }
  }, [selectedChild, dbState]);

  // Audio simulation timer interval
  useEffect(() => {
    let intervalId: any = null;
    if (activeAudio && isAudioPlaying) {
      intervalId = setInterval(() => {
        setAudioCurrentTime(prev => {
          if (prev >= 180) {
            setIsAudioPlaying(false);
            setAudioProgress(100);
            return 180;
          }
          const nextTime = prev + 1;
          setAudioProgress(Math.round((nextTime / 180) * 100));
          return nextTime;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeAudio, isAudioPlaying]);

  // Handle addition of custom resource
  const handleAddResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customClassId) return;

    const classObj = enrolledClasses.find(c => c.id === customClassId);
    const codeName = classObj ? classObj.name : 'Custom Subject';

    const newResourceItem: ResourceItem = {
      id: `custom-res-${Math.random().toString(36).substr(2, 9)}`,
      classId: customClassId,
      subjectName: codeName,
      type: customType,
      title: customTitle,
      description: customDescription || `Self-uploaded ${customType} classroom study aid.`,
      url: customUrl || '#',
      fileName: customType === 'notes' || customType === 'pdf' ? `${customTitle.replace(' ', '_')}.pdf` : undefined,
      fileSize: '420 KB',
      documentContent: customType === 'notes' || customType === 'pdf' 
        ? `${customTitle.toUpperCase()} NOTES\n\n- Study reference summary:\n${customDescription || 'No explicit study guide details typed.'}`
        : undefined
    };

    const currentCustomSaved = localStorage.getItem(`parent_custom_resources_${selectedChild.id}`);
    let currentCustomList: ResourceItem[] = [];
    if (currentCustomSaved) {
      try {
        currentCustomList = JSON.parse(currentCustomSaved);
      } catch (err) {}
    }

    currentCustomList.push(newResourceItem);
    localStorage.setItem(`parent_custom_resources_${selectedChild.id}`, JSON.stringify(currentCustomList));

    loadResourcesList();

    // Clear and hide modal
    setCustomTitle('');
    setCustomDescription('');
    setCustomUrl('');
    setShowAddResourceModal(false);

    alert(`Study Resource added directly into ${codeName} library index!`);
  };

  // Filters logic
  const filteredResources = resources.filter(res => {
    const isMatchedType = activeMediaFilter === 'all' || res.type === activeMediaFilter;
    const isMatchedClass = selectedClassId === 'all' || res.classId === selectedClassId;
    
    const searchLow = searchQuery.toLowerCase();
    const isMatchedSearch = searchQuery === '' || 
      res.title.toLowerCase().includes(searchLow) || 
      res.description.toLowerCase().includes(searchLow) ||
      res.subjectName.toLowerCase().includes(searchLow);

    return isMatchedType && isMatchedClass && isMatchedSearch;
  });

  return (
    <div className="space-y-6" id="parent-resources-root">
      
      {/* Search and upload actions rows */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print shadow-3xs">
        
        {/* Class subject filtering */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -transform -translate-y-1/2" />
            <input
              type="text"
              id="search-resources-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search syllabus files or links..."
              className="pl-8.5 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50/55 outline-none focus:ring-1 focus:ring-indigo-500 w-full md:w-[190px]"
            />
          </div>

          <select
            id="filter-resources-subject"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-xs border border-slate-200 px-3 py-1.5 rounded-xl font-bold bg-slate-50 text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Course Libraries</option>
            {enrolledClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>

        {/* Upload material button */}
        <button
          onClick={() => {
            setShowAddResourceModal(true);
            setCustomClassId(enrolledClasses.length > 0 ? enrolledClasses[0].id : '');
          }}
          id="btn-upload-materials"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Study Material</span>
        </button>

      </div>

      {/* Filterable pills */}
      <div className="flex flex-wrap gap-1.5 no-print" id="resource-media-pills">
        {([
          { code: 'all', label: 'All Resources', icon: Library },
          { code: 'notes', label: 'Class Notes', icon: BookOpen },
          { code: 'pdf', label: 'Syllabus PDF', icon: FileText },
          { code: 'mp3', label: 'Audio Podcast', icon: Music },
          { code: 'video', label: 'Lesson Video', icon: Video },
          { code: 'image', label: 'Infographics', icon: ImageIcon },
          { code: 'video_link', label: 'External Links', icon: Sliders }
        ] as const).map(pill => {
          const isActive = activeMediaFilter === pill.code;
          const count = resources.filter(r => pill.code === 'all' || r.type === pill.code).length;
          return (
            <button
              key={pill.code}
              id={`pill-res-${pill.code}`}
              onClick={() => setActiveMediaFilter(pill.code)}
              className={`px-3 py-1.8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive 
                  ? 'bg-indigo-650 text-white shadow-3xs' 
                  : 'bg-white border border-slate-100 text-slate-550 hover:text-indigo-600 hover:bg-indigo-50/20'
              }`}
            >
              <pill.icon className="w-3.5 h-3.5" />
              <span>{pill.label}</span>
              <span className={`text-[9px] font-mono px-1 rounded-sm ${isActive ? 'bg-indigo-755 text-indigo-120' : 'bg-slate-100 text-slate-450'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Library Vault Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="parent-school-resources-grid">
        {filteredResources.length === 0 ? (
          <div className="col-span-full bg-white p-12 border border-slate-100 border-dashed rounded-2xl text-center text-slate-450 text-xs">
            No academic resources align with the selected media filters.
          </div>
        ) : (
          filteredResources.map(res => {
            return (
              <div 
                key={res.id} 
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* Category Pill and Details Row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-indigo-500 uppercase font-mono px-2 py-0.5 rounded-md bg-slate-100 tracking-wide border border-slate-200/40">
                      {res.subjectName}
                    </span>
                    
                    <span className="text-[9px] font-bold text-slate-400 capitalize flex items-center gap-1 font-mono">
                      {res.type === 'notes' ? <BookOpen className="w-3 h-3 text-emerald-500" /> :
                       res.type === 'pdf' ? <FileText className="w-3 h-3 text-red-500" /> :
                       res.type === 'mp3' ? <Music className="w-3 h-3 text-pink-500" /> :
                       res.type === 'video' ? <Video className="w-3 h-3 text-blue-500" /> :
                       res.type === 'image' ? <ImageIcon className="w-3 h-3 text-amber-500" /> :
                       <Library className="w-3 h-3 text-purple-500" />}
                      <span>{res.type.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {/* Title and descriptions */}
                  <div>
                    <h4 className="text-xs font-black text-slate-800 leading-tight tracking-tight">{res.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 lines-clamp font-semibold leading-relaxed">{res.description}</p>
                  </div>

                </div>

                {/* File size / links indicators */}
                <div className="pt-3 border-t border-slate-50 mt-4 flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
                  <span>File: {res.fileName || 'Online resource link'}</span>
                  <span>{res.fileSize || '38 KB'}</span>
                </div>

                {/* Core Action Trigger buttons */}
                <div className="pt-3 mt-3">
                  {res.type === 'notes' || res.type === 'pdf' ? (
                    /* Text documents and PDF reader layout trigger */
                    <button
                      onClick={() => {
                        setActiveDoc(res);
                        setDocZoomLevel(100);
                      }}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open Document Reader</span>
                    </button>
                  ) : res.type === 'mp3' ? (
                    /* Audio Pod Player launch dial */
                    <button
                      onClick={() => {
                        setActiveAudio(res);
                        setIsAudioPlaying(true);
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
                    >
                      <Music className="w-3.5 h-3.5 fill-current animate-bounce" />
                      <span>Play Lesson Podcast</span>
                    </button>
                  ) : res.type === 'video' ? (
                    /* Theatre video projection launch */
                    <button
                      onClick={() => setActiveVideo(res)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Watch Video Lesson</span>
                    </button>
                  ) : res.type === 'image' ? (
                    /* Graphic lightbox zoom-in enlarger */
                    <button
                      onClick={() => setActiveImage(res)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Maximize Labeled Graphic</span>
                    </button>
                  ) : (
                    /* External video tutorials hyperlink reference */
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border border-indigo-200"
                    >
                      <span>Launch External Vimeo tutorial</span>
                      <Play className="w-3 h-3 fill-current" />
                    </a>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* -------------------------------------------------------------
          IMMERSIVE ELEMENT 1: AUDIO POP PLAYER (Vinyl Disc Graphics)
         ------------------------------------------------------------- */}
      {activeAudio && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl max-w-sm w-full shadow-2xl z-50 animate-fadeIn space-y-4 font-sans border-t-2 border-t-indigo-500">
          
          <div className="flex items-start justify-between">
            <div className="leading-none">
              <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase">PODCAST PLAYER DOCK</span>
              <h4 className="text-xs font-black text-white mt-1 leading-tight truncate max-w-[200px]">{activeAudio.title}</h4>
              <p className="text-[10px] text-slate-450 mt-0.5 font-bold uppercase">{activeAudio.subjectName}</p>
            </div>
            
            <button 
              onClick={() => {
                setActiveAudio(null);
                setIsAudioPlaying(false);
              }}
              className="p-1 hover:bg-slate-800 rounded-full text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core visual spinning vinyl disc graphics */}
          <div className="flex items-center gap-4.5 py-1">
            <div className="relative shrink-0 select-none">
              <div className={`w-14 h-14 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center flex-col shadow-inner transition-transform duration-3000 ${
                isAudioPlaying ? 'animate-spin' : ''
              }`}>
                {/* Vinyl Grooves concentric rings */}
                <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950/80">
                  <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center bg-indigo-501">
                    <Music className="w-3 h-3 text-indigo-500" />
                  </div>
                </div>
              </div>
              
              {/* Turntable needle armature arm */}
              <div className={`w-5 h-8 border-l border-b border-indigo-400 absolute top-0 -right-1 origin-top transform transition-all duration-500 ${
                isAudioPlaying ? 'rotate-12 translate-x-0.8' : '-rotate-12'
              }`} />
            </div>

            {/* Audio Wave animators */}
            <div className="flex items-end gap-1.2 h-8 flex-1">
              {Array.from({ length: 15 }).map((_, waveIdx) => {
                const randomAnimHeight = isAudioPlaying 
                  ? `${Math.max(10, Math.floor(Math.random() * 100))}%` 
                  : '8%';
                return (
                  <div 
                    key={waveIdx} 
                    className="w-1 bg-gradient-to-t from-indigo-500 to-pink-500 rounded-t-sm transition-all duration-300"
                    style={{ height: randomAnimHeight }}
                  />
                );
              })}
            </div>
          </div>

          {/* Time and custom timeline progress seek indicator */}
          <div className="space-y-1.5 font-mono text-[9px] font-bold text-slate-450 leading-none">
            <div className="flex justify-between">
              <span>{Math.floor(audioCurrentTime / 60)}:{(audioCurrentTime % 60).toString().padStart(2, '0')}</span>
              <span>3:00 (Lecture length)</span>
            </div>
            
            {/* Seek board */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = clickX / rect.width;
                setAudioProgress(Math.round(pct * 100));
                setAudioCurrentTime(Math.round(pct * 180));
              }}
            >
              <div 
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </div>

          {/* Standard buttons layout */}
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => {
                setAudioCurrentTime(Math.max(0, audioCurrentTime - 10));
                setAudioProgress(Math.round((Math.max(0, audioCurrentTime - 10) / 180) * 100));
              }}
              className="text-slate-400 hover:text-white p-1 text-[10px] font-mono cursor-pointer"
            >
              -10s
            </button>

            <button
              onClick={() => setIsAudioPlaying(!isAudioPlaying)}
              className="p-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-full transition-all cursor-pointer shadow-md select-none"
            >
              {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button 
              onClick={() => {
                setAudioCurrentTime(Math.min(180, audioCurrentTime + 10));
                setAudioProgress(Math.round((Math.min(180, audioCurrentTime + 10) / 180) * 100));
              }}
              className="text-slate-400 hover:text-white p-1 text-[10px] font-mono cursor-pointer"
            >
              +10s
            </button>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          IMMERSIVE ELEMENT 2: COMPLETE TEXT DOC/PDF READER (Zoom Scale)
         ------------------------------------------------------------- */}
      {activeDoc && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn" id="document-reader-full-overlay">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border shadow-2xl space-y-4 font-sans relative flex flex-col max-h-[85vh]">
            
            <button
              onClick={() => setActiveDoc(null)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Document Header details */}
            <div className="border-b pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 pr-8">
              <div>
                <span className="text-[8px] font-black tracking-widest text-indigo-500 uppercase">DOCUMENT VIEWER ENGINE</span>
                <h3 className="text-base font-black text-slate-900 mt-1 uppercase truncate max-w-[320px]">{activeDoc.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{activeDoc.subjectName} Syllabus</p>
              </div>

              {/* Zoom sliders */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 font-mono self-start">
                <button 
                  onClick={() => setDocZoomLevel(Math.max(70, docZoomLevel - 15))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  A-
                </button>
                <span>{docZoomLevel}%</span>
                <button 
                  onClick={() => setDocZoomLevel(Math.min(150, docZoomLevel + 15))}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Simulated scroll file sheet content */}
            <div className="overflow-y-auto bg-slate-50 border p-6 rounded-xl flex-1 max-h-[500px]">
              <div 
                className="font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed space-y-3"
                style={{ fontSize: `${11 * (docZoomLevel / 100)}px` }}
              >
                {activeDoc.documentContent || 'Study guide overview details. Examine the notes and complete assignments before terminal assessments commence.'}
              </div>
            </div>

            {/* Reader Footer controls */}
            <div className="border-t pt-3 flex items-center justify-between text-xs font-bold text-slate-500 leading-none">
              <span className="font-mono text-[10px]">Page 1 of 1 • Validated Sourced</span>
              <button 
                onClick={() => alert("Simulated print to device triggered successfully.")}
                className="px-3.5 py-2 hover:bg-slate-100 rounded-xl flex items-center gap-1 cursor-pointer transition-all border text-slate-650"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Study Booklet</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          IMMERSIVE ELEMENT 3: THEATRE VIDEO SCREEN POPUP
         ------------------------------------------------------------- */}
      {activeVideo && (
        <div className="fixed inset-0 bg-slate-950/85 flex items-center justify-center p-4 z-50 animate-fadeIn" id="theatre-video-popup">
          <div className="max-w-2xl w-full flex flex-col gap-3 relative relative">
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute -top-7 right-0 text-white font-mono text-xs flex items-center gap-1 opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="w-4 h-4" /> Exit Cinema
            </button>

            {/* Black Projection box */}
            <div className="aspect-video bg-black rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-4 flex-col">
              
              {/* Projection visual loader bar */}
              <div className="text-white bg-slate-900/60 backdrop-blur-sm self-start px-3 py-1 text-[10px] font-mono rounded-lg border border-slate-800">
                Course Video: {activeVideo.title}
              </div>

              {/* Big play overlay logo icon */}
              <div className="self-center p-5 rounded-full bg-indigo-650/80 hover:bg-indigo-600 border border-indigo-400 text-white shadow-xl cursor-pointer select-none transition-all">
                <Play className="w-8 h-8 fill-current" />
              </div>

              {/* Control panels */}
              <div className="w-full bg-slate-950/80 p-2 border border-slate-900 rounded-xl flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-2.5">
                  <Play className="w-3.5 h-3.5 fill-current text-white cursor-pointer" />
                  <span>0:00 / 12:45</span>
                </div>
                <div className="h-1 bg-slate-800 flex-1 mx-4 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-1/12" />
                </div>
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>100%</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          IMMERSIVE ELEMENT 4: INFOGRAPHICS LIGHTBOX ZOOM
         ------------------------------------------------------------- */}
      {activeImage && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 animate-fadeIn" id="image-lightbox-zoom">
          <div className="max-w-2xl w-full flex flex-col gap-3 relative relative pr-0 leading-none">
            
            <button
              onClick={() => setActiveImage(null)}
              className="absolute -top-8 right-0 text-white text-xs font-bold leading-none flex items-center gap-1 cursor-pointer hover:underline"
            >
              <X className="w-4 h-4" /> Close Graphic
            </button>

            {/* Immersive card wrapper */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-2 relative">
              <img 
                src={activeImage.url} 
                alt={activeImage.title} 
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl select-none"
                referrerPolicy="no-referrer"
              />
              <div className="p-4 bg-slate-950 text-white text-center leading-normal border-t border-slate-900 rounded-b-xl">
                <h4 className="text-xs font-black text-white">{activeImage.title}</h4>
                <p className="text-[10px] text-slate-450 mt-1 italic">{activeImage.description}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          IMMERSIVE ELEMENT 5: UPLOAD ADD RESOURCE FORM DIALOG
         ------------------------------------------------------------- */}
      {showAddResourceModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 animate-fadeIn" id="add-resource-modal-overlay">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border shadow-2xl space-y-4 font-sans relative">
            
            <button
              onClick={() => setShowAddResourceModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[8px] tracking-widest font-black uppercase text-indigo-500 block">LOCAL DEPOSIT PORTAL</span>
              <h3 className="text-base font-black text-slate-900 mt-1">Register New Study Material</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Custom repository items added are persistent across reloads</p>
            </div>

            <form onSubmit={handleAddResourceSubmit} className="space-y-3.5 text-xs text-slate-650">
              
              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Resource Title Name:</label>
                <input 
                  type="text" 
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Projectile Flight Vectors CheatSheet" 
                  required
                  className="w-full border border-slate-200 outline-none p-2.5 rounded-xl font-bold bg-slate-50/50 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Class list selector mapping */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Link Subject Class:</label>
                <select
                  value={customClassId}
                  onChange={(e) => setCustomClassId(e.target.value)}
                  required
                  className="w-full border border-slate-200 outline-none p-2.5 rounded-xl font-bold bg-slate-50/50 cursor-pointer focus:ring-1 focus:ring-indigo-505"
                >
                  <option value="" disabled>Choose Enrolled Course Group</option>
                  {enrolledClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Type toggle */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Media Category Type:</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  required
                  className="w-full border border-slate-200 outline-none p-2.5 rounded-xl font-bold bg-slate-50/50 cursor-pointer"
                >
                  <option value="notes">Class Notes</option>
                  <option value="pdf">Syllabus PDF File</option>
                  <option value="mp3">Podcast MP3 Audio</option>
                  <option value="video">Lesson Video MP4</option>
                  <option value="image">Cheat-Sheet diagram Image</option>
                  <option value="video_link">External Playlists link</option>
                </select>
              </div>

              {/* URL or mock filename */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Mock Link / Source URL Path:</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="e.g. https://images.unsplash.com/photo-16... or #link"
                  className="w-full border border-slate-200 outline-none p-2.5 rounded-xl font-semibold bg-slate-50/50"
                />
              </div>

              {/* Comment / notes content */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-450">Explanatory description / notes body:</label>
                <textarea 
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Excursion notes summaries or chapter outline paragraphs..."
                  rows={3}
                  className="w-full border border-slate-200 outline-none p-2.5 rounded-xl bg-slate-50/50"
                />
              </div>

              {/* Control buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddResourceModal(false)}
                  className="px-4 py-2 border border-slate-250 font-bold text-slate-500 rounded-xl text-xs cursor-pointer hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white rounded-xl text-xs cursor-pointer transition-all shadow-sm"
                >
                  Add Resource Material
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
