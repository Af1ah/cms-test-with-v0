import { initializeDatabase } from '../lib/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    console.time('DB Initialization');
    try {
        await initializeDatabase();
        console.timeEnd('DB Initialization');
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

test();
