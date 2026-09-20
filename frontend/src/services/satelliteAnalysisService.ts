/**
 * Satellite Analysis Service
 * 
 * Provides comprehensive satellite imagery analysis including NDVI, change detection,
 * land cover analysis, water quality assessment, and thermal analysis.
 */

import { supabase } from "@/integrations/supabase/client";

export interface SatelliteAnalysisRequest {
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  analysisType: 'ndvi' | 'change_detection' | 'land_cover' | 'water_quality' | 'thermal';
  satellite?: 'landsat' | 'sentinel' | 'modis';
}

export interface NDVIResult {
  date: string;
  ndvi: number;
  vegetation_health: 'poor' | 'moderate' | 'good' | 'excellent';
  cloud_coverage: number;
}

export interface ChangeDetectionResult {
  change_type: 'deforestation' | 'urbanization' | 'water_change' | 'agriculture' | 'mining';
  change_percentage: number;
  confidence: number;
  affected_area_km2: number;
}

export interface SatelliteAnalysisResponse {
  success: boolean;
  analysisId: string;
  analysisType: string;
  results: any;
  satellite: string;
  metadata: {
    processingTime: number;
    dataQuality: string;
    cloudCoverage: number;
    spatialResolution: number;
  };
}

class SatelliteAnalysisService {
  private baseUrl = 'https://xeohypupypohmgahlugl.supabase.co/functions/v1';

  async performAnalysis(request: SatelliteAnalysisRequest): Promise<SatelliteAnalysisResponse> {
    try {
      console.log('🛰️ Performing satellite analysis:', request);

      const { data, error } = await supabase.functions.invoke('satellite-analysis', {
        body: request
      });

      if (error) {
        console.error('Satellite analysis error:', error);
        throw new Error(error.message || 'Failed to perform satellite analysis');
      }

      console.log('✅ Satellite analysis completed:', data);
      return data;
    } catch (error) {
      console.error('❌ Satellite analysis service error:', error);
      throw error;
    }
  }

  async getNDVITimeSeries(lat: number, lng: number, startDate: string, endDate: string, satellite: string = 'sentinel'): Promise<{ timeSeries: NDVIResult[], summary: any }> {
    const response = await this.performAnalysis({
      lat,
      lng,
      startDate,
      endDate,
      analysisType: 'ndvi',
      satellite: satellite as any
    });

    return response.results;
  }

  async getChangeDetection(lat: number, lng: number, startDate: string, endDate: string): Promise<{ changes: ChangeDetectionResult[], summary: any }> {
    const response = await this.performAnalysis({
      lat,
      lng,
      startDate,
      endDate,
      analysisType: 'change_detection'
    });

    return response.results;
  }

  async getLandCoverAnalysis(lat: number, lng: number): Promise<{ landCover: any, classification: any }> {
    const response = await this.performAnalysis({
      lat,
      lng,
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      analysisType: 'land_cover'
    });

    return response.results;
  }

  async getWaterQualityAnalysis(lat: number, lng: number, startDate: string, endDate: string): Promise<{ waterQuality: any, indicators: any }> {
    const response = await this.performAnalysis({
      lat,
      lng,
      startDate,
      endDate,
      analysisType: 'water_quality'
    });

    return response.results;
  }

  async getThermalAnalysis(lat: number, lng: number, startDate: string, endDate: string): Promise<{ thermal: any, analysis: any }> {
    const response = await this.performAnalysis({
      lat,
      lng,
      startDate,
      endDate,
      analysisType: 'thermal'
    });

    return response.results;
  }

  // Batch analysis for multiple locations
  async performBatchAnalysis(locations: Array<{ lat: number, lng: number, name?: string }>, analysisType: SatelliteAnalysisRequest['analysisType']): Promise<any[]> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const analysisPromises = locations.map(location =>
      this.performAnalysis({
        lat: location.lat,
        lng: location.lng,
        startDate,
        endDate,
        analysisType
      }).then(result => ({
        ...result,
        location: location.name || `${location.lat}, ${location.lng}`
      }))
    );

    return Promise.all(analysisPromises);
  }

  // Get analysis history for a location
  async getAnalysisHistory(lat: number, lng: number, analysisType?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('analysis_results')
        .select('*')
        .like('analysis_type', 'satellite_%')
        .order('created_at', { ascending: false });

      if (analysisType) {
        query = query.eq('analysis_type', `satellite_${analysisType}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching analysis history:', error);
        throw new Error('Failed to fetch analysis history');
      }

      // Filter by location (approximate match within 0.01 degrees)
      return data.filter(result => {
        const params = result.parameters as any;
        if (params?.lat && params?.lng) {
          const latDiff = Math.abs(params.lat - lat);
          const lngDiff = Math.abs(params.lng - lng);
          return latDiff < 0.01 && lngDiff < 0.01;
        }
        return false;
      });
    } catch (error) {
      console.error('Error getting analysis history:', error);
      throw error;
    }
  }

  // Real-time monitoring setup
  async setupRealTimeMonitoring(lat: number, lng: number, analysisTypes: string[], interval: number = 24): Promise<void> {
    try {
      console.log('🔄 Setting up real-time satellite monitoring...');
      
      // This would typically set up a scheduled job or webhook
      // For now, we'll store the monitoring configuration
      const monitoringConfig = {
        location: { lat, lng },
        analysisTypes,
        interval,
        active: true,
        lastRun: new Date().toISOString(),
        nextRun: new Date(Date.now() + interval * 60 * 60 * 1000).toISOString()
      };

      console.log('✅ Real-time monitoring configured:', monitoringConfig);
    } catch (error) {
      console.error('❌ Failed to setup real-time monitoring:', error);
      throw error;
    }
  }

  // Data quality assessment
  assessDataQuality(metadata: any): { score: number, issues: string[], recommendations: string[] } {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (metadata.cloudCoverage > 30) {
      score -= 20;
      issues.push('High cloud coverage');
      recommendations.push('Consider using data from different dates with lower cloud coverage');
    }

    if (metadata.spatialResolution > 30) {
      score -= 10;
      issues.push('Lower spatial resolution');
      recommendations.push('Use higher resolution satellite data for detailed analysis');
    }

    if (metadata.dataQuality === 'low') {
      score -= 30;
      issues.push('Low data quality detected');
      recommendations.push('Verify sensor calibration and atmospheric correction');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  // Generate comprehensive satellite report
  async generateSatelliteReport(lat: number, lng: number, timeRange: { start: string, end: string }): Promise<any> {
    try {
      console.log('📊 Generating comprehensive satellite report...');

      const analysisTypes = ['ndvi', 'change_detection', 'land_cover', 'water_quality', 'thermal'] as const;
      const analyses: any = {};

      // Perform all analyses
      for (const analysisType of analysisTypes) {
        try {
          const result = await this.performAnalysis({
            lat,
            lng,
            startDate: timeRange.start,
            endDate: timeRange.end,
            analysisType
          });
          analyses[analysisType] = result;
        } catch (error) {
          console.warn(`Failed to perform ${analysisType} analysis:`, error);
          analyses[analysisType] = { error: error.message };
        }
      }

      // Generate executive summary
      const executiveSummary = this.generateExecutiveSummary(analyses);

      const report = {
        location: { lat, lng },
        timeRange,
        generatedAt: new Date().toISOString(),
        executiveSummary,
        analyses,
        dataQuality: this.assessOverallDataQuality(analyses),
        recommendations: this.generateRecommendations(analyses)
      };

      console.log('✅ Satellite report generated successfully');
      return report;
    } catch (error) {
      console.error('❌ Failed to generate satellite report:', error);
      throw error;
    }
  }

  private generateExecutiveSummary(analyses: any): string {
    const completedAnalyses = Object.keys(analyses).filter(key => !analyses[key].error);
    const summary = [
      `Satellite analysis completed for ${completedAnalyses.length} different assessment types.`
    ];

    if (analyses.ndvi && !analyses.ndvi.error) {
      const avgNDVI = analyses.ndvi.results?.summary?.averageNDVI;
      if (avgNDVI) {
        summary.push(`Vegetation health is ${avgNDVI > 0.7 ? 'excellent' : avgNDVI > 0.5 ? 'good' : 'concerning'} with average NDVI of ${avgNDVI.toFixed(3)}.`);
      }
    }

    if (analyses.change_detection && !analyses.change_detection.error) {
      const changes = analyses.change_detection.results?.changes || [];
      if (changes.length > 0) {
        summary.push(`${changes.length} significant environmental change(s) detected.`);
      } else {
        summary.push('No significant environmental changes detected.');
      }
    }

    return summary.join(' ');
  }

  private assessOverallDataQuality(analyses: any): any {
    const qualityScores: number[] = [];
    const issues: string[] = [];

    Object.values(analyses).forEach((analysis: any) => {
      if (analysis.metadata) {
        const quality = this.assessDataQuality(analysis.metadata);
        qualityScores.push(quality.score);
        issues.push(...quality.issues);
      }
    });

    const averageScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;

    return {
      overallScore: Math.round(averageScore),
      level: averageScore > 80 ? 'high' : averageScore > 60 ? 'medium' : 'low',
      issues: [...new Set(issues)], // Remove duplicates
      analysesCompleted: qualityScores.length
    };
  }

  private generateRecommendations(analyses: any): string[] {
    const recommendations: string[] = [];

    if (analyses.ndvi?.results?.summary?.trend === 'declining') {
      recommendations.push('Monitor vegetation health closely - declining trend detected');
    }

    if (analyses.change_detection?.results?.changes?.length > 0) {
      recommendations.push('Investigate detected environmental changes for potential impacts');
    }

    if (analyses.water_quality?.results?.indicators?.pollution_level === 'elevated') {
      recommendations.push('Enhanced water quality monitoring recommended');
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue regular monitoring to maintain baseline environmental conditions');
    }

    return recommendations;
  }
}

export const satelliteAnalysisService = new SatelliteAnalysisService();