import React from 'react';

interface QueryFormProps {
  query: string;
  setQuery: (query: string) => void;
  chartType: string;
  setChartType: (type: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const QueryForm: React.FC<QueryFormProps> = ({
  query,
  setQuery,
  chartType,
  setChartType,
  loading,
  onSubmit,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {query && (
          <div className="flex justify-end">
            <div className="bg-blue-500 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%]">
              {query}
            </div>
          </div>
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing your request...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="sticky bottom-0 bg-gray-800/50 backdrop-blur-lg border-t border-gray-700 p-4">
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your data..."
              className="w-full h-20 p-4 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ minHeight: '5rem' }}
            />
            <div className="absolute bottom-2 right-2 flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="auto">Auto-detect</option>
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
                <option value="scatter">Scatter Plot</option>
              </select>
              <button 
                type="submit" 
                disabled={loading || !query.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full sm:w-auto"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Analyze'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QueryForm; 