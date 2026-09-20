
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Users, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface BusinessIntelligenceProps {
  period: string;
}

export const BusinessIntelligence: React.FC<BusinessIntelligenceProps> = ({ period }) => {
  // Mock business metrics
  const metrics = [
    {
      title: 'Revenue',
      value: '$2.4M',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Operating Costs',
      value: '$1.8M',
      change: '-3.2%',
      trend: 'down',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Team Size',
      value: '247',
      change: '+5.1%',
      trend: 'up',
      icon: Users,
      color: 'purple'
    },
    {
      title: 'Goal Achievement',
      value: '89%',
      change: '+7.3%',
      trend: 'up',
      icon: Target,
      color: 'orange'
    }
  ];

  const costBreakdown = [
    { name: 'Equipment', value: 35, color: '#8884d8' },
    { name: 'Personnel', value: 28, color: '#82ca9d' },
    { name: 'Environmental', value: 15, color: '#ffc658' },
    { name: 'Maintenance', value: 12, color: '#ff7c7c' },
    { name: 'Other', value: 10, color: '#8dd1e1' }
  ];

  const productivityData = [
    { month: 'Jan', production: 450, efficiency: 85, costs: 180 },
    { month: 'Feb', production: 480, efficiency: 87, costs: 175 },
    { month: 'Mar', production: 520, efficiency: 89, costs: 170 },
    { month: 'Apr', production: 510, efficiency: 91, costs: 165 }
  ];

  const riskAssessment = [
    { category: 'Market Risk', level: 'Medium', score: 65, color: 'yellow' },
    { category: 'Operational Risk', level: 'Low', score: 35, color: 'green' },
    { category: 'Environmental Risk', level: 'Low', score: 25, color: 'green' },
    { category: 'Regulatory Risk', level: 'Medium', score: 55, color: 'yellow' },
    { category: 'Financial Risk', level: 'Low', score: 40, color: 'green' }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <IconComponent className={`h-5 w-5 text-${metric.color}-600`} />
                <Badge variant={metric.trend === 'up' ? 'default' : 'secondary'}>
                  {metric.change}
                </Badge>
              </div>
              <h3 className="font-medium text-sm text-gray-600 mb-1">{metric.title}</h3>
              <div className="text-2xl font-bold">{metric.value}</div>
            </Card>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={costBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {costBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Productivity Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Productivity & Efficiency</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="production" stroke="#8884d8" strokeWidth={2} name="Production" />
              <Line type="monotone" dataKey="efficiency" stroke="#82ca9d" strokeWidth={2} name="Efficiency %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Assessment Matrix</h3>
        <div className="space-y-4">
          {riskAssessment.map((risk, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {risk.level === 'High' ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium">{risk.category}</h4>
                  <p className="text-sm text-gray-600">Risk Score: {risk.score}/100</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={risk.score} className="w-24" />
                <Badge className={getRiskColor(risk.level)}>
                  {risk.level}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Financial Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={productivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="production" fill="#8884d8" name="Production Value ($k)" />
            <Bar dataKey="costs" fill="#82ca9d" name="Operating Costs ($k)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
