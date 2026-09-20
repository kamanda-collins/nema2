
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFeatures } from '@/hooks/useFeatures';
import { useFeedback } from '@/hooks/useFeedback';

export const ExportTools: React.FC = () => {
  const { features } = useFeatures();
  const { feedback } = useFeedback();
  const { toast } = useToast();

  const exportGeoJSON = () => {
    if (features.length === 0) {
      toast({
        title: "No data to export",
        description: "Please create some features first.",
        variant: "destructive"
      });
      return;
    }

    const geoJSON = {
      type: "FeatureCollection",
      features: features.map(feature => {
        try {
          return JSON.parse(feature.geo);
        } catch (e) {
          console.error('Error parsing feature geo:', e);
          return null;
        }
      }).filter(Boolean)
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `features-${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "GeoJSON file has been downloaded.",
    });
  };

  const exportFeedbackCSV = () => {
    if (feedback.length === 0) {
      toast({
        title: "No feedback to export",
        description: "No feedback data available.",
        variant: "destructive"
      });
      return;
    }

    const headers = ['ID', 'Feature ID', 'Rating', 'Category', 'Comment', 'Created At'];
    const csvData = feedback.map(item => [
      item.id,
      item.feature_id,
      item.rating,
      item.category,
      `"${item.comment.replace(/"/g, '""')}"`,
      item.created_at
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Feedback CSV has been downloaded.",
    });
  };

  const exportReport = () => {
    const reportData = {
      summary: {
        totalFeatures: features.length,
        totalFeedback: feedback.length,
        averageRating: feedback.length > 0 
          ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(2)
          : '0'
      },
      features: features.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        category: f.category,
        created_at: f.created_at
      })),
      feedback: feedback.map(f => ({
        feature_id: f.feature_id,
        rating: f.rating,
        category: f.category,
        comment: f.comment,
        created_at: f.created_at
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report exported",
      description: "Complete data report has been downloaded.",
    });
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-blue-500" />
          <h3 className="font-medium text-sm">Export Tools</h3>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={exportGeoJSON} 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
          >
            <Database className="h-3 w-3 mr-2" />
            Export GeoJSON
          </Button>
          
          <Button 
            onClick={exportFeedbackCSV} 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
          >
            <FileText className="h-3 w-3 mr-2" />
            Export Feedback CSV
          </Button>
          
          <Button 
            onClick={exportReport} 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
          >
            <Download className="h-3 w-3 mr-2" />
            Full Report
          </Button>
        </div>
        
        <p className="text-xs text-gray-500">
          Export your data for analysis or backup purposes.
        </p>
      </div>
    </Card>
  );
};
