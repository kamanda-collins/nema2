
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Feedback {
  id: string;
  feature_id: string;
  user_id: string;
  rating: number;
  comment: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useFeedback = (featureId?: string) => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (featureId && featureId !== 'general') {
        query = query.eq('feature_id', featureId);
      } else if (featureId === 'general') {
        // For general feedback, we'll use a placeholder UUID or handle it differently
        query = query.eq('feature_id', '00000000-0000-0000-0000-000000000000');
      }

      const { data, error } = await query;

      if (error) throw error;
      setFeedback(data || []);
    } catch (error: any) {
      console.error('Error loading feedback:', error);
      // Don't show error toast for UUID parsing issues
      if (!error.message.includes('invalid input syntax for type uuid')) {
        toast({
          title: "Error loading feedback",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (feedbackData: {
    feature_id: string;
    rating: number;
    comment: string;
    category: string;
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to submit feedback.",
        variant: "destructive"
      });
      return;
    }

    try {
      // For general feedback, use a consistent placeholder UUID
      const featureIdToUse = feedbackData.feature_id === 'general' 
        ? '00000000-0000-0000-0000-000000000000' 
        : feedbackData.feature_id;

      const { data, error } = await supabase
        .from('feedback')
        .insert([{
          ...feedbackData,
          feature_id: featureIdToUse,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setFeedback(prev => [data, ...prev]);
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!"
      });

      return data;
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    loadFeedback();
  }, [featureId]);

  return {
    feedback,
    loading,
    loadFeedback,
    submitFeedback
  };
};
