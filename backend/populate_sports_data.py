import asyncio
from db import database, engine, metadata
import sqlalchemy
from models import sports_data

# Sample sports data with realistic values
sports_data_list = [
    # Cricket data
    {"sport": "Cricket", "year": 2018, "medals": 0, "participants": 15, "budget": 5000000000, "viewership": 1000000000, "revenue": 8000000000},
    {"sport": "Cricket", "year": 2019, "medals": 0, "participants": 15, "budget": 5500000000, "viewership": 1100000000, "revenue": 9000000000},
    {"sport": "Cricket", "year": 2020, "medals": 0, "participants": 15, "budget": 6000000000, "viewership": 1200000000, "revenue": 10000000000},
    {"sport": "Cricket", "year": 2021, "medals": 0, "participants": 15, "budget": 6500000000, "viewership": 1300000000, "revenue": 11000000000},
    {"sport": "Cricket", "year": 2022, "medals": 0, "participants": 15, "budget": 7000000000, "viewership": 1400000000, "revenue": 12000000000},
    {"sport": "Cricket", "year": 2023, "medals": 0, "participants": 15, "budget": 7500000000, "viewership": 1500000000, "revenue": 13000000000},
    {"sport": "Cricket", "year": 2024, "medals": 0, "participants": 15, "budget": 8000000000, "viewership": 1600000000, "revenue": 14000000000},
    
    # Football data
    {"sport": "Football", "year": 2018, "medals": 0, "participants": 20, "budget": 3000000000, "viewership": 800000000, "revenue": 5000000000},
    {"sport": "Football", "year": 2019, "medals": 0, "participants": 20, "budget": 3500000000, "viewership": 900000000, "revenue": 6000000000},
    {"sport": "Football", "year": 2020, "medals": 0, "participants": 20, "budget": 4000000000, "viewership": 1000000000, "revenue": 7000000000},
    {"sport": "Football", "year": 2021, "medals": 0, "participants": 20, "budget": 4500000000, "viewership": 1100000000, "revenue": 8000000000},
    {"sport": "Football", "year": 2022, "medals": 0, "participants": 20, "budget": 5000000000, "viewership": 1200000000, "revenue": 9000000000},
    {"sport": "Football", "year": 2023, "medals": 0, "participants": 20, "budget": 5500000000, "viewership": 1300000000, "revenue": 10000000000},
    {"sport": "Football", "year": 2024, "medals": 0, "participants": 20, "budget": 6000000000, "viewership": 1400000000, "revenue": 11000000000},
    
    # Hockey data
    {"sport": "Hockey", "year": 2018, "medals": 2, "participants": 18, "budget": 2000000000, "viewership": 500000000, "revenue": 3000000000},
    {"sport": "Hockey", "year": 2019, "medals": 3, "participants": 18, "budget": 2500000000, "viewership": 600000000, "revenue": 4000000000},
    {"sport": "Hockey", "year": 2020, "medals": 2, "participants": 18, "budget": 3000000000, "viewership": 700000000, "revenue": 5000000000},
    {"sport": "Hockey", "year": 2021, "medals": 4, "participants": 18, "budget": 3500000000, "viewership": 800000000, "revenue": 6000000000},
    {"sport": "Hockey", "year": 2022, "medals": 3, "participants": 18, "budget": 4000000000, "viewership": 900000000, "revenue": 7000000000},
    {"sport": "Hockey", "year": 2023, "medals": 5, "participants": 18, "budget": 4500000000, "viewership": 1000000000, "revenue": 8000000000},
    {"sport": "Hockey", "year": 2024, "medals": 4, "participants": 18, "budget": 5000000000, "viewership": 1100000000, "revenue": 9000000000},
    
    # Badminton data
    {"sport": "Badminton", "year": 2018, "medals": 5, "participants": 10, "budget": 1000000000, "viewership": 300000000, "revenue": 2000000000},
    {"sport": "Badminton", "year": 2019, "medals": 6, "participants": 10, "budget": 1500000000, "viewership": 400000000, "revenue": 3000000000},
    {"sport": "Badminton", "year": 2020, "medals": 4, "participants": 10, "budget": 2000000000, "viewership": 500000000, "revenue": 4000000000},
    {"sport": "Badminton", "year": 2021, "medals": 7, "participants": 10, "budget": 2500000000, "viewership": 600000000, "revenue": 5000000000},
    {"sport": "Badminton", "year": 2022, "medals": 6, "participants": 10, "budget": 3000000000, "viewership": 700000000, "revenue": 6000000000},
    {"sport": "Badminton", "year": 2023, "medals": 8, "participants": 10, "budget": 3500000000, "viewership": 800000000, "revenue": 7000000000},
    {"sport": "Badminton", "year": 2024, "medals": 7, "participants": 10, "budget": 4000000000, "viewership": 900000000, "revenue": 8000000000},
    
    # Wrestling data
    {"sport": "Wrestling", "year": 2018, "medals": 8, "participants": 12, "budget": 800000000, "viewership": 200000000, "revenue": 1500000000},
    {"sport": "Wrestling", "year": 2019, "medals": 9, "participants": 12, "budget": 1000000000, "viewership": 300000000, "revenue": 2000000000},
    {"sport": "Wrestling", "year": 2020, "medals": 7, "participants": 12, "budget": 1200000000, "viewership": 400000000, "revenue": 2500000000},
    {"sport": "Wrestling", "year": 2021, "medals": 10, "participants": 12, "budget": 1400000000, "viewership": 500000000, "revenue": 3000000000},
    {"sport": "Wrestling", "year": 2022, "medals": 9, "participants": 12, "budget": 1600000000, "viewership": 600000000, "revenue": 3500000000},
    {"sport": "Wrestling", "year": 2023, "medals": 11, "participants": 12, "budget": 1800000000, "viewership": 700000000, "revenue": 4000000000},
    {"sport": "Wrestling", "year": 2024, "medals": 10, "participants": 12, "budget": 2000000000, "viewership": 800000000, "revenue": 4500000000}
]

async def insert_data():
    await database.connect()
    
    # Create the table if it doesn't exist
    metadata.create_all(engine)
    
    # Clear existing data
    delete_query = sports_data.delete()
    await database.execute(delete_query)
    
    # Insert new data
    insert_query = sports_data.insert()
    await database.execute_many(query=insert_query, values=sports_data_list)
    
    # Verify data was inserted
    select_query = sports_data.select()
    result = await database.fetch_all(select_query)
    print("Data in database:")
    for row in result:
        print(f"Sport: {row['sport']}, Year: {row['year']}, Medals: {row['medals']}, Participants: {row['participants']}, Budget: {row['budget']}, Viewership: {row['viewership']}, Revenue: {row['revenue']}")
    
    await database.disconnect()

if __name__ == "__main__":
    asyncio.run(insert_data()) 