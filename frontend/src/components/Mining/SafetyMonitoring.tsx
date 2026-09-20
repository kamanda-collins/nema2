
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, HardHat, Users, Calendar, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const SafetyMonitoring: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState('all');
  const [timeRange, setTimeRange] = useState('month');

  // Mock safety data
  const safetyMetrics = {
    overallScore: 94,
    incidentRate: 2.1,
    daysWithoutIncident: 45,
    complianceRate: 96,
    trainingCompletion: 88,
    activeCertifications: 142
  };

  const safetyIncidents = [
    {
      id: 'INC-001',
      type: 'Near Miss',
      severity: 'Low',
      site: 'Quarry Alpha',
      description: 'Equipment proximity alert triggered',
      date: '2024-06-12',
      status: 'Resolved',
      reportedBy: 'John Smith'
    },
    {
      id: 'INC-002',
      type: 'Minor Injury',
      severity: 'Medium',
      site: 'Underground Beta',
      description: 'Worker slipped on wet surface',
      date: '2024-06-10',
      status: 'Under Investigation',
      reportedBy: 'Sarah Johnson'
    },
    {
      id: 'INC-003',
      type: 'Equipment Issue',
      severity: 'High',
      site: 'Processing Gamma',
      description: 'Safety guard malfunction detected',
      date: '2024-06-08',
      status: 'Corrective Action',
      reportedBy: 'Mike Davis'
    }
  ];

  const safetyTrends = [
    { month: 'Jan', incidents: 3, nearMisses: 8, safetyScore: 92 },
    { month: 'Feb', incidents: 2, nearMisses: 6, safetyScore: 94 },
    { month: 'Mar', incidents: 4, nearMisses: 10, safetyScore: 89 },
    { month: 'Apr', incidents: 1, nearMisses: 5, safetyScore: 96 },
    { month: 'May', incidents: 2, nearMisses: 7, safetyScore: 94 },
    { month: 'Jun', incidents: 2, nearMisses: 4, safetyScore: 95 }
  ];

  const trainingStatus = [
    { category: 'Safety Induction', completed: 95, total: 100 },
    { category: 'Equipment Training', completed: 78, total: 90 },
    { category: 'Emergency Procedures', completed: 88, total: 100 },
    { category: 'First Aid', completed: 65, total: 80 },
    { category: 'Hazard Recognition', completed: 92, total: 100 }
  ];

  const incidentTypes = [
    { name: 'Near Miss', value: 45, color: '#FFBB28' },
    { name: 'Minor Injury', value: 30, color: '#FF8042' },
    { name: 'Equipment Issue', value: 15, color: '#00C49F' },
    { name: 'Procedure Violation', value: 10, color: '#8884d8' }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Investigation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Corrective Action': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Safety Monitoring</h2>
          <p className="text-gray-600">Track safety incidents, compliance, and training status</p>
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
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Safety Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Safety Score</p>
              <p className="text-2xl font-bold">{safetyMetrics.overallScore}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Incident Rate</p>
              <p className="text-2xl font-bold">{safetyMetrics.incidentRate}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Days Safe</p>
              <p className="text-2xl font-bold">{safetyMetrics.daysWithoutIncident}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Compliance</p>
              <p className="text-2xl font-bold">{safetyMetrics.complianceRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <HardHat className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Training</p>
              <p className="text-2xl font-bold">{safetyMetrics.trainingCompletion}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-600">Certifications</p>
              <p className="text-2xl font-bold">{safetyMetrics.activeCertifications}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Incident Type Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={incidentTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {incidentTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Training Completion Status</h3>
              <div className="space-y-4">
                {trainingStatus.map((training, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{training.category}</span>
                      <span className="text-sm text-gray-600">{training.completed}/{training.total}</span>
                    </div>
                    <Progress value={(training.completed / training.total) * 100} className="h-3" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Safety Incidents</h3>
            <div className="space-y-4">
              {safetyIncidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div>
                        <h4 className="font-medium">{incident.id} - {incident.type}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {incident.site}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(incident.severity)}>{incident.severity}</Badge>
                      <Badge className={getStatusColor(incident.status)}>{incident.status}</Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{incident.description}</p>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Reported by: {incident.reportedBy}</span>
                    <span>Date: {incident.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Training Completion Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trainingStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#8884d8" name="Completed" />
                <Bar dataKey="total" fill="#82ca9d" name="Total Required" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Safety Performance Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={safetyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="incidents" fill="#FF8042" name="Incidents" />
                <Bar yAxisId="left" dataKey="nearMisses" fill="#FFBB28" name="Near Misses" />
                <Line yAxisId="right" type="monotone" dataKey="safetyScore" stroke="#00C49F" name="Safety Score %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
