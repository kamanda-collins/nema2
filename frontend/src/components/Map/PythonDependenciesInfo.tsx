
import React from 'react';
import { Badge } from '@/components/ui/badge';

export const PythonDependenciesInfo: React.FC = () => (
  <div className="bg-gray-50 border rounded-lg p-4">
    <h4 className="font-medium mb-2">Python Dependencies Required:</h4>
    <div className="flex flex-wrap gap-2">
      {[
        'matplotlib',
        'geopandas',
        'contextily',
        'numpy',
        'shapely',
        'pillow'
      ].map(dep => (
        <Badge key={dep} variant="outline" className="text-xs">
          {dep}
        </Badge>
      ))}
    </div>
    <p className="text-xs text-gray-600 mt-2">
      Install with: <code className="bg-white px-1 rounded">
        pip install matplotlib geopandas contextily numpy shapely pillow
      </code>
    </p>
  </div>
);
