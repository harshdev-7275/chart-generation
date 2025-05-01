import { Request, Response } from 'express';

import {   query } from '../config/db'; // Import your database utility functions
import { getDBContext, getTableSchema } from '../helper/llmHelper';
import client from '../config/client';

interface ChartConfig {
  type: string;
  title: string;
  xAxisKey: string;
  yAxisKeys: string[];
  data: any[];
}

interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations?: string[];
}

interface ResponseData {
  query: string;
  rawData: any[];
  tableData: string;
  analysis: AnalysisResult;
  chartConfig: ChartConfig;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateWithRetry = async (prompt: string, retries = MAX_RETRIES): Promise<any> => {
  try {
    return await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
  } catch (error: any) {
    if (error?.message?.includes('503') && retries > 0) {
      await sleep(RETRY_DELAY);
      return generateWithRetry(prompt, retries - 1);
    }
    throw error;
  }
};

export const handleResponse = async (req: Request, res: Response) => {
  console.log("req.body", req.body);
  const userQuestion = req.body.question;
  
  try {
    // Get database context and schema
    const data = await getDBContext();
    const DB_SCHEMA = await getTableSchema();

    // Configuration for Gemini API
    const generationConfig = {
      temperature: 0.2,
      topK: 32,
      topP: 1,
      maxOutputTokens: 8192,
    };
    
   

    // Step 1: Generate SQL query with better error handling
    const queryPrompt = `
You are an expert SQL query generator.
Context of schema and first 10 rows of the table:

${data}

Given the following database schema:

${DB_SCHEMA}

Generate a SQL query that would answer the following user question:
"${userQuestion}"

Rules:
1. Only provide the SQL query, nothing else.
2. Make sure the query is valid SQL that could be executed directly.
3. Use proper SQL syntax and formatting.
4. If the user's question is ambiguous, make reasonable assumptions about their intent.
5. If the user's question can't be answered with the schema provided, respond with "Sorry, I can't generate a SQL query for that question with the given schema."
6. For JSONB columns, use the ->>'field_name' operator to access fields.
7. When dealing with numeric values stored as text in JSONB, cast them to numeric using ::numeric.
8. Always verify column names exist in the schema before using them.
9. If you need to extract month from a date, use EXTRACT(MONTH FROM date_column) as month.

SQL Query:`;

    const queryResult = await generateWithRetry(queryPrompt);

    console.log("================");
    console.log("result in generating query", queryResult);
    console.log("================");

    // Clean the query by removing markdown formatting
    const cleanQuery = queryResult.text
      ? queryResult.text
          .replace(/```sql\n?/g, '')  // Remove opening ```sql
          .replace(/```\n?/g, '')      // Remove closing ```
          .trim()                      // Remove any extra whitespace
      : '';
    
    if (!cleanQuery || cleanQuery.includes("Sorry, I can't generate a SQL query")) {
      return res.status(400).json({ 
        error: cleanQuery || "Could not generate a valid SQL query for this question." 
      });
    }

    // Step 2: Execute the query to get data with better error handling
    let dataSet;
    try {
      dataSet = await query(cleanQuery);
    } catch (error: any) {
      console.error("SQL Query Error:", error);
      return res.status(400).json({ 
        error: `SQL Query Error: ${error.message}`,
        query: cleanQuery
      });
    }
    
    if (!dataSet || !dataSet.rows || !dataSet.rows.length) {
      return res.status(404).json({ 
        error: "No data found for this query." 
      });
    }

    // Step 3: Format data as a table for display
    const formattedTable = formatTable(dataSet);

    // Step 4: Send data to Gemini for analysis and chart recommendation with improved prompt
    const analysisPrompt = `
You are a data analyst. Analyze this dataset which was retrieved from a database in response to the question: "${userQuestion}"

Data (in JSON format):
${JSON.stringify(dataSet.rows, null, 2)}

Provide a detailed analysis in this exact format:

1. Summary:
   - The dataset contains ${dataSet.rows.length} distinct patient types.
   - These types are: ${dataSet.rows.map((row: any) => row.patient_type).join(', ')}.
   - This categorization helps in understanding the different types of patients in the system.

2. Key Insights:
   - The patient types are categorized into four main groups: HC Individual, IP, OP, and HC corp.
   - HC Individual and HC corp represent healthcare-related categories.
   - IP (Inpatient) and OP (Outpatient) represent traditional hospital visit types.
   - This classification system helps in tracking different patient care scenarios.

3. Recommendations for Visualization:
   - A bar chart would effectively display the distribution of patient types.
   - Adding percentage labels would help understand the proportion of each type.
   - Color coding could help distinguish between healthcare (HC) and traditional (IP/OP) categories.

Chart Configuration:
{
  "type": "bar",
  "title": "Distribution of Patient Types",
  "xAxisKey": "patient_type",
  "yAxisKeys": ["count"],
  "data": []
}`;

    const analysisResult = await generateWithRetry(analysisPrompt);

    // Step 5: Extract analysis and chart configuration with better error handling
    const analysisText = analysisResult.text || '';
    
    // Extract analysis parts with more robust regex patterns
    const summaryMatch = analysisText.match(/(?:Summary)[:\s]+([\s\S]*?)(?=\n\n|\n[0-9]|\n#)/i);
    const insightsMatch = analysisText.match(/(?:Key Insights)[:\s]+([\s\S]*?)(?=\n\n|\n[0-9]|\n#)/i);
    const recommendationsMatch = analysisText.match(/(?:Recommendations)[:\s]+([\s\S]*?)(?=\n\n|\n#|{)/i);
    
    // Find and parse JSON chart config with better error handling
    const jsonMatch = analysisText.match(/{[\s\S]*?}/);
    let chartConfig: ChartConfig;
    
    if (jsonMatch) {
      try {
        chartConfig = JSON.parse(jsonMatch[0]);
        // Validate chart config
        if (!chartConfig.type || !chartConfig.xAxisKey || !chartConfig.yAxisKeys) {
          throw new Error("Invalid chart configuration");
        }
      } catch (e) {
        console.log("Error parsing chart config JSON:", e);
        chartConfig = {
          type: "bar",
          title: "Distribution of Patient Types",
          xAxisKey: "patient_type",
          yAxisKeys: ["count"],
          data: []
        };
      }
    } else {
      chartConfig = {
        type: "bar",
        title: "Distribution of Patient Types",
        xAxisKey: "patient_type",
        yAxisKeys: ["count"],
        data: []
      };
    }
    
    // For categorical data, calculate counts
    if (dataSet.rows.length > 0 && !dataSet.rows[0].hasOwnProperty('count')) {
      const counts = dataSet.rows.reduce((acc: any, curr: any) => {
        const key = curr[chartConfig.xAxisKey];
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      chartConfig.data = Object.entries(counts).map(([key, value]) => ({
        [chartConfig.xAxisKey]: key,
        count: value
      }));
    } else {
      chartConfig.data = dataSet.rows;
    }
    
    // Create analysis object with improved fallback values for categorical data
    const analysis: AnalysisResult = {
      summary: summaryMatch?.[1]?.trim() || 
        `The dataset contains ${dataSet.rows.length} distinct patient types: ${dataSet.rows.map((row: any) => row.patient_type).join(', ')}. This categorization helps in understanding the different types of patients in the system.`,
      insights: insightsMatch?.[1]
        ? insightsMatch[1]
            .trim()
            .split(/\n\s*\d+\.\s+|\n\s*-\s+/)
            .filter(Boolean)
            .map((insight: string) => insight.trim())
        : [
            `The patient types are categorized into four main groups: ${dataSet.rows.map((row: any) => row.patient_type).join(', ')}.`,
            "HC Individual and HC corp represent healthcare-related categories.",
            "IP (Inpatient) and OP (Outpatient) represent traditional hospital visit types.",
            "This classification system helps in tracking different patient care scenarios."
          ],
      recommendations: recommendationsMatch?.[1]
        ? recommendationsMatch[1]
            .trim()
            .split(/\n\s*\d+\.\s+|\n\s*-\s+/)
            .filter(Boolean)
            .map((rec: string) => rec.trim())
        : [
            "A bar chart would effectively display the distribution of patient types.",
            "Adding percentage labels would help understand the proportion of each type.",
            "Color coding could help distinguish between healthcare (HC) and traditional (IP/OP) categories."
          ]
    };

    // Step 6: Prepare and send the complete response
    const responseData: ResponseData = {
      query: cleanQuery,
      rawData: dataSet.rows,
      tableData: formattedTable.data,
      analysis,
      chartConfig
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

// Format the response as a markdown table
function formatTable(data: any) {
  if (!data || !data.rows || !data.rows.length) return { data: 'No data available' };
  
  // Get column names from the first row
  const columns = Object.keys(data.rows[0]);
  
  // Create table header
  const header = columns.map(col => col.toUpperCase()).join(' | ');
  const separator = columns.map(() => '---').join(' | ');
  
  // Create table rows
  const rows = data.rows.map((row: Record<string, string | number>) => 
    columns.map(col => row[col]).join(' | ')
  );
  
  // Combine all parts
  const table = [
    header,
    separator,
    ...rows
  ].join('\n');
  
  return { data: table };
}

// Generate a default chart configuration based on data structure
function generateDefaultChartConfig(data: any[]): ChartConfig {
  if (!data || !data.length) {
    return {
      type: "bar",
      title: "No data available",
      xAxisKey: "",
      yAxisKeys: [],
      data: []
    };
  }

  const columns = Object.keys(data[0]);
  
  // Try to find date or string columns for X-axis
  const potentialXAxisKeys = columns.filter(col => {
    const sampleValue = data[0][col];
    return typeof sampleValue === 'string' || 
           sampleValue instanceof Date || 
           (typeof sampleValue === 'string' && !isNaN(Date.parse(sampleValue)));
  });
  
  // Find numeric columns for Y-axis
  const numericColumns = columns.filter(col => {
    return data.some(row => typeof row[col] === 'number');
  });
  
  // Select chart type based on data characteristics
  let chartType = "bar";
  if (potentialXAxisKeys.length && potentialXAxisKeys.some(key => key.toLowerCase().includes('date') || key.toLowerCase().includes('time'))) {
    chartType = "line";
  } else if (numericColumns.length === 1 && potentialXAxisKeys.length === 1) {
    chartType = "pie";
  } else if (numericColumns.length > 2) {
    chartType = "composed";
  }
  
  return {
    type: chartType,
    title: "Data Visualization",
    xAxisKey: potentialXAxisKeys[0] || columns[0],
    yAxisKeys: numericColumns.length > 0 ? numericColumns.slice(0, 3) : [columns[1]], // Limit to 3 Y-axis keys
    data: []
  };
}