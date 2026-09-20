
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Feature {
  id: string;
  name: string;
  description: string;
  geo: any;
  user_id: string;
  category: string;
  visibility: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const useFeatures = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const { toast } = useToast();

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase features not available:', error.message);
        // Only show error once and mark Supabase as unavailable
        if (supabaseAvailable) {
          setSupabaseAvailable(false);
          console.info('Working in offline mode - Supabase features disabled');
        }
        setFeatures([]);
        return;
      }
      setFeatures(data || []);
      setSupabaseAvailable(true);
    } catch (error: any) {
      console.warn('Supabase connection error:', error.message);
      if (supabaseAvailable) {
        setSupabaseAvailable(false);
        console.info('Working in offline mode - Supabase features disabled');
      }
      setFeatures([]);
    } finally {
      setLoading(false);
    }
  };

  const createValidGeoJSON = (name: string, description: string, category: string) => {
    const geoJSON = {
      type: "Feature",
      properties: {
        name: name,
        description: description,
        category: category,
        created_at: new Date().toISOString()
      },
      geometry: {
        type: "Point",
        coordinates: [-122.4194, 37.7749]
      }
    };
    
    console.log('Created valid GeoJSON:', geoJSON);
    return geoJSON;
  };

  const addFeature = async (featureData: {
    name: string;
    description?: string;
    geo?: string;
    category?: string;
    visibility?: string;
    tags?: string[];
  }) => {
    try {
      console.log('Starting addFeature with data:', featureData);

      // Get current user - but allow anonymous users for testing
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.warn('Auth error (allowing anonymous):', userError);
      }

      // Create valid GeoJSON
      let geoData;
      if (featureData.geo) {
        try {
          const parsed = typeof featureData.geo === 'string' ? JSON.parse(featureData.geo) : featureData.geo;
          if (parsed.type === 'Feature' && parsed.geometry && parsed.geometry.type && parsed.geometry.coordinates) {
            geoData = JSON.stringify(parsed);
          } else {
            throw new Error('Invalid GeoJSON structure');
          }
        } catch (parseError) {
          console.warn('Invalid GeoJSON provided, creating default:', parseError);
          geoData = JSON.stringify(createValidGeoJSON(
            featureData.name, 
            featureData.description || '', 
            featureData.category || 'general'
          ));
        }
      } else {
        geoData = JSON.stringify(createValidGeoJSON(
          featureData.name, 
          featureData.description || '', 
          featureData.category || 'general'
        ));
      }

      const insertData = {
        name: featureData.name || 'Untitled Feature',
        description: featureData.description || '',
        category: featureData.category || 'general',
        visibility: featureData.visibility || 'private',
        tags: featureData.tags || [],
        user_id: user?.id || null, // Allow null for anonymous users
        geo: geoData
      };

      console.log('Inserting feature with data:', insertData);

      const { data, error } = await supabase
        .from('features')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.warn('Supabase save error (offline mode):', error.message);
        if (supabaseAvailable) {
          toast({
            title: "Save unavailable",
            description: "Working in offline mode - features not saved to database",
            variant: "default"
          });
          setSupabaseAvailable(false);
        }
        throw error;
      }

      if (!data) {
        console.error('No data returned from insert');
        throw new Error('No data returned from insert');
      }

      console.log('Feature saved successfully:', data);
      setFeatures(prev => [data, ...prev]);
      toast({
        title: "Feature saved",
        description: `"${featureData.name}" has been saved successfully!`
      });

      return data;
    } catch (error: any) {
      console.warn('Feature save error (offline mode):', error.message);
      // Don't show error toast - already handled above or user is offline
      throw error;
    }
  };

  const updateFeature = async (featureId: string, updates: Partial<Feature>) => {
    if (!supabaseAvailable) {
      console.warn('Cannot update - working in offline mode');
      return null;
    }
    
    try {
      const { data, error } = await supabase
        .from('features')
        .update(updates)
        .eq('id', featureId)
        .select()
        .single();

      if (error) throw error;

      setFeatures(prev => prev.map(f => f.id === featureId ? data : f));
      toast({
        title: "Feature updated",
        description: "Feature has been updated successfully."
      });

      return data;
    } catch (error: any) {
      console.warn('Update error (offline mode):', error.message);
      setSupabaseAvailable(false);
      throw error;
    }
  };

  const saveFeature = async (featureData: {
    name: string;
    description?: string;
    geo: string;
    category?: string;
    visibility?: string;
    tags?: string[];
  }) => {
    return addFeature(featureData);
  };

  const deleteFeature = async (featureId: string) => {
    if (!supabaseAvailable) {
      console.warn('Cannot delete - working in offline mode');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(prev => prev.filter(f => f.id !== featureId));
      toast({
        title: "Feature deleted",
        description: "Feature has been deleted successfully."
      });
    } catch (error: any) {
      console.warn('Delete error (offline mode):', error.message);
      setSupabaseAvailable(false);
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  return {
    features,
    loading,
    isLoading: loading,
    supabaseAvailable,
    loadFeatures,
    addFeature,
    updateFeature,
    saveFeature,
    deleteFeature
  };
};
