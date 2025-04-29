import { useState } from 'react'
import QueryForm from './components/QueryForm'
import ChartDisplay from './components/ChartDisplay'
import DataTable from './components/DataTable'
import SQLDisplay from './components/SQLDisplay'
import ResponseCard from './components/ResponseCard'
import './App.css'

interface QueryResponse {
  question: string;
  sql: string;
  result: any[];
  llm_response: string;
  error?: string;
}

function App() {
  const [query, setQuery] = useState('')
  const [chartType, setChartType] = useState('auto')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<QueryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch('http://localhost:8001/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: query,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to fetch data')
      }

      const data = await res.json()
      setResponse(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Dynamic Data Analysis</h1>
        <p>Ask questions about your data in natural language</p>
      </header>

      <main className="app-main">
        <div className="query-section">
          <QueryForm
            query={query}
            setQuery={setQuery}
            chartType={chartType}
            setChartType={setChartType}
            loading={loading}
            onSubmit={handleSubmit}
          />
        </div>

        {error && (
          <div className="error-card">
            <p className="error-message">{error}</p>
          </div>
        )}

        {response && (
          <div className="results-container">
            <div className="card response-section">
              <ResponseCard llmResponse={response.llm_response} />
            </div>

            {response.result.length > 0 && (
              <div className="card chart-section">
                <h3>Visualization</h3>
                <ChartDisplay data={response.result} chartType={chartType} />
              </div>
            )}

            <div className="card data-section">
              <h3>Data</h3>
              <DataTable data={response.result} />
            </div>

            <div className="card sql-section">
              <SQLDisplay sql={response.sql} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
