import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, Typography, List, Space, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface ChartConfig {
  type: string;
  title: string;
  xAxisKey: string;
  yAxisKeys: string[];
  data: any[];
}

interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations?: string[];
}

interface ResponseData {
  query: string;
  rawData: any[];
  tableData: string;
  analysis: AnalysisResult;
  chartConfig: ChartConfig;
}

interface AnalysisDisplayProps {
  data: ResponseData;
}

interface ChartDataItem {
  [key: string]: string | number;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
  // Transform data for the chart
  const chartData: ChartDataItem[] = data.rawData.map((item: any) => ({
    ...item,
    [data.chartConfig.xAxisKey]: item[data.chartConfig.xAxisKey],
    [data.chartConfig.yAxisKeys[0]]: item[data.chartConfig.yAxisKeys[0]]
  }));

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Analysis Summary */}
      <Card>
        <Title level={4}>Analysis Summary</Title>
        <Paragraph>{data.analysis.summary}</Paragraph>
      </Card>

      {/* Chart */}
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
                labelFormatter={(label: string) => `Month: ${label}`}
              />
              <Bar
                dataKey={data.chartConfig.yAxisKeys[0]}
                fill="#8884d8"
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Key Insights */}
      <Card>
        <Title level={4}>Key Insights</Title>
        <List
          dataSource={data.analysis.insights}
          renderItem={(item: string) => (
            <List.Item>
              <Text>{item}</Text>
            </List.Item>
          )}
        />
      </Card>

      {/* Recommendations */}
      {data.analysis.recommendations && data.analysis.recommendations.length > 0 && (
        <Card>
          <Title level={4}>Recommendations</Title>
          <List
            dataSource={data.analysis.recommendations}
            renderItem={(item: string) => (
              <List.Item>
                <Text>{item}</Text>
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <Title level={4}>Data Table</Title>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '1rem',
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