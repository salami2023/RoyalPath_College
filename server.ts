import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { getCloudSqlState, saveCloudSqlState, seedInitialStateIfEmpty } from './src/db/cloudService.ts';
import { INITIAL_DB } from './src/database.ts';

const BACKUP_FILE = path.join(process.cwd(), 'school_db_state.json');

function readDiskBackup(): any | null {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err: any) {
    console.warn('[Server Startup] Unable to read local disk backup:', err.message);
  }
  return null;
}

function writeDiskBackup(state: any): void {
  try {
    if (state && typeof state === 'object') {
      fs.writeFileSync(BACKUP_FILE, JSON.stringify(state, null, 2), 'utf-8');
    }
  } catch (err: any) {
    console.warn('[Server] Failed to write local disk backup:', err.message);
  }
}

function sanitizeState(state: any) {
  if (!state || typeof state !== 'object') return state;
  const deletedSet = new Set<string>(Array.isArray(state.deletedRecordIds) ? state.deletedRecordIds : []);
  if (deletedSet.size === 0) return state;

  const filterList = (arr: any[]) => Array.isArray(arr) ? arr.filter(item => item && item.id && !deletedSet.has(item.id)) : [];

  return {
    ...state,
    users: filterList(state.users),
    teachers: filterList(state.teachers),
    students: filterList(state.students),
    parents: filterList(state.parents),
    classes: filterList(state.classes),
    enrollments: filterList(state.enrollments),
    grades: filterList(state.grades),
    attendance: filterList(state.attendance),
    reportComments: filterList(state.reportComments),
    tests: filterList(state.tests),
    lessonNotes: filterList(state.lessonNotes),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // In-memory caching layer for instantaneous fan-out across all clients
  const diskState = readDiskBackup();
  let inMemoryState: any = diskState || null;
  let inMemoryUpdatedAt: string = new Date().toISOString();

  // Bootstraps initial state safely: NEVER overwrite existing user records on republish
  try {
    const existing = await getCloudSqlState();
    if (existing && Array.isArray(existing.users) && existing.users.length > 0) {
      inMemoryState = sanitizeState(existing);
      writeDiskBackup(inMemoryState);
    } else if (diskState && Array.isArray(diskState.users) && diskState.users.length > 0) {
      inMemoryState = sanitizeState(diskState);
      // Re-hydrate Cloud SQL from the persistent disk state
      try {
        await saveCloudSqlState(inMemoryState);
      } catch (sqlErr: any) {
        console.warn('[Cloud SQL] Could not sync disk state to SQL:', sqlErr.message);
      }
    } else {
      await seedInitialStateIfEmpty(INITIAL_DB);
      inMemoryState = sanitizeState(INITIAL_DB);
      writeDiskBackup(inMemoryState);
    }
  } catch (err: any) {
    console.warn('[Cloud SQL Startup] Database initialization fallback:', err.message);
    if (!inMemoryState) {
      inMemoryState = sanitizeState(INITIAL_DB);
      writeDiskBackup(inMemoryState);
    }
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', provider: 'google_cloud_sql', region: 'europe-west2' });
  });

  // Fetch full state from Google Cloud SQL (fallback to inMemoryState if database is busy)
  app.get('/api/db/state', async (req, res) => {
    try {
      const sqlState = await getCloudSqlState();
      if (sqlState && Array.isArray(sqlState.users) && sqlState.users.length > 0) {
        const cleanState = sanitizeState(sqlState);
        inMemoryState = cleanState;
        writeDiskBackup(cleanState);
        return res.json({ success: true, data: cleanState, updatedAt: inMemoryUpdatedAt, source: 'cloud_sql' });
      }
      return res.json({ success: true, data: sanitizeState(inMemoryState), updatedAt: inMemoryUpdatedAt, source: 'memory_fallback' });
    } catch (err: any) {
      console.error('[Cloud SQL API] State read error:', err.message);
      return res.json({ success: true, data: sanitizeState(inMemoryState), updatedAt: inMemoryUpdatedAt, source: 'memory_fallback' });
    }
  });

  // Save updated state into Google Cloud SQL and broadcast to cache + disk
  app.post('/api/db/state', async (req, res) => {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    const stateObj = sanitizeState(typeof data === 'string' ? JSON.parse(data) : data);
    inMemoryState = stateObj;
    inMemoryUpdatedAt = new Date().toISOString();
    writeDiskBackup(stateObj);

    try {
      await saveCloudSqlState(stateObj);
      return res.json({ success: true, persisted: 'cloud_sql', updatedAt: inMemoryUpdatedAt });
    } catch (err: any) {
      console.error('[Cloud SQL API] State write error:', err.message);
      // Still acknowledge and persist to disk so local UI and server retain state
      return res.json({ success: true, persisted: 'disk_and_memory', warning: err.message, updatedAt: inMemoryUpdatedAt });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
