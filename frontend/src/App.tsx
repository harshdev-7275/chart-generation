import { useState } from 'react'
import QueryForm from './components/QueryForm'
import ChartDisplay from './components/ChartDisplay'
import DataTable from './components/DataTable'
import SQLDisplay from './components/SQLDisplay'
import ResponseCard from './components/ResponseCard'

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white w-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            Dynamic Data Analysis
          </h1>
          <p className="text-gray-300 text-lg">
            Ask questions about your data in natural language
          </p>
        </header>

        <main className="space-y-8">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-700">
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
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {response && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-700">
                <ResponseCard llmResponse={response.llm_response} />
              </div>

              {response.result.length > 0 && (
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-700">
                  <h3 className="text-xl font-semibold text-blue-400 mb-4">Visualization</h3>
                  <ChartDisplay data={response.result} chartType={chartType} />
                </div>
              )}

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-700">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">Data</h3>
                <DataTable data={response.result} />
              </div>

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-700">
                <SQLDisplay sql={response.sql} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
