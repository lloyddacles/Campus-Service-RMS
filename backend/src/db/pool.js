import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const db = new Database(path.join(__dirname, '../../data/campus_rms.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
