
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MessageSquare } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';
import { useAuth } from '@/components/Auth/AuthProvider';

interface FeedbackPanelProps {
  featureId?: string;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ featureId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const { feedback, loading, submitFeedback } = useFeedback(featureId);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureId || !rating || !category) return;

    try {
      await submitFeedback({
        feature_id: featureId,
        rating,
        comment,
        category
      });
      
      // Reset form
      setRating(0);
      setComment('');
      setCategory('');
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          <h3 className="font-medium text-sm">Feedback</h3>
        </div>

        {user && featureId && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-xs">Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 cursor-pointer ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accuracy">Accuracy</SelectItem>
                  <SelectItem value="completeness">Completeness</SelectItem>
                  <SelectItem value="usefulness">Usefulness</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Comment</Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="h-20 text-xs"
              />
            </div>

            <Button type="submit" size="sm" className="w-full">
              Submit Feedback
            </Button>
          </form>
        )}

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {feedback.map((item) => (
            <div key={item.id} className="p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center gap-1 mb-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= item.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {item.category}
                </span>
              </div>
              {item.comment && <p className="text-gray-700">{item.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
