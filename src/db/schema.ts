import { pgTable, text, timestamp, integer, doublePrecision, jsonb, boolean } from 'drizzle-orm/pg-core';

// Global school data state record to store persistent school database documents and real-time syncing
export const schoolState = pgTable('school_state', {
  id: text('id').primaryKey(), // 'current_state' or tenant ID
  data: jsonb('data').notNull(), // Complete DbState structured object
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

// Normalized Teachers table
export const teachers = pgTable('teachers', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  department: text('department').notNull(),
  phone: text('phone'),
  subjects: jsonb('subjects'),
  status: text('status'),
});

// Normalized Parents table
export const parents = pgTable('parents', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  childIds: jsonb('child_ids'),
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
  status: text('status'),
  isArchived: boolean('is_archived').default(false),
  archivedAt: text('archived_at'),
  archivedYear: text('archived_year'),
  archivedFromClass: text('archived_from_class'),
  createdAt: text('created_at'),
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
  term: text('term'),
  session: text('session'),
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

// Normalized Settings table
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
