import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Deletes the database file. The app rebuilds it from schema.sql and seed.sql the next time it starts.
const file = fileURLToPath(new URL('./tuckshop.db', import.meta.url));
if (existsSync(file)) rmSync(file);
console.log('Database deleted. Start the app (npm start) to rebuild it with fresh demo data.');
