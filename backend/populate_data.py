import asyncio
from db import database, engine, metadata
import sqlalchemy
from models import india_revenue

revenue_data = [
    {"year": 2018, "revenue": 170000000000},
    {"year": 2019, "revenue": 185000000000},
    {"year": 2020, "revenue": 190000000000},
    {"year": 2021, "revenue": 210000000000},
    {"year": 2022, "revenue": 230000000000},
    {"year": 2023, "revenue": 250000000000},
    {"year": 2024, "revenue": 275000000000},
    {"year": 2025, "revenue": 300000000000},
    {"year": 2026, "revenue": 325000000000},
    {"year": 2027, "revenue": 350000000000},
    {"year": 2028, "revenue": 375000000000},
    {"year": 2029, "revenue": 400000000000},
    {"year": 2030, "revenue": 425000000000},
]



async def insert_data():
    await database.connect()
    
    # Create the table if it doesn't exist
    metadata.create_all(engine)
    
    # Clear existing data
    delete_query = india_revenue.delete()
    await database.execute(delete_query)
    
    # Insert new data
    insert_query = india_revenue.insert()
    await database.execute_many(query=insert_query, values=revenue_data)
    
    # Verify data was inserted
    select_query = india_revenue.select()
    result = await database.fetch_all(select_query)
    print("Data in database:")
    for row in result:
        print(f"Year: {row['year']}, Revenue: {row['revenue']}")
    
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(insert_data())
