import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

// Database connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://tokoindo:tokoindo123@localhost:5432/tokoindo';

// Create postgres client
const client = postgres(connectionString);

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export for migrations
export { client };
