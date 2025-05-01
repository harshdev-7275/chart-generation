import { Router } from 'express';
import {  query } from '../config/db';
import multer from 'multer';
import { parse } from 'csv-parse';
import { Readable } from 'stream';


const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

interface CsvRecord {
  [key: string]: string | number;
}

// Track processing status
let isProcessing = false;
let totalRecords = 0;
let processedRecords = 0;

// Function to ensure table exists
async function ensureTableExists() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS csv_records (
        id SERIAL PRIMARY KEY,
        data JSONB NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table csv_records is ready');
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
}

// Function to process CSV data
async function processCsvData(buffer: Buffer) {
  return new Promise((resolve, reject) => {
    const results: CsvRecord[] = [];
    let headers: string[] = [];

    Readable.from(buffer)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true
      }))
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          // Ensure table exists before inserting
          await ensureTableExists();
          
          totalRecords = results.length;
          processedRecords = 0;
          isProcessing = true;
          
          // Store all records in database
          for (const record of results) {
            await query(
              'INSERT INTO csv_records (data) VALUES ($1)',
              [record]
            );
            processedRecords++;
          }
          isProcessing = false;
          resolve(results);
        } catch (error) {
          isProcessing = false;
          reject(error);
        }
      })
      .on('error', (err) => {
        isProcessing = false;
        reject(err);
      });
  });
}

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Ensure table exists before proceeding
    await ensureTableExists();

    // Process the first batch of data (first 10 rows)
    const firstBatch = await new Promise<CsvRecord[]>((resolve, reject) => {
      const results: CsvRecord[] = [];
      let headers: string[] = [];

      Readable.from(req.file!.buffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true
        }))
        .on('data', (data) => {
          if (results.length < 10) {
            results.push(data);
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (err) => {
          reject(err);
        });
    });

    // Store first batch immediately
    for (const record of firstBatch) {
      await query(
        'INSERT INTO csv_records (data) VALUES ($1)',
        [record]
      );
    }

    // Start background processing for the rest of the data
    processCsvData(req.file.buffer).catch(error => {
      console.error('Background processing error:', error);
    });

    const headers = firstBatch.length > 0 ? Object.keys(firstBatch[0]) : [];
    
    res.json({
      message: 'Initial batch processed. Continuing in background.',
      headers,
      data: firstBatch
    });

  } catch (error) {
    console.error('Error uploading CSV:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint to get latest records
router.get('/latest', async (req, res) => {
  try {
    // Ensure table exists before querying
    await ensureTableExists();

    const { rows } = await query(
      'SELECT data FROM csv_records ORDER BY uploaded_at DESC LIMIT 100'
    );

    const headers = rows.length > 0 ? Object.keys(rows[0].data) : [];
    
    res.json({
      headers,
      data: rows.map(row => row.data),
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching latest records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// New endpoint to check processing status
router.get('/status', async (req, res) => {
  try {
    await ensureTableExists();
    
    // Get total records in database
    const { rows } = await query('SELECT COUNT(*) as total FROM csv_records');
    const totalInDb = parseInt(rows[0].total);
    
    res.json({
      isProcessing,
      totalRecords,
      processedRecords,
      totalInDatabase: totalInDb,
      progress: totalRecords > 0 ? (processedRecords / totalRecords * 100).toFixed(2) + '%' : '0%'
    });
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 