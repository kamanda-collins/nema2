
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFeedback } from '@/hooks/useFeedback';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface FeedbackFormProps {
  featureId?: string;
  onSuccess?: () => void;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ featureId = 'general', onSuccess }) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('general');
  const { submitFeedback, loading } = useFeedback();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit feedback.",
        variant: "destructive"
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter your feedback comment.",
        variant: "destructive"
      });
      return;
    }

    try {
      await submitFeedback({
        feature_id: featureId,
        rating,
        comment: comment.trim(),
        category
      });
      
      // Reset form
      setComment('');
      setRating(5);
      setCategory('general');
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="feedback-category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="bug">Bug Report</SelectItem>
            <SelectItem value="feature">Feature Request</SelectItem>
            <SelectItem value="ui">UI/UX</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="feedback-rating">Rating (1-5)</Label>
        <Select value={rating.toString()} onValueChange={(value) => setRating(parseInt(value))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Poor</SelectItem>
            <SelectItem value="2">2 - Fair</SelectItem>
            <SelectItem value="3">3 - Good</SelectItem>
            <SelectItem value="4">4 - Very Good</SelectItem>
            <SelectItem value="5">5 - Excellent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="feedback-comment">Your Feedback</Label>
        <Textarea
          id="feedback-comment"
          placeholder="Share your thoughts, suggestions, or report issues..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
          required
        />
      </div>

      <Button type="submit" disabled={loading || !comment.trim()}>
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </Button>
    </form>
  );
};
