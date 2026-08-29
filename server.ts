import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // In-memory state cache for local session handling
  let inMemoryState: any = null;
  let inMemoryUpdatedAt: string = new Date().toISOString();

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: 'standalone' });
  });

  // Local state endpoints
  app.get('/api/db/state', (req, res) => {
    return res.json({ success: true, data: inMemoryState, updatedAt: inMemoryUpdatedAt });
  });

  app.post('/api/db/state', (req, res) => {
    const { data } = req.body;
    if (data) {
      inMemoryState = typeof data === 'string' ? JSON.parse(data) : data;
      inMemoryUpdatedAt = new Date().toISOString();
    }
    return res.json({ success: true });
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

