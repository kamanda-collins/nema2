
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mountain, Layers, Search, FileText, MapPin, Compass } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

export const GeologicalAnalysis: React.FC = () => {
  const [selectedSurvey, setSelectedSurvey] = useState('latest');
  const [analysisType, setAnalysisType] = useState('composition');

  // Mock geological data
  const rockComposition = [
    { type: 'Limestone', percentage: 45, quality: 'High' },
    { type: 'Sandstone', percentage: 30, quality: 'Medium' },
    { type: 'Shale', percentage: 15, quality: 'Low' },
    { type: 'Granite', percentage: 10, quality: 'High' }
  ];

  const drillingLogs = [
    {
      id: 'DH-001',
      location: 'Grid A-1',
      depth: 150,
      coreRecovery: 95,
      primaryMineral: 'Limestone',
      grade: 'A',
      date: '2024-06-10'
    },
    {
      id: 'DH-002',
      location: 'Grid A-2',
      depth: 180,
      coreRecovery: 88,
      primaryMineral: 'Sandstone',
      grade: 'B',
      date: '2024-06-12'
    },
    {
      id: 'DH-003',
      location: 'Grid B-1',
      depth: 200,
      coreRecovery: 92,
      primaryMineral: 'Limestone',
      grade: 'A',
      date: '2024-06-14'
    }
  ];

  const depthProfile = [
    { depth: 0, limestone: 20, sandstone: 60, shale: 15, granite: 5 },
    { depth: 25, limestone: 35, sandstone: 45, shale: 15, granite: 5 },
    { depth: 50, limestone: 50, sandstone: 30, shale: 15, granite: 5 },
    { depth: 75, limestone: 60, sandstone: 20, shale: 15, granite: 5 },
    { depth: 100, limestone: 55, sandstone: 25, shale: 15, granite: 5 },
    { depth: 125, limestone: 45, sandstone: 35, shale: 15, granite: 5 },
    { depth: 150, limestone: 40, sandstone: 40, shale: 15, granite: 5 }
  ];

  const oreDeposits = [
    { x: 120, y: 80, grade: 85, size: 40, name: 'Deposit A' },
    { x: 200, y: 150, grade: 72, size: 30, name: 'Deposit B' },
    { x: 300, y: 120, grade: 91, size: 50, name: 'Deposit C' },
    { x: 180, y: 200, grade: 68, size: 25, name: 'Deposit D' },
    { x: 250, y: 90, grade: 78, size: 35, name: 'Deposit E' }
  ];

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'C': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Geological Analysis</h2>
          <p className="text-gray-600">Rock composition, ore deposits, and drilling analysis</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Survey" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Survey</SelectItem>
              <SelectItem value="2024-q2">Q2 2024</SelectItem>
              <SelectItem value="2024-q1">Q1 2024</SelectItem>
              <SelectItem value="2023-q4">Q4 2023</SelectItem>
            </SelectContent>
          </Select>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Analysis Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="composition">Composition</SelectItem>
              <SelectItem value="deposits">Ore Deposits</SelectItem>
              <SelectItem value="drilling">Drilling Logs</SelectItem>
              <SelectItem value="depth">Depth Profile</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="composition" className="w-full">
        <TabsList>
          <TabsTrigger value="composition">Rock Composition</TabsTrigger>
          <TabsTrigger value="deposits">Ore Deposits</TabsTrigger>
          <TabsTrigger value="drilling">Drilling Logs</TabsTrigger>
          <TabsTrigger value="depth">Depth Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="composition" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Rock Type Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rockComposition}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Rock Quality Assessment</h3>
              <div className="space-y-4">
                {rockComposition.map((rock, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Layers className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium">{rock.type}</p>
                        <p className="text-sm text-gray-600">{rock.percentage}% composition</p>
                      </div>
                    </div>
                    <Badge className={getQualityColor(rock.quality)}>
                      {rock.quality} Quality
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deposits" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Ore Deposit Mapping</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={oreDeposits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" name="X Coordinate" />
                <YAxis dataKey="y" name="Y Coordinate" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border rounded shadow">
                          <p className="font-medium">{data.name}</p>
                          <p>Grade: {data.grade}%</p>
                          <p>Size: {data.size}m²</p>
                          <p>Location: ({data.x}, {data.y})</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter dataKey="grade" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="drilling" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Drilling Logs</h3>
            <div className="space-y-4">
              {drillingLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{log.id}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {log.location}
                        </div>
                      </div>
                    </div>
                    <Badge className={getGradeColor(log.grade)}>Grade {log.grade}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Depth: </span>
                      <span className="font-medium">{log.depth}m</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Recovery: </span>
                      <span className="font-medium">{log.coreRecovery}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Primary: </span>
                      <span className="font-medium">{log.primaryMineral}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Date: </span>
                      <span className="font-medium">{log.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="depth" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Geological Depth Profile</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={depthProfile}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="depth" label={{ value: 'Depth (m)', position: 'insideBottom', offset: -10 }} />
                <YAxis label={{ value: 'Composition (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="limestone" stroke="#8884d8" name="Limestone" />
                <Line type="monotone" dataKey="sandstone" stroke="#82ca9d" name="Sandstone" />
                <Line type="monotone" dataKey="shale" stroke="#ffc658" name="Shale" />
                <Line type="monotone" dataKey="granite" stroke="#ff7300" name="Granite" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Active Surveys</p>
              <p className="text-xl font-bold">8</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Drill Holes</p>
              <p className="text-xl font-bold">24</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Rock Types</p>
              <p className="text-xl font-bold">12</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Ore Deposits</p>
              <p className="text-xl font-bold">5</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
