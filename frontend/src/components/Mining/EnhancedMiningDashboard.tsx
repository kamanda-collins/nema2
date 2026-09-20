
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pickaxe, TrendingUp, AlertTriangle, MapPin, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Observation {
  id: string;
  type: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  observer: string;
  timestamp: Date;
  status: 'active' | 'resolved' | 'monitoring';
}

interface MiningSample {
  id: string;
  sampleType: string;
  location: string;
  depth: number;
  mineralContent: string;
  grade: number;
  notes: string;
  collectedBy: string;
  timestamp: Date;
}

export const EnhancedMiningDashboard: React.FC = () => {
  const { toast } = useToast();
  const [observations, setObservations] = useState<Observation[]>([
    {
      id: '1',
      type: 'Geological Anomaly',
      location: 'Section A-4, Depth 45m',
      description: 'Unexpected mineral vein discovered with high copper content. Requires further investigation.',
      severity: 'high',
      observer: 'John Smith',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active'
    },
    {
      id: '2',
      type: 'Equipment Issue',
      location: 'Drill Site B-2',
      description: 'Drill bit showing signs of wear, replacement recommended before next shift.',
      severity: 'medium',
      observer: 'Sarah Johnson',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'monitoring'
    }
  ]);

  const [samples, setSamples] = useState<MiningSample[]>([
    {
      id: '1',
      sampleType: 'Core Sample',
      location: 'Borehole A-12',
      depth: 35.5,
      mineralContent: 'Copper Ore',
      grade: 2.4,
      notes: 'High-grade copper with trace gold content',
      collectedBy: 'Mike Davis',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  ]);

  const [newObservation, setNewObservation] = useState({
    type: '',
    location: '',
    description: '',
    severity: 'medium' as const,
    observer: ''
  });

  const [newSample, setNewSample] = useState({
    sampleType: '',
    location: '',
    depth: 0,
    mineralContent: '',
    grade: 0,
    notes: '',
    collectedBy: ''
  });

  const addObservation = () => {
    if (!newObservation.type || !newObservation.location || !newObservation.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const observation: Observation = {
      id: Date.now().toString(),
      ...newObservation,
      timestamp: new Date(),
      status: 'active'
    };

    setObservations(prev => [observation, ...prev]);
    setNewObservation({
      type: '',
      location: '',
      description: '',
      severity: 'medium',
      observer: ''
    });

    toast({
      title: "Observation Added",
      description: "Field observation has been recorded successfully"
    });
  };

  const addSample = () => {
    if (!newSample.sampleType || !newSample.location || !newSample.mineralContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const sample: MiningSample = {
      id: Date.now().toString(),
      ...newSample,
      timestamp: new Date()
    };

    setSamples(prev => [sample, ...prev]);
    setNewSample({
      sampleType: '',
      location: '',
      depth: 0,
      mineralContent: '',
      grade: 0,
      notes: '',
      collectedBy: ''
    });

    toast({
      title: "Sample Recorded",
      description: "Mining sample data has been added successfully"
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'monitoring':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Pickaxe className="h-8 w-8 text-orange-600" />
        <h2 className="text-2xl font-bold text-gray-900">Mining Operations Dashboard</h2>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600">Active Issues</p>
              <p className="text-2xl font-bold">{observations.filter(o => o.status === 'active').length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Samples Collected</p>
              <p className="text-2xl font-bold">{samples.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Active Sites</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Pickaxe className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600">Avg Grade</p>
              <p className="text-2xl font-bold">{samples.length > 0 ? (samples.reduce((sum, s) => sum + s.grade, 0) / samples.length).toFixed(1) : '0.0'}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="observations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="observations">Field Observations</TabsTrigger>
          <TabsTrigger value="samples">Sample Data</TabsTrigger>
        </TabsList>

        <TabsContent value="observations" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add New Observation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Observation Type</label>
                <Select value={newObservation.type} onValueChange={(value) => setNewObservation({...newObservation, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geological Anomaly">Geological Anomaly</SelectItem>
                    <SelectItem value="Equipment Issue">Equipment Issue</SelectItem>
                    <SelectItem value="Safety Concern">Safety Concern</SelectItem>
                    <SelectItem value="Environmental Impact">Environmental Impact</SelectItem>
                    <SelectItem value="Resource Discovery">Resource Discovery</SelectItem>
                    <SelectItem value="Structural Issue">Structural Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={newObservation.location}
                  onChange={(e) => setNewObservation({...newObservation, location: e.target.value})}
                  placeholder="e.g., Section A-4, Depth 45m"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Severity</label>
                <Select value={newObservation.severity} onValueChange={(value) => setNewObservation({...newObservation, severity: value as any})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Observer</label>
                <Input
                  value={newObservation.observer}
                  onChange={(e) => setNewObservation({...newObservation, observer: e.target.value})}
                  placeholder="Your name"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={newObservation.description}
                  onChange={(e) => setNewObservation({...newObservation, description: e.target.value})}
                  placeholder="Detailed description of the observation..."
                  rows={3}
                />
              </div>
            </div>
            
            <Button onClick={addObservation} className="mt-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Observation
            </Button>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Observations</h3>
            {observations.map((observation) => (
              <Card key={observation.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(observation.severity)}>
                      {observation.severity.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(observation.status)}>
                      {observation.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {observation.timestamp.toLocaleString()}
                  </div>
                </div>
                
                <h4 className="font-medium text-lg mb-1">{observation.type}</h4>
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4" />
                  {observation.location}
                </div>
                
                <p className="text-gray-700 mb-2">{observation.description}</p>
                
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <User className="h-4 w-4" />
                  Observed by: {observation.observer}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="samples" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Record New Sample</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sample Type</label>
                <Select value={newSample.sampleType} onValueChange={(value) => setNewSample({...newSample, sampleType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sample type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core Sample">Core Sample</SelectItem>
                    <SelectItem value="Chip Sample">Chip Sample</SelectItem>
                    <SelectItem value="Grab Sample">Grab Sample</SelectItem>
                    <SelectItem value="Channel Sample">Channel Sample</SelectItem>
                    <SelectItem value="Bulk Sample">Bulk Sample</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <Input
                  value={newSample.location}
                  onChange={(e) => setNewSample({...newSample, location: e.target.value})}
                  placeholder="e.g., Borehole A-12"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Depth (m)</label>
                <Input
                  type="number"
                  value={newSample.depth}
                  onChange={(e) => setNewSample({...newSample, depth: parseFloat(e.target.value) || 0})}
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Mineral Content</label>
                <Input
                  value={newSample.mineralContent}
                  onChange={(e) => setNewSample({...newSample, mineralContent: e.target.value})}
                  placeholder="e.g., Copper Ore"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Grade (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={newSample.grade}
                  onChange={(e) => setNewSample({...newSample, grade: parseFloat(e.target.value) || 0})}
                  placeholder="0.0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Collected By</label>
                <Input
                  value={newSample.collectedBy}
                  onChange={(e) => setNewSample({...newSample, collectedBy: e.target.value})}
                  placeholder="Your name"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Notes</label>
                <Textarea
                  value={newSample.notes}
                  onChange={(e) => setNewSample({...newSample, notes: e.target.value})}
                  placeholder="Additional notes about the sample..."
                  rows={2}
                />
              </div>
            </div>
            
            <Button onClick={addSample} className="mt-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Record Sample
            </Button>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Sample Records</h3>
            {samples.map((sample) => (
              <Card key={sample.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{sample.sampleType}</Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    {sample.timestamp.toLocaleString()}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{sample.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Depth</p>
                    <p className="font-medium">{sample.depth}m</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-medium text-lg text-blue-600">{sample.grade}%</p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Mineral Content</p>
                  <p className="font-medium">{sample.mineralContent}</p>
                </div>
                
                {sample.notes && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-gray-700">{sample.notes}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <User className="h-4 w-4" />
                  Collected by: {sample.collectedBy}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
