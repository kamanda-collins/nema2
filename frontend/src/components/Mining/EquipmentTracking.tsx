
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Drill, Wrench, AlertTriangle, Calendar, Clock, MapPin, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const EquipmentTracking: React.FC = () => {
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [timeRange, setTimeRange] = useState('week');

  // Mock equipment data
  const equipment = [
    {
      id: 'EQ-001',
      name: 'Excavator Alpha',
      type: 'Excavator',
      status: 'Active',
      location: 'Quarry Alpha',
      utilization: 85,
      lastMaintenance: '2024-06-01',
      nextMaintenance: '2024-07-01',
      fuelLevel: 78,
      hoursWorked: 342
    },
    {
      id: 'EQ-002',
      name: 'Drill Rig Beta',
      type: 'Drill Rig',
      status: 'Maintenance',
      location: 'Workshop',
      utilization: 0,
      lastMaintenance: '2024-06-14',
      nextMaintenance: '2024-07-14',
      fuelLevel: 45,
      hoursWorked: 156
    },
    {
      id: 'EQ-003',
      name: 'Dump Truck Gamma',
      type: 'Dump Truck',
      status: 'Active',
      location: 'Underground Beta',
      utilization: 92,
      lastMaintenance: '2024-05-15',
      nextMaintenance: '2024-06-20',
      fuelLevel: 65,
      hoursWorked: 428
    },
    {
      id: 'EQ-004',
      name: 'Loader Delta',
      type: 'Loader',
      status: 'Idle',
      location: 'Processing Gamma',
      utilization: 45,
      lastMaintenance: '2024-06-10',
      nextMaintenance: '2024-07-10',
      fuelLevel: 90,
      hoursWorked: 201
    }
  ];

  const utilizationData = [
    { day: 'Mon', excavator: 85, drillRig: 70, dumpTruck: 92, loader: 65 },
    { day: 'Tue', excavator: 88, drillRig: 75, dumpTruck: 89, loader: 70 },
    { day: 'Wed', excavator: 82, drillRig: 0, dumpTruck: 94, loader: 55 },
    { day: 'Thu', excavator: 90, drillRig: 0, dumpTruck: 87, loader: 60 },
    { day: 'Fri', excavator: 87, drillRig: 0, dumpTruck: 91, loader: 68 },
    { day: 'Sat', excavator: 75, drillRig: 0, dumpTruck: 85, loader: 40 },
    { day: 'Sun', excavator: 45, drillRig: 0, dumpTruck: 60, loader: 25 }
  ];

  const maintenanceSchedule = [
    { equipment: 'Dump Truck Gamma', type: 'Scheduled', priority: 'High', dueDate: '2024-06-20' },
    { equipment: 'Loader Delta', type: 'Preventive', priority: 'Medium', dueDate: '2024-06-25' },
    { equipment: 'Excavator Alpha', type: 'Inspection', priority: 'Low', dueDate: '2024-07-01' },
    { equipment: 'Drill Rig Beta', type: 'Repair', priority: 'High', dueDate: 'In Progress' }
  ];

  const equipmentTypes = [
    { name: 'Excavators', count: 3, active: 2 },
    { name: 'Drill Rigs', count: 2, active: 1 },
    { name: 'Dump Trucks', count: 5, active: 4 },
    { name: 'Loaders', count: 4, active: 3 }
  ];

  const statusDistribution = [
    { name: 'Active', value: 60, color: '#00C49F' },
    { name: 'Idle', value: 25, color: '#FFBB28' },
    { name: 'Maintenance', value: 15, color: '#FF8042' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200';
      case 'Idle': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Maintenance': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Equipment Tracking</h2>
          <p className="text-gray-600">Monitor equipment status, utilization, and maintenance</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              <SelectItem value="excavator">Excavators</SelectItem>
              <SelectItem value="drill">Drill Rigs</SelectItem>
              <SelectItem value="truck">Dump Trucks</SelectItem>
              <SelectItem value="loader">Loaders</SelectItem>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="details">Equipment Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Equipment Status Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Equipment by Type</h3>
              <div className="space-y-4">
                {equipmentTypes.map((type, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{type.name}</span>
                      <span className="text-sm text-gray-600">{type.active}/{type.count} active</span>
                    </div>
                    <Progress value={(type.active / type.count) * 100} className="h-3" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Equipment Utilization Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={utilizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="excavator" stroke="#8884d8" name="Excavator" />
                <Line type="monotone" dataKey="drillRig" stroke="#82ca9d" name="Drill Rig" />
                <Line type="monotone" dataKey="dumpTruck" stroke="#ffc658" name="Dump Truck" />
                <Line type="monotone" dataKey="loader" stroke="#ff7300" name="Loader" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Maintenance Schedule</h3>
            <div className="space-y-4">
              {maintenanceSchedule.map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{item.equipment}</h4>
                        <p className="text-sm text-gray-600">{item.type} Maintenance</p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    Due: {item.dueDate}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {equipment.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Truck className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.type} • {item.id}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium">{item.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Utilization</p>
                      <p className="font-medium">{item.utilization}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Hours Worked</p>
                      <p className="font-medium">{item.hoursWorked}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Fuel Level</p>
                      <p className="font-medium">{item.fuelLevel}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Utilization</span>
                    <span>{item.utilization}%</span>
                  </div>
                  <Progress value={item.utilization} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Fuel Level</span>
                    <span>{item.fuelLevel}%</span>
                  </div>
                  <Progress value={item.fuelLevel} className="h-2" />
                </div>

                <div className="flex justify-between text-xs text-gray-500 mt-3">
                  <span>Last Maintenance: {item.lastMaintenance}</span>
                  <span>Next Maintenance: {item.nextMaintenance}</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
