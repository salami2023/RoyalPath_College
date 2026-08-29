/**
 * School Management System - Shared Types
 */

export type UserRole = 'admin' | 'teacher' | 'parent';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  permissions?: string[];
  password?: string; // Optional password for login credentials
}

export interface Teacher {
  id: string; // matches teacher user's id
  fullName: string;
  email: string;
  department: string;
  phone?: string;
  subjects?: string[];
  status?: string;
}

export interface Student {
  id: string;
  fullName: string;
  gradeLevel: string; // e.g. "Grade 9", "Grade 10"
  parentId?: string; // Links to Parent's ID
  rollNumber: string;
  birthDate: string;
  gender?: string; // e.g. "Male", "Female"
  isArchived?: boolean;
  archivedAt?: string;
  archivedYear?: string;
  archivedFromClass?: string;
  status?: 'active' | 'archived' | 'graduated';
}

export interface Parent {
  id: string; // matches parent user's id
  fullName: string;
  email: string;
  phone: string;
  childIds: string[]; // Links to Students
}

export interface Class {
  id: string;
  name: string;
  code: string; // e.g. "MATH-101"
  teacherId: string; // Links to Teacher ID
  schedule: string; // e.g. "Mon, Wed, Fri 09:00 - 10:30"
  room: string;
  classFee?: number;
  extraFee?: number;
  promotionStatus?: string;
  levelOfEducation?: string; // e.g., 'Nursery', 'Junior Secondary', 'Senior Secondary'
}

export const AVAILABLE_ACADEMIC_SESSIONS = [
  '2023/2024',
  '2024/2025',
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030',
  '2030/2031',
  '2031/2032',
  '2032/2033',
  '2033/2034',
  '2034/2035'
] as const;

export type AcademicSession = typeof AVAILABLE_ACADEMIC_SESSIONS[number] | string;

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
}

export type GradeCategory = 'exam' | 'ca' | 'mid_term' | 'quiz' | 'project' | 'homework' | 'ca1' | 'ca2' | 'notebook';

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  assignmentName: string;
  score: number; // 0-100
  category: GradeCategory;
  date: string;
  feedback?: string;
  subjectName?: string;
  term?: string;
  session?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'tardy';

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  notes?: string;
}

export interface ReportComment {
  id: string;
  studentId: string;
  classId: string;
  term: string;
  session?: string;
  teacherComment: string;
  principalComment?: string;
  attentiveness?: string;
  cooperation?: string;
  attitudeToWork?: string;
  socialIntegration?: string;
}

export interface DbState {
  users: User[];
  teachers: Teacher[];
  students: Student[];
  parents: Parent[];
  classes: Class[];
  enrollments: Enrollment[];
  grades: Grade[];
  attendance: Attendance[];
  reportComments?: ReportComment[];
  tests?: any[];
  lessonNotes?: any[];
  settings?: Record<string, any>;
}

/**
 * Computes the letter grade based on the custom grading scale stored in localStorage or default ranges.
 */
export function getStoredLetterGrade(score: number): string {
  if (score >= 75) return 'A1';
  if (score >= 70) return 'B2';
  if (score >= 65) return 'B3';
  if (score >= 60) return 'C4';
  if (score >= 55) return 'C5';
  if (score >= 50) return 'C6';
  if (score >= 45) return 'D7';
  if (score >= 40) return 'D8';
  return 'F9';
}

/**
 * Gets consistent CSS styles for each letter grade badge.
 */
export function getStoredLetterColor(letter: string): string {
  switch (letter) {
    case 'A1':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'B2':
    case 'B3':
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    case 'C4':
    case 'C5':
    case 'C6':
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'D7':
    case 'D8':
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    default:
      return 'bg-rose-50 text-rose-700 border border-rose-200';
  }
}

/**
 * Computes the weighted average score of grades using custom weighting parameters.
 */
export function computeWeightedScore(gradesList: { score: number; category: string }[]): number {
  if (gradesList.length === 0) return 0;
  if (typeof window === 'undefined') {
    return gradesList.reduce((sum, g) => sum + g.score, 0) / gradesList.length;
  }

  const weightExam = parseFloat(localStorage.getItem('weight_exam') || '50');
  const weightCa = parseFloat(localStorage.getItem('weight_ca') || '30');
  const weightMidterm = parseFloat(localStorage.getItem('weight_midterm') || '20');

  // Find components
  const examGrades = gradesList.filter(g => g.category === 'exam');
  const midGrades = gradesList.filter(g => g.category === 'mid_term');
  
  // CA components: 'ca1', 'ca2', 'ca', 'notebook'
  const ca1Grades = gradesList.filter(g => g.category === 'ca1');
  const ca2Grades = gradesList.filter(g => g.category === 'ca2' || g.category === 'notebook');
  const legacyCaGrades = gradesList.filter(g => g.category === 'ca');

  let caSumPercent = 0;
  let caWeightsCount = 0;

  if (ca1Grades.length > 0) {
    const avg = ca1Grades.reduce((sum, g) => sum + g.score, 0) / ca1Grades.length;
    caSumPercent += (avg / 10) * 100;
    caWeightsCount++;
  }
  if (ca2Grades.length > 0) {
    const avg = ca2Grades.reduce((sum, g) => sum + g.score, 0) / ca2Grades.length;
    caSumPercent += (avg / 10) * 100;
    caWeightsCount++;
  }
  if (legacyCaGrades.length > 0) {
    const avg = legacyCaGrades.reduce((sum, g) => sum + g.score, 0) / legacyCaGrades.length;
    caSumPercent += (avg / 20) * 100;
    caWeightsCount++;
  }

  // Fallback for other non-unified categories (quiz, homework, project)
  const otherCaGrades = gradesList.filter(g => !['exam', 'mid_term', 'ca1', 'ca2', 'notebook', 'ca'].includes(g.category));
  if (otherCaGrades.length > 0) {
    const avg = otherCaGrades.reduce((sum, g) => sum + g.score, 0) / otherCaGrades.length;
    caSumPercent += avg > 20 ? avg : (avg / 20) * 100;
    caWeightsCount++;
  }

  let totalWeightUsed = 0;
  let totalWeightedPartSum = 0;

  if (examGrades.length > 0) {
    const examAvg = examGrades.reduce((sum, g) => sum + g.score, 0) / examGrades.length;
    const examPercent = examAvg > 60 ? examAvg : (examAvg / 60) * 100;
    totalWeightUsed += weightExam;
    totalWeightedPartSum += examPercent * weightExam;
  }
  if (caWeightsCount > 0) {
    const caPercent = caSumPercent / caWeightsCount;
    totalWeightUsed += weightCa;
    totalWeightedPartSum += caPercent * weightCa;
  }
  if (midGrades.length > 0) {
    const midtermAvg = midGrades.reduce((sum, g) => sum + g.score, 0) / midGrades.length;
    const midtermPercent = midtermAvg > 20 ? midtermAvg : (midtermAvg / 20) * 100;
    totalWeightUsed += weightMidterm;
    totalWeightedPartSum += midtermPercent * weightMidterm;
  }

  if (totalWeightUsed > 0) {
    return totalWeightedPartSum / totalWeightUsed;
  }

  return gradesList.reduce((sum, g) => sum + g.score, 0) / gradesList.length;
}

const CANONICAL_CLASS_ORDER = [
  "JSS 1A", "JSS 1B", "JSS 2A", "JSS 2B", "JSS 3A", "JSS 3B",
  "SSS 1A", "SSS 1B", "SSS 2A", "SSS 2B", "SSS 3A", "SSS 3B"
];

function getCanonicalClassIndex(className: string): number {
  if (!className) return 999;
  const normalized = className.toUpperCase().replace(/\s+/g, "");
  
  for (let i = 0; i < CANONICAL_CLASS_ORDER.length; i++) {
    const canonicalNormalized = CANONICAL_CLASS_ORDER[i].replace(/\s+/g, "");
    if (normalized === canonicalNormalized) {
      return i;
    }
  }
  
  if (normalized.startsWith("JSS")) {
    const numberMatch = normalized.match(/JSS(\d+)/);
    if (numberMatch) {
      const num = Number(numberMatch[1]);
      const rest = normalized.slice(numberMatch[0].length);
      const letterCode = rest.charCodeAt(0) || 0;
      return 100 + num * 10 + letterCode;
    }
    return 150;
  }
  if (normalized.startsWith("SSS")) {
    const numberMatch = normalized.match(/SSS(\d+)/);
    if (numberMatch) {
      const num = Number(numberMatch[1]);
      const rest = normalized.slice(numberMatch[0].length);
      const letterCode = rest.charCodeAt(0) || 0;
      return 200 + num * 10 + letterCode;
    }
    return 250;
  }
  
  return 500 + className.localeCompare(className);
}

export function sortClasses<T extends { name: string }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const idxA = getCanonicalClassIndex(a.name);
    const idxB = getCanonicalClassIndex(b.name);
    if (idxA !== idxB) {
      return idxA - idxB;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  });
}

