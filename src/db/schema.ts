import { pgTable, text, timestamp, integer, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

// Global school data state record to store persistent school database documents
export const schoolState = pgTable('school_state', {
  id: text('id').primaryKey(), // 'current_state' or tenant ID
  data: jsonb('data').notNull(), // DbState structured object
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Normalized Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  fullName: text('full_name').notNull(),
  avatarUrl: text('avatar_url'),
  permissions: jsonb('permissions'),
  password: text('password'),
  createdAt: text('created_at').notNull(),
});

// Normalized Students table
export const students = pgTable('students', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  gradeLevel: text('grade_level').notNull(),
  parentId: text('parent_id'),
  rollNumber: text('roll_number').notNull(),
  birthDate: text('birth_date').notNull(),
  gender: text('gender'),
});

// Normalized Classes table
export const classes = pgTable('classes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  teacherId: text('teacher_id').notNull(),
  schedule: text('schedule').notNull(),
  room: text('room').notNull(),
  classFee: doublePrecision('class_fee'),
  extraFee: doublePrecision('extra_fee'),
  promotionStatus: text('promotion_status'),
  levelOfEducation: text('level_of_education'),
});

// Normalized Grades table
export const grades = pgTable('grades', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  classId: text('class_id').notNull(),
  assignmentName: text('assignment_name').notNull(),
  score: doublePrecision('score').notNull(),
  category: text('category').notNull(),
  date: text('date').notNull(),
  feedback: text('feedback'),
  subjectName: text('subject_name'),
});

// Normalized Attendance table
export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  classId: text('class_id').notNull(),
  date: text('date').notNull(),
  status: text('status').notNull(),
  notes: text('notes'),
});
