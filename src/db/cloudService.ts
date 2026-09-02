import { db } from './index.ts';
import { schoolState, users, teachers, students, parents, classes, grades, attendance, settings } from './schema.ts';
import { eq } from 'drizzle-orm';
import type { DbState } from '../types.ts';

const STATE_RECORD_ID = 'current_school_state';

/**
 * Retrieves the full school database state from Google Cloud SQL.
 */
export async function getCloudSqlState(): Promise<DbState | null> {
  try {
    const result = await db.select().from(schoolState).where(eq(schoolState.id, STATE_RECORD_ID));
    if (result.length > 0 && result[0].data) {
      return result[0].data as DbState;
    }
    return null;
  } catch (error) {
    console.error('Error fetching state from Cloud SQL:', error);
    throw new Error('Failed to retrieve state from Cloud SQL', { cause: error });
  }
}

/**
 * Saves or updates the authoritative school database state in Google Cloud SQL.
 * Also synchronizes the individual normalized tables so that data is accessible in both formats without truncation.
 */
export async function saveCloudSqlState(stateData: DbState): Promise<boolean> {
  try {
    // 1. Upsert the composite state document
    await db
      .insert(schoolState)
      .values({
        id: STATE_RECORD_ID,
        data: stateData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schoolState.id,
        set: {
          data: stateData,
          updatedAt: new Date(),
        },
      });

    // 2. Synchronize normalized users
    if (Array.isArray(stateData.users) && stateData.users.length > 0) {
      for (const u of stateData.users) {
        if (!u || !u.id) continue;
        await db
          .insert(users)
          .values({
            id: u.id,
            email: u.email || '',
            role: u.role || 'teacher',
            fullName: u.fullName || '',
            avatarUrl: u.avatarUrl || null,
            permissions: u.permissions || [],
            password: u.password || null,
            createdAt: u.createdAt || new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              email: u.email || '',
              role: u.role || 'teacher',
              fullName: u.fullName || '',
              avatarUrl: u.avatarUrl || null,
              permissions: u.permissions || [],
              password: u.password || null,
            },
          });
      }
    }

    // 3. Synchronize normalized students
    if (Array.isArray(stateData.students) && stateData.students.length > 0) {
      for (const s of stateData.students) {
        if (!s || !s.id) continue;
        await db
          .insert(students)
          .values({
            id: s.id,
            fullName: s.fullName || '',
            gradeLevel: s.gradeLevel || '',
            parentId: s.parentId || null,
            rollNumber: s.rollNumber || '',
            birthDate: s.birthDate || '',
            gender: s.gender || 'Male',
            status: s.status || 'active',
            isArchived: Boolean(s.isArchived),
            archivedAt: s.archivedAt || null,
            archivedYear: s.archivedYear || null,
            archivedFromClass: s.archivedFromClass || null,
            createdAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: students.id,
            set: {
              fullName: s.fullName || '',
              gradeLevel: s.gradeLevel || '',
              parentId: s.parentId || null,
              rollNumber: s.rollNumber || '',
              birthDate: s.birthDate || '',
              gender: s.gender || 'Male',
              status: s.status || 'active',
              isArchived: Boolean(s.isArchived),
              archivedAt: s.archivedAt || null,
              archivedYear: s.archivedYear || null,
              archivedFromClass: s.archivedFromClass || null,
            },
          });
      }
    }

    // 4. Synchronize normalized teachers
    if (Array.isArray(stateData.teachers) && stateData.teachers.length > 0) {
      for (const t of stateData.teachers) {
        if (!t || !t.id) continue;
        await db
          .insert(teachers)
          .values({
            id: t.id,
            fullName: t.fullName || '',
            email: t.email || '',
            department: t.department || 'General Studies',
            phone: t.phone || '',
            subjects: t.subjects || [],
            status: t.status || 'Active',
          })
          .onConflictDoUpdate({
            target: teachers.id,
            set: {
              fullName: t.fullName || '',
              email: t.email || '',
              department: t.department || 'General Studies',
              phone: t.phone || '',
              subjects: t.subjects || [],
              status: t.status || 'Active',
            },
          });
      }
    }

    // 5. Synchronize normalized classes
    if (Array.isArray(stateData.classes) && stateData.classes.length > 0) {
      for (const c of stateData.classes) {
        if (!c || !c.id) continue;
        await db
          .insert(classes)
          .values({
            id: c.id,
            name: c.name || '',
            code: c.code || '',
            teacherId: c.teacherId || '',
            schedule: c.schedule || '',
            room: c.room || '',
            classFee: c.classFee || 0,
            extraFee: c.extraFee || 0,
            promotionStatus: c.promotionStatus || 'Regular',
            levelOfEducation: c.levelOfEducation || 'Junior Secondary',
          })
          .onConflictDoUpdate({
            target: classes.id,
            set: {
              name: c.name || '',
              code: c.code || '',
              teacherId: c.teacherId || '',
              schedule: c.schedule || '',
              room: c.room || '',
              classFee: c.classFee || 0,
              extraFee: c.extraFee || 0,
              promotionStatus: c.promotionStatus || 'Regular',
              levelOfEducation: c.levelOfEducation || 'Junior Secondary',
            },
          });
      }
    }

    return true;
  } catch (error) {
    console.error('Error persisting state to Cloud SQL:', error);
    throw new Error('Failed to persist state to Cloud SQL', { cause: error });
  }
}

/**
 * Seed initial baseline data into Cloud SQL if empty
 */
export async function seedInitialStateIfEmpty(initialState: DbState): Promise<void> {
  try {
    const existing = await getCloudSqlState();
    if (!existing || !existing.users || existing.users.length === 0) {
      console.log('Seeding initial state to Cloud SQL...');
      await saveCloudSqlState(initialState);
    }
  } catch (error) {
    console.error('Error seeding initial state to Cloud SQL:', error);
  }
}
