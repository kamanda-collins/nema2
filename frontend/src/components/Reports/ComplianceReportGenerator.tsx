
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Download, CheckCircle, AlertTriangle, FileText, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface ComplianceItem {
  id: string;
  category: string;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'partial' | 'not-applicable';
  evidence: string;
  notes: string;
  priority: 'high' | 'medium' | 'low';
}

interface ComplianceReportData {
  organizationName: string;
  projectName: string;
  assessmentDate: string;
  assessor: string;
  regulatoryFramework: string;
  items: ComplianceItem[];
  summary: string;
  recommendations: string;
}

export const ComplianceReportGenerator: React.FC = () => {
  const [reportData, setReportData] = useState<ComplianceReportData>({
    organizationName: '',
    projectName: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    assessor: '',
    regulatoryFramework: '',
    items: [],
    summary: '',
    recommendations: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const defaultComplianceItems: ComplianceItem[] = [
    {
      id: '1',
      category: 'Environmental',
      requirement: 'Environmental Impact Assessment (EIA) Approval',
      status: 'compliant',
      evidence: 'EIA Certificate #ENV-2024-001 dated January 15, 2024',
      notes: 'Valid for current project scope and timeline',
      priority: 'high'
    },
    {
      id: '2',
      category: 'Environmental',
      requirement: 'Water Use Permit',
      status: 'compliant',
      evidence: 'Water Authority License #WL-2024-045',
      notes: 'Covers groundwater and surface water usage as per project requirements',
      priority: 'high'
    },
    {
      id: '3',
      category: 'Environmental',
      requirement: 'Air Emissions Permit',
      status: 'partial',
      evidence: 'Application submitted, pending final approval',
      notes: 'Expected approval by end of quarter. Temporary operations permit in place.',
      priority: 'high'
    },
    {
      id: '4',
      category: 'Environmental',
      requirement: 'Waste Management License',
      status: 'compliant',
      evidence: 'Hazardous Waste Management License #HWM-2024-012',
      notes: 'Covers all waste streams including hazardous materials',
      priority: 'medium'
    },
    {
      id: '5',
      category: 'Safety',
      requirement: 'Occupational Health & Safety Plan',
      status: 'compliant',
      evidence: 'Approved OHS Plan v2.1, updated March 2024',
      notes: 'Includes COVID-19 protocols and emergency response procedures',
      priority: 'high'
    },
    {
      id: '6',
      category: 'Safety',
      requirement: 'Emergency Response Plan',
      status: 'compliant',
      evidence: 'Emergency Response Plan approved by local authorities',
      notes: 'Coordination agreements with local fire and medical services',
      priority: 'high'
    },
    {
      id: '7',
      category: 'Safety',
      requirement: 'Safety Training Certification',
      status: 'partial',
      evidence: '85% of workforce certified, training ongoing',
      notes: 'New employee training in progress, completion expected by month-end',
      priority: 'medium'
    },
    {
      id: '8',
      category: 'Social',
      requirement: 'Community Consultation Records',
      status: 'compliant',
      evidence: 'Community meetings held quarterly, documented stakeholder feedback',
      notes: 'Active grievance mechanism in place with monthly reporting',
      priority: 'high'
    },
    {
      id: '9',
      category: 'Social',
      requirement: 'Local Employment Requirements',
      status: 'compliant',
      evidence: '60% local hiring achieved, exceeding 50% requirement',
      notes: 'Skills development programs actively supporting local workforce',
      priority: 'medium'
    },
    {
      id: '10',
      category: 'Social',
      requirement: 'Cultural Heritage Protection',
      status: 'compliant',
      evidence: 'Cultural Heritage Management Plan implemented',
      notes: 'Archaeological survey completed, no significant findings',
      priority: 'medium'
    },
    {
      id: '11',
      category: 'Legal',
      requirement: 'Mining License/Operating Permit',
      status: 'compliant',
      evidence: 'Mining License ML-2024-008 valid until December 2029',
      notes: 'Annual renewal requirements met, next review scheduled',
      priority: 'high'
    },
    {
      id: '12',
      category: 'Legal',
      requirement: 'Tax Compliance',
      status: 'compliant',
      evidence: 'Current on all tax obligations, certificate of compliance',
      notes: 'Monthly tax filings up to date, no outstanding liabilities',
      priority: 'high'
    },
    {
      id: '13',
      category: 'Legal',
      requirement: 'Insurance Coverage',
      status: 'compliant',
      evidence: 'Comprehensive insurance package including environmental liability',
      notes: 'Coverage amounts meet regulatory requirements and industry standards',
      priority: 'medium'
    },
    {
      id: '14',
      category: 'Legal',
      requirement: 'Import/Export Permits',
      status: 'non-compliant',
      evidence: 'Equipment import permits expired, renewal in progress',
      notes: 'Operations temporarily affected, urgent renewal required',
      priority: 'high'
    },
    {
      id: '15',
      category: 'Financial',
      requirement: 'Financial Assurance/Bond',
      status: 'compliant',
      evidence: 'Environmental remediation bond of $2.5M secured',
      notes: 'Bond amount reviewed annually and adjusted for inflation',
      priority: 'high'
    }
  ];

  const loadSampleData = () => {
    setReportData({
      organizationName: 'Sierra Mining Corporation',
      projectName: 'Northern Coastal Mining Project',
      assessmentDate: new Date().toISOString().split('T')[0],
      assessor: 'Environmental Compliance Team',
      regulatoryFramework: 'Sierra Leone Environmental Protection Authority (EPA) Regulations, Mining Act 2009, Occupational Health & Safety Act',
      items: defaultComplianceItems,
      summary: 'Overall compliance assessment shows strong adherence to regulatory requirements with 80% full compliance rate. Key areas of concern include pending air emissions permit approval and expired import permits. Immediate action required on high-priority non-compliant items to maintain operational status.',
      recommendations: '1. Expedite air emissions permit approval process through direct engagement with EPA\n2. Renew equipment import permits immediately to avoid operational disruptions\n3. Complete safety training for remaining 15% of workforce within 30 days\n4. Establish quarterly compliance review meetings\n5. Implement automated tracking system for permit renewal dates\n6. Enhance documentation procedures for regulatory inspections'
    });

    toast({
      title: "Sample Data Loaded",
      description: "Compliance report populated with realistic assessment data"
    });
  };

  const generateComplianceReport = async () => {
    if (!reportData.organizationName || !reportData.projectName) {
      toast({
        title: "Missing Information",
        description: "Please fill in organization and project name",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let yPos = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Title Page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REGULATORY COMPLIANCE ASSESSMENT', pageWidth / 2, yPos, { align: 'center' });

      yPos += 20;
      pdf.setFontSize(18);
      pdf.text(reportData.projectName, pageWidth / 2, yPos, { align: 'center' });

      yPos += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportData.organizationName, pageWidth / 2, yPos, { align: 'center' });

      yPos += 10;
      pdf.text(`Assessment Date: ${new Date(reportData.assessmentDate).toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });

      yPos += 10;
      pdf.text(`Assessor: ${reportData.assessor}`, pageWidth / 2, yPos, { align: 'center' });

      // Add new page for executive summary
      pdf.addPage();
      yPos = 20;

      // Executive Summary
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EXECUTIVE SUMMARY', margin, yPos);
      yPos += 15;

      // Compliance Statistics
      const totalItems = reportData.items.length;
      const compliantItems = reportData.items.filter(item => item.status === 'compliant').length;
      const partialItems = reportData.items.filter(item => item.status === 'partial').length;
      const nonCompliantItems = reportData.items.filter(item => item.status === 'non-compliant').length;
      const complianceRate = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Requirements Assessed: ${totalItems}`, margin, yPos);
      yPos += 8;
      pdf.text(`Fully Compliant: ${compliantItems} (${Math.round((compliantItems/totalItems)*100)}%)`, margin, yPos);
      yPos += 6;
      pdf.text(`Partially Compliant: ${partialItems} (${Math.round((partialItems/totalItems)*100)}%)`, margin, yPos);
      yPos += 6;
      pdf.text(`Non-Compliant: ${nonCompliantItems} (${Math.round((nonCompliantItems/totalItems)*100)}%)`, margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Overall Compliance Rate: ${complianceRate}%`, margin, yPos);
      yPos += 15;

      // Summary text
      pdf.setFont('helvetica', 'normal');
      const summaryLines = pdf.splitTextToSize(reportData.summary, contentWidth);
      pdf.text(summaryLines, margin, yPos);
      yPos += summaryLines.length * 5 + 15;

      // Regulatory Framework
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('REGULATORY FRAMEWORK', margin, yPos);
      yPos += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const frameworkLines = pdf.splitTextToSize(reportData.regulatoryFramework, contentWidth);
      pdf.text(frameworkLines, margin, yPos);
      yPos += frameworkLines.length * 5 + 15;

      // Detailed Assessment
      pdf.addPage();
      yPos = 20;
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DETAILED COMPLIANCE ASSESSMENT', margin, yPos);
      yPos += 15;

      // Group items by category
      const categories = [...new Set(reportData.items.map(item => item.category))];
      
      categories.forEach(category => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${category.toUpperCase()} REQUIREMENTS`, margin, yPos);
        yPos += 12;

        const categoryItems = reportData.items.filter(item => item.category === category);
        
        categoryItems.forEach(item => {
          if (yPos > 260) {
            pdf.addPage();
            yPos = 20;
          }

          // Status indicator
          const statusColors = {
            'compliant': [40, 167, 69],
            'partial': [255, 193, 7],
            'non-compliant': [220, 53, 69],
            'not-applicable': [108, 117, 125]
          };
          
          const color = statusColors[item.status];
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.rect(margin, yPos - 4, 8, 6, 'F');
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(item.requirement, margin + 12, yPos);
          yPos += 8;

          // Status and Priority
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Status: ${item.status.toUpperCase()}`, margin + 12, yPos);
          pdf.text(`Priority: ${item.priority.toUpperCase()}`, margin + 80, yPos);
          yPos += 6;

          // Evidence
          pdf.setFont('helvetica', 'bold');
          pdf.text('Evidence:', margin + 12, yPos);
          yPos += 4;
          pdf.setFont('helvetica', 'normal');
          const evidenceLines = pdf.splitTextToSize(item.evidence, contentWidth - 12);
          pdf.text(evidenceLines, margin + 12, yPos);
          yPos += evidenceLines.length * 4 + 2;

          // Notes
          if (item.notes) {
            pdf.setFont('helvetica', 'bold');
            pdf.text('Notes:', margin + 12, yPos);
            yPos += 4;
            pdf.setFont('helvetica', 'normal');
            const notesLines = pdf.splitTextToSize(item.notes, contentWidth - 12);
            pdf.text(notesLines, margin + 12, yPos);
            yPos += notesLines.length * 4;
          }
          
          yPos += 8;
        });
        
        yPos += 5;
      });

      // Recommendations
      if (yPos > 200) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECOMMENDATIONS', margin, yPos);
      yPos += 15;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const recommendationLines = pdf.splitTextToSize(reportData.recommendations, contentWidth);
      pdf.text(recommendationLines, margin, yPos);

      // Save PDF
      pdf.save(`Compliance-Report-${reportData.projectName.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`);

      toast({
        title: "Compliance Report Generated",
        description: "Regulatory compliance report has been created and downloaded"
      });

    } catch (error) {
      console.error('Compliance report generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: "Could not generate compliance report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: ComplianceItem['status']) => {
    const colors = {
      'compliant': 'bg-green-100 text-green-800',
      'partial': 'bg-yellow-100 text-yellow-800',
      'non-compliant': 'bg-red-100 text-red-800',
      'not-applicable': 'bg-gray-100 text-gray-800'
    };
    const icons = {
      'compliant': CheckCircle,
      'partial': AlertTriangle,
      'non-compliant': AlertTriangle,
      'not-applicable': Shield
    };
    const Icon = icons[status];
    return (
      <Badge className={`${colors[status]} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const updateComplianceItem = (id: string, updates: Partial<ComplianceItem>) => {
    setReportData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const addComplianceItem = () => {
    const newItem: ComplianceItem = {
      id: Date.now().toString(),
      category: 'Environmental',
      requirement: '',
      status: 'partial',
      evidence: '',
      notes: '',
      priority: 'medium'
    };
    setReportData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeComplianceItem = (id: string) => {
    setReportData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold">Compliance Report Generator</h2>
        <Badge variant="outline" className="bg-blue-100 text-blue-800">Regulatory Grade</Badge>
      </div>

      <div className="space-y-6">
        <div className="flex gap-3 mb-4">
          <Button onClick={loadSampleData} variant="outline" size="sm">
            Load Sample Data
          </Button>
          <Button
            onClick={generateComplianceReport}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Generate Compliance Report
              </>
            )}
          </Button>
        </div>

        {/* Report Header */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Building className="h-5 w-5" />
            Assessment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Organization Name"
              value={reportData.organizationName}
              onChange={(e) => setReportData(prev => ({ ...prev, organizationName: e.target.value }))}
            />
            <Input
              placeholder="Project Name"
              value={reportData.projectName}
              onChange={(e) => setReportData(prev => ({ ...prev, projectName: e.target.value }))}
            />
            <Input
              type="date"
              value={reportData.assessmentDate}
              onChange={(e) => setReportData(prev => ({ ...prev, assessmentDate: e.target.value }))}
            />
            <Input
              placeholder="Assessor Name"
              value={reportData.assessor}
              onChange={(e) => setReportData(prev => ({ ...prev, assessor: e.target.value }))}
            />
          </div>
          <Textarea
            placeholder="Regulatory Framework (applicable laws, regulations, standards)"
            value={reportData.regulatoryFramework}
            onChange={(e) => setReportData(prev => ({ ...prev, regulatoryFramework: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Compliance Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Compliance Assessment</h3>
            <Button onClick={addComplianceItem} size="sm" variant="outline">
              Add Requirement
            </Button>
          </div>
          
          {reportData.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <select
                  value={item.category}
                  onChange={(e) => updateComplianceItem(item.id, { category: e.target.value })}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="Environmental">Environmental</option>
                  <option value="Safety">Safety</option>
                  <option value="Social">Social</option>
                  <option value="Legal">Legal</option>
                  <option value="Financial">Financial</option>
                </select>
                {getStatusBadge(item.status)}
                <select
                  value={item.status}
                  onChange={(e) => updateComplianceItem(item.id, { status: e.target.value as ComplianceItem['status'] })}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="compliant">Compliant</option>
                  <option value="partial">Partial</option>
                  <option value="non-compliant">Non-Compliant</option>
                  <option value="not-applicable">Not Applicable</option>
                </select>
                <select
                  value={item.priority}
                  onChange={(e) => updateComplianceItem(item.id, { priority: e.target.value as ComplianceItem['priority'] })}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <Button
                  onClick={() => removeComplianceItem(item.id)}
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                >
                  Remove
                </Button>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Requirement Description"
                  value={item.requirement}
                  onChange={(e) => updateComplianceItem(item.id, { requirement: e.target.value })}
                />
                <Textarea
                  placeholder="Evidence / Documentation"
                  value={item.evidence}
                  onChange={(e) => updateComplianceItem(item.id, { evidence: e.target.value })}
                  rows={2}
                />
                <Textarea
                  placeholder="Additional Notes"
                  value={item.notes}
                  onChange={(e) => updateComplianceItem(item.id, { notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary and Recommendations */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Executive Summary</h3>
            <Textarea
              placeholder="Overall compliance assessment summary..."
              value={reportData.summary}
              onChange={(e) => setReportData(prev => ({ ...prev, summary: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Recommendations</h3>
            <Textarea
              placeholder="Recommendations for improvement and corrective actions..."
              value={reportData.recommendations}
              onChange={(e) => setReportData(prev => ({ ...prev, recommendations: e.target.value }))}
              rows={4}
            />
          </div>
        </div>

        {/* Compliance Statistics */}
        {reportData.items.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Compliance Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.items.filter(item => item.status === 'compliant').length}
                </div>
                <div className="text-sm text-gray-600">Compliant</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.items.filter(item => item.status === 'partial').length}
                </div>
                <div className="text-sm text-gray-600">Partial</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {reportData.items.filter(item => item.status === 'non-compliant').length}
                </div>
                <div className="text-sm text-gray-600">Non-Compliant</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((reportData.items.filter(item => item.status === 'compliant').length / reportData.items.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Compliance Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
