import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaf, Droplets, Wind, AlertTriangle, TrendingUp, MapPin, Calendar, Shield } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const MiningEnvironmentalImpact: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState('all');
  const [impactType, setImpactType] = useState('air');

  // Mock environmental impact data
  const environmentalMetrics = {
    airQualityIndex: 78,
    waterQualityScore: 85,
    noiseLevel: 65,
    dustEmissions: 42,
    rehabilitationProgress: 67,
    complianceRate: 92
  };

  const airQualityData = [
    { hour: '00:00', pm25: 35, pm10: 55, no2: 25, so2: 15 },
    { hour: '04:00', pm25: 42, pm10: 68, no2: 30, so2: 18 },
    { hour: '08:00', pm25: 65, pm10: 95, no2: 45, so2: 28 },
    { hour: '12:00', pm25: 78, pm10: 120, no2: 52, so2: 35 },
    { hour: '16:00', pm25: 85, pm10: 135, no2: 58, so2: 40 },
    { hour: '20:00', pm25: 72, pm10: 110, no2: 48, so2: 32 }
  ];

  const waterQualityData = [
    { parameter: 'pH Level', current: 7.2, standard: 7.5, status: 'Good' },
    { parameter: 'Turbidity', current: 8.5, standard: 10, status: 'Good' },
    { parameter: 'Total Suspended Solids', current: 45, standard: 50, status: 'Good' },
    { parameter: 'Heavy Metals', current: 0.02, standard: 0.05, status: 'Excellent' },
    { parameter: 'Oil & Grease', current: 12, standard: 15, status: 'Good' }
  ];

  const rehabilitationProgress = [
    { site: 'Former Quarry A', area: 25, completed: 18, target: 22, status: 'On Track' },
    { site: 'Old Mining Area B', area: 40, completed: 35, target: 38, status: 'Ahead' },
    { site: 'Processing Site C', area: 15, completed: 8, target: 12, status: 'Behind' },
    { site: 'Access Road D', area: 8, completed: 6, target: 7, status: 'On Track' }
  ];

  const complianceTracking = [
    {
      category: 'Air Quality',
      lastInspection: '2024-06-10',
      nextInspection: '2024-07-10',
      status: 'Compliant',
      score: 94
    },
    {
      category: 'Water Management',
      lastInspection: '2024-06-05',
      nextInspection: '2024-07-05',
      status: 'Compliant',
      score: 88
    },
    {
      category: 'Noise Control',
      lastInspection: '2024-06-12',
      nextInspection: '2024-07-12',
      status: 'Minor Issues',
      score: 76
    },
    {
      category: 'Waste Management',
      lastInspection: '2024-06-08',
      nextInspection: '2024-07-08',
      status: 'Compliant',
      score: 92
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': case 'Compliant': case 'Ahead': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': case 'On Track': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Behind': case 'Minor Issues': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Poor': case 'Non-Compliant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Environmental Impact Assessment</h2>
          <p className="text-gray-600">Monitor environmental compliance and rehabilitation progress</p>
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
          <Select value={impactType} onValueChange={setImpactType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Impact Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="air">Air Quality</SelectItem>
              <SelectItem value="water">Water Quality</SelectItem>
              <SelectItem value="noise">Noise Levels</SelectItem>
              <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Environmental Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Wind className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Air Quality</p>
              <p className="text-2xl font-bold">{environmentalMetrics.airQualityIndex}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Droplets className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Water Quality</p>
              <p className="text-2xl font-bold">{environmentalMetrics.waterQualityScore}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Noise Level</p>
              <p className="text-2xl font-bold">{environmentalMetrics.noiseLevel} dB</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Wind className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Dust Emissions</p>
              <p className="text-2xl font-bold">{environmentalMetrics.dustEmissions} µg/m³</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Leaf className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Rehabilitation</p>
              <p className="text-2xl font-bold">{environmentalMetrics.rehabilitationProgress}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Compliance</p>
              <p className="text-2xl font-bold">{environmentalMetrics.complianceRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="air" className="w-full">
        <TabsList
          className={`
            flex w-full overflow-x-auto scrollbar-hide gap-1 bg-transparent min-h-[36px]
            sm:grid sm:w-full sm:grid-cols-4
          `}
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <TabsTrigger value="air" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm">Air</TabsTrigger>
          <TabsTrigger value="water" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm">Water</TabsTrigger>
          <TabsTrigger value="rehabilitation" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm">Rehab</TabsTrigger>
          <TabsTrigger value="compliance" className="flex-shrink-0 px-3 py-2 text-xs sm:text-sm">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="air" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Air Quality Monitoring</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={airQualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pm25" stroke="#8884d8" name="PM2.5 (µg/m³)" />
                <Line type="monotone" dataKey="pm10" stroke="#82ca9d" name="PM10 (µg/m³)" />
                <Line type="monotone" dataKey="no2" stroke="#ffc658" name="NO2 (µg/m³)" />
                <Line type="monotone" dataKey="so2" stroke="#ff7300" name="SO2 (µg/m³)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="water" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Water Quality Parameters</h3>
            <div className="space-y-4">
              {waterQualityData.map((param, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Droplets className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{param.parameter}</span>
                    </div>
                    <Badge className={getStatusColor(param.status)}>{param.status}</Badge>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Current: {param.current}</span>
                    <span>Standard: {param.standard}</span>
                  </div>
                  <Progress value={(param.current / param.standard) * 100} className="h-3" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rehabilitation" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Site Rehabilitation Progress</h3>
            <div className="space-y-4">
              {rehabilitationProgress.map((site, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Leaf className="h-5 w-5 text-green-600" />
                      <div>
                        <h4 className="font-medium">{site.site}</h4>
                        <p className="text-sm text-gray-600">Total Area: {site.area} hectares</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(site.status)}>{site.status}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{site.completed}/{site.target} hectares</span>
                    </div>
                    <Progress value={(site.completed / site.target) * 100} className="h-3" />
                    <div className="text-xs text-gray-500">
                      {((site.completed / site.target) * 100).toFixed(1)}% complete
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Regulatory Compliance Tracking</h3>
            <div className="space-y-4">
              {complianceTracking.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{item.category}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Last: {item.lastInspection}</span>
                          <span>Next: {item.nextInspection}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      <div className="text-sm font-medium mt-1">Score: {item.score}%</div>
                    </div>
                  </div>
                  <Progress value={item.score} className="h-3" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pollution" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Pollution Sources Analysis</h3>
            <div className="w-full min-h-[220px] md:min-h-[320px]">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={[
                    { name: 'Vehicle', value: 35 },
                    { name: 'Industrial', value: 28 },
                    { name: 'Construction', value: 18 },
                    { name: 'Natural', value: 12 },
                    { name: 'Other', value: 7 },
                  ]}
                  margin={{
                    top: 4, right: 16, left: 0, bottom: 4,
                  }}
                  barCategoryGap="15%"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
