import { DbState, User, Teacher, Student, Parent, Class, Enrollment, Grade, Attendance, UserRole, AttendanceStatus, ReportComment, sortClasses } from './types';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db as firestoreDb } from './firebase.ts';

// Storage Key for Local Cache
const DB_STORAGE_KEY = 'school_management_system_db';
const FIRESTORE_COLLECTION = 'school_system';
const FIRESTORE_DOC_ID = 'authoritative_state';

// Safe helper to deduplicate array by key while preserving order
function dedupeBy<T>(arr: T[] = [], keyFn: (item: T) => string): T[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of arr) {
    if (!item) continue;
    const key = keyFn(item);
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

// Safe LocalStorage Wrappers to prevent SecurityErrors in sandboxed iframes
const safeLocalStorageGet = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`LocalStorage getItem failed for key "${key}":`, e);
  }
  return null;
};

const safeLocalStorageSet = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`LocalStorage setItem failed for key "${key}":`, e);
  }
};

// Safe event dispatcher to prevent synchronous React render collisions
function safeDispatch(event: Event) {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(event);
    }, 0);
  }
}

// Initial Seed Data representation
export const INITIAL_DB: DbState = {
  users: [
    {
      id: 'usr-admin-1',
      email: 'realayanwunmi@gmail.com',
      role: 'admin',
      fullName: 'Principal Ayanniyi',
      createdAt: '2026-01-10T08:00:00Z',
      permissions: ['mark_attendance', 'upload_scores', 'upload_notes', 'create_assessments', 'enter_comments', 'view_edit_form_class', 'view_edit_subject']
    },
    {
      id: 'usr-teach-1',
      email: 'j.harrison@oakridge.edu',
      role: 'teacher',
      fullName: 'Mr. James Harrison',
      createdAt: '2026-01-12T09:00:00Z',
      permissions: ['mark_attendance', 'upload_scores', 'upload_notes', 'create_assessments', 'enter_comments', 'view_edit_form_class', 'view_edit_subject']
    },
    {
      id: 'usr-teach-2',
      email: 'm.baker@oakridge.edu',
      role: 'teacher',
      fullName: 'Mrs. Maria Baker',
      createdAt: '2026-01-12T10:00:00Z',
      permissions: ['mark_attendance', 'upload_scores', 'upload_notes', 'create_assessments', 'enter_comments', 'view_edit_form_class', 'view_edit_subject']
    },
    {
      id: 'usr-teach-3',
      email: 'k.jenkins@oakridge.edu',
      role: 'teacher',
      fullName: 'Mr. Kenneth Jenkins',
      createdAt: '2026-01-14T11:00:00Z',
      permissions: ['mark_attendance', 'upload_scores', 'upload_notes', 'create_assessments', 'enter_comments', 'view_edit_form_class', 'view_edit_subject']
    },
    {
      id: 'usr-parent-1',
      email: 'eleanor.foley@gmail.com',
      role: 'parent',
      fullName: 'Mrs. Eleanor Foley (Parent)',
      createdAt: '2026-02-01T15:00:00Z'
    },
    {
      id: 'usr-parent-2',
      email: 'richard.stewart@gmail.com',
      role: 'parent',
      fullName: 'Mr. Richard Stewart (Parent)',
      createdAt: '2026-02-05T16:30:00Z'
    }
  ],
  teachers: [
    {
      id: 'usr-teach-1',
      fullName: 'Mr. James Harrison',
      email: 'j.harrison@oakridge.edu',
      department: 'Mathematics Faculty',
      phone: '+234 (802) 119-2834',
      subjects: ['Mathematics', 'Basic Science and Technology'],
      status: 'Active'
    },
    {
      id: 'usr-teach-2',
      fullName: 'Mrs. Maria Baker',
      email: 'm.baker@oakridge.edu',
      department: 'Natural Sciences Faculty',
      phone: '+234 (803) 219-5832',
      subjects: ['Physics', 'Chemistry', 'Biology', 'Basic Science and Technology'],
      status: 'Active'
    },
    {
      id: 'usr-teach-3',
      fullName: 'Mr. Kenneth Jenkins',
      email: 'k.jenkins@oakridge.edu',
      department: 'English & Humanities Faculty',
      phone: '+234 (805) 319-9941',
      subjects: ['English language', 'English Language', 'Literature in English', 'Diction', 'Civic Education'],
      status: 'Active'
    }
  ],
  students: [
    {
      id: 'stud-1',
      fullName: 'Tommy Foley',
      gradeLevel: 'JSS 2B',
      parentId: 'usr-parent-1',
      rollNumber: 'ROYAL-2026-001',
      birthDate: '2011-04-12',
      gender: 'Male'
    },
    {
      id: 'stud-2',
      fullName: 'Emily Foley',
      gradeLevel: 'SSS 2B',
      parentId: 'usr-parent-1',
      rollNumber: 'ROYAL-2024-054',
      birthDate: '2009-09-22',
      gender: 'Female'
    },
    {
      id: 'stud-3',
      fullName: 'Oliver Stewart',
      gradeLevel: 'SSS 1B',
      parentId: 'usr-parent-2',
      rollNumber: 'ROYAL-2025-012',
      birthDate: '2010-06-15',
      gender: 'Male'
    },
    {
      id: 'stud-4',
      fullName: 'Chloe Bennett',
      gradeLevel: 'JSS 2B',
      parentId: 'usr-parent-1',
      rollNumber: 'ROYAL-2026-004',
      birthDate: '2011-01-30',
      gender: 'Female'
    },
    {
      id: 'stud-5',
      fullName: 'Nathan Drake',
      gradeLevel: 'SSS 2B',
      parentId: 'usr-parent-2',
      rollNumber: 'ROYAL-2024-089',
      birthDate: '2009-11-02',
      gender: 'Male'
    },
    {
      id: 'stud-6',
      fullName: 'Adaobi Okonkwo',
      gradeLevel: 'JSS 3B',
      parentId: undefined,
      rollNumber: 'ROYAL-2025-021',
      birthDate: '2010-08-14',
      gender: 'Female'
    },
    {
      id: 'stud-7',
      fullName: 'David Adeleke',
      gradeLevel: 'JSS 3B',
      parentId: undefined,
      rollNumber: 'ROYAL-2025-022',
      birthDate: '2010-11-03',
      gender: 'Male'
    },
    {
      id: 'stud-8',
      fullName: 'Zainab Ibrahim',
      gradeLevel: 'SSS 1B',
      parentId: undefined,
      rollNumber: 'ROYAL-2025-015',
      birthDate: '2010-02-18',
      gender: 'Female'
    },
    {
      id: 'stud-9',
      fullName: 'Babajide Sanwo',
      gradeLevel: 'SS3A',
      parentId: 'usr-parent-1',
      rollNumber: 'ROYAL-2024-001',
      birthDate: '2008-03-15',
      gender: 'Male'
    },
    {
      id: 'stud-10',
      fullName: 'Chioma Nwosu',
      gradeLevel: 'SS3A',
      parentId: 'usr-parent-2',
      rollNumber: 'ROYAL-2024-002',
      birthDate: '2008-07-22',
      gender: 'Female'
    },
    {
      id: 'stud-11',
      fullName: 'Emeka Eze',
      gradeLevel: 'SS3B',
      parentId: 'usr-parent-1',
      rollNumber: 'ROYAL-2024-003',
      birthDate: '2008-01-10',
      gender: 'Male'
    },
    {
      id: 'stud-12',
      fullName: 'Folake Balogun',
      gradeLevel: 'SS3B',
      parentId: 'usr-parent-2',
      rollNumber: 'ROYAL-2024-004',
      birthDate: '2008-09-30',
      gender: 'Female'
    }
  ],
  parents: [
    {
      id: 'usr-parent-1',
      fullName: 'Mrs. Eleanor Foley',
      email: 'eleanor.foley@gmail.com',
      phone: '+234 (803) 014-9988',
      childIds: ['stud-1', 'stud-2', 'stud-4']
    },
    {
      id: 'usr-parent-2',
      fullName: 'Mr. Richard Stewart',
      email: 'richard.stewart@gmail.com',
      phone: '+234 (802) 014-2211',
      childIds: ['stud-3', 'stud-5']
    }
  ],
  classes: [
    {
      id: 'cls-9',
      name: 'JSS 2B',
      code: 'J2-102',
      teacherId: 'usr-teach-1',
      schedule: 'Mon, Wed, Fri 11:00 - 12:15',
      room: 'Room 104',
      promotionStatus: 'Auto',
      levelOfEducation: 'Junior Secondary'
    },
    {
      id: 'cls-6',
      name: 'JSS 3B',
      code: 'J3-102',
      teacherId: 'usr-teach-2',
      schedule: 'Tue, Thu 10:30 - 11:45',
      room: 'Room 105',
      promotionStatus: 'Auto',
      levelOfEducation: 'Junior Secondary'
    },
    {
      id: 'cls-7',
      name: 'SSS 1B',
      code: 'S1-102',
      teacherId: 'usr-teach-3',
      schedule: 'Tue, Thu 13:00 - 14:30',
      room: 'Room 204',
      promotionStatus: 'Auto',
      levelOfEducation: 'Senior Secondary'
    },
    {
      id: 'cls-8',
      name: 'SSS 2B',
      code: 'S2-102',
      teacherId: 'usr-teach-1',
      schedule: 'Mon, Wed 14:45 - 16:15',
      room: 'Room 205',
      promotionStatus: 'Auto',
      levelOfEducation: 'Senior Secondary'
    },
    {
      id: 'cls-ss3a',
      name: 'SS3A',
      code: 'SS3-A',
      teacherId: 'usr-teach-2',
      schedule: 'Tue, Thu 13:00 - 14:30',
      room: 'Room 206',
      promotionStatus: 'Auto',
      levelOfEducation: 'Senior Secondary'
    },
    {
      id: 'cls-ss3b',
      name: 'SS3B',
      code: 'SS3-B',
      teacherId: 'usr-teach-3',
      schedule: 'Tue, Thu 14:45 - 16:15',
      room: 'Room 207',
      promotionStatus: 'Auto',
      levelOfEducation: 'Senior Secondary'
    },
    {
      id: 'cls-1',
      name: 'Algebra I',
      code: 'MATH-101',
      teacherId: 'usr-teach-1',
      schedule: 'Mon, Wed, Fri 09:00 - 10:15',
      room: 'Room 201',
      levelOfEducation: 'Junior Secondary'
    },
    {
      id: 'cls-2',
      name: 'Calculus AB',
      code: 'MATH-301',
      teacherId: 'usr-teach-1',
      schedule: 'Tue, Thu 11:00 - 12:30',
      room: 'Room 205',
      levelOfEducation: 'Senior Secondary'
    },
    {
      id: 'cls-3',
      name: 'AP Physics',
      code: 'SCI-201',
      teacherId: 'usr-teach-2',
      schedule: 'Mon, Wed 13:00 - 14:30',
      room: 'Lab B',
      levelOfEducation: 'Senior Secondary'
    },
    {
      id: 'cls-4',
      name: 'Biology',
      code: 'SCI-101',
      teacherId: 'usr-teach-2',
      schedule: 'Tue, Thu 09:00 - 10:15',
      room: 'Lab A',
      levelOfEducation: 'Senior Secondary'
    },
    {
      id: 'cls-5',
      name: 'English Literature II',
      code: 'ENG-201',
      teacherId: 'usr-teach-3',
      schedule: 'Mon, Wed, Fri 10:30 - 11:45',
      room: 'Room 102',
      levelOfEducation: 'Senior Secondary'
    }
  ],
  enrollments: [
    // JSS 2B
    { id: 'enr-j2-1', studentId: 'stud-1', classId: 'cls-9' },
    { id: 'enr-j2-2', studentId: 'stud-4', classId: 'cls-9' },
    // JSS 3B
    { id: 'enr-j3-1', studentId: 'stud-6', classId: 'cls-6' },
    { id: 'enr-j3-2', studentId: 'stud-7', classId: 'cls-6' },
    // SSS 1B
    { id: 'enr-s1-1', studentId: 'stud-3', classId: 'cls-7' },
    { id: 'enr-s1-2', studentId: 'stud-8', classId: 'cls-7' },
    // SSS 2B
    { id: 'enr-s2-1', studentId: 'stud-2', classId: 'cls-8' },
    { id: 'enr-s2-2', studentId: 'stud-5', classId: 'cls-8' },
    // SS3A
    { id: 'enr-ss3a-1', studentId: 'stud-9', classId: 'cls-ss3a' },
    { id: 'enr-ss3a-2', studentId: 'stud-10', classId: 'cls-ss3a' },
    // SS3B
    { id: 'enr-ss3b-1', studentId: 'stud-11', classId: 'cls-ss3b' },
    { id: 'enr-ss3b-2', studentId: 'stud-12', classId: 'cls-ss3b' },
    // Subject Classes
    { id: 'enr-1', studentId: 'stud-1', classId: 'cls-1' },
    { id: 'enr-2', studentId: 'stud-4', classId: 'cls-1' },
    { id: 'enr-3', studentId: 'stud-3', classId: 'cls-1' },
    { id: 'enr-4', studentId: 'stud-2', classId: 'cls-2' },
    { id: 'enr-5', studentId: 'stud-5', classId: 'cls-2' },
    { id: 'enr-6', studentId: 'stud-2', classId: 'cls-3' },
    { id: 'enr-7', studentId: 'stud-5', classId: 'cls-3' },
    { id: 'enr-8', studentId: 'stud-3', classId: 'cls-3' },
    { id: 'enr-9', studentId: 'stud-1', classId: 'cls-4' },
    { id: 'enr-10', studentId: 'stud-4', classId: 'cls-4' },
    { id: 'enr-11', studentId: 'stud-1', classId: 'cls-5' },
    { id: 'enr-12', studentId: 'stud-2', classId: 'cls-5' },
    { id: 'enr-13', studentId: 'stud-3', classId: 'cls-5' },
    { id: 'enr-14', studentId: 'stud-4', classId: 'cls-5' },
    { id: 'enr-15', studentId: 'stud-5', classId: 'cls-5' }
  ],
  grades: [
    // Tommy Foley (stud-1) - JSS 2B (cls-9)
    { id: 'grd-101', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'Mathematics 3rd Term Exam', score: 54, category: 'exam', date: '2026-05-15', subjectName: 'Mathematics', feedback: 'Good grasp of algebra' },
    { id: 'grd-102', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'Mathematics CA Test 1', score: 9, category: 'ca1', date: '2026-04-10', subjectName: 'Mathematics' },
    { id: 'grd-103', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'Mathematics Notebook & Project', score: 9, category: 'ca2', date: '2026-04-20', subjectName: 'Mathematics' },
    { id: 'grd-104', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'Mathematics Mid-Term Assessment', score: 18, category: 'mid_term', date: '2026-05-02', subjectName: 'Mathematics' },

    { id: 'grd-105', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'English language 3rd Term Exam', score: 52, category: 'exam', date: '2026-05-16', subjectName: 'English language' },
    { id: 'grd-106', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'English language CA Test 1', score: 8, category: 'ca1', date: '2026-04-11', subjectName: 'English language' },
    { id: 'grd-107', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'English language Notebook', score: 9, category: 'ca2', date: '2026-04-21', subjectName: 'English language' },
    { id: 'grd-108', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'English language Mid-Term', score: 17, category: 'mid_term', date: '2026-05-03', subjectName: 'English language' },

    { id: 'grd-109', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'Basic Science and Technology 3rd Term Exam', score: 50, category: 'exam', date: '2026-05-17', subjectName: 'Basic Science and Technology' },
    { id: 'grd-110', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'Basic Science CA Test 1', score: 9, category: 'ca1', date: '2026-04-12', subjectName: 'Basic Science and Technology' },
    { id: 'grd-111', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'Basic Science Notebook', score: 8, category: 'ca2', date: '2026-04-22', subjectName: 'Basic Science and Technology' },
    { id: 'grd-112', studentId: 'stud-1', classId: 'cls-9', assignmentName: 'Basic Science Mid-Term', score: 18, category: 'mid_term', date: '2026-05-04', subjectName: 'Basic Science and Technology' },

    // Chloe Bennett (stud-4) - JSS 2B (cls-9)
    { id: 'grd-121', studentId: 'stud-4', classId: 'cls-9', assignmentName: 'Mathematics 3rd Term Exam', score: 58, category: 'exam', date: '2026-05-15', subjectName: 'Mathematics', feedback: 'Exceptional math skills' },
    { id: 'grd-122', studentId: 'stud-4', classId: 'cls-9', assignmentName: 'Mathematics CA Test 1', score: 10, category: 'ca1', date: '2026-04-10', subjectName: 'Mathematics' },
    { id: 'grd-123', studentId: 'stud-4', classId: 'cls-9', assignmentName: 'Mathematics Notebook & Project', score: 10, category: 'ca2', date: '2026-04-20', subjectName: 'Mathematics' },
    { id: 'grd-124', studentId: 'stud-4', classId: 'cls-9', assignmentName: 'Mathematics Mid-Term Assessment', score: 19, category: 'mid_term', date: '2026-05-02', subjectName: 'Mathematics' },

    // Emily Foley (stud-2) - SSS 2B (cls-8)
    { id: 'grd-201', studentId: 'stud-2', classId: 'cls-8', assignmentName: 'Mathematics 3rd Term Exam', score: 56, category: 'exam', date: '2026-05-15', subjectName: 'Mathematics', feedback: 'Outstanding performance in calculus' },
    { id: 'grd-202', studentId: 'stud-2', classId: 'cls-8', assignmentName: 'Mathematics CA Test 1', score: 10, category: 'ca1', date: '2026-04-10', subjectName: 'Mathematics' },
    { id: 'grd-203', studentId: 'stud-2', classId: 'cls-8', assignmentName: 'Mathematics Notebook', score: 10, category: 'ca2', date: '2026-04-20', subjectName: 'Mathematics' },
    { id: 'grd-204', studentId: 'stud-2', classId: 'cls-8', assignmentName: 'Mathematics Mid-Term Assessment', score: 19, category: 'mid_term', date: '2026-05-02', subjectName: 'Mathematics' },

    { id: 'grd-205', studentId: 'stud-2', classId: 'cls-8', assignmentName: 'Physics 3rd Term Exam', score: 55, category: 'exam', date: '2026-05-16', subjectName: 'Physics' },
    { id: 'grd-206', studentId: 'stud-2', classId: 'cls-8', assignmentName: 'Physics CA Test 1', score: 9, category: 'ca1', date: '2026-04-11', subjectName: 'Physics' },
    { id: 'grd-207', studentId: 'stud-2', classId: 'cls-8', assignmentName: 'Physics Notebook', score: 10, category: 'ca2', date: '2026-04-21', subjectName: 'Physics' },
    { id: 'grd-208', studentId: 'stud-2', classId: 'cls-8', assignmentName: 'Physics Mid-Term Assessment', score: 19, category: 'mid_term', date: '2026-05-03', subjectName: 'Physics' },

    // Oliver Stewart (stud-3) - SSS 1B (cls-7)
    { id: 'grd-301', studentId: 'stud-3', classId: 'cls-7', assignmentName: 'Mathematics 3rd Term Exam', score: 48, category: 'exam', date: '2026-05-15', subjectName: 'Mathematics' },
    { id: 'grd-302', studentId: 'stud-3', classId: 'cls-7', assignmentName: 'Mathematics CA Test 1', score: 8, category: 'ca1', date: '2026-04-10', subjectName: 'Mathematics' },
    { id: 'grd-303', studentId: 'stud-3', classId: 'cls-7', assignmentName: 'Mathematics Notebook', score: 8, category: 'ca2', date: '2026-04-20', subjectName: 'Mathematics' },
    { id: 'grd-304', studentId: 'stud-3', classId: 'cls-7', assignmentName: 'Mathematics Mid-Term Assessment', score: 16, category: 'mid_term', date: '2026-05-02', subjectName: 'Mathematics' },

    // Nathan Drake (stud-5) - SSS 2B (cls-8)
    { id: 'grd-501', studentId: 'stud-5', classId: 'cls-8', assignmentName: 'Mathematics 3rd Term Exam', score: 51, category: 'exam', date: '2026-05-15', subjectName: 'Mathematics' },
    { id: 'grd-502', studentId: 'stud-5', classId: 'cls-8', assignmentName: 'Mathematics CA Test 1', score: 9, category: 'ca1', date: '2026-04-10', subjectName: 'Mathematics' },
    { id: 'grd-503', studentId: 'stud-5', classId: 'cls-8', assignmentName: 'Mathematics Notebook', score: 8, category: 'ca2', date: '2026-04-20', subjectName: 'Mathematics' },
    { id: 'grd-504', studentId: 'stud-5', classId: 'cls-8', assignmentName: 'Mathematics Mid-Term Assessment', score: 17, category: 'mid_term', date: '2026-05-02', subjectName: 'Mathematics' },

    // Baseline individual assignments
    { id: 'grd-1', studentId: 'stud-1', classId: 'cls-1', assignmentName: 'Midterm Exam', score: 88, category: 'exam', date: '2026-03-15', feedback: 'Great job with multi-step equations!' },
    { id: 'grd-2', studentId: 'stud-3', classId: 'cls-1', assignmentName: 'Midterm Exam', score: 74, category: 'exam', date: '2026-03-15', feedback: 'Review quadratic factoring.' },
    { id: 'grd-3', studentId: 'stud-4', classId: 'cls-1', assignmentName: 'Midterm Exam', score: 95, category: 'exam', date: '2026-03-15', feedback: 'Perfect scores on word problems.' },
    { id: 'grd-4', studentId: 'stud-1', classId: 'cls-1', assignmentName: 'Quadratic Equations Quiz', score: 92, category: 'quiz', date: '2026-04-05', feedback: 'Strong performance' },
    { id: 'grd-5', studentId: 'stud-3', classId: 'cls-1', assignmentName: 'Quadratic Equations Quiz', score: 80, category: 'quiz', date: '2026-04-05', feedback: 'Improved significantly' },
    { id: 'grd-6', studentId: 'stud-2', classId: 'cls-2', assignmentName: 'Limits & Continuity Test', score: 94, category: 'exam', date: '2026-02-28', feedback: 'Fantastic work on epsilon-delta details' },
    { id: 'grd-7', studentId: 'stud-5', classId: 'cls-2', assignmentName: 'Limits & Continuity Test', score: 85, category: 'exam', date: '2026-02-28', feedback: 'Check calculations on non-existent limit cases' },
    { id: 'grd-8', studentId: 'stud-2', classId: 'cls-2', assignmentName: 'Derivatives Homework Portfolio', score: 100, category: 'homework', date: '2026-04-12', feedback: 'Extremely neat and well documented' },
    { id: 'grd-9', studentId: 'stud-2', classId: 'cls-3', assignmentName: 'Kinematics Lab Report', score: 91, category: 'project', date: '2026-03-10', feedback: 'Very analytical conclusion section' },
    { id: 'grd-10', studentId: 'stud-5', classId: 'cls-3', assignmentName: 'Kinematics Lab Report', score: 93, category: 'project', date: '2026-03-10', feedback: 'Clean error analysis charts' },
    { id: 'grd-11', studentId: 'stud-3', classId: 'cls-3', assignmentName: 'Kinematics Lab Report', score: 82, category: 'project', date: '2026-03-10', feedback: 'Include references next time' },
    { id: 'grd-12', studentId: 'stud-3', classId: 'cls-3', assignmentName: 'Newtonian Motion Test', score: 78, category: 'exam', date: '2026-04-02', feedback: 'Review incline friction forces' }
  ],
  attendance: [
    { id: 'att-1', studentId: 'stud-1', classId: 'cls-9', date: '2026-05-29', status: 'present' },
    { id: 'att-2', studentId: 'stud-4', classId: 'cls-9', date: '2026-05-29', status: 'present' },
    { id: 'att-3', studentId: 'stud-1', classId: 'cls-9', date: '2026-05-30', status: 'present' },
    { id: 'att-4', studentId: 'stud-4', classId: 'cls-9', date: '2026-05-30', status: 'present' },
    { id: 'att-5', studentId: 'stud-2', classId: 'cls-8', date: '2026-05-29', status: 'present' },
    { id: 'att-6', studentId: 'stud-5', classId: 'cls-8', date: '2026-05-29', status: 'tardy', notes: 'Late 10 mins (Bus delay)' },
    { id: 'att-7', studentId: 'stud-3', classId: 'cls-7', date: '2026-05-29', status: 'present' },
    { id: 'att-8', studentId: 'stud-8', classId: 'cls-7', date: '2026-05-29', status: 'present' }
  ],
  reportComments: [
    {
      id: 'rc-1',
      studentId: 'stud-1',
      classId: 'cls-9',
      term: '3rd Term',
      teacherComment: 'Tommy exhibits exceptional dedication and enthusiasm in Mathematics and Sciences.',
      principalComment: 'A very promising young scholar with tremendous character.',
      attentiveness: 'Excellent',
      cooperation: 'Excellent',
      attitudeToWork: 'Very Good',
      socialIntegration: 'Excellent'
    },
    {
      id: 'rc-2',
      studentId: 'stud-4',
      classId: 'cls-9',
      term: '3rd Term',
      teacherComment: 'Chloe is an outstanding student with a brilliant problem-solving analytical mind.',
      principalComment: 'Distinguished scholastic excellence throughout the term.',
      attentiveness: 'Excellent',
      cooperation: 'Excellent',
      attitudeToWork: 'Excellent',
      socialIntegration: 'Excellent'
    },
    {
      id: 'rc-3',
      studentId: 'stud-2',
      classId: 'cls-8',
      term: '3rd Term',
      teacherComment: 'Emily maintains a superior academic record across both Pure and Applied Sciences.',
      principalComment: 'Consistently exceptional. Highly commendable performance.',
      attentiveness: 'Excellent',
      cooperation: 'Excellent',
      attitudeToWork: 'Excellent',
      socialIntegration: 'Excellent'
    }
  ],
  tests: [
    {
      id: 'tst-1',
      classId: 'cls-9',
      title: 'Equations Differentiation Test A',
      category: 'Objective',
      maxScore: 20,
      instructions: 'Answer all 20 multiple choice questions. No calculators allowed.',
      date: '2026-05-25',
      submitsCount: 2,
      subject: 'Mathematics'
    }
  ],
  lessonNotes: [
    {
      id: 'note-1',
      classId: 'cls-9',
      topic: 'Introduction to Core Quadratic Functions',
      category: 'Algebra Core',
      objectives: 'To define quadratic equation variables and identify axis of symmetry.',
      body: 'Standard form is Ax^2 + Bx + C = 0. Explaining graphs and parabolic vertex points manually with standard tables.',
      date: '2026-05-28',
      status: 'Published',
      subject: 'Mathematics'
    },
    {
      id: 'note-2',
      classId: 'cls-9',
      topic: 'Quadratic Factoring Methods',
      category: 'Factoring Techniques',
      objectives: 'To factor expressions using difference of squares and quadratic formula.',
      body: 'Reviewing cross multiplication and formula x = (-b +/- sqrt(b^2 - 4ac)) / 2a. Practice exercises on sheet 3.',
      date: '2026-05-30',
      status: 'Published',
      subject: 'Mathematics'
    }
  ]
};

// Legacy supabase constant kept for compatibility with components referencing it
export const supabase = null;

class DatabaseManager {
  private state: DbState;
  public isCloudSynced: boolean = true;
  public syncError: string | null = null;
  public isMigrating: boolean = false;
  private lastWriteTime: number = 0;
  private deletedIds: Set<string> = new Set<string>();

  private loadDeletedIds(): void {
    try {
      const raw = safeLocalStorageGet('school_deleted_records');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(id => {
            if (id) this.deletedIds.add(id);
          });
        }
      }
    } catch (e) {
      // ignore
    }
    if (this.state && Array.isArray(this.state.deletedRecordIds)) {
      this.state.deletedRecordIds.forEach(id => {
        if (id) this.deletedIds.add(id);
      });
    }
  }

  private saveDeletedIds(): void {
    try {
      const arr = Array.from(this.deletedIds);
      safeLocalStorageSet('school_deleted_records', JSON.stringify(arr));
      if (this.state) {
        this.state.deletedRecordIds = arr;
      }
    } catch (e) {
      // ignore
    }
  }

  private getEmptyState(): DbState {
    return {
      users: [],
      teachers: [],
      students: [],
      parents: [],
      classes: [],
      enrollments: [],
      grades: [],
      attendance: [],
      reportComments: [],
      tests: [],
      lessonNotes: [],
      settings: {},
      deletedRecordIds: []
    };
  }

  /**
   * Structural integrity check: Guarantees that array lists and object settings exist,
   * are free of duplicate IDs, and strictly exclude any deleted records.
   */
  public ensureStructuralIntegrity(): void {
    if (!this.state) {
      this.state = this.getEmptyState();
    }

    if (Array.isArray(this.state.deletedRecordIds)) {
      this.state.deletedRecordIds.forEach(id => {
        if (id) this.deletedIds.add(id);
      });
    }

    const filterDeleted = <T extends { id: string }>(items: T[] = []): T[] => {
      if (!Array.isArray(items)) return [];
      return items.filter(item => item && item.id && !this.deletedIds.has(item.id));
    };

    this.state.users = dedupeBy(filterDeleted(this.state.users), u => u.id);
    this.state.teachers = dedupeBy(filterDeleted(this.state.teachers), t => t.id);
    this.state.students = dedupeBy(filterDeleted(this.state.students), s => s.id);
    this.state.parents = dedupeBy(filterDeleted(this.state.parents), p => p.id);
    this.state.classes = dedupeBy(filterDeleted(this.state.classes), c => c.id);
    this.state.enrollments = dedupeBy(filterDeleted(this.state.enrollments), e => e.id || `${e.studentId}___${e.classId}`);
    this.state.grades = dedupeBy(filterDeleted(this.state.grades), g => g.id);
    this.state.attendance = dedupeBy(filterDeleted(this.state.attendance), a => a.id || `${a.studentId}___${a.classId}___${a.date}`);
    this.state.reportComments = dedupeBy(filterDeleted(this.state.reportComments), rc => rc.id || `${rc.studentId}___${rc.classId}___${rc.term}`);
    this.state.tests = dedupeBy(filterDeleted(this.state.tests), t => t.id);
    this.state.lessonNotes = dedupeBy(filterDeleted(this.state.lessonNotes), n => n.id);
    this.state.settings = this.state.settings || {};
    this.state.deletedRecordIds = Array.from(this.deletedIds);

    // Ensure initial admin user exists only if completely zero users exist in the system and admin was not deleted
    if (this.state.users.length === 0 && !this.deletedIds.has('usr-admin-1')) {
      this.state.users.push({
        id: 'usr-admin-1',
        email: 'realayanwunmi@gmail.com',
        role: 'admin',
        fullName: 'Principal Ayanniyi',
        createdAt: '2026-01-10T08:00:00Z',
        permissions: ['mark_attendance', 'upload_scores', 'upload_notes', 'create_assessments', 'enter_comments', 'view_edit_form_class', 'view_edit_subject']
      });
    }

    // Clean up duplicate childIds in parents and remove deleted students
    this.state.parents.forEach(p => {
      if (Array.isArray(p.childIds)) {
        p.childIds = Array.from(new Set(p.childIds.filter(id => !this.deletedIds.has(id))));
      } else {
        p.childIds = [];
      }
    });
  }

  /**
   * Alias for backward compatibility
   */
  public ensureBaselineIntegrity(): void {
    this.ensureStructuralIntegrity();
  }

  /**
   * Intelligently merges remote state into local state without wiping out newly added or modified local entities,
   * while strictly respecting all deleted records across sessions.
   */
  public applyRemoteState(remote: DbState): void {
    if (!remote) return;

    // Adopt any deletedRecordIds from remote
    if (Array.isArray(remote.deletedRecordIds)) {
      remote.deletedRecordIds.forEach(id => {
        if (id) this.deletedIds.add(id);
      });
      this.saveDeletedIds();
    }

    // Active local write window: if user performed modifications on this client within the last 8 seconds
    const isRecentLocalWrite = Date.now() - this.lastWriteTime < 8000;

    const sanitizeList = <T extends { id: string }>(items: T[] = [], dedupeKey: (item: T) => string = (i) => i.id): T[] => {
      if (!Array.isArray(items)) return [];
      const list = items.filter(item => item && item.id && !this.deletedIds.has(item.id));
      return dedupeBy(list, dedupeKey);
    };

    let nextState: DbState;

    if (!isRecentLocalWrite) {
      // Normal remote synchronization: remote authoritative state replaces local state cleanly
      nextState = {
        users: sanitizeList(remote.users || []),
        teachers: sanitizeList(remote.teachers || []),
        students: sanitizeList(remote.students || []),
        parents: sanitizeList(remote.parents || []),
        classes: sanitizeList(remote.classes || []),
        enrollments: sanitizeList(remote.enrollments || [], e => e.id || `${e.studentId}___${e.classId}`),
        grades: sanitizeList(remote.grades || []),
        attendance: sanitizeList(remote.attendance || [], a => a.id || `${a.studentId}___${a.classId}___${a.date}`),
        reportComments: sanitizeList(remote.reportComments || [], rc => rc.id || `${rc.studentId}___${rc.classId}___${rc.term}`),
        tests: sanitizeList(remote.tests || []),
        lessonNotes: sanitizeList(remote.lessonNotes || []),
        settings: { ...(this.state?.settings || {}), ...(remote.settings || {}) },
        deletedRecordIds: Array.from(this.deletedIds)
      };
    } else {
      // In-flight active local write window: merge local additions with remote
      const mergeCollection = <T extends { id: string }>(
        localItems: T[] = [],
        remoteItems: T[] = [],
        dedupeKey: (item: T) => string = (i) => i.id
      ): T[] => {
        const mergedMap = new Map<string, T>();

        // 1. Add remote items if not deleted
        for (const item of remoteItems || []) {
          if (!item || !item.id || this.deletedIds.has(item.id)) continue;
          const key = dedupeKey(item);
          mergedMap.set(key, item);
        }

        // 2. Keep local items that are new or in-flight (excluding deleted)
        for (const item of localItems || []) {
          if (!item || !item.id || this.deletedIds.has(item.id)) continue;
          const key = dedupeKey(item);
          if (!mergedMap.has(key)) {
            mergedMap.set(key, item);
          } else {
            mergedMap.set(key, item);
          }
        }

        return Array.from(mergedMap.values());
      };

      nextState = {
        users: mergeCollection(this.state.users, remote.users),
        teachers: mergeCollection(this.state.teachers, remote.teachers),
        students: mergeCollection(this.state.students, remote.students),
        parents: mergeCollection(this.state.parents, remote.parents),
        classes: mergeCollection(this.state.classes, remote.classes),
        enrollments: mergeCollection(this.state.enrollments, remote.enrollments, e => e.id || `${e.studentId}___${e.classId}`),
        grades: mergeCollection(this.state.grades, remote.grades),
        attendance: mergeCollection(this.state.attendance, remote.attendance, a => a.id || `${a.studentId}___${a.classId}___${a.date}`),
        reportComments: mergeCollection(this.state.reportComments, remote.reportComments, rc => rc.id || `${rc.studentId}___${rc.classId}___${rc.term}`),
        tests: mergeCollection(this.state.tests, remote.tests),
        lessonNotes: mergeCollection(this.state.lessonNotes, remote.lessonNotes),
        settings: { ...(remote.settings || {}), ...(this.state.settings || {}) },
        deletedRecordIds: Array.from(this.deletedIds)
      };
    }

    // Prevent needless re-renders if data is identical
    const currentSerialized = JSON.stringify(this.state);
    const nextSerialized = JSON.stringify(nextState);

    if (currentSerialized === nextSerialized) {
      return;
    }

    this.state = nextState;
    this.ensureStructuralIntegrity();

    // Propagate settings to local cache for fast synchronous component reads
    if (this.state.settings && typeof this.state.settings === 'object') {
      for (const [k, v] of Object.entries(this.state.settings)) {
        if (v !== undefined && v !== null) {
          safeLocalStorageSet(k, typeof v === 'string' ? v : JSON.stringify(v));
        }
      }
    }

    safeLocalStorageSet(DB_STORAGE_KEY, JSON.stringify(this.state));
    this.isCloudSynced = true;
    this.syncError = null;

    // If local state had newly created items that remote lacked, push the merged state back to cloud
    if (isRecentLocalWrite) {
      this.triggerDebouncedPush();
    }

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
      if (this.state.settings) {
        safeDispatch(new CustomEvent('school_settings_changed', {
          detail: {
            name: this.state.settings['settings_school_name'],
            theme: this.state.settings['settings_color_theme'],
            logo: this.state.settings['settings_school_logo']
          }
        }));
      }
    }
  }

  public mergeRemoteStateSafely(remote: DbState): void {
    this.applyRemoteState(remote);
  }

  /**
   * Reads or sets persistent school-wide configuration settings
   */
  public getSetting<T = any>(key: string, defaultValue: T | null = null): T | null {
    if (this.state.settings && this.state.settings[key] !== undefined) {
      return this.state.settings[key] as T;
    }
    const raw = safeLocalStorageGet(key);
    if (raw !== null && raw !== undefined) {
      try {
        return JSON.parse(raw) as T;
      } catch (e) {
        return raw as unknown as T;
      }
    }
    return defaultValue;
  }

  public async saveSetting(key: string, value: any): Promise<void> {
    if (!this.state.settings) {
      this.state.settings = {};
    }
    this.state.settings[key] = value;
    const valString = typeof value === 'string' ? value : JSON.stringify(value);
    safeLocalStorageSet(key, valString);
    this.saveLocalBackup();

    if (key === 'settings_school_name' || key === 'settings_color_theme' || key === 'settings_school_logo') {
      if (typeof window !== 'undefined') {
        safeDispatch(new CustomEvent('school_settings_changed', {
          detail: {
            name: this.state.settings['settings_school_name'],
            theme: this.state.settings['settings_color_theme'],
            logo: this.state.settings['settings_school_logo']
          }
        }));
      }
    }
  }

  private syncTimeout: any = null;

  constructor() {
    this.loadDeletedIds();
    
    // Initial State Hydration: read local storage cache or load default initial data
    const raw = safeLocalStorageGet(DB_STORAGE_KEY);
    if (raw) {
      try {
        this.state = JSON.parse(raw);
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(INITIAL_DB));
      }
    } else {
      this.state = JSON.parse(JSON.stringify(INITIAL_DB));
    }

    this.ensureStructuralIntegrity();

    // Multi-tab synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === DB_STORAGE_KEY) {
          this.reload();
          safeDispatch(new CustomEvent('database_updated'));
        }
      });

      // Synchronize with Cloud Firestore and Cloud SQL backend on startup
      this.initFirestoreListener();
      this.fetchFromFirestore();
      this.fetchFromBackend();

      // Window focus and visibility listeners for smooth resume
      window.addEventListener('focus', () => {
        if (Date.now() - this.lastWriteTime > 6000) {
          this.fetchFromFirestore();
        }
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && Date.now() - this.lastWriteTime > 6000) {
          this.fetchFromFirestore();
        }
      });

      // Low-frequency periodic health check without competing polling
      setInterval(() => {
        if (Date.now() - this.lastWriteTime > 10000) {
          this.fetchFromFirestore();
        }
      }, 15000);
    }
  }

  /**
   * Listens for real-time changes to the authoritative database in Google Cloud Firestore
   */
  private initFirestoreListener(): void {
    try {
      if (typeof window === 'undefined' || !firestoreDb) return;
      const stateDocRef = doc(firestoreDb, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      onSnapshot(
        stateDocRef,
        (snap) => {
          if (snap.exists()) {
            const cloudData = snap.data();
            if (cloudData && cloudData.data && Array.isArray(cloudData.data.users) && cloudData.data.users.length > 0) {
              const remote = cloudData.data as DbState;
              this.applyRemoteState(remote);
            }
          }
        },
        (err) => {
          console.warn('Firestore live sync listener notice:', err);
        }
      );
    } catch (err) {
      console.warn('Firestore listener setup warning:', err);
    }
  }

  /**
   * Fetches latest authoritative state from Google Cloud Firestore
   */
  public async fetchFromFirestore(): Promise<void> {
    try {
      if (typeof window === 'undefined' || !firestoreDb) return;
      const stateDocRef = doc(firestoreDb, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      const snap = await getDoc(stateDocRef);
      if (snap.exists()) {
        const cloudData = snap.data();
        if (cloudData && cloudData.data && Array.isArray(cloudData.data.users) && cloudData.data.users.length > 0) {
          const remote = cloudData.data as DbState;
          this.applyRemoteState(remote);
        }
      }
    } catch (e) {
      console.warn('Firestore fetchState notice:', e);
    }
  }

  /**
   * Fetches latest authoritative state from backend Google Cloud SQL and applies if newer.
   */
  public async fetchFromBackend(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      const res = await fetch('/api/db/state');
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.data) {
        const serverState = json.data as DbState;
        if (serverState && Array.isArray(serverState.users) && serverState.users.length > 0) {
          this.applyRemoteState(serverState);
        } else {
          this.pushToBackend();
        }
      }
    } catch (e) {
      // Background sync silently catches network glitches
    }
  }

  /**
   * Pushes the current local state to both Google Cloud Firestore and backend Google Cloud SQL database.
   * Guarantees data permanence across republishes, restarts, and new devices.
   */
  public async pushToBackend(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      this.ensureStructuralIntegrity();

      // 1. Persist to Cloud SQL / Express backend
      fetch('/api/db/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: this.state })
      }).catch(err => console.warn('SQL backend sync warning:', err));

      // 2. Persist to Google Cloud Firestore (permanent cloud database unharmed by republishing)
      if (firestoreDb) {
        const stateDocRef = doc(firestoreDb, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
        setDoc(
          stateDocRef,
          {
            data: this.state,
            updatedAt: new Date().toISOString(),
            appId: 'ai-studio-schoolmanagement'
          }
        ).catch(err => console.warn('Firestore cloud sync warning:', err));
      }
    } catch (e) {
      console.warn('Background sync error:', e);
    }
  }

  public async publishAndSyncCloud(): Promise<boolean> {
    this.ensureStructuralIntegrity();
    await this.pushToBackend();
    return true;
  }

  public async migrateAllLocalDataToCloud(): Promise<{ success: boolean; count: number; error?: string }> {
    this.ensureStructuralIntegrity();
    this.saveLocalBackup();
    await this.pushToBackend();
    const totalCount =
      (this.state.users?.length || 0) +
      (this.state.students?.length || 0) +
      (this.state.teachers?.length || 0) +
      (this.state.classes?.length || 0) +
      (this.state.grades?.length || 0) +
      (this.state.attendance?.length || 0);

    return { success: true, count: totalCount };
  }

  public async syncWithCloud(): Promise<boolean> {
    await this.fetchFromBackend();
    return true;
  }

  private asyncSaveFirestore(_collectionName: string, _row?: any, _deleteId?: string) {
    this.triggerDebouncedPush();
  }

  private asyncSaveSupabase(tableName: string, row: any, deleteId?: string) {
    this.triggerDebouncedPush();
  }

  private triggerDebouncedPush(immediate: boolean = false): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    if (immediate) {
      this.pushToBackend();
    } else {
      this.syncTimeout = setTimeout(() => {
        this.pushToBackend();
      }, 150);
    }
  }

  public reload() {
    const raw = safeLocalStorageGet(DB_STORAGE_KEY);
    if (raw) {
      try {
        this.state = JSON.parse(raw);
        this.ensureBaselineIntegrity();
      } catch (e) {
        this.ensureBaselineIntegrity();
      }
    }
  }

  private saveLocalBackup() {
    this.lastWriteTime = Date.now();
    safeLocalStorageSet(DB_STORAGE_KEY, JSON.stringify(this.state));
    this.triggerDebouncedPush();
    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }
  }

  public getRawData(): DbState {
    this.ensureBaselineIntegrity();
    if (this.state.classes) {
      this.state.classes = sortClasses(this.state.classes);
    }
    return { ...this.state };
  }

  public saveTestsList(tests: any[]) {
    const previousTests = this.state.tests || [];
    this.state.tests = tests;
    this.saveLocalBackup();

    const currentIds = new Set(tests.map(t => t.id));
    previousTests.forEach(t => {
      if (!currentIds.has(t.id)) {
        this.asyncSaveFirestore('tests', null, t.id);
      }
    });
    tests.forEach(test => {
      this.asyncSaveFirestore('tests', test);
    });
  }

  public saveLessonNotesList(notes: any[]) {
    const previousNotes = this.state.lessonNotes || [];
    this.state.lessonNotes = notes;
    this.saveLocalBackup();

    const currentIds = new Set(notes.map(n => n.id));
    previousNotes.forEach(n => {
      if (!currentIds.has(n.id)) {
        this.asyncSaveFirestore('lesson_notes', null, n.id);
      }
    });
    notes.forEach(note => {
      this.asyncSaveFirestore('lesson_notes', note);
    });
  }

  // --- REPORT CARD COMMENTS ---
  public getReportCommentsForClass(classId: string): ReportComment[] {
    if (!this.state.reportComments) this.state.reportComments = [];
    return this.state.reportComments.filter(rc => rc.classId === classId);
  }

  public getReportCommentsForStudent(studentId: string): ReportComment[] {
    if (!this.state.reportComments) this.state.reportComments = [];
    return this.state.reportComments.filter(rc => rc.studentId === studentId);
  }

  public saveReportComment(
    studentId: string,
    classId: string,
    term: string,
    teacherComment: string,
    principalComment?: string,
    attentiveness?: string,
    cooperation?: string,
    attitudeToWork?: string,
    socialIntegration?: string,
    session?: string
  ): ReportComment {
    if (!this.state.reportComments) this.state.reportComments = [];
    const activeSession = session || localStorage.getItem('academic_session') || '2025/2026';
    const existingIndex = this.state.reportComments.findIndex(
      rc => rc.studentId === studentId && 
            rc.classId === classId && 
            (rc.term === term || rc.term.startsWith(term)) &&
            (rc.session === activeSession || !rc.session)
    );

    let finalComment: ReportComment;

    if (existingIndex !== -1) {
      this.state.reportComments[existingIndex] = {
        ...this.state.reportComments[existingIndex],
        term,
        session: activeSession,
        teacherComment,
        ...(principalComment !== undefined ? { principalComment } : {}),
        ...(attentiveness !== undefined ? { attentiveness } : {}),
        ...(cooperation !== undefined ? { cooperation } : {}),
        ...(attitudeToWork !== undefined ? { attitudeToWork } : {}),
        ...(socialIntegration !== undefined ? { socialIntegration } : {})
      };
      finalComment = this.state.reportComments[existingIndex];
    } else {
      const id = `rc-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const newComment: ReportComment = {
        id,
        studentId,
        classId,
        term,
        session: activeSession,
        teacherComment,
        principalComment,
        attentiveness,
        cooperation,
        attitudeToWork,
        socialIntegration
      };
      this.state.reportComments.push(newComment);
      finalComment = newComment;
    }

    this.saveLocalBackup();
    this.asyncSaveFirestore('report_comments', finalComment);
    return finalComment;
  }

  public resetDatabase() {
    this.deletedIds.clear();
    this.saveDeletedIds();
    this.state = JSON.parse(JSON.stringify(INITIAL_DB));
    this.ensureBaselineIntegrity();
    this.saveLocalBackup();
    this.migrateAllLocalDataToCloud();
    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }
  }

  // --- AUTH METHODS ---
  public signIn(email: string, password?: string): User | null {
    this.ensureBaselineIntegrity();
    const user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return null;

    if (user.password && user.password !== password) {
      return null;
    }

    return user;
  }

  public updateUserPassword(userId: string, password?: string): boolean {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      if (password === undefined || password === '') {
        delete user.password;
      } else {
        user.password = password;
      }
      this.saveLocalBackup();
      this.asyncSaveFirestore('users', user);
      return true;
    }
    return false;
  }

  public updateUserAvatar(userId: string, avatarUrl: string): boolean {
    const user = this.state.users.find(u => u.id === userId);
    if (user) {
      user.avatarUrl = avatarUrl;
      this.saveLocalBackup();
      this.asyncSaveFirestore('users', user);
      return true;
    }
    return false;
  }

  public signUp(email: string, fullName: string, role: UserRole, permissions?: string[]): User {
    const existing = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      if (permissions) {
        existing.permissions = permissions;
        this.saveLocalBackup();
        this.asyncSaveFirestore('users', existing);
      }
      return existing;
    }

    const defaultPermissions = role === 'teacher' ? [
      'mark_attendance', 'upload_scores', 'upload_notes', 'create_assessments', 'enter_comments', 'view_edit_form_class', 'view_edit_subject'
    ] : role === 'admin' ? [
      'mark_attendance', 'upload_scores', 'upload_notes', 'create_assessments', 'enter_comments', 'view_edit_form_class', 'view_edit_subject'
    ] : [];

    const userId = `usr-${role}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newUser: User = {
      id: userId,
      email: email.trim().toLowerCase(),
      role,
      fullName: fullName.trim(),
      createdAt: new Date().toISOString(),
      permissions: permissions || defaultPermissions
    };

    this.state.users.push(newUser);

    let newTeach: Teacher | null = null;
    let newParent: Parent | null = null;

    if (role === 'teacher') {
      newTeach = {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        department: 'General Studies',
        status: 'Active'
      };
      this.state.teachers.push(newTeach);
    } else if (role === 'parent') {
      newParent = {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: '+234 (800) 000-0000',
        childIds: []
      };
      this.state.parents.push(newParent);
    }

    this.saveLocalBackup();
    
    this.asyncSaveFirestore('users', newUser);
    if (newTeach) this.asyncSaveFirestore('teachers', newTeach);
    if (newParent) this.asyncSaveFirestore('parents', newParent);

    return newUser;
  }

  public deleteUser(userId: string): boolean {
    const userIndex = this.state.users.findIndex(u => u.id === userId);
    let role = userIndex !== -1 ? this.state.users[userIndex].role : null;
    if (userIndex !== -1) {
      this.state.users.splice(userIndex, 1);
    }
    
    // Always clean up teacher records and assigned classes if teacher
    const isTeacher = this.state.teachers.some(t => t.id === userId) || role === 'teacher';
    if (isTeacher) {
      this.state.teachers = this.state.teachers.filter(t => t.id !== userId);
      this.state.classes = this.state.classes.map(c => {
        if (c.teacherId === userId) return { ...c, teacherId: '' };
        return c;
      });
      this.asyncSaveFirestore('teachers', null, userId);
    }

    const isParent = this.state.parents.some(p => p.id === userId) || role === 'parent';
    if (isParent) {
      this.state.parents = this.state.parents.filter(p => p.id !== userId);
      this.state.students = this.state.students.map(s => {
        if (s.parentId === userId) return { ...s, parentId: undefined };
        return s;
      });
      this.asyncSaveFirestore('parents', null, userId);
    }

    this.deletedIds.add(userId);
    this.saveDeletedIds();
    this.saveLocalBackup();

    this.asyncSaveFirestore('users', null, userId);

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }

    return true;
  }

  public deleteTeacher(teacherId: string): boolean {
    return this.deleteUser(teacherId);
  }

  public deleteStudent(studentId: string): boolean {
    const initialLen = this.state.students.length;
    this.state.students = this.state.students.filter(s => s.id !== studentId);
    if (this.state.students.length === initialLen) return false;

    const enrToDelete = this.state.enrollments.filter(e => e.studentId === studentId);
    const grdToDelete = this.state.grades.filter(g => g.studentId === studentId);
    const attToDelete = this.state.attendance.filter(a => a.studentId === studentId);

    this.state.enrollments = this.state.enrollments.filter(e => e.studentId !== studentId);
    this.state.grades = this.state.grades.filter(g => g.studentId !== studentId);
    this.state.attendance = this.state.attendance.filter(a => a.studentId !== studentId);
    
    this.state.parents = this.state.parents.map(p => {
      if (p.childIds && p.childIds.includes(studentId)) {
        const updateP = { ...p, childIds: p.childIds.filter(id => id !== studentId) };
        this.asyncSaveFirestore('parents', updateP);
        return updateP;
      }
      return p;
    });

    this.deletedIds.add(studentId);
    enrToDelete.forEach(e => this.deletedIds.add(e.id));
    grdToDelete.forEach(g => this.deletedIds.add(g.id));
    attToDelete.forEach(a => this.deletedIds.add(a.id));
    this.saveDeletedIds();

    this.saveLocalBackup();

    this.asyncSaveFirestore('students', null, studentId);
    enrToDelete.forEach(e => this.asyncSaveFirestore('enrollments', null, e.id));
    grdToDelete.forEach(g => this.asyncSaveFirestore('grades', null, g.id));
    attToDelete.forEach(a => this.asyncSaveFirestore('attendance', null, a.id));

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }

    return true;
  }

  public updateStudent(studentId: string, updates: Partial<Omit<Student, 'id'>>): Student | null {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return null;

    Object.assign(student, updates);

    // If gradeLevel changed, ensure enrollment in corresponding class
    if (updates.gradeLevel) {
      const matchingClass = this.state.classes.find(c => 
        c.name.toLowerCase() === updates.gradeLevel!.toLowerCase() ||
        c.code.toLowerCase() === updates.gradeLevel!.toLowerCase()
      );
      if (matchingClass) {
        this.enrollStudentInClass(studentId, matchingClass.id);
      }
    }

    this.saveLocalBackup();
    this.asyncSaveFirestore('students', student);
    return student;
  }

  public updateUserPermissions(userId: string, permissions: string[]): boolean {
    const user = this.state.users.find(u => u.id === userId);
    if (!user) return false;
    user.permissions = permissions;
    this.saveLocalBackup();
    this.asyncSaveFirestore('users', user);
    return true;
  }

  // --- CLASSES ---
  public getAllClasses(): Class[] {
    this.ensureBaselineIntegrity();
    return sortClasses([...this.state.classes]);
  }

  private getSubjectsForClassLevel(level: string): string[] {
    if (level === 'Junior Secondary') {
      const saved = safeLocalStorageGet('settings_jss_subjects');
      return saved ? JSON.parse(saved) : [
        "Mathematics", "Basic Science and Technology", "Religious and National Value", "History",
        "Prevocational Studies", "Business Studies", "Literature", "Yoruba", "Cultural and Creative Arts",
        "French", "Music", "Christian Religious Knowledge", "Digital Technologies", "English language", "Diction"
      ];
    } else if (level === 'Senior Secondary') {
      const saved = safeLocalStorageGet('settings_sss_subjects');
      return saved ? JSON.parse(saved) : [
        "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Civic Education", "Geography", "Economics", "Literature in English"
      ];
    } else if (level === 'Primary') {
      return ["Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education", "Computer Studies", "Creative Arts"];
    } else {
      return ["Numeracy", "Literacy", "Sensory Activity", "Creative Art", "Social Habit", "Health Education", "Science Experience"];
    }
  }

  public getTeacherClasses(teacherId: string): Class[] {
    this.ensureBaselineIntegrity();
    const teacher = this.state.teachers.find(t => t.id === teacherId);
    const assignedSubjects = teacher?.subjects || [];
    
    const result = this.state.classes.filter(c => {
      if (c.teacherId === teacherId) return true;
      
      if (assignedSubjects.length > 0) {
        const level = c.levelOfEducation || 'Junior Secondary';
        let classSubjects = this.getSubjectsForClassLevel(level);
        try {
          const savedOverride = safeLocalStorageGet('class_subjects_override');
          if (savedOverride) {
            const overrides = JSON.parse(savedOverride);
            if (overrides && overrides[c.id]) {
              classSubjects = overrides[c.id];
            }
          }
        } catch (e) {}
        return classSubjects.some(sub => 
          assignedSubjects.some(asub => {
            const asubC = asub.trim().toLowerCase();
            const csubC = sub.trim().toLowerCase();
            const levelC = level.trim().toLowerCase();
            
            let baseSubject = asubC;
            let allowedLevel = "";

            if (asubC.endsWith('(jss)')) {
              baseSubject = asubC.substring(0, asubC.length - 5).trim();
              allowedLevel = 'junior secondary';
            } else if (asubC.endsWith('(sss)')) {
              baseSubject = asubC.substring(0, asubC.length - 5).trim();
              allowedLevel = 'senior secondary';
            } else if (asubC.endsWith('(primary)')) {
              baseSubject = asubC.substring(0, asubC.length - 9).trim();
              allowedLevel = 'primary';
            } else if (asubC.endsWith('(nursery)')) {
              baseSubject = asubC.substring(0, asubC.length - 9).trim();
              allowedLevel = 'nursery';
            }

            if (allowedLevel !== "") {
              if (levelC !== allowedLevel) return false;
              return baseSubject === csubC;
            }

            return asubC === csubC || asubC.includes(csubC) || csubC.includes(asubC);
          })
        );
      }
      
      return false;
    });

    if (result.length === 0) return sortClasses(this.state.classes);
    return sortClasses(result);
  }

  private ensureFormTeacherPermissions(teacherId: string): void {
    if (!teacherId) return;
    const user = this.state.users.find(u => u.id === teacherId);
    if (user && user.role === 'teacher') {
      const formTeacherPermissions = [
        'mark_attendance', 'upload_scores', 'upload_notes', 'create_assessments', 'enter_comments', 'view_edit_form_class'
      ];
      const currentPermissions = user.permissions || [];
      const updatedPermissions = [...currentPermissions];
      let changed = false;

      formTeacherPermissions.forEach(perm => {
        if (!updatedPermissions.includes(perm)) {
          updatedPermissions.push(perm);
          changed = true;
        }
      });

      if (changed) {
        user.permissions = updatedPermissions;
        this.asyncSaveFirestore('users', user);
      }
    }
  }

  public createClass(name: string, code: string, teacherId: string, schedule: string, room: string, classFee?: number, extraFee?: number, promotionStatus?: string, levelOfEducation?: string): Class {
    const id = `cls-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newClass: Class = { id, name, code, teacherId, schedule, room, classFee, extraFee, promotionStatus, levelOfEducation };
    this.state.classes.push(newClass);
    if (teacherId) {
      this.ensureFormTeacherPermissions(teacherId);
    }
    this.saveLocalBackup();
    this.asyncSaveFirestore('classes', newClass);
    return newClass;
  }

  public updateClass(id: string, updates: Partial<Omit<Class, 'id'>>): Class | undefined {
    const cls = this.state.classes.find(c => c.id === id);
    if (cls) {
      Object.assign(cls, updates);
      if (updates.teacherId) {
        this.ensureFormTeacherPermissions(updates.teacherId);
      }
      this.saveLocalBackup();
      this.asyncSaveFirestore('classes', cls);
    }
    return cls;
  }

  public deleteClass(id: string): boolean {
    const initialLen = this.state.classes.length;
    this.state.classes = this.state.classes.filter(c => c.id !== id);
    
    const enrToDelete = this.state.enrollments.filter(e => e.classId === id);
    const grdToDelete = this.state.grades.filter(g => g.classId === id);
    const attToDelete = this.state.attendance.filter(a => a.classId === id);

    this.state.enrollments = this.state.enrollments.filter(e => e.classId !== id);
    this.state.grades = this.state.grades.filter(g => g.classId !== id);
    this.state.attendance = this.state.attendance.filter(a => a.classId !== id);

    this.deletedIds.add(id);
    enrToDelete.forEach(e => this.deletedIds.add(e.id));
    grdToDelete.forEach(g => this.deletedIds.add(g.id));
    attToDelete.forEach(a => this.deletedIds.add(a.id));
    this.saveDeletedIds();
    
    this.saveLocalBackup();

    this.asyncSaveFirestore('classes', null, id);
    enrToDelete.forEach(e => this.asyncSaveFirestore('enrollments', null, e.id));
    grdToDelete.forEach(g => this.asyncSaveFirestore('grades', null, g.id));
    attToDelete.forEach(a => this.asyncSaveFirestore('attendance', null, a.id));

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }

    return this.state.classes.length < initialLen;
  }

  // --- TEACHERS ---
  public getTeachers(): Teacher[] {
    this.ensureBaselineIntegrity();
    return [...this.state.teachers];
  }

  public getTeacherById(id: string): Teacher | undefined {
    this.ensureBaselineIntegrity();
    return this.state.teachers.find(t => t.id === id);
  }

  // --- STUDENTS ---
  public getStudents(): Student[] {
    this.ensureBaselineIntegrity();
    return dedupeBy([...this.state.students], s => s.id);
  }

  public getStudentsInClass(classId: string): Student[] {
    this.ensureBaselineIntegrity();
    const enrolledIds = new Set(
      this.state.enrollments
        .filter(e => e.classId === classId)
        .map(e => e.studentId)
    );

    const enrolledMap = new Map<string, Student>();
    for (const s of this.state.students) {
      if (s && s.id && enrolledIds.has(s.id)) {
        enrolledMap.set(s.id, s);
      }
    }
    let enrolled = Array.from(enrolledMap.values());

    // Fallback: If no students are explicitly linked in this class yet,
    // ONLY match students who have no enrollments at all and whose gradeLevel corresponds to this class name or code!
    if (enrolled.length === 0) {
      const cls = this.state.classes.find(c => c.id === classId);
      if (cls) {
        const allEnrolledStudentIds = new Set(this.state.enrollments.map(e => e.studentId));
        const matched = this.state.students.filter(s => {
          if (!s || !s.gradeLevel || allEnrolledStudentIds.has(s.id)) return false;
          const gl = s.gradeLevel.toLowerCase().replace(/\s+/g, '');
          const cn = cls.name.toLowerCase().replace(/\s+/g, '');
          const cc = (cls.code || '').toLowerCase().replace(/\s+/g, '');
          return gl === cn || gl === cc || cn.includes(gl) || gl.includes(cn);
        });

        if (matched.length > 0) {
          matched.forEach(st => {
            if (st && st.id) {
              this.enrollStudentInClass(st.id, classId);
              enrolledMap.set(st.id, st);
            }
          });
          enrolled = Array.from(enrolledMap.values());
        }
      }
    }

    return dedupeBy(enrolled, s => s.id);
  }

  public getAvailableStudentsToEnroll(classId: string): Student[] {
    this.ensureBaselineIntegrity();
    const enrolledIds = new Set(
      this.state.enrollments
        .filter(e => e.classId === classId)
        .map(e => e.studentId)
    );
    return dedupeBy(this.state.students.filter(s => s && s.id && !enrolledIds.has(s.id)), s => s.id);
  }

  public createStudent(fullName: string, gradeLevel: string, rollNumber: string, birthDate: string, parentId?: string): Student {
    const id = `stud-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newStud: Student = { id, fullName, gradeLevel, rollNumber, birthDate, parentId };
    this.state.students.push(newStud);

    // Auto enroll in matching class
    const matchingClass = this.state.classes.find(c => 
      c.name.toLowerCase() === gradeLevel.toLowerCase() ||
      c.code.toLowerCase() === gradeLevel.toLowerCase()
    );
    if (matchingClass) {
      this.enrollStudentInClass(id, matchingClass.id);
    }

    let updatedParent: Parent | null = null;
    if (parentId) {
      const parent = this.state.parents.find(p => p.id === parentId);
      if (parent && !parent.childIds.includes(id)) {
        parent.childIds.push(id);
        updatedParent = parent;
      }
    }

    this.saveLocalBackup();

    this.asyncSaveFirestore('students', newStud);
    if (updatedParent) {
      this.asyncSaveFirestore('parents', updatedParent);
    }

    return newStud;
  }

  /**
   * Batch creates multiple students in a single atomic database operation.
   * Prevents event spamming, race conditions, and temporary rollback blips.
   */
  public createStudentsBulk(
    studentsData: Array<{
      fullName: string;
      gradeLevel: string;
      rollNumber: string;
      birthDate: string;
      parentId?: string;
    }>
  ): Student[] {
    this.ensureBaselineIntegrity();
    const createdStudents: Student[] = [];
    const timestamp = Date.now();

    studentsData.forEach((data, index) => {
      const id = `stud-${timestamp}-${index}-${Math.floor(Math.random() * 100000)}`;
      const newStud: Student = {
        id,
        fullName: data.fullName,
        gradeLevel: data.gradeLevel,
        rollNumber: data.rollNumber,
        birthDate: data.birthDate,
        parentId: data.parentId
      };
      this.state.students.push(newStud);
      createdStudents.push(newStud);

      // Auto enroll in matching class
      const matchingClass = this.state.classes.find(c => 
        c.name.toLowerCase() === data.gradeLevel.toLowerCase() ||
        c.code.toLowerCase() === data.gradeLevel.toLowerCase()
      );
      if (matchingClass) {
        const enrId = `enr-${timestamp}-${index}-${Math.floor(Math.random() * 100000)}`;
        this.state.enrollments.push({
          id: enrId,
          studentId: id,
          classId: matchingClass.id
        });
      }

      if (data.parentId) {
        const parent = this.state.parents.find(p => p.id === data.parentId);
        if (parent && !parent.childIds.includes(id)) {
          parent.childIds.push(id);
        }
      }
    });

    this.lastWriteTime = Date.now();
    this.ensureStructuralIntegrity();
    this.saveLocalBackup();
    this.pushToBackend();

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }

    return createdStudents;
  }

  // --- PARENTS ---
  public getParents(): Parent[] {
    this.ensureBaselineIntegrity();
    return [...this.state.parents];
  }

  public getParentById(id: string): Parent | undefined {
    this.ensureBaselineIntegrity();
    return this.state.parents.find(p => p.id === id);
  }

  public getParentChildren(parentId: string): Student[] {
    this.ensureBaselineIntegrity();
    const p = this.getParentById(parentId);
    if (!p) return [];
    return this.state.students.filter(s => p.childIds.includes(s.id));
  }

  public linkStudentToParent(studentId: string, parentId: string) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found');
    
    let oldParent: Parent | null = null;
    if (student.parentId) {
      const op = this.state.parents.find(p => p.id === student.parentId);
      if (op) {
        op.childIds = op.childIds.filter(cid => cid !== studentId);
        oldParent = op;
      }
    }

    student.parentId = parentId;
    const parent = this.state.parents.find(p => p.id === parentId);
    if (parent && !parent.childIds.includes(studentId)) {
      parent.childIds.push(studentId);
    }

    this.saveLocalBackup();

    this.asyncSaveFirestore('students', student);
    if (parent) this.asyncSaveFirestore('parents', parent);
    if (oldParent) this.asyncSaveFirestore('parents', oldParent);
  }

  public unlinkStudentFromParent(studentId: string) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) throw new Error('Student not found');

    let oldParent: Parent | null = null;
    if (student.parentId) {
      const parent = this.state.parents.find(p => p.id === student.parentId);
      if (parent) {
        parent.childIds = parent.childIds.filter(cid => cid !== studentId);
        oldParent = parent;
      }
      student.parentId = undefined;
    }

    this.saveLocalBackup();

    this.asyncSaveFirestore('students', student);
    if (oldParent) this.asyncSaveFirestore('parents', oldParent);
  }

  // --- ENROLLMENT ---
  public enrollStudentInClass(studentId: string, classId: string): Enrollment {
    const existing = this.state.enrollments.find(e => e.studentId === studentId && e.classId === classId);
    if (existing) return existing;

    const id = `enr-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newEnr: Enrollment = { id, studentId, classId };
    this.state.enrollments.push(newEnr);
    this.saveLocalBackup();
    this.asyncSaveFirestore('enrollments', newEnr);
    return newEnr;
  }

  public unenrollStudentFromClass(studentId: string, classId: string) {
    const enrToDelete = this.state.enrollments.filter(e => e.studentId === studentId && e.classId === classId);
    const grdToDelete = this.state.grades.filter(g => g.studentId === studentId && g.classId === classId);
    const attToDelete = this.state.attendance.filter(a => a.studentId === studentId && a.classId === classId);

    enrToDelete.forEach(e => this.deletedIds.add(e.id));
    this.saveDeletedIds();

    this.state.enrollments = this.state.enrollments.filter(e => !(e.studentId === studentId && e.classId === classId));
    this.state.grades = this.state.grades.filter(g => !(g.studentId === studentId && g.classId === classId));
    this.state.attendance = this.state.attendance.filter(a => !(a.studentId === studentId && a.classId === classId));
    this.saveLocalBackup();

    enrToDelete.forEach(e => this.asyncSaveFirestore('enrollments', null, e.id));
    grdToDelete.forEach(g => this.asyncSaveFirestore('grades', null, g.id));
    attToDelete.forEach(a => this.asyncSaveFirestore('attendance', null, a.id));

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }
  }

  /**
   * Archives a student who has completed the academic calendar / graduated.
   * Unenrolls the student from active classes and updates their status to archived/graduated.
   */
  public archiveStudent(studentId: string, classId?: string, graduationYear?: string): boolean {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return false;

    let sourceClassName = '';
    if (classId) {
      const cls = this.state.classes.find(c => c.id === classId);
      if (cls) sourceClassName = cls.name;
      // Remove all enrollments linking this student to source class
      const oldEnrollments = this.state.enrollments.filter(e => e.studentId === studentId && e.classId === classId);
      oldEnrollments.forEach(e => {
        this.deletedIds.add(e.id);
        this.asyncSaveFirestore('enrollments', null, e.id);
      });
      this.saveDeletedIds();
      this.state.enrollments = this.state.enrollments.filter(e => !(e.studentId === studentId && e.classId === classId));
    } else {
      // Unenroll from all classes
      const oldEnrollments = this.state.enrollments.filter(e => e.studentId === studentId);
      oldEnrollments.forEach(e => {
        this.deletedIds.add(e.id);
        this.asyncSaveFirestore('enrollments', null, e.id);
      });
      this.saveDeletedIds();
      this.state.enrollments = this.state.enrollments.filter(e => e.studentId !== studentId);
    }

    const activeSession = this.getSetting<string>('settings_academic_session', '2026/2027');
    const yearText = graduationYear || `Class of ${activeSession?.split('/')[1] || '2027'} (${activeSession || ''})`;

    student.isArchived = true;
    student.status = 'graduated';
    student.archivedAt = new Date().toISOString();
    student.archivedYear = yearText;
    student.archivedFromClass = sourceClassName || student.gradeLevel || 'SS3';
    student.gradeLevel = 'Graduated (Alumni)';

    this.asyncSaveFirestore('students', student);
    this.saveLocalBackup();

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }
    return true;
  }

  /**
   * Batch archives multiple students in a single operation.
   */
  public batchArchiveStudents(studentIds: string[], classId: string, graduationYear?: string): number {
    let count = 0;
    for (const sId of studentIds) {
      if (this.archiveStudent(sId, classId, graduationYear)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Restores an archived student back to active status and optionally re-enrolls in a class.
   */
  public unarchiveStudent(studentId: string, targetClassId?: string): boolean {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) return false;

    student.isArchived = false;
    student.status = 'active';
    delete student.archivedAt;

    if (targetClassId) {
      const targetClass = this.state.classes.find(c => c.id === targetClassId);
      if (targetClass) {
        student.gradeLevel = targetClass.name;
        const alreadyInTarget = this.state.enrollments.some(e => e.studentId === studentId && e.classId === targetClassId);
        if (!alreadyInTarget) {
          const newEnrId = `enr-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
          const newEnr: Enrollment = {
            id: newEnrId,
            studentId,
            classId: targetClassId
          };
          this.state.enrollments.push(newEnr);
          this.asyncSaveFirestore('enrollments', newEnr);
        }
      }
    } else if (student.archivedFromClass) {
      student.gradeLevel = student.archivedFromClass;
    }

    this.asyncSaveFirestore('students', student);
    this.saveLocalBackup();

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }
    return true;
  }

  /**
   * Returns all archived / graduated students.
   */
  public getArchivedStudents(): Student[] {
    this.ensureBaselineIntegrity();
    return this.state.students.filter(s => s.isArchived || s.status === 'archived' || s.status === 'graduated' || s.gradeLevel?.toLowerCase().includes('graduated'));
  }

  /**
   * Returns all active students.
   */
  public getActiveStudents(): Student[] {
    this.ensureBaselineIntegrity();
    return this.state.students.filter(s => !s.isArchived && s.status !== 'archived' && s.status !== 'graduated');
  }

  /**
   * Promotes a student from source class to target class.
   * If targetClassId is 'archive', delegates to archiveStudent.
   * Guarantees that the student is completely unenrolled from the source class,
   * enrolled in the target class, their grade level updated, and their previous
   * class enrollment marked permanently deleted so they never appear in the previous class.
   */
  public promoteStudent(studentId: string, sourceClassId: string, targetClassId: string): boolean {
    if (targetClassId === 'archive') {
      return this.archiveStudent(studentId, sourceClassId);
    }

    const student = this.state.students.find(s => s.id === studentId);
    const targetClass = this.state.classes.find(c => c.id === targetClassId);
    if (!student || !targetClass) return false;

    // 1. Remove all enrollments linking this student to source class & record in deletedIds
    const oldEnrollments = this.state.enrollments.filter(e => e.studentId === studentId && e.classId === sourceClassId);
    oldEnrollments.forEach(e => {
      this.deletedIds.add(e.id);
      this.asyncSaveFirestore('enrollments', null, e.id);
    });
    this.saveDeletedIds();
    this.state.enrollments = this.state.enrollments.filter(e => !(e.studentId === studentId && e.classId === sourceClassId));

    // 2. Add enrollment to target class if not already enrolled
    const alreadyInTarget = this.state.enrollments.some(e => e.studentId === studentId && e.classId === targetClassId);
    if (!alreadyInTarget) {
      const newEnrId = `enr-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const newEnr: Enrollment = {
        id: newEnrId,
        studentId,
        classId: targetClassId
      };
      this.state.enrollments.push(newEnr);
      this.asyncSaveFirestore('enrollments', newEnr);
    }

    // 3. Update student's grade level to match target class name/level
    let newGradeLevel = targetClass.name;
    const targetUpper = targetClass.name.toUpperCase();
    if (targetUpper.includes('JSS 1')) newGradeLevel = 'JSS 1';
    else if (targetUpper.includes('JSS 2')) newGradeLevel = 'JSS 2';
    else if (targetUpper.includes('JSS 3')) newGradeLevel = 'JSS 3';
    else if (targetUpper.includes('SSS 1')) newGradeLevel = 'SSS 1';
    else if (targetUpper.includes('SSS 2')) newGradeLevel = 'SSS 2';
    else if (targetUpper.includes('SSS 3')) newGradeLevel = 'SSS 3';
    else if (targetUpper.includes('SS3') || targetUpper.includes('SS 3')) newGradeLevel = targetClass.name;

    student.gradeLevel = newGradeLevel;
    student.isArchived = false;
    student.status = 'active';
    this.asyncSaveFirestore('students', student);

    this.saveLocalBackup();

    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }

    return true;
  }

  /**
   * Promotes multiple students in a single batch operation.
   * If targetClassId is 'archive', delegates to batchArchiveStudents.
   */
  public batchPromoteStudents(studentIds: string[], sourceClassId: string, targetClassId: string): number {
    if (targetClassId === 'archive') {
      return this.batchArchiveStudents(studentIds, sourceClassId);
    }
    let count = 0;
    for (const sId of studentIds) {
      if (this.promoteStudent(sId, sourceClassId, targetClassId)) {
        count++;
      }
    }
    return count;
  }

  // --- GRADES ---
  public getGradesForClass(classId: string): Grade[] {
    this.ensureBaselineIntegrity();
    return this.state.grades.filter(g => g.classId === classId);
  }

  public getGradesForStudent(studentId: string): Grade[] {
    this.ensureBaselineIntegrity();
    return this.state.grades.filter(g => g.studentId === studentId);
  }

  public addGrade(grade: Omit<Grade, 'id'>): Grade {
    const id = `grd-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const newGrade: Grade = { id, ...grade };
    this.state.grades.push(newGrade);
    this.saveLocalBackup();
    this.asyncSaveFirestore('grades', newGrade);
    return newGrade;
  }

  public deleteGrade(gradeId: string) {
    this.state.grades = this.state.grades.filter(g => g.id !== gradeId);
    this.deletedIds.add(gradeId);
    this.saveDeletedIds();
    this.saveLocalBackup();
    this.asyncSaveFirestore('grades', null, gradeId);
    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }
  }

  public saveBulkGrades(gradesToAddOrUpdate: Grade[], gradeIdsToDelete: string[]) {
    // 1. Delete removed grades
    if (gradeIdsToDelete.length > 0) {
      const toDeleteSet = new Set(gradeIdsToDelete);
      this.state.grades = this.state.grades.filter(g => !toDeleteSet.has(g.id));
      gradeIdsToDelete.forEach(id => {
        this.deletedIds.add(id);
        this.asyncSaveFirestore('grades', null, id);
      });
      this.saveDeletedIds();
    }

    // 2. Add or update grades in local state
    gradesToAddOrUpdate.forEach(updatedGrade => {
      const index = this.state.grades.findIndex(g => g.id === updatedGrade.id);
      if (index >= 0) {
        this.state.grades[index] = updatedGrade;
      } else {
        this.state.grades.push(updatedGrade);
      }
      this.asyncSaveFirestore('grades', updatedGrade);
    });

    this.saveLocalBackup();
  }

  // --- ATTENDANCE ---
  public getAttendanceForClass(classId: string): Attendance[] {
    this.ensureBaselineIntegrity();
    return this.state.attendance.filter(a => a.classId === classId);
  }

  public getAttendanceForClassAndDate(classId: string, date: string): Attendance[] {
    this.ensureBaselineIntegrity();
    return this.state.attendance.filter(a => a.classId === classId && a.date === date);
  }

  public markAttendance(studentId: string, classId: string, date: string, status: AttendanceStatus, notes?: string): Attendance {
    const existingIndex = this.state.attendance.findIndex(
      a => a.studentId === studentId && a.classId === classId && a.date === date
    );

    let finalAtt: Attendance;

    if (existingIndex !== -1) {
      this.state.attendance[existingIndex].status = status;
      this.state.attendance[existingIndex].notes = notes;
      finalAtt = this.state.attendance[existingIndex];
    } else {
      const id = `att-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      finalAtt = { id, studentId, classId, date, status, notes };
      this.state.attendance.push(finalAtt);
    }

    this.saveLocalBackup();
    this.asyncSaveFirestore('attendance', finalAtt);
    return finalAtt;
  }

  public recordAttendance(studentId: string, classId: string, date: string, status: AttendanceStatus, notes?: string): Attendance {
    return this.markAttendance(studentId, classId, date, status, notes);
  }

  public deleteAttendance(id: string) {
    this.state.attendance = this.state.attendance.filter(a => a.id !== id);
    this.deletedIds.add(id);
    this.saveDeletedIds();
    this.saveLocalBackup();
    this.asyncSaveFirestore('attendance', null, id);
    if (typeof window !== 'undefined') {
      safeDispatch(new CustomEvent('database_updated'));
    }
  }

  // --- TEACHER & CLASS HELPERS ---
  public updateTeacherInfo(id: string, updatesOrDept: Partial<Omit<Teacher, 'id'>> | string, phone?: string): boolean {
    const teacher = this.state.teachers.find(t => t.id === id);
    if (!teacher) return false;

    let updates: Partial<Omit<Teacher, 'id'>>;
    if (typeof updatesOrDept === 'string') {
      updates = { department: updatesOrDept, ...(phone !== undefined ? { phone } : {}) };
    } else {
      updates = updatesOrDept;
    }

    Object.assign(teacher, updates);

    const user = this.state.users.find(u => u.id === id);
    if (user && updates.fullName) {
      user.fullName = updates.fullName;
      this.asyncSaveFirestore('users', user);
    }
    if (user && updates.email) {
      user.email = updates.email;
      this.asyncSaveFirestore('users', user);
    }

    this.saveLocalBackup();
    this.asyncSaveFirestore('teachers', teacher);
    return true;
  }

  public updateTeacherStatus(teacherId: string, status: string): boolean {
    return this.updateTeacherInfo(teacherId, { status });
  }

  public updateTeacherSubjects(teacherId: string, subjects: string[]): boolean {
    return this.updateTeacherInfo(teacherId, { subjects });
  }

  public assignClassToTeacher(classIdOrTeacherId: string, teacherIdOrClassId: string): boolean {
    let classId = classIdOrTeacherId;
    let teacherId = teacherIdOrClassId;

    if (!this.state.classes.some(c => c.id === classId) && this.state.classes.some(c => c.id === teacherId)) {
      classId = teacherIdOrClassId;
      teacherId = classIdOrTeacherId;
    }

    return this.assignTeacherToClass(teacherId, classId);
  }

  public unassignClassFromTeacher(classId: string): boolean {
    return this.removeTeacherFromClass(classId);
  }

  public saveGradesBatch(gradesToAddOrUpdate: Grade[], gradeIdsToDelete: string[] = []) {
    return this.saveBulkGrades(gradesToAddOrUpdate, gradeIdsToDelete);
  }

  public assignTeacherToClass(teacherId: string, classId: string): boolean {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return false;

    cls.teacherId = teacherId;
    this.ensureFormTeacherPermissions(teacherId);
    this.saveLocalBackup();
    this.asyncSaveFirestore('classes', cls);
    return true;
  }

  public removeTeacherFromClass(classId: string): boolean {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return false;

    cls.teacherId = '';
    this.saveLocalBackup();
    this.asyncSaveFirestore('classes', cls);
    return true;
  }

  public addSubjectToTeacher(teacherId: string, subject: string): boolean {
    const teacher = this.state.teachers.find(t => t.id === teacherId);
    if (!teacher) return false;

    if (!teacher.subjects) {
      teacher.subjects = [];
    }
    if (!teacher.subjects.includes(subject)) {
      teacher.subjects.push(subject);
      this.saveLocalBackup();
      this.asyncSaveFirestore('teachers', teacher);
      return true;
    }
    return false;
  }

  public removeSubjectFromTeacher(teacherId: string, subject: string): boolean {
    const teacher = this.state.teachers.find(t => t.id === teacherId);
    if (!teacher || !teacher.subjects) return false;

    teacher.subjects = teacher.subjects.filter(s => s !== subject);
    this.saveLocalBackup();
    this.asyncSaveFirestore('teachers', teacher);
    return true;
  }
}

export const db = new DatabaseManager();
