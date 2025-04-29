import React from 'react';

interface SQLDisplayProps {
  sql: string;
}

const SQLDisplay: React.FC<SQLDisplayProps> = ({ sql }) => {
  return (
    <div className="sql-display-container">
      <h3>Generated SQL</h3>
      <pre className="sql-code">{sql}</pre>
    </div>
  );
};

export default SQLDisplay; 