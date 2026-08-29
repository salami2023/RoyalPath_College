-- ====================================================================
-- ROYAL PATH COLLEGE & OAKRIDGE PORTAL - LIVE SUPABASE POSTGRES SCHEMA
-- ====================================================================
-- This SQL script sets up all 9 relaltional tables, columns, indexes,
-- and inserts the initial administrator, high-authority teachers,
-- and pre-linked guardians.
-- 
-- HOW TO USE:
-- 1. Sign up on https://supabase.com
-- 2. Create a new project (e.g., "Royal Path College Portal").
-- 3. Navigate to "SQL Editor" in the left sidebar menu.
-- 4. Click "New Query", paste this entire script, and click "Run".
-- 5. Copy your PROJECT URL & ANON PUBLIC KEY from Project Settings -> API.
-- 6. Insert them into your deployment secrets or .env configurations.
-- ====================================================================

-- DROP EXISTING TABLES IN CASCADE ORDER (FOR A CLEAN RE-RUNNABLE SEED)
DROP TABLE IF EXISTS "settings" CASCADE;
DROP TABLE IF EXISTS "report_comments" CASCADE;
DROP TABLE IF EXISTS "attendance" CASCADE;
DROP TABLE IF EXISTS "grades" CASCADE;
DROP TABLE IF EXISTS "enrollments" CASCADE;
DROP TABLE IF EXISTS "classes" CASCADE;
DROP TABLE IF EXISTS "parents" CASCADE;
DROP TABLE IF EXISTS "students" CASCADE;
DROP TABLE IF EXISTS "teachers" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 1. USERS COLLECTION
CREATE TABLE "users" (
  "id" VARCHAR PRIMARY KEY,
  "email" VARCHAR UNIQUE NOT NULL,
  "role" VARCHAR NOT NULL CHECK ("role" IN ('admin', 'teacher', 'parent')),
  "fullName" VARCHAR NOT NULL,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "permissions" JSONB DEFAULT '[]'::jsonb,
  "password" VARCHAR
);

-- 2. TEACHERS TABLE
CREATE TABLE "teachers" (
  "id" VARCHAR PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "fullName" VARCHAR NOT NULL,
  "email" VARCHAR NOT NULL,
  "department" VARCHAR NOT NULL DEFAULT 'General Studies',
  "phone" VARCHAR,
  "subjects" JSONB DEFAULT '[]'::jsonb,
  "status" VARCHAR DEFAULT 'Active'
);

-- 3. PARENTS / GUARDIANS TABLE
CREATE TABLE "parents" (
  "id" VARCHAR PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "fullName" VARCHAR NOT NULL,
  "email" VARCHAR NOT NULL,
  "phone" VARCHAR NOT NULL,
  "childIds" JSONB DEFAULT '[]'::jsonb
);

-- 4. STUDENTS SYSTEM ROSTER
CREATE TABLE "students" (
  "id" VARCHAR PRIMARY KEY,
  "fullName" VARCHAR NOT NULL,
  "gradeLevel" VARCHAR NOT NULL,
  "parentId" VARCHAR REFERENCES "parents"("id") ON DELETE SET NULL,
  "rollNumber" VARCHAR UNIQUE NOT NULL,
  "birthDate" DATE NOT NULL,
  "gender" VARCHAR
);

-- 5. ACADEMIC CLASSES
CREATE TABLE "classes" (
  "id" VARCHAR PRIMARY KEY,
  "name" VARCHAR NOT NULL,
  "code" VARCHAR UNIQUE NOT NULL,
  "teacherId" VARCHAR REFERENCES "teachers"("id") ON DELETE SET NULL,
  "schedule" VARCHAR NOT NULL,
  "room" VARCHAR NOT NULL,
  "classFee" NUMERIC DEFAULT 0,
  "extraFee" NUMERIC DEFAULT 0,
  "promotionStatus" VARCHAR DEFAULT 'Regular',
  "levelOfEducation" VARCHAR DEFAULT 'Junior Secondary'
);

-- 6. CLASS ENROLLMENTS
CREATE TABLE "enrollments" (
  "id" VARCHAR PRIMARY KEY,
  "studentId" VARCHAR NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "classId" VARCHAR NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  CONSTRAINT "unq_student_class_enrollment" UNIQUE("studentId", "classId")
);

-- 7. GRADES & ASSESSMENT SHEETS
CREATE TABLE "grades" (
  "id" VARCHAR PRIMARY KEY,
  "studentId" VARCHAR NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "classId" VARCHAR NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  "assignmentName" VARCHAR NOT NULL,
  "score" NUMERIC NOT NULL CHECK ("score" BETWEEN 0 AND 100),
  "category" VARCHAR NOT NULL,
  "date" DATE DEFAULT CURRENT_DATE,
  "feedback" TEXT,
  "subjectName" VARCHAR
);

-- 8. ATTENDANCE REGISTERS
CREATE TABLE "attendance" (
  "id" VARCHAR PRIMARY KEY,
  "studentId" VARCHAR NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "classId" VARCHAR NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL DEFAULT CURRENT_DATE,
  "status" VARCHAR NOT NULL CHECK ("status" IN ('present', 'absent', 'tardy')),
  "notes" TEXT,
  CONSTRAINT "unq_attendance_day" UNIQUE("studentId", "classId", "date")
);

-- 9. END-OF-TERM REPORT COMMENTS & ENDORSEMENTS
CREATE TABLE "report_comments" (
  "id" VARCHAR PRIMARY KEY,
  "studentId" VARCHAR NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
  "classId" VARCHAR NOT NULL REFERENCES "classes"("id") ON DELETE CASCADE,
  "term" VARCHAR NOT NULL,
  "teacherComment" TEXT NOT NULL,
  "principalComment" TEXT,
  "attentiveness" VARCHAR,
  "cooperation" VARCHAR,
  "attitudeToWork" VARCHAR,
  "socialIntegration" VARCHAR,
  CONSTRAINT "unq_comment_report" UNIQUE("studentId", "classId", "term")
);

-- 10. SYSTEM CONFIGURATION SETTINGS
CREATE TABLE "settings" (
  "key" VARCHAR PRIMARY KEY,
  "value" JSONB NOT NULL
);

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) ADJUSTMENT FOR DIRECT VITE INTERACTION
-- ====================================================================
-- Supabase enables Row Level Security (RLS) by default on newly created tables.
-- To allow your client-side application to safely perform queries without 
-- requiring complex authentication setups immediately, we disable RLS on these
-- tables. You can easily re-enable RLS and add strict policies later inside
-- the Supabase Policies Manager whenever you are ready.
-- ====================================================================
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "teachers" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "parents" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "students" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "classes" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "grades" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "attendance" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "report_comments" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POPULATE SYSTEM DEMONSTRATION SEED DATA
-- ====================================================================

-- Users Seed
INSERT INTO "users" ("id", "email", "role", "fullName", "createdAt", "permissions", "password") VALUES
('usr-admin-1', 'admin@royalpath.edu', 'admin', 'Principal Ayanwunmi', NOW(), '["mark_attendance", "upload_scores", "upload_notes", "create_assessments", "enter_comments", "view_edit_form_class", "view_edit_subject"]'::jsonb, NULL),
('usr-teach-1', 'j.harrison@oakridge.edu', 'teacher', 'Mr. James Harrison', NOW(), '["mark_attendance", "upload_scores", "upload_notes", "create_assessments", "enter_comments", "view_edit_form_class", "view_edit_subject"]'::jsonb, NULL),
('usr-teach-2', 'm.baker@oakridge.edu', 'teacher', 'Mrs. Maria Baker', NOW(), '["mark_attendance", "upload_scores", "upload_notes", "create_assessments", "enter_comments", "view_edit_form_class", "view_edit_subject"]'::jsonb, NULL),
('usr-teach-3', 'k.jenkins@oakridge.edu', 'teacher', 'Mr. Kenneth Jenkins', NOW(), '["mark_attendance", "upload_scores", "upload_notes", "create_assessments", "enter_comments", "view_edit_form_class", "view_edit_subject"]'::jsonb, NULL),
('usr-parent-1', 'eleanor.foley@gmail.com', 'parent', 'Emily & Tommy Foley (Parent)', NOW(), '[]'::jsonb, NULL),
('usr-parent-2', 'richard.stewart@gmail.com', 'parent', 'Oliver Stewart (Parent)', NOW(), '[]'::jsonb, NULL);

-- Teachers Seed
INSERT INTO "teachers" ("id", "fullName", "email", "department", "phone", "subjects", "status") VALUES
('usr-teach-1', 'Mr. James Harrison', 'j.harrison@oakridge.edu', 'Mathematics', '+1 (555) 019-2834', '[]'::jsonb, 'Active'),
('usr-teach-2', 'Mrs. Maria Baker', 'm.baker@oakridge.edu', 'Science', '+1 (555) 019-5832', '[]'::jsonb, 'Active'),
('usr-teach-3', 'Mr. Kenneth Jenkins', 'k.jenkins@oakridge.edu', 'English & Humanities', '+1 (555) 019-9941', '[]'::jsonb, 'Active');

-- Parents Seed (Child linkages stored in JSON array)
INSERT INTO "parents" ("id", "fullName", "email", "phone", "childIds") VALUES
('usr-parent-1', 'Mrs. Eleanor Foley', 'eleanor.foley@gmail.com', '+1 (555) 014-9988', '["stud-1", "stud-2"]'::jsonb),
('usr-parent-2', 'Mr. Richard Stewart', 'richard.stewart@gmail.com', '+1 (555) 014-2211', '["stud-3"]'::jsonb);

-- Students Seed
INSERT INTO "students" ("id", "fullName", "gradeLevel", "parentId", "rollNumber", "birthDate", "gender") VALUES
('stud-1', 'Tommy Foley', 'Algebra I', 'usr-parent-1', 'OAK-2026-001', '2011-04-12', 'Male'),
('stud-2', 'Emily Foley', 'Calculus AB', 'usr-parent-1', 'OAK-2024-054', '2009-09-22', 'Female'),
('stud-3', 'Oliver Stewart', 'AP Physics', 'usr-parent-2', 'OAK-2025-012', '2010-06-15', 'Male'),
('stud-4', 'Chloe Bennett', 'Algebra I', NULL, 'OAK-2026-004', '2011-01-30', 'Female'),
('stud-5', 'Nathan Drake', 'Calculus AB', NULL, 'OAK-2024-089', '2009-11-02', 'Male');

-- Classes Seed
INSERT INTO "classes" ("id", "name", "code", "teacherId", "schedule", "room", "classFee", "extraFee", "promotionStatus", "levelOfEducation") VALUES
('cls-1', 'Algebra I', 'MATH-101', 'usr-teach-1', 'Mon, Wed, Fri 09:00 - 10:15', 'Room 201', 120, 20, 'Regular', 'Junior Secondary'),
('cls-2', 'Calculus AB', 'MATH-301', 'usr-teach-1', 'Tue, Thu 11:00 - 12:30', 'Room 205', 240, 45, 'Regular', 'Senior Secondary'),
('cls-3', 'AP Physics', 'SCI-201', 'usr-teach-2', 'Mon, Wed 13:00 - 14:30', 'Lab B', 310, 80, 'Regular', 'Senior Secondary'),
('cls-4', 'Biology', 'SCI-101', 'usr-teach-2', 'Tue, Thu 09:00 - 10:15', 'Lab A', 150, 30, 'Regular', 'Junior Secondary'),
('cls-5', 'English Literature II', 'ENG-201', 'usr-teach-3', 'Mon, Wed, Fri 10:30 - 11:45', 'Room 102', 110, 0, 'Regular', 'Junior Secondary'),
('cls-6', 'JSS 3B', 'J3-102', 'usr-teach-2', 'Tue, Thu 10:30 - 11:45', 'Room 105', 0, 0, 'Auto', 'Junior Secondary'),
('cls-7', 'SSS 1B', 'S1-102', 'usr-teach-3', 'Tue, Thu 13:00 - 14:30', 'Room 204', 0, 0, 'Auto', 'Senior Secondary'),
('cls-8', 'SSS 2B', 'S2-102', 'usr-teach-1', 'Mon, Wed 14:45 - 16:15', 'Room 205', 0, 0, 'Auto', 'Senior Secondary');

-- Enrollments Seed
INSERT INTO "enrollments" ("id", "studentId", "classId") VALUES
('enr-1', 'stud-1', 'cls-1'),
('enr-2', 'stud-4', 'cls-1'),
('enr-3', 'stud-3', 'cls-1'),
('enr-4', 'stud-2', 'cls-2'),
('enr-5', 'stud-5', 'cls-2'),
('enr-6', 'stud-2', 'cls-3'),
('enr-7', 'stud-5', 'cls-3'),
('enr-8', 'stud-3', 'cls-3'),
('enr-9', 'stud-1', 'cls-4'),
('enr-10', 'stud-4', 'cls-4'),
('enr-11', 'stud-1', 'cls-5'),
('enr-12', 'stud-2', 'cls-5'),
('enr-13', 'stud-3', 'cls-5'),
('enr-14', 'stud-4', 'cls-5'),
('enr-15', 'stud-5', 'cls-5');

-- Grades Seed
INSERT INTO "grades" ("id", "studentId", "classId", "assignmentName", "score", "category", "date", "feedback", "subjectName") VALUES
('grd-1', 'stud-1', 'cls-1', 'Midterm Exam', 88, 'exam', '2026-03-15', 'Great job with multi-step equations!', NULL),
('grd-2', 'stud-3', 'cls-1', 'Midterm Exam', 74, 'exam', '2026-03-15', 'Review quadratic factoring.', NULL),
('grd-3', 'stud-4', 'cls-1', 'Midterm Exam', 95, 'exam', '2026-03-15', 'Perfect scores on word problems.', NULL),
('grd-4', 'stud-1', 'cls-1', 'Quadratic Equations Quiz', 92, 'quiz', '2026-04-05', 'Strong performance', NULL),
('grd-5', 'stud-3', 'cls-1', 'Quadratic Equations Quiz', 80, 'quiz', '2026-04-05', 'Improved significantly', NULL),
('grd-6', 'stud-2', 'cls-2', 'Limits & Continuity Test', 94, 'exam', '2026-02-28', 'Fantastic work on epsilon-delta details', NULL),
('grd-7', 'stud-5', 'cls-2', 'Limits & Continuity Test', 85, 'exam', '2026-02-28', 'Check calculations on non-existent limit cases', NULL),
('grd-8', 'stud-2', 'cls-2', 'Derivatives Homework Portfolio', 100, 'homework', '2026-04-12', 'Extremely neat and well documented', NULL),
('grd-9', 'stud-2', 'cls-3', 'Kinematics Lab Report', 91, 'project', '2026-03-10', 'Very analytical conclusion section', NULL),
('grd-10', 'stud-5', 'cls-3', 'Kinematics Lab Report', 93, 'project', '2026-03-10', 'Clean error analysis charts', NULL),
('grd-11', 'stud-3', 'cls-3', 'Kinematics Lab Report', 82, 'project', '2026-03-10', 'Include references next time', NULL),
('grd-12', 'stud-3', 'cls-3', 'Newtonian Motion Test', 78, 'exam', '2026-04-02', 'Review incline friction forces', NULL);

-- Attendance Seed
INSERT INTO "attendance" ("id", "studentId", "classId", "date", "status", "notes") VALUES
('att-1', 'stud-1', 'cls-1', '2026-05-29', 'present', NULL),
('att-2', 'stud-3', 'cls-1', '2026-05-29', 'present', NULL),
('att-3', 'stud-4', 'cls-1', '2026-05-29', 'absent', 'Excused (Doctor appt)'),
('att-4', 'stud-2', 'cls-2', '2026-05-29', 'present', NULL),
('att-5', 'stud-5', 'cls-2', '2026-05-29', 'tardy', 'Late 10 mins (Bus delay)'),
('att-6', 'stud-1', 'cls-1', '2026-05-30', 'present', NULL),
('att-7', 'stud-3', 'cls-1', '2026-05-30', 'present', NULL),
('att-8', 'stud-4', 'cls-1', '2026-05-30', 'present', NULL);

-- Settings Table Initial Seeds
INSERT INTO "settings" ("key", "value") VALUES
('settings_jss_subjects', '["Mathematics", "English Language", "Basic Science", "Basic Technology", "Social Studies", "Civic Education", "Agricultural Science"]'::jsonb),
('settings_sss_subjects', '["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Civic Education", "Geography", "Economics", "Literature in English"]'::jsonb),
('settings_school_name', '"RoyalPath College"'::jsonb);

-- ====================================================================
-- SCHEMA CREATED SUCCESSFULLY
-- ====================================================================
