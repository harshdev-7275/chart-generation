import client from "../config/client";
import { query } from "../config/db"


const getDBContext = async () => {
   const data = await getTableSchema();

   
   if (!data.rows || data.rows.length === 0) {
       throw new Error("No tables found in the database");
   }

   // Group columns by table
   const tableSchema = [{
       name: 'csv_records',
       columns: data.rows.map((item: any) => ({
           name: item.column_name,
           type: item.data_type
       }))
   }];
   
   if (!tableSchema[0] || !tableSchema[0].name) {
       throw new Error("Invalid table schema data");
   }

   // Get sample data from the table (first 10 rows)
   const sampleData = await query(`SELECT * FROM ${tableSchema[0].name} LIMIT 10`);
   
   const question = `Please summarize the data table name ${tableSchema[0].name} and the columns ${tableSchema[0].columns.map((column: any) => column.name).join(", ")} and give the context of the data in the table`
   console.log("question", question)
   const response = await client.models.generateContent({
     model: "gemini-2.0-flash",
     contents: `
     You are a helpful database analyst assistant. Your task is to analyze database schema and sample data to provide comprehensive insights.

     I'll provide you with information about a database table, its columns, and sample data. Please:
     1. Summarize what this table likely represents in a business context
     2. Explain the purpose of each column and its data characteristics
     3. Analyze patterns, trends, or insights visible in the sample data
     4. Suggest how this data might be used in analysis or applications
     5. Note any potential relationships this table might have with other typical database tables
     6. Identify columns that might be primary keys, foreign keys, or contain special values
     7. Flag any data quality issues or anomalies in the sample data
     8. Suggest possible queries or analytics that would be valuable with this data

     Database schema information:
     Table name: ${tableSchema[0].name}
     Columns: ${tableSchema[0].columns.map((column: any) => `${column.name} (${column.type})`).join(", ")}

     Sample data (first 10 rows):
     ${JSON.stringify(sampleData, null, 2)}

     question: ${question}

     Respond with a clear, structured explanation that would help someone understand both the structure and content of this data. Include specific examples from the sample data to illustrate your points.
     `,
   })
console.log("response for the db context", response.text)
   return response.text
}

   const getTableSchema = async () => {
    const result = await query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'csv_records' AND table_schema = 'public';")
    return result
}

export { getDBContext, getTableSchema }