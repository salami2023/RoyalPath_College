import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      allowExitOnIdle: true,
    });

    global._postgresPool.on('error', (err: any) => {
      const isExpectedIdleClosure =
        err?.message?.includes('terminating connection due to administrator command') ||
        err?.message?.includes('Connection terminated unexpectedly') ||
        err?.code === '57P01' || // PostgreSQL admin_shutdown
        err?.code === 'ECONNRESET';

      if (isExpectedIdleClosure) {
        console.warn('[Cloud SQL Pool] Idle connection terminated by server (handled):', err?.message || err);
      } else {
        console.error('[Cloud SQL Pool] Unexpected error on idle client:', err);
      }
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
export { pool };
