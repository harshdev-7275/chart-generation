from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Union, AsyncGenerator
import os
import json
import uuid
from pathlib import Path
import pandas as pd
import google.generativeai as genai
from sqlalchemy import inspect, text
from db import database, engine
from dotenv import load_dotenv
import asyncio

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Dynamic Data API",
    description="API for querying data using Gemini and SQL databases",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Validate required environment variables
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Simple in-memory cache
schema_cache = {}
tables_cache = None
cache_expiry = {}
CACHE_TTL = 3600  # 1 hour in seconds

# Pydantic Models
class QueryRequest(BaseModel):
    question: str
    stream: bool = False

class QueryResponse(BaseModel):
    question: str
    sql: str
    result: List[Dict[str, Any]]
    llm_response: str
    error: Optional[str] = None

# Cache functions
def get_cached_schema(table_name: str) -> Optional[str]:
    """Get schema from in-memory cache if available and not expired."""
    now = asyncio.get_event_loop().time()
    if table_name in schema_cache and now < cache_expiry.get(table_name, 0):
        return schema_cache[table_name]
    return None

def set_cached_schema(table_name: str, schema: str) -> None:
    """Cache schema in memory."""
    now = asyncio.get_event_loop().time()
    schema_cache[table_name] = schema
    cache_expiry[table_name] = now + CACHE_TTL

def get_cached_tables() -> Optional[List[str]]:
    """Get list of tables from in-memory cache if available and not expired."""
    now = asyncio.get_event_loop().time()
    if tables_cache and now < cache_expiry.get('tables', 0):
        return tables_cache
    return None

def set_cached_tables(tables: List[str]) -> None:
    """Cache list of tables in memory."""
    global tables_cache
    now = asyncio.get_event_loop().time()
    tables_cache = tables
    cache_expiry['tables'] = now + CACHE_TTL

async def fetch_table_schema(table_name: str) -> str:
    """Fetch table schema with caching."""
    # Try to get from cache first
    cached_schema = get_cached_schema(table_name)
    if cached_schema:
        return cached_schema

    # If not in cache, fetch from database
    inspector = inspect(engine)
    try:
        columns = inspector.get_columns(table_name)
        schema_lines = [f"- `{column['name']}`: {column['type']}" for column in columns]
        schema_text = f"Schema for `{table_name}`:\n" + "\n".join(schema_lines)
        
        # Cache the schema
        set_cached_schema(table_name, schema_text)
        return schema_text
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error fetching schema for table {table_name}: {str(e)}")

async def fetch_all_tables_and_schemas() -> Dict[str, str]:
    """Fetch all tables and their schemas with caching."""
    # Try to get tables from cache first
    cached_tables = get_cached_tables()
    if cached_tables:
        tables = cached_tables
    else:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        # Cache the table list
        set_cached_tables(tables)
    
    table_schemas = {}
    for table in tables:
        schema_text = await fetch_table_schema(table)
        table_schemas[table] = schema_text
    
    return table_schemas

def clean_sql(sql: str) -> str:
    """Clean and sanitize the SQL query."""
    sql = sql.replace("```sql", "").replace("```", "").strip()
    if sql.endswith(';'):
        sql = sql[:-1]
    return sql

async def generate_sql_from_question(question: str) -> str:
    """Use Gemini to generate SQL from natural language."""
    try:
        # Fetch all tables and their schemas
        table_schemas = await fetch_all_tables_and_schemas()
        
        # Create a comprehensive schema description
        all_schemas_text = "\n\n".join([
            f"Table: {table_name}\n{schema}"
            for table_name, schema in table_schemas.items()
        ])
        
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = f"""
You are an expert at writing SQL queries for PostgreSQL.

Write a PostgreSQL SQL query to answer the question:
"{question}"

Available tables and their schemas:
{all_schemas_text}

INSTRUCTIONS:
- Choose the most appropriate table(s) to answer the question.
- Do NOT make up column names.
- Use STANDARD SQL.
- Do NOT include comments or semicolons.
- Return ONLY the SQL.
- If you need to join tables, make sure to use the correct join conditions.
- For date operations, use CAST or TO_DATE instead of make_date.
- For numeric values, ensure proper type casting using CAST(value AS type).
- Use proper date formatting: 'YYYY-MM-DD' for dates.
- Use proper numeric formatting: CAST(value AS NUMERIC) for decimal numbers.
- Use proper integer formatting: CAST(value AS INTEGER) for whole numbers.
"""
        response = model.generate_content(prompt)
        sql = response.text.strip()
        print(f"Raw SQL from Gemini: {sql}")
        return clean_sql(sql)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

def validate_sql(sql: str) -> None:
    """Validate SQL to prevent dangerous operations."""
    dangerous_keywords = ["DROP", "DELETE", "UPDATE", "ALTER", "TRUNCATE", "INSERT"]
    for keyword in dangerous_keywords:
        if keyword in sql.upper():
            raise HTTPException(status_code=400, detail=f"Dangerous operation found: {keyword}. Query rejected.")
    if not sql.upper().startswith("SELECT"):
        raise HTTPException(status_code=400, detail="Query must start with SELECT")
    if "--" in sql:
        raise HTTPException(status_code=400, detail="SQL contains comments (--) which may cause syntax errors")
    for char in ["--", "/*", "*/"]:
        if char in sql:
            raise HTTPException(status_code=400, detail=f"SQL contains problematic characters: {char}")

async def run_database_query(sql: str) -> pd.DataFrame:
    """Execute SQL query and return results as DataFrame."""
    try:
        validate_sql(sql)
        async with database.connection() as connection:
            # First try to execute the query
            try:
                result = await connection.fetch_all(query=sql)
                # Create a DataFrame with proper column names and data types
                if result:
                    # Convert the result to a list of dictionaries
                    data = [dict(row) for row in result]
                    # Create DataFrame with explicit column names and data types
                    df = pd.DataFrame(data)
                    
                    # Handle percentage calculations
                    if '?column?' in df.columns:
                        df = df.rename(columns={'?column?': 'percentage_increase'})
                        # Format percentage values
                        df['percentage_increase'] = df['percentage_increase'].apply(
                            lambda x: f"{float(x):.2f}%" if pd.notnull(x) else None
                        )
                    
                    # Convert numeric columns to appropriate types
                    for col in df.columns:
                        if col.lower() in ['year', 'revenue']:
                            df[col] = pd.to_numeric(df[col], errors='coerce')
                    return df
                return pd.DataFrame()  # Empty DataFrame if no results
            except Exception as db_error:
                # If the query fails, try to fix common issues
                if "make_date" in str(db_error):
                    # Replace make_date with proper date casting
                    sql = sql.replace("make_date", "TO_DATE")
                elif "numeric" in str(db_error).lower():
                    # Add proper numeric casting
                    sql = sql.replace("numeric", "CAST(value AS NUMERIC)")
                
                # Try the modified query
                result = await connection.fetch_all(query=sql)
                if result:
                    # Convert the result to a list of dictionaries
                    data = [dict(row) for row in result]
                    # Create DataFrame with explicit column names and data types
                    df = pd.DataFrame(data)
                    
                    # Handle percentage calculations
                    if '?column?' in df.columns:
                        df = df.rename(columns={'?column?': 'percentage_increase'})
                        # Format percentage values
                        df['percentage_increase'] = df['percentage_increase'].apply(
                            lambda x: f"{float(x):.2f}%" if pd.notnull(x) else None
                        )
                    
                    # Convert numeric columns to appropriate types
                    for col in df.columns:
                        if col.lower() in ['year', 'revenue']:
                            df[col] = pd.to_numeric(df[col], errors='coerce')
                    return df
                return pd.DataFrame()  # Empty DataFrame if no results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

async def generate_llm_response(question: str, data: pd.DataFrame, stream: bool = False) -> Union[str, AsyncGenerator[str, None]]:
    """Generate a natural language response from the data."""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Add context about the data
        data_context = ""
        if 'percentage_increase' in data.columns:
            data_context = "The percentage increase is calculated as: ((2020 revenue - 2019 revenue) / 2019 revenue) * 100"
        
        prompt = f"""
Based on the following data, provide a clear and concise analysis that answers this question:
"{question}"

{data_context}

Data:
{data.to_string()}

Instructions:
- Focus on the key insights and trends
- Use natural language
- Be concise but informative
- Highlight any notable patterns or anomalies
- For percentage calculations, explain the meaning of the percentage
"""
        if stream:
            async def generate():
                response = await model.generate_content_async(prompt, stream=True)
                async for chunk in response:
                    if chunk.text:
                        yield f"data: {json.dumps({'text': chunk.text})}\n\n"
            return generate()
        else:
            response = await model.generate_content_async(prompt)
            return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

@app.post("/query")
async def process_query(request: QueryRequest):
    question = request.question
    try:
        sql = await generate_sql_from_question(question)
        df = await run_database_query(sql)
        
        # Convert DataFrame to records with properly named columns
        if not df.empty:
            # Use orient='records' to get list of dictionaries with proper column names
            result_json = df.to_dict(orient="records")
        else:
            result_json = []
        
        if request.stream:
            # Create a streaming response
            async def generate():
                # Stream the LLM response
                async for chunk in await generate_llm_response(question, df, stream=True):
                    yield chunk
            
            return StreamingResponse(generate(), media_type="text/event-stream")
        else:
            llm_response = await generate_llm_response(question, df, stream=False)
            return QueryResponse(
                question=question,
                sql=sql,
                result=result_json,
                llm_response=llm_response
            )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/execute-sql")
async def execute_sql(sql: str):
    """Execute a custom SQL query directly."""
    try:
        validate_sql(sql)
        df = await run_database_query(sql)
        
        # Convert DataFrame to records with properly named columns
        if not df.empty:
            result_json = df.to_dict(orient="records")
        else:
            result_json = []
            
        return {"result": result_json}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error executing SQL: {str(e)}")

@app.get("/tables")
async def get_tables():
    """Get list of all tables in the database."""
    try:
        tables = await fetch_all_tables_and_schemas()
        return {"tables": list(tables.keys())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tables: {str(e)}")

@app.get("/schema/{table_name}")
async def get_table_schema(table_name: str):
    """Get schema for a specific table."""
    try:
        schema = await fetch_table_schema(table_name)
        return {"table": table_name, "schema": schema}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching schema: {str(e)}")

@app.get("/clear-cache")
async def clear_cache():
    """Clear the in-memory schema cache."""
    global schema_cache, tables_cache, cache_expiry
    schema_cache = {}
    tables_cache = None
    cache_expiry = {}
    return {"message": "Cache cleared successfully"}

@app.get("/test")
async def test():
    return {"message": "API is running!", "database_connected": database.is_connected}