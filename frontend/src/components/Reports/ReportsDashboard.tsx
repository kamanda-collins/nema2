
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Share2 } from 'lucide-react';
import { ExecutiveSummary } from './ExecutiveSummary';
import { ReportGenerator } from './ReportGenerator';
import { BusinessIntelligence } from './BusinessIntelligence';
import { TrendAnalysis } from './TrendAnalysis';

export const ReportsDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [reportType, setReportType] = useState('comprehensive');

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Reports & Analytics</h2>
          <p className="text-gray-600">Comprehensive reporting and business intelligence dashboard</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="executive" className="w-full">
        <TabsList className="flex w-full overflow-x-auto gap-0 sm:grid sm:w-full sm:grid-cols-4 scrollbar-hide !bg-muted p-1"
          style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* More compact, responsive tab triggers. */}
          <TabsTrigger 
            value="executive" 
            className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm min-w-[110px] md:min-w-0">
            Executive
          </TabsTrigger>
          <TabsTrigger 
            value="generator" 
            className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm min-w-[110px] md:min-w-0">
            Generator
          </TabsTrigger>
          <TabsTrigger 
            value="intelligence" 
            className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm min-w-[110px] md:min-w-0">
            Intelligence
          </TabsTrigger>
          <TabsTrigger 
            value="trends" 
            className="flex-shrink-0 px-2 py-1 text-xs sm:text-sm min-w-[110px] md:min-w-0">
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-6">
          <ExecutiveSummary period={selectedPeriod} />
        </TabsContent>
        <TabsContent value="generator" className="space-y-6">
          <ReportGenerator 
            format={selectedFormat}
            onFormatChange={setSelectedFormat}
            reportType={reportType}
            onReportTypeChange={setReportType}
          />
        </TabsContent>
        <TabsContent value="intelligence" className="space-y-6">
          <BusinessIntelligence period={selectedPeriod} />
        </TabsContent>
        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis period={selectedPeriod} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
