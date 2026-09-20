
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layers, Calendar, MapPin } from 'lucide-react';

interface Shape {
  id: string;
  name: string;
  geo: string;
  timestamp: string;
}

interface ShapesListProps {
  shapes: Shape[];
}

export const ShapesList = ({ shapes = [] }: ShapesListProps) => {
  const getShapeType = (geoString: string): string => {
    try {
      const geo = JSON.parse(geoString);
      return geo.geometry?.type || 'Unknown';
    } catch {
      return 'Unknown';
    }
  };

  const getShapeColor = (index: number): string => {
    const colors = ['bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-cyan-500'];
    return colors[index % colors.length];
  };

  const safeShapes = Array.isArray(shapes) ? shapes : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Saved Shapes ({safeShapes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {safeShapes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No shapes saved yet</p>
              <p className="text-xs">Draw and save your first shape!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safeShapes.map((shape, index) => (
                <div
                  key={shape.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-sm truncate flex-1">
                      {shape.name}
                    </h4>
                    <div className={`w-3 h-3 rounded-full ${getShapeColor(index)} ml-2 flex-shrink-0`} />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {getShapeType(shape.geo)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(shape.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
