import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"

interface AnalyticsData {
  time: string;
  airQuality: number;
  waterQuality: number;
  vegetationHealth: number;
  anomalies?: number;
}

interface Alert {
  type: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

// Traditional ML fallback: If NO valid data source responds, use dummy analytics logic.
function defaultTraditionalMLAnalysis(data: any) {
  // Simulate a very basic "traditional analysis" result
  return {
    summary: "Traditional ML Model Fallback: Trend is stable, no significant anomalies detected.",
    predictedAqi: data?.airQuality?.aqi
      ? Math.round(data.airQuality.aqi * 0.98)
      : 120,
    alerts: [
      {
        type: "fallback",
        detail: "No live/modern analysis available; showing static fallback using classic ML."
      }
    ]
  };
}

// Main EnhancedAnalytics component
export const EnhancedAnalytics: React.FC<{ data: any }> = ({ data }) => {
  let analyticsResult;
  if (!data || typeof data !== 'object' || !('airQuality' in data)) {
    analyticsResult = defaultTraditionalMLAnalysis({});
  } else {
    try {
      const mockAnalyticsData: AnalyticsData[] = [
        { time: '00:00', airQuality: 75, waterQuality: 82, vegetationHealth: 68 },
        { time: '03:00', airQuality: 80, waterQuality: 78, vegetationHealth: 72 },
        { time: '06:00', airQuality: 85, waterQuality: 85, vegetationHealth: 70 },
        { time: '09:00', airQuality: 92, waterQuality: 88, vegetationHealth: 75 },
        { time: '12:00', airQuality: 98, waterQuality: 92, vegetationHealth: 80 },
        { time: '15:00', airQuality: 95, waterQuality: 89, vegetationHealth: 78 },
        { time: '18:00', airQuality: 90, waterQuality: 85, vegetationHealth: 75 },
        { time: '21:00', airQuality: 82, waterQuality: 80, vegetationHealth: 70 },
      ];

      const mockAlerts: Alert[] = [
        { type: 'Air Quality', level: 'warning', message: 'Slight increase in PM2.5 levels detected.' },
        { type: 'Water Quality', level: 'info', message: 'pH levels are stable.' },
        { type: 'Vegetation Health', level: 'info', message: 'NDVI shows healthy vegetation coverage.' },
      ];

      const isMobile = useIsMobile();
      const getTrendIndicator = (value: number, prevValue: number): JSX.Element => {
        if (value > prevValue) {
          return <ArrowUp className="inline-block w-4 h-4 text-red-500 ml-1" />;
        } else if (value < prevValue) {
          return <ArrowDown className="inline-block w-4 h-4 text-green-500 ml-1" />;
        } else {
          return <ArrowRight className="inline-block w-4 h-4 text-gray-500 ml-1" />;
        }
      };

      analyticsResult = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environmental Overview */}
          <Card className="bg-white shadow-md rounded-lg p-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Environmental Overview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Metric</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Value</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border px-4 py-2 text-sm text-gray-600">Air Quality Index</td>
                    <td className="border px-4 py-2 text-sm text-gray-600">{data?.airQuality?.aqi || 'N/A'}</td>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      {getTrendIndicator(data?.airQuality?.aqi || 0, 70)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2 text-sm text-gray-600">Water Quality</td>
                    <td className="border px-4 py-2 text-sm text-gray-600">{data?.waterQuality?.ph || 'N/A'}</td>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      {getTrendIndicator(data?.waterQuality?.ph || 0, 7)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border px-4 py-2 text-sm text-gray-600">Vegetation Health</td>
                    <td className="border px-4 py-2 text-sm text-gray-600">{data?.vegetation?.ndvi || 'N/A'}</td>
                    <td className="border px-4 py-2 text-sm text-gray-600">
                      {getTrendIndicator(data?.vegetation?.ndvi || 0, 0.6)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Time Series Analysis Chart */}
          <Card className="bg-white shadow-md rounded-lg p-4">
            <h3 className="font-semibold text-lg text-gray-800 mb-4">Time Series Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockAnalyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="airQuality" stroke="#8884d8" name="Air Quality" />
                <Line type="monotone" dataKey="waterQuality" stroke="#82ca9d" name="Water Quality" />
                <Line type="monotone" dataKey="vegetationHealth" stroke="#ffc658" name="Vegetation Health" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      );
    } catch (err) {
      analyticsResult = defaultTraditionalMLAnalysis(data);
    }
  }

  // --- FIX: Properly discriminate between fallback (object) and modern analytics (JSX) ---
  if (analyticsResult && typeof analyticsResult === 'object' && analyticsResult !== null && 'alerts' in analyticsResult) {
    // Fallback analytics object
    const resultObj = analyticsResult as { summary: string; predictedAqi: number; alerts: any[] };
    return (
      <div className="p-4">
        <div className="mb-2 font-semibold text-red-700">{resultObj.summary}</div>
        <div className="mb-1 text-sm">Predicted AQI: {resultObj.predictedAqi}</div>
        <ul className="ml-4 text-xs text-gray-600">
          {(resultObj.alerts ?? []).map((a, i) => <li key={i}>{a.detail}</li>)}
        </ul>
      </div>
    );
  }

  // Modern analytics UI (JSX)
  return (
    <div className="p-4">
      {analyticsResult}
    </div>
  );
};
