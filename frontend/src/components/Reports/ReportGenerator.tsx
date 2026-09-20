
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Settings, Calendar } from 'lucide-react';

interface ReportGeneratorProps {
  format: string;
  onFormatChange: (format: string) => void;
  reportType: string;
  onReportTypeChange: (type: string) => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  format,
  onFormatChange,
  reportType,
  onReportTypeChange
}) => {
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(['executive', 'environmental', 'mining']);
  
  const reportSections = [
    { id: 'executive', label: 'Executive Summary', description: 'High-level overview and KPIs' },
    { id: 'environmental', label: 'Environmental Analysis', description: 'Air quality, water quality, vegetation health' },
    { id: 'mining', label: 'Mining Operations', description: 'Production data, equipment status, safety metrics' },
    { id: 'financial', label: 'Financial Summary', description: 'Cost analysis and revenue metrics' },
    { id: 'compliance', label: 'Regulatory Compliance', description: 'Compliance status and audit results' },
    { id: 'recommendations', label: 'Recommendations', description: 'Action items and strategic recommendations' }
  ];

  const templates = [
    { id: 'comprehensive', label: 'Comprehensive Report', description: 'Full detailed analysis' },
    { id: 'executive', label: 'Executive Brief', description: 'High-level summary for leadership' },
    { id: 'technical', label: 'Technical Report', description: 'Detailed technical analysis' },
    { id: 'compliance', label: 'Compliance Report', description: 'Regulatory and compliance focused' },
    { id: 'custom', label: 'Custom Report', description: 'Build your own report structure' }
  ];

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleGenerateReport = () => {
    console.log('Generating report:', {
      title: reportTitle,
      description: reportDescription,
      format,
      type: reportType,
      sections: selectedSections
    });
    // Implementation for report generation would go here
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Report Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="reportTitle">Report Title</Label>
              <Input
                id="reportTitle"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title..."
              />
            </div>
            
            <div>
              <Label htmlFor="reportDescription">Description</Label>
              <Textarea
                id="reportDescription"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Brief description of the report..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Report Template</Label>
              <Select value={reportType} onValueChange={onReportTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div>
                        <div className="font-medium">{template.label}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Export Format</Label>
              <Select value={format} onValueChange={onFormatChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
                  <SelectItem value="word">Word Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Section Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Report Sections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportSections.map(section => (
            <div key={section.id} className="flex items-start space-x-3">
              <Checkbox
                id={section.id}
                checked={selectedSections.includes(section.id)}
                onCheckedChange={() => handleSectionToggle(section.id)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor={section.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {section.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Report Preview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <span className="font-medium">{reportTitle || 'Untitled Report'}</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {reportDescription || 'No description provided'}
          </p>
          <div className="text-xs text-gray-500">
            <p>Format: {format.toUpperCase()}</p>
            <p>Sections: {selectedSections.length} selected</p>
            <p>Template: {templates.find(t => t.id === reportType)?.label}</p>
          </div>
        </div>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleGenerateReport}
          className="flex items-center gap-2"
          disabled={selectedSections.length === 0}
        >
          <Download className="h-4 w-4" />
          Generate Report
        </Button>
      </div>
    </div>
  );
};
