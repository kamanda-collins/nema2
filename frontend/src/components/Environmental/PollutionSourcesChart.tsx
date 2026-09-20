
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PollutionSourcesChartProps {
  isMobile: boolean;
  data?: { source: string, percentage: number, color: string }[];
}

// Chart will use new props.data if provided, else fallback to default static data
const defaultPollutionSources = [
  { source: 'Vehicle Emissions', percentage: 35, color: '#ef4444' },
  { source: 'Industrial', percentage: 28, color: '#f97316' },
  { source: 'Construction', percentage: 18, color: '#eab308' },
  { source: 'Natural', percentage: 12, color: '#22c55e' },
  { source: 'Other', percentage: 7, color: '#6b7280' },
];

export const PollutionSourcesChart: React.FC<PollutionSourcesChartProps> = ({ isMobile, data }) => {
  const chartData = Array.isArray(data) && data.length ? data : defaultPollutionSources;

  return (
    <Card className={`${isMobile ? 'p-2' : 'p-4'}`}>
      <div>
        <ResponsiveContainer width="100%" height={isMobile ? 220 : 220}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{
              top: 8,
              right: isMobile ? 20 : 10,
              left: isMobile ? 100 : 120,
              bottom: 8,
            }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 40]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: isMobile ? 9 : 12 }}
            />
            <YAxis
              type="category"
              dataKey="source"
              width={isMobile ? 95 : 115}
              tick={{ fontSize: isMobile ? 9 : 12 }}
              interval={0}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Contribution"]}
              wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
            />
            <Bar dataKey="percentage" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
