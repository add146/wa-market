import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDb(env: any) {
    // In Cloudflare Workers, DB is bound to the environment
    return drizzle(env.DB, { schema });
}
