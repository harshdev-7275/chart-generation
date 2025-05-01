import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Typography, List, Space, Divider } from 'antd';

const { Title, Text, Paragraph } = Typography;

interface AnalysisDisplayProps {
  data: {
    query: string;
    rawData: any[];
    tableData: string;
    analysis: {
      summary: string;
      insights: string[];
      recommendations?: string[];
    };
    chartConfig: {
      type: string;
      title: string;
      xAxisKey: string;
      yAxisKeys: string[];
      data: any[];
    };
  };
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
  // Format the revenue number
  const formatRevenue = (value: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(value));
  };

  // Format the data for the chart
  const chartData = data.rawData.map(item => ({
    ...item,
    [data.chartConfig.yAxisKeys[0]]: formatRevenue(item[data.chartConfig.yAxisKeys[0]])
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Summary Card */}
      <Card>
        <Title level={4}>Analysis Summary</Title>
        <Paragraph>{data.analysis.summary}</Paragraph>
      </Card>

      {/* Chart Card */}
      <Card>
        <Title level={4}>{data.chartConfig.title}</Title>
        <div style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={data.chartConfig.xAxisKey} />
              <YAxis />
              <Tooltip 
                formatter={(value: string) => [value, 'Revenue']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Bar 
                dataKey={data.chartConfig.yAxisKeys[0]} 
                fill="#1890ff" 
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Insights Card */}
      <Card>
        <Title level={4}>Key Insights</Title>
        <List
          dataSource={data.analysis.insights}
          renderItem={(item) => (
            <List.Item>
              <Text>{item}</Text>
            </List.Item>
          )}
        />
      </Card>

      {/* Recommendations Card */}
      {data.analysis.recommendations && (
        <Card>
          <Title level={4}>Recommendations</Title>
          <List
            dataSource={data.analysis.recommendations}
            renderItem={(item) => (
              <List.Item>
                <Text>{item}</Text>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Raw Data Table */}
      <Card>
        <Title level={4}>Data Table</Title>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '4px',
          overflowX: 'auto'
        }}>
          {data.tableData}
        </pre>
      </Card>
    </Space>
  );
};

export default AnalysisDisplay; 