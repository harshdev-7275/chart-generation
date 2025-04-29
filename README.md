# Dynamic Data Analysis and Visualization

A full-stack application that allows users to query data using natural language and visualize it through various chart types. The application uses FastAPI for the backend, React for the frontend, and PostgreSQL for the database.

## Features

- Natural language query processing using Google's Gemini AI
- Dynamic chart generation based on data type
- Multiple visualization types (Bar, Line, Pie, Scatter)
- Real-time data analysis
- Responsive and modern UI
- PostgreSQL database integration

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 17+
- Docker (optional, for containerized setup)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the PostgreSQL database (using Docker):
```bash
docker-compose up -d
```

5. Populate the database with sample data:
```bash
python populate_data.py
python populate_sports_data.py
```

6. Start the backend server:
```bash
uvicorn main:app --reload --port 8001
```

The backend API will be available at `http://localhost:8001`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

- `POST /api/query`: Process natural language queries
- `GET /api/tables`: List all available tables
- `GET /api/schema/{table_name}`: Get schema for a specific table
- `POST /api/execute-sql`: Execute custom SQL queries
- `GET /api/test`: Test API functionality

## Database Schema

### india_revenue Table
- year (Integer, Primary Key)
- revenue (BigInteger)

### sports_data Table
- id (Integer, Primary Key)
- sport (String)
- year (Integer)
- medals (Integer)
- participants (Integer)
- budget (BigInteger)
- viewership (BigInteger)
- revenue (BigInteger)

## Example Queries

1. Revenue Comparison:
```
What is the revenue comparison between all sports for the year 2024?
```

2. Trend Analysis:
```
Show me the revenue trend for Cricket from 2018 to 2024
```

3. Distribution Analysis:
```
What is the distribution of budget across different sports in 2023?
```

4. Correlation Analysis:
```
Show me the relationship between medals and revenue for all sports
```

## Development

### Backend Structure
```
backend/
├── api.py          # API endpoints and business logic
├── db.py           # Database configuration
├── models.py       # SQLAlchemy models
├── main.py         # FastAPI application
├── populate_data.py        # Sample data population
└── populate_sports_data.py # Sports data population
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── QueryForm.tsx
│   │   ├── ChartDisplay.tsx
│   │   ├── DataTable.tsx
│   │   ├── SQLDisplay.tsx
│   │   └── ResponseCard.tsx
│   ├── App.tsx
│   └── App.css
└── package.json
```

## Troubleshooting

1. Database Connection Issues:
   - Ensure PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Verify database credentials

2. API Connection Issues:
   - Check if backend server is running
   - Verify CORS settings
   - Check API endpoint URLs

3. Frontend Issues:
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall
   - Check browser console for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 