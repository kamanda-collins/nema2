import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, MapPin, Edit3, Save, X, Plus, AlertCircle } from 'lucide-react';
import { useFeatures } from '@/hooks/useFeatures';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const FeatureManager: React.FC = () => {
  const { features, addFeature, updateFeature, deleteFeature, isLoading } = useFeatures();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [newFeature, setNewFeature] = useState({
    name: '',
    description: '',
    category: 'environmental'
  });

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAddFeature = async () => {
    if (!newFeature.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a feature name",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adding feature:', newFeature);
      
      await addFeature({
        name: newFeature.name.trim(),
        description: newFeature.description.trim(),
        category: newFeature.category,
        visibility: 'private',
        tags: []
      });

      setNewFeature({ name: '', description: '', category: 'environmental' });
      
    } catch (error) {
      console.error('Error in handleAddFeature:', error);
    }
  };

  const handleUpdateFeature = async (id: string, updates: any) => {
    try {
      await updateFeature(id, updates);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating feature:', error);
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) {
      return;
    }

    try {
      await deleteFeature(id);
    } catch (error) {
      console.error('Error deleting feature:', error);
    }
  };

  const getFeatureCoordinates = (feature: any) => {
    try {
      if (!feature.geo) return 'No coordinates';
      
      let geoData = feature.geo;
      if (typeof geoData === 'string') {
        geoData = JSON.parse(geoData);
      }

      if (geoData.geometry && geoData.geometry.coordinates) {
        const coords = geoData.geometry.coordinates;
        if (geoData.geometry.type === 'Point' && Array.isArray(coords) && coords.length >= 2) {
          return `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
        }
      }
      
      return 'Complex geometry';
    } catch (error) {
      return 'Invalid coordinates';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      environmental: 'bg-green-100 text-green-800',
      mining: 'bg-orange-100 text-orange-800',
      infrastructure: 'bg-blue-100 text-blue-800',
      monitoring: 'bg-purple-100 text-purple-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const loadSampleFeatures = async () => {
    const sampleFeatures = [
      {
        name: 'Water Quality Monitoring Point A',
        description: 'Primary water quality monitoring location upstream of mining operations',
        category: 'environmental'
      },
      {
        name: 'Mining Extraction Zone 1',
        description: 'Active mining area with ongoing extraction operations',
        category: 'mining'
      },
      {
        name: 'Community Health Center',
        description: 'Local healthcare facility serving mining community',
        category: 'infrastructure'
      },
      {
        name: 'Wildlife Corridor B',
        description: 'Protected wildlife migration route around mining site',
        category: 'environmental'
      }
    ];

    for (const feature of sampleFeatures) {
      try {
        await addFeature({
          name: feature.name,
          description: feature.description,
          category: feature.category,
          visibility: 'private',
          tags: []
        });
      } catch (error) {
        console.error('Error adding sample feature:', error);
      }
    }

    toast({
      title: "Sample Features Added",
      description: "Loaded sample monitoring points and analysis areas"
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Loading features...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Feature Management</h3>
          {features.length === 0 && (
            <Button onClick={loadSampleFeatures} variant="outline" size="sm">
              Load Sample Data
            </Button>
          )}
        </div>

        {/* Authentication status indicator */}
        {!authUser && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-700">
              You're not authenticated. Features will be saved without user association.
            </p>
          </div>
        )}
        
        {/* Add new feature form */}
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Feature
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="Feature name"
              value={newFeature.name}
              onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
            />
            <select
              value={newFeature.category}
              onChange={(e) => setNewFeature({ ...newFeature, category: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="environmental">Environmental</option>
              <option value="mining">Mining</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="monitoring">Monitoring</option>
              <option value="general">General</option>
            </select>
          </div>
          <Textarea
            placeholder="Description (optional)"
            value={newFeature.description}
            onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
            rows={2}
          />
          <Button onClick={handleAddFeature} size="sm" disabled={!newFeature.name.trim()}>
            <MapPin className="h-4 w-4 mr-2" />
            Add Feature
          </Button>
        </div>

        {/* Features list */}
        <div className="space-y-3">
          <h4 className="font-medium">
            Features ({features.length})
          </h4>
          
          {features.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No features created yet</p>
              <p className="text-sm">Add your first feature above or load sample data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {features.map((feature) => (
                <div key={feature.id} className="border rounded-lg p-4 space-y-2">
                  {editingId === feature.id ? (
                    <EditFeatureForm
                      feature={feature}
                      onSave={(updates) => handleUpdateFeature(feature.id, updates)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{feature.name}</h5>
                          <Badge className={getCategoryColor(feature.category)}>
                            {feature.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(feature.id)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteFeature(feature.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {feature.description && (
                        <p className="text-sm text-gray-600">{feature.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Coordinates: {getFeatureCoordinates(feature)}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Created: {new Date(feature.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

interface EditFeatureFormProps {
  feature: any;
  onSave: (updates: any) => void;
  onCancel: () => void;
}

const EditFeatureForm: React.FC<EditFeatureFormProps> = ({ feature, onSave, onCancel }) => {
  const [name, setName] = useState(feature.name);
  const [description, setDescription] = useState(feature.description || '');
  const [category, setCategory] = useState(feature.category);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }
    onSave({ name, description, category });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Feature name"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="environmental">Environmental</option>
          <option value="mining">Mining</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="monitoring">Monitoring</option>
          <option value="general">General</option>
        </select>
      </div>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
};
