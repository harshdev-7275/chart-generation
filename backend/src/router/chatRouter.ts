import express,{RequestHandler} from "express";
import { handleResponse } from "../controllers/chatController";
import { pool } from "../config/db";

const router = express.Router();

router.post("/response", handleResponse as RequestHandler)
router.get("/get-initial-data", async(req, res)=>{
    try {
        // Get query parameters for pagination
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;

        // Validate parameters
        if (pageSize > 100) {
            res.status(400).json({ error: "Page size cannot exceed 100" });
            return;
        }

        // Get the total count of records
        const countResult = await pool.query("SELECT COUNT(*) FROM csv_records;");
        const totalCount = parseInt(countResult.rows[0].count);

        // Calculate offset
        const offset = (page - 1) * pageSize;

        // Get paginated data with all fields
        const data = await pool.query(
            `SELECT id, data, uploaded_at
             FROM csv_records 
             ORDER BY uploaded_at DESC 
             LIMIT $1 OFFSET $2`,
            [pageSize, offset]
        );
        
        if (!data.rows || data.rows.length === 0) {
            res.status(404).json({ message: "No records found" });
            return;
        }

        // Log the size of our response
        const responseSize = Buffer.from(JSON.stringify(data.rows)).length;
        console.log('Response size:', responseSize, 'bytes');

        // Set response headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Transfer-Encoding', 'chunked');

        // Send paginated response
        res.status(200).json({ 
            data: data.rows.map(row => ({
                id: row.id,
                data: row.data,
                uploadedAt: row.uploaded_at
            })),
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalCount: totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
            }
        });
    } catch (error) {
        console.error("Error fetching initial data:", error);
        res.status(500).json({ 
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error occurred"
        });
    }
})

export default router; 