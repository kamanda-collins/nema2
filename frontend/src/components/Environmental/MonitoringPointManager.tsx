
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Plus, Trash2, Map } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

interface MonitoringPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'air' | 'water' | 'vegetation' | 'general';
  createdAt: Date;
}

interface MonitoringPointManagerProps {
  onSetPoint?: () => void;
}

export const MonitoringPointManager: React.FC<MonitoringPointManagerProps> = ({ onSetPoint }) => {
  const [monitoringPoints, setMonitoringPoints] = useState<MonitoringPoint[]>([]);
  const [newPointName, setNewPointName] = useState('');
  const [newPointType, setNewPointType] = useState<MonitoringPoint['type']>('general');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { currentLocation } = useLocation();
  const { toast } = useToast();

  const handleSetPointClick = () => {
    if (!currentLocation && onSetPoint) {
      onSetPoint();
      return;
    }
    setIsDialogOpen(true);
  };

  const addMonitoringPoint = () => {
    if (!currentLocation) {
      toast({
        title: "No location selected",
        description: "Please go to the Maps tab and click on a location first",
        variant: "destructive"
      });
      return;
    }

    if (!newPointName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the monitoring point",
        variant: "destructive"
      });
      return;
    }

    const newPoint: MonitoringPoint = {
      id: Date.now().toString(),
      name: newPointName.trim(),
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      type: newPointType,
      createdAt: new Date()
    };

    setMonitoringPoints(prev => [newPoint, ...prev]);
    setNewPointName('');
    setNewPointType('general');
    setIsDialogOpen(false);

    toast({
      title: "Monitoring point added",
      description: `${newPoint.name} has been set as a monitoring point`,
    });
  };

  const removeMonitoringPoint = (id: string) => {
    setMonitoringPoints(prev => prev.filter(point => point.id !== id));
    toast({
      title: "Monitoring point removed",
      description: "The monitoring point has been deleted",
    });
  };

  const getTypeColor = (type: MonitoringPoint['type']) => {
    switch (type) {
      case 'air': return 'bg-blue-100 text-blue-800';
      case 'water': return 'bg-cyan-100 text-cyan-800';
      case 'vegetation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Monitoring Points</h3>
        {!currentLocation ? (
          <Button 
            size="sm" 
            className="flex items-center gap-2"
            onClick={handleSetPointClick}
          >
            <Map className="h-4 w-4" />
            Go to Maps
          </Button>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Set Point
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Monitoring Point</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Selected Location</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">{currentLocation.name}</p>
                  <p className="text-xs text-green-600">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pointName">Point Name</Label>
                  <Input
                    id="pointName"
                    value={newPointName}
                    onChange={(e) => setNewPointName(e.target.value)}
                    placeholder="Enter monitoring point name..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pointType">Monitoring Type</Label>
                  <select
                    id="pointType"
                    value={newPointType}
                    onChange={(e) => setNewPointType(e.target.value as MonitoringPoint['type'])}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="general">General Monitoring</option>
                    <option value="air">Air Quality</option>
                    <option value="water">Water Quality</option>
                    <option value="vegetation">Vegetation Analysis</option>
                  </select>
                </div>

                <Button onClick={addMonitoringPoint} className="w-full">
                  Add Monitoring Point
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {monitoringPoints.length === 0 ? (
        <Card className="p-4 text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No monitoring points set</p>
          <p className="text-sm">
            {!currentLocation ? (
              <Button
                variant="link"
                size="sm"
                onClick={handleSetPointClick}
                className="p-0 h-auto text-blue-600"
              >
                Go to Maps tab to select a location first
              </Button>
            ) : (
              "Click 'Set Point' to add monitoring locations"
            )}
          </p>
        </Card>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {monitoringPoints.map((point) => (
            <Card key={point.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{point.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getTypeColor(point.type)}`}>
                      {point.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {point.createdAt.toLocaleDateString()} {point.createdAt.toLocaleTimeString()}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeMonitoringPoint(point.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
        <p><strong>How it works:</strong> Go to the Maps tab, click anywhere on the map to select a location, then come back here and click "Set Point" to save it for monitoring.</p>
      </div>
    </div>
  );
};
