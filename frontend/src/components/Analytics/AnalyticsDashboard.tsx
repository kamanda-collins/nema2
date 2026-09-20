
import React from 'react';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, MapPin, MessageSquare } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';
import { useFeatures } from '@/hooks/useFeatures';

export const AnalyticsDashboard: React.FC = () => {
  const { feedback } = useFeedback();
  const { features } = useFeatures();

  const feedbackByCategory = feedback.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(feedbackByCategory).map(([category, count]) => ({
    category,
    count
  }));

  const averageRating = feedback.length > 0 
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Total Features</p>
              <p className="text-lg font-semibold">{features.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Total Feedback</p>
              <p className="text-lg font-semibold">{feedback.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-gray-500">Avg. Rating</p>
              <p className="text-lg font-semibold">{averageRating}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-lg font-semibold">{Object.keys(feedbackByCategory).length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-medium mb-4">Feedback by Category</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
