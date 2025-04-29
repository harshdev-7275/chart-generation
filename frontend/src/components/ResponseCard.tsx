import React from 'react';

interface ResponseCardProps {
  llmResponse: string;
}

const ResponseCard: React.FC<ResponseCardProps> = ({ llmResponse }) => {
  return (
    <div className="response-card">
      <h3>Analysis</h3>
      <p className="response-text">{llmResponse}</p>
    </div>
  );
};

export default ResponseCard; 