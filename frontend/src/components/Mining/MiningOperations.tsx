
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mountain, Pickaxe, TrendingUp, MapPin, Calendar, Clock, Truck, Drill } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const MiningOperations: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState('all');
  const [timeRange, setTimeRange] = useState('week');

  // Mock production data
  const productionData = [
    { date: 'Mon', quarryAlpha: 340, undergroundBeta: 280, processingGamma: 220 },
    { date: 'Tue', quarryAlpha: 360, undergroundBeta: 290, processingGamma: 250 },
    { date: 'Wed', quarryAlpha: 320, undergroundBeta: 270, processingGamma: 240 },
    { date: 'Thu', quarryAlpha: 380, undergroundBeta: 310, processingGamma: 260 },
    { date: 'Fri', quarryAlpha: 350, undergroundBeta: 300, processingGamma: 280 },
    { date: 'Sat', quarryAlpha: 290, undergroundBeta: 250, processingGamma: 200 },
    { date: 'Sun', quarryAlpha: 200, undergroundBeta: 180, processingGamma: 150 }
  ];

  const operationalEfficiency = [
    { name: 'Drilling', efficiency: 85, target: 90 },
    { name: 'Extraction', efficiency: 78, target: 80 },
    { name: 'Transport', efficiency: 92, target: 95 },
    { name: 'Processing', efficiency: 88, target: 85 }
  ];

  const siteDistribution = [
    { name: 'Quarry Alpha', value: 45, color: '#FF8042' },
    { name: 'Underground Beta', value: 35, color: '#00C49F' },
    { name: 'Processing Gamma', value: 20, color: '#FFBB28' }
  ];

  const operations = [
    {
      id: 1,
      site: 'Quarry Alpha',
      operation: 'Surface Extraction',
      shift: 'Day Shift',
      crew: 12,
      equipment: 8,
      target: 400,
      actual: 380,
      status: 'On Track'
    },
    {
      id: 2,
      site: 'Underground Beta',
      operation: 'Tunnel Mining',
      shift: 'Night Shift',
      crew: 15,
      equipment: 6,
      target: 300,
      actual: 310,
      status: 'Ahead'
    },
    {
      id: 3,
      site: 'Processing Gamma',
      operation: 'Ore Processing',
      shift: 'Continuous',
      crew: 8,
      equipment: 12,
      target: 250,
      actual: 230,
      status: 'Behind'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ahead': return 'bg-green-100 text-green-800 border-green-200';
      case 'On Track': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Behind': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mining Operations Overview</h2>
          <p className="text-gray-600">Real-time monitoring of mining activities and production</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              <SelectItem value="quarry">Quarry Alpha</SelectItem>
              <SelectItem value="underground">Underground Beta</SelectItem>
              <SelectItem value="processing">Processing Gamma</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="production" className="w-full">
        <TabsList>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-6">
          {/* Production Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Production Output</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={productionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="quarryAlpha" stackId="1" stroke="#FF8042" fill="#FF8042" name="Quarry Alpha" />
                <Area type="monotone" dataKey="undergroundBeta" stackId="1" stroke="#00C49F" fill="#00C49F" name="Underground Beta" />
                <Area type="monotone" dataKey="processingGamma" stackId="1" stroke="#FFBB28" fill="#FFBB28" name="Processing Gamma" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Site Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Production Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={siteDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {siteDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Production Targets vs Actual</h3>
              <div className="space-y-4">
                {operations.map((op) => (
                  <div key={op.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{op.site}</span>
                      <span className="text-sm text-gray-600">{op.actual}/{op.target} tons</span>
                    </div>
                    <Progress value={(op.actual / op.target) * 100} className="h-3" />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{((op.actual / op.target) * 100).toFixed(1)}% of target</span>
                      <Badge className={getStatusColor(op.status)}>{op.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Operational Efficiency</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={operationalEfficiency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="efficiency" fill="#8884d8" name="Current Efficiency %" />
                <Bar dataKey="target" fill="#82ca9d" name="Target %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {operations.map((operation) => (
              <Card key={operation.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Drill className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="font-semibold">{operation.site}</h3>
                      <p className="text-sm text-gray-600">{operation.operation}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(operation.status)}>{operation.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Shift</p>
                      <p className="font-medium">{operation.shift}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Crew Size</p>
                      <p className="font-medium">{operation.crew} workers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Equipment</p>
                      <p className="font-medium">{operation.equipment} units</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Output</p>
                      <p className="font-medium">{operation.actual}/{operation.target} tons</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
