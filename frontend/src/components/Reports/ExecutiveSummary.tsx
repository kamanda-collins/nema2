
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Mountain, Leaf } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ExecutiveSummaryProps {
  period: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ period }) => {
  // Mock KPI data
  const kpis = [
    {
      title: 'Environmental Compliance',
      value: 94,
      target: 95,
      trend: 'up',
      status: 'good',
      icon: Leaf,
      color: 'green'
    },
    {
      title: 'Mining Efficiency',
      value: 87,
      target: 90,
      trend: 'up',
      status: 'warning',
      icon: Mountain,
      color: 'orange'
    },
    {
      title: 'Safety Score',
      value: 98,
      target: 95,
      trend: 'up',
      status: 'excellent',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Risk Level',
      value: 23,
      target: 20,
      trend: 'down',
      status: 'attention',
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  const performanceData = [
    { month: 'Jan', environmental: 92, mining: 85, safety: 96 },
    { month: 'Feb', environmental: 93, mining: 87, safety: 97 },
    { month: 'Mar', environmental: 94, mining: 87, safety: 98 },
    { month: 'Apr', environmental: 94, mining: 88, safety: 98 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'attention': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`h-5 w-5 text-${kpi.color}-600`} />
                <Badge className={getStatusColor(kpi.status)}>
                  {kpi.status.toUpperCase()}
                </Badge>
              </div>
              <h3 className="font-medium text-sm text-gray-600 mb-1">{kpi.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">{kpi.value}%</span>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <Progress value={kpi.value} className="mb-1" />
              <p className="text-xs text-gray-500">Target: {kpi.target}%</p>
            </Card>
          );
        })}
      </div>

      {/* Performance Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Performance Overview - {period}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="environmental" stroke="#10B981" strokeWidth={2} name="Environmental" />
            <Line type="monotone" dataKey="mining" stroke="#F59E0B" strokeWidth={2} name="Mining" />
            <Line type="monotone" dataKey="safety" stroke="#3B82F6" strokeWidth={2} name="Safety" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Key Achievements</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Safety record: 45 days without incidents</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Environmental compliance above target</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Production efficiency improved by 3%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Action Items</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm">Review mining efficiency protocols</span>
            </div>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm">Update risk assessment procedures</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Expand environmental monitoring</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
