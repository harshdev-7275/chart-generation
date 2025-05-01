// db.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const createCsvRecordsTable = async () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS csv_records (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL,
      uploaded_at TIMESTAMP DEFAULT NOW()
    );
  `;
  return query(createTableQuery);
};


