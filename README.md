# Dynamic Data Analysis and Visualization

A full-stack application that allows users to query data using natural language and visualize it through various chart types. The application uses Node.js/TypeScript for the backend, React/TypeScript for the frontend, and Redis for caching.

## Features

- Natural language query processing using Google's Gemini AI
- Dynamic chart generation based on data type
- Multiple visualization types (Bar, Line, Pie, Scatter)
- Real-time data analysis
- Responsive and modern UI
- Redis caching for improved performance

## Prerequisites

- Node.js 16+
- Redis
- Docker (optional, for containerized setup)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the Redis server (using Docker):
```bash
docker-compose up -d
```

4. Start the backend server:
```bash
npm run dev
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

## Project Structure

### Backend Structure
```
backend/
├── src/           # Source code
├── dist/          # Compiled output
├── package.json   # Dependencies and scripts
├── tsconfig.json  # TypeScript configuration
└── docker-compose.yml # Docker configuration
```

### Frontend Structure
```
frontend/
├── src/           # Source code
├── public/        # Static assets
├── package.json   # Dependencies and scripts
├── tsconfig.json  # TypeScript configuration
└── vite.config.ts # Vite configuration
```

## Development

The project uses TypeScript for both frontend and backend development, providing type safety and better developer experience.

### Backend Development
- Built with Node.js and TypeScript
- Uses Express.js for the API server
- Redis for caching and data storage
- Docker for containerization

### Frontend Development
- Built with React and TypeScript
- Uses Vite as the build tool
- Modern UI components and responsive design
- Chart.js for data visualization

## Troubleshooting

1. Redis Connection Issues:
   - Ensure Redis is running
   - Check REDIS_URL in .env file
   - Verify Redis credentials

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