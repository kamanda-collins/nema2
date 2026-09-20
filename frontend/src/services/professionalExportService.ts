/**
 * Professional Export Service
 * 
 * Provides high-quality export capabilities for maps, reports, data, and analysis results
 * in various professional formats suitable for presentations, compliance, and archival.
 */

import { supabase } from "@/integrations/supabase/client";

export interface ExportRequest {
  type: 'map' | 'report' | 'data' | 'analysis';
  format: 'pdf' | 'png' | 'jpeg' | 'geotiff' | 'shapefile' | 'kml' | 'csv' | 'excel' | 'geojson';
  data: any;
  options?: {
    dpi?: number;
    quality?: 'draft' | 'standard' | 'high' | 'publication';
    template?: string;
    includeMetadata?: boolean;
    watermark?: boolean;
    customStyling?: any;
    title?: string;
    subtitle?: string;
    organization?: string;
    author?: string;
  };
}

export interface ExportResponse {
  success: boolean;
  exportId: string;
  downloadUrl: string;
  fileSize: number;
  format: string;
  exportTime: number;
  metadata: any;
}

class ProfessionalExportService {
  private baseUrl = 'https://xeohypupypohmgahlugl.supabase.co/functions/v1';

  async exportMap(mapData: any, format: ExportRequest['format'], options: any = {}): Promise<ExportResponse> {
    return this.performExport({
      type: 'map',
      format,
      data: mapData,
      options: {
        dpi: 300,
        quality: 'high',
        ...options
      }
    });
  }

  async exportReport(reportData: any, format: ExportRequest['format'] = 'pdf', options: any = {}): Promise<ExportResponse> {
    return this.performExport({
      type: 'report',
      format,
      data: reportData,
      options: {
        template: 'professional',
        includeMetadata: true,
        ...options
      }
    });
  }

  async exportData(data: any, format: ExportRequest['format'], options: any = {}): Promise<ExportResponse> {
    return this.performExport({
      type: 'data',
      format,
      data,
      options: {
        includeMetadata: true,
        compression: 'standard',
        ...options
      }
    });
  }

  async exportAnalysis(analysisData: any, format: ExportRequest['format'] = 'pdf', options: any = {}): Promise<ExportResponse> {
    return this.performExport({
      type: 'analysis',
      format,
      data: analysisData,
      options: {
        quality: 'publication',
        includeMetadata: true,
        ...options
      }
    });
  }

  private async performExport(request: ExportRequest): Promise<ExportResponse> {
    try {
      console.log('📄 Starting export:', request.type, request.format);

      const { data, error } = await supabase.functions.invoke('professional-export', {
        body: request
      });

      if (error) {
        console.error('Export error:', error);
        throw new Error(error.message || 'Failed to export');
      }

      console.log('✅ Export completed:', data);
      return data;
    } catch (error) {
      console.error('❌ Export service error:', error);
      throw error;
    }
  }

  // Comprehensive environmental report generation
  async generateEnvironmentalReport(data: any, options: any = {}): Promise<ExportResponse> {
    const reportData = {
      title: options.title || 'Environmental Analysis Report',
      subtitle: options.subtitle || 'Comprehensive Environmental Assessment',
      generatedAt: new Date().toISOString(),
      organization: options.organization || 'GeoLabs Environmental Solutions',
      author: options.author || 'Environmental Analysis System',
      
      // Executive Summary
      executiveSummary: this.generateExecutiveSummary(data),
      
      // Key Findings
      keyFindings: this.extractKeyFindings(data),
      
      // Environmental Metrics
      environmentalMetrics: this.compileEnvironmentalMetrics(data),
      
      // Satellite Analysis Results
      satelliteAnalysis: data.satelliteData || null,
      
      // AI Analytics Results
      aiAnalytics: data.aiAnalytics || null,
      
      // Risk Assessment
      riskAssessment: this.generateRiskAssessment(data),
      
      // Recommendations
      recommendations: this.generateRecommendations(data),
      
      // Compliance Information
      compliance: this.generateComplianceSection(data),
      
      // Appendices
      appendices: this.generateAppendices(data)
    };

    return this.exportReport(reportData, 'pdf', {
      template: 'environmental_professional',
      quality: 'publication',
      includeMetadata: true,
      watermark: false,
      ...options
    });
  }

  // Batch export for multiple items
  async batchExport(exports: Array<{ data: any, format: ExportRequest['format'], filename?: string }>): Promise<ExportResponse[]> {
    const exportPromises = exports.map((exportItem, index) =>
      this.performExport({
        type: 'data',
        format: exportItem.format,
        data: exportItem.data,
        options: {
          title: exportItem.filename || `export_${index + 1}`,
          includeMetadata: true
        }
      })
    );

    return Promise.all(exportPromises);
  }

  // High-resolution map export with custom styling
  async exportHighResolutionMap(mapData: any, options: any = {}): Promise<ExportResponse> {
    const mapExportData = {
      layers: mapData.layers || [],
      extent: mapData.extent || [-180, -90, 180, 90],
      projection: mapData.projection || 'EPSG:4326',
      features: mapData.features || [],
      styling: {
        basemap: options.basemap || 'satellite',
        colorScheme: options.colorScheme || 'professional',
        annotations: options.annotations || true,
        legend: options.legend !== false,
        scalebar: options.scalebar !== false,
        northArrow: options.northArrow !== false
      },
      metadata: {
        title: options.title || 'Environmental Analysis Map',
        subtitle: options.subtitle,
        organization: options.organization,
        createdBy: options.author,
        createdAt: new Date().toISOString()
      }
    };

    return this.exportMap(mapExportData, 'png', {
      dpi: 300,
      quality: 'publication',
      customStyling: mapExportData.styling,
      ...options
    });
  }

  // GIS data export in multiple formats
  async exportGISData(spatialData: any, formats: ExportRequest['format'][] = ['shapefile', 'kml']): Promise<ExportResponse[]> {
    const gisData = {
      features: spatialData.features || [],
      crs: spatialData.crs || 'EPSG:4326',
      attributes: spatialData.attributes || {},
      metadata: {
        source: 'GeoLabs Environmental Platform',
        exportedAt: new Date().toISOString(),
        featureCount: spatialData.features?.length || 0
      }
    };

    const exportPromises = formats.map(format =>
      this.exportData(gisData, format, {
        includeMetadata: true
      })
    );

    return Promise.all(exportPromises);
  }

  // Time series data export with analysis
  async exportTimeSeriesData(timeSeriesData: any, options: any = {}): Promise<ExportResponse> {
    const exportData = {
      timeSeries: timeSeriesData.data || [],
      statistics: this.calculateTimeSeriesStatistics(timeSeriesData.data || []),
      analysis: {
        trend: timeSeriesData.trend || 'stable',
        seasonality: timeSeriesData.seasonality || false,
        anomalies: timeSeriesData.anomalies || [],
        quality: timeSeriesData.dataQuality || {}
      },
      metadata: {
        location: timeSeriesData.location,
        parameters: timeSeriesData.parameters,
        timeRange: timeSeriesData.timeRange,
        samplingRate: timeSeriesData.samplingRate,
        units: timeSeriesData.units,
        exportedAt: new Date().toISOString()
      }
    };

    return this.exportData(exportData, options.format || 'excel', {
      includeMetadata: true,
      multipleSheets: true,
      charts: true,
      ...options
    });
  }

  // Get export history
  async getExportHistory(limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('analysis_type', 'export')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching export history:', error);
        throw new Error('Failed to fetch export history');
      }

      return data || [];
    } catch (error) {
      console.error('Error getting export history:', error);
      throw error;
    }
  }

  // Helper methods for report generation
  private generateExecutiveSummary(data: any): string {
    const summaryPoints = [];
    
    if (data.environmentalMetrics) {
      summaryPoints.push(`Environmental assessment conducted across ${Object.keys(data.environmentalMetrics).length} key parameters.`);
    }
    
    if (data.timeRange) {
      summaryPoints.push(`Analysis period: ${data.timeRange.start} to ${data.timeRange.end}.`);
    }
    
    if (data.location) {
      summaryPoints.push(`Location: ${data.location.name || `${data.location.lat}, ${data.location.lng}`}.`);
    }
    
    if (data.alerts && data.alerts.length > 0) {
      summaryPoints.push(`${data.alerts.length} environmental alert(s) identified requiring attention.`);
    } else {
      summaryPoints.push('All environmental parameters within acceptable ranges.');
    }

    return summaryPoints.join(' ');
  }

  private extractKeyFindings(data: any): string[] {
    const findings = [];
    
    if (data.airQuality) {
      const aqi = data.airQuality.current || data.airQuality.average;
      findings.push(`Air Quality Index: ${aqi} (${this.getAQICategory(aqi)})`);
    }
    
    if (data.waterQuality) {
      findings.push(`Water quality parameters ${data.waterQuality.status || 'monitored'}`);
    }
    
    if (data.satelliteData?.ndvi) {
      findings.push(`Vegetation health indicator (NDVI): ${data.satelliteData.ndvi.average?.toFixed(3) || 'Analyzed'}`);
    }
    
    if (data.aiAnalytics?.anomalies?.length > 0) {
      findings.push(`${data.aiAnalytics.anomalies.length} anomalies detected through AI analysis`);
    }

    return findings.length > 0 ? findings : ['No significant environmental concerns identified'];
  }

  private compileEnvironmentalMetrics(data: any): any {
    return {
      airQuality: data.airQuality || {},
      waterQuality: data.waterQuality || {},
      soilConditions: data.soilConditions || {},
      climateMetrics: data.climateMetrics || {},
      biodiversityIndicators: data.biodiversityIndicators || {},
      pollutionLevels: data.pollutionLevels || {}
    };
  }

  private generateRiskAssessment(data: any): any {
    let riskLevel = 'low';
    const riskFactors = [];
    
    if (data.alerts && data.alerts.length > 0) {
      riskLevel = 'medium';
      riskFactors.push('Active environmental alerts');
    }
    
    if (data.aiAnalytics?.risk?.overallRiskScore > 7) {
      riskLevel = 'high';
      riskFactors.push('High AI-assessed risk score');
    }
    
    return {
      overallRiskLevel: riskLevel,
      riskFactors,
      mitigation: this.generateMitigationStrategies(riskFactors),
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  }

  private generateRecommendations(data: any): string[] {
    const recommendations = [];
    
    if (data.alerts && data.alerts.length > 0) {
      recommendations.push('Address active environmental alerts immediately');
    }
    
    if (data.dataQuality && data.dataQuality.score < 80) {
      recommendations.push('Improve data collection protocols for better analysis accuracy');
    }
    
    recommendations.push('Continue regular environmental monitoring');
    recommendations.push('Review and update monitoring thresholds quarterly');
    
    return recommendations;
  }

  private generateComplianceSection(data: any): any {
    return {
      standards: ['ISO 14001', 'EPA Guidelines', 'Local Environmental Regulations'],
      complianceStatus: 'Under Review',
      lastAudit: data.lastAudit || 'Not Available',
      nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      certifications: data.certifications || []
    };
  }

  private generateAppendices(data: any): any {
    return {
      rawDataSummary: `${data.recordCount || 'Multiple'} data points analyzed`,
      methodologyNotes: 'Advanced AI analytics combined with satellite imagery analysis',
      qualityAssurance: 'Automated quality checks and manual verification performed',
      glossary: {
        'NDVI': 'Normalized Difference Vegetation Index',
        'AQI': 'Air Quality Index',
        'PPM': 'Parts Per Million'
      }
    };
  }

  private calculateTimeSeriesStatistics(timeSeries: any[]): any {
    if (!timeSeries || timeSeries.length === 0) {
      return {};
    }

    const values = timeSeries.map(item => item.value || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      count: values.length,
      mean: Math.round(mean * 1000) / 1000,
      standardDeviation: Math.round(stdDev * 1000) / 1000,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      range: Math.max(...values) - Math.min(...values)
    };
  }

  private getAQICategory(aqi: number): string {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  }

  private generateMitigationStrategies(riskFactors: string[]): string[] {
    const strategies = [];
    
    riskFactors.forEach(factor => {
      if (factor.includes('alert')) {
        strategies.push('Implement immediate response protocols');
      }
      if (factor.includes('risk')) {
        strategies.push('Enhanced monitoring and early warning systems');
      }
    });
    
    if (strategies.length === 0) {
      strategies.push('Maintain current preventive measures');
    }
    
    return strategies;
  }
}

export const professionalExportService = new ProfessionalExportService();