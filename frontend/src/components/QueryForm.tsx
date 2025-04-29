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
    <div className="query-form-container">
      <form onSubmit={onSubmit} className="query-form">
        <div className="input-group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your data..."
            className="query-input"
          />
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="chart-select"
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
            className="submit-button"
          >
            {loading ? 'Processing...' : 'Analyze'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QueryForm; 