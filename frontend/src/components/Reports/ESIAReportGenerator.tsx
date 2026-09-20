
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, AlertTriangle, Leaf, Users, Factory } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface ESIAData {
  projectTitle: string;
  projectLocation: string;
  projectDescription: string;
  environmentalImpacts: {
    airQuality: { impact: string; mitigation: string; severity: 'low' | 'medium' | 'high' };
    waterQuality: { impact: string; mitigation: string; severity: 'low' | 'medium' | 'high' };
    soilQuality: { impact: string; mitigation: string; severity: 'low' | 'medium' | 'high' };
    biodiversity: { impact: string; mitigation: string; severity: 'low' | 'medium' | 'high' };
  };
  socialImpacts: {
    community: { impact: string; mitigation: string; severity: 'low' | 'medium' | 'high' };
    employment: { impact: string; mitigation: string; severity: 'low' | 'medium' | 'high' };
    infrastructure: { impact: string; mitigation: string; severity: 'low' | 'medium' | 'high' };
  };
  monitoringPlan: string;
  conclusions: string;
}

export const ESIAReportGenerator: React.FC = () => {
  const [reportData, setReportData] = useState<ESIAData>({
    projectTitle: '',
    projectLocation: '',
    projectDescription: '',
    environmentalImpacts: {
      airQuality: { impact: '', mitigation: '', severity: 'medium' },
      waterQuality: { impact: '', mitigation: '', severity: 'medium' },
      soilQuality: { impact: '', mitigation: '', severity: 'medium' },
      biodiversity: { impact: '', mitigation: '', severity: 'medium' }
    },
    socialImpacts: {
      community: { impact: '', mitigation: '', severity: 'medium' },
      employment: { impact: '', mitigation: '', severity: 'medium' },
      infrastructure: { impact: '', mitigation: '', severity: 'medium' }
    },
    monitoringPlan: '',
    conclusions: ''
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const loadSampleData = () => {
    setReportData({
      projectTitle: 'Coastal Mining Operation Environmental Assessment',
      projectLocation: 'Northern Sierra Leone, Coastal Region',
      projectDescription: 'Large-scale mineral extraction project covering 2,500 hectares of coastal area with planned operations for 15 years. The project involves open-pit mining, processing facilities, and supporting infrastructure including access roads and port facilities.',
      environmentalImpacts: {
        airQuality: {
          impact: 'Dust emissions from mining operations and vehicle traffic may increase PM10 and PM2.5 concentrations by 15-25% above baseline levels in a 5km radius.',
          mitigation: 'Implementation of water spraying systems, covered conveyors, regular vehicle maintenance, and establishment of green belts around operations.',
          severity: 'medium'
        },
        waterQuality: {
          impact: 'Potential contamination of groundwater and surface water from acid mine drainage, heavy metals leaching, and sediment runoff affecting local water bodies.',
          mitigation: 'Installation of lined settling ponds, water treatment systems, continuous monitoring, and implementation of best practices for waste management.',
          severity: 'high'
        },
        soilQuality: {
          impact: 'Soil contamination from heavy metals and chemicals, topsoil removal, and potential erosion affecting agricultural lands within 2km of operations.',
          mitigation: 'Topsoil preservation and storage, soil remediation programs, controlled chemical usage, and progressive rehabilitation of disturbed areas.',
          severity: 'high'
        },
        biodiversity: {
          impact: 'Habitat loss affecting 15 species of concern including migratory birds, displacement of local wildlife, and fragmentation of coastal ecosystems.',
          mitigation: 'Creation of wildlife corridors, species relocation programs, establishment of protected areas, and biodiversity offset programs.',
          severity: 'high'
        }
      },
      socialImpacts: {
        community: {
          impact: 'Displacement of 3 villages (approx. 1,200 people), disruption of traditional fishing activities, and changes to local cultural practices.',
          mitigation: 'Comprehensive resettlement program, community engagement initiatives, cultural preservation programs, and alternative livelihood support.',
          severity: 'high'
        },
        employment: {
          impact: 'Creation of 800 direct jobs and 2,000 indirect jobs, but potential loss of traditional employment in fishing and agriculture sectors.',
          mitigation: 'Local hiring preferences, skills development programs, support for affected traditional industries, and establishment of community development fund.',
          severity: 'medium'
        },
        infrastructure: {
          impact: 'Increased traffic on local roads, pressure on utilities and services, and need for upgraded port facilities affecting local communities.',
          mitigation: 'Road improvements, infrastructure upgrades, utility system enhancements, and revenue sharing with local authorities.',
          severity: 'medium'
        }
      },
      monitoringPlan: 'Quarterly environmental monitoring including air quality, water quality, soil conditions, and biodiversity assessments. Monthly social impact monitoring through community liaisons. Annual independent audits and public reporting. Establishment of grievance mechanisms and adaptive management protocols.',
      conclusions: 'The project presents significant environmental and social impacts that can be effectively managed through comprehensive mitigation measures. Successful implementation requires strict adherence to monitoring protocols, community engagement, and adaptive management practices. The project can contribute to national development while maintaining environmental and social standards through proper oversight and implementation of recommended measures.'
    });

    toast({
      title: "Sample Data Loaded",
      description: "ESIA report populated with realistic project data"
    });
  };

  const generateESIAReport = async () => {
    if (!reportData.projectTitle || !reportData.projectLocation) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least project title and location",
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
      pdf.text('Environmental & Social Impact Assessment', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 20;
      pdf.setFontSize(18);
      pdf.text(reportData.projectTitle, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Location: ${reportData.projectLocation}`, pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });

      // Add new page for content
      pdf.addPage();
      yPos = 20;

      // Project Description
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. PROJECT DESCRIPTION', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(reportData.projectDescription, contentWidth);
      pdf.text(descLines, margin, yPos);
      yPos += descLines.length * 5 + 10;

      // Environmental Impacts
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. ENVIRONMENTAL IMPACTS', margin, yPos);
      yPos += 15;

      const envImpacts = [
        { title: 'Air Quality', data: reportData.environmentalImpacts.airQuality },
        { title: 'Water Quality', data: reportData.environmentalImpacts.waterQuality },
        { title: 'Soil Quality', data: reportData.environmentalImpacts.soilQuality },
        { title: 'Biodiversity', data: reportData.environmentalImpacts.biodiversity }
      ];

      envImpacts.forEach(({ title, data }) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`2.${envImpacts.indexOf({ title, data }) + 1} ${title}`, margin, yPos);
        yPos += 8;

        // Severity badge
        const severityColor = data.severity === 'high' ? [220, 53, 69] : 
                             data.severity === 'medium' ? [255, 193, 7] : [40, 167, 69];
        pdf.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
        pdf.rect(margin, yPos - 5, 20, 6, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text(data.severity.toUpperCase(), margin + 2, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Impact:', margin, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const impactLines = pdf.splitTextToSize(data.impact, contentWidth);
        pdf.text(impactLines, margin, yPos);
        yPos += impactLines.length * 4 + 5;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Mitigation:', margin, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const mitigationLines = pdf.splitTextToSize(data.mitigation, contentWidth);
        pdf.text(mitigationLines, margin, yPos);
        yPos += mitigationLines.length * 4 + 10;
      });

      // Social Impacts
      if (yPos > 200) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. SOCIAL IMPACTS', margin, yPos);
      yPos += 15;

      const socialImpacts = [
        { title: 'Community Impact', data: reportData.socialImpacts.community },
        { title: 'Employment Impact', data: reportData.socialImpacts.employment },
        { title: 'Infrastructure Impact', data: reportData.socialImpacts.infrastructure }
      ];

      socialImpacts.forEach(({ title, data }) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`3.${socialImpacts.indexOf({ title, data }) + 1} ${title}`, margin, yPos);
        yPos += 8;

        const severityColor = data.severity === 'high' ? [220, 53, 69] : 
                             data.severity === 'medium' ? [255, 193, 7] : [40, 167, 69];
        pdf.setFillColor(severityColor[0], severityColor[1], severityColor[2]);
        pdf.rect(margin, yPos - 5, 20, 6, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text(data.severity.toUpperCase(), margin + 2, yPos);
        pdf.setTextColor(0, 0, 0);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Impact:', margin, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const impactLines = pdf.splitTextToSize(data.impact, contentWidth);
        pdf.text(impactLines, margin, yPos);
        yPos += impactLines.length * 4 + 5;

        pdf.setFont('helvetica', 'bold');
        pdf.text('Mitigation:', margin, yPos);
        yPos += 5;
        pdf.setFont('helvetica', 'normal');
        const mitigationLines = pdf.splitTextToSize(data.mitigation, contentWidth);
        pdf.text(mitigationLines, margin, yPos);
        yPos += mitigationLines.length * 4 + 10;
      });

      // Monitoring Plan
      if (yPos > 200) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('4. MONITORING PLAN', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const monitoringLines = pdf.splitTextToSize(reportData.monitoringPlan, contentWidth);
      pdf.text(monitoringLines, margin, yPos);
      yPos += monitoringLines.length * 5 + 15;

      // Conclusions
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('5. CONCLUSIONS & RECOMMENDATIONS', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const conclusionLines = pdf.splitTextToSize(reportData.conclusions, contentWidth);
      pdf.text(conclusionLines, margin, yPos);

      // Save PDF
      pdf.save(`ESIA-Report-${reportData.projectTitle.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`);

      toast({
        title: "ESIA Report Generated",
        description: "Environmental & Social Impact Assessment report has been created and downloaded"
      });

    } catch (error) {
      console.error('ESIA report generation error:', error);
      toast({
        title: "Report Generation Failed",
        description: "Could not generate ESIA report",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[severity]}>{severity.toUpperCase()}</Badge>;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-semibold">ESIA Report Generator</h2>
        <Badge variant="outline" className="bg-green-100 text-green-800">Professional Grade</Badge>
      </div>

      <div className="space-y-6">
        <div className="flex gap-3 mb-4">
          <Button onClick={loadSampleData} variant="outline" size="sm">
            Load Sample Data
          </Button>
          <Button
            onClick={generateESIAReport}
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
                Generate ESIA Report
              </>
            )}
          </Button>
        </div>

        {/* Project Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Project Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Project Title"
              value={reportData.projectTitle}
              onChange={(e) => setReportData(prev => ({ ...prev, projectTitle: e.target.value }))}
            />
            <Input
              placeholder="Project Location"
              value={reportData.projectLocation}
              onChange={(e) => setReportData(prev => ({ ...prev, projectLocation: e.target.value }))}
            />
          </div>
          <Textarea
            placeholder="Project Description"
            value={reportData.projectDescription}
            onChange={(e) => setReportData(prev => ({ ...prev, projectDescription: e.target.value }))}
            rows={3}
          />
        </div>

        {/* Environmental Impacts */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            Environmental Impacts
          </h3>
          {Object.entries(reportData.environmentalImpacts).map(([key, data]) => (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                {getSeverityBadge(data.severity)}
                <select
                  value={data.severity}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    environmentalImpacts: {
                      ...prev.environmentalImpacts,
                      [key]: { ...data, severity: e.target.value as 'low' | 'medium' | 'high' }
                    }
                  }))}
                  className="ml-auto px-2 py-1 border rounded text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-3">
                <Textarea
                  placeholder="Impact Description"
                  value={data.impact}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    environmentalImpacts: {
                      ...prev.environmentalImpacts,
                      [key]: { ...data, impact: e.target.value }
                    }
                  }))}
                  rows={2}
                />
                <Textarea
                  placeholder="Mitigation Measures"
                  value={data.mitigation}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    environmentalImpacts: {
                      ...prev.environmentalImpacts,
                      [key]: { ...data, mitigation: e.target.value }
                    }
                  }))}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Social Impacts */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Impacts
          </h3>
          {Object.entries(reportData.socialImpacts).map(([key, data]) => (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium capitalize">{key} Impact</h4>
                {getSeverityBadge(data.severity)}
                <select
                  value={data.severity}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    socialImpacts: {
                      ...prev.socialImpacts,
                      [key]: { ...data, severity: e.target.value as 'low' | 'medium' | 'high' }
                    }
                  }))}
                  className="ml-auto px-2 py-1 border rounded text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-3">
                <Textarea
                  placeholder="Impact Description"
                  value={data.impact}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    socialImpacts: {
                      ...prev.socialImpacts,
                      [key]: { ...data, impact: e.target.value }
                    }
                  }))}
                  rows={2}
                />
                <Textarea
                  placeholder="Mitigation Measures"
                  value={data.mitigation}
                  onChange={(e) => setReportData(prev => ({
                    ...prev,
                    socialImpacts: {
                      ...prev.socialImpacts,
                      [key]: { ...data, mitigation: e.target.value }
                    }
                  }))}
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Monitoring Plan & Conclusions */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Monitoring Plan</h3>
            <Textarea
              placeholder="Describe monitoring and management plans..."
              value={reportData.monitoringPlan}
              onChange={(e) => setReportData(prev => ({ ...prev, monitoringPlan: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Conclusions & Recommendations</h3>
            <Textarea
              placeholder="Summary conclusions and recommendations..."
              value={reportData.conclusions}
              onChange={(e) => setReportData(prev => ({ ...prev, conclusions: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
