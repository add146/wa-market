import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://tokoindo:tokoindo123@localhost:5432/tokoindo',
    },
    verbose: true,
    strict: true,
});
