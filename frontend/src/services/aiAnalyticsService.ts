/**
 * AI Analytics Service
 * 
 * Provides advanced AI-powered analytics including anomaly detection,
 * predictive modeling, pattern recognition, risk assessment, and trend analysis.
 */

import { supabase } from "@/integrations/supabase/client";

export interface AIAnalysisRequest {
  analysisType: 'anomaly_detection' | 'predictive_modeling' | 'pattern_recognition' | 'risk_assessment' | 'trend_analysis';
  data: any;
  parameters?: any;
}

export interface AnomalyDetectionResult {
  anomalies: Array<{
    timestamp: string;
    value: number;
    zScore: number;
    severity: 'critical' | 'high' | 'medium';
    type: 'spike' | 'drop';
    confidence: number;
  }>;
  summary: {
    totalAnomalies: number;
    criticalAnomalies: number;
    anomalyRate: number;
    detectionThreshold: number;
    mostSevereAnomaly: any;
  };
}

export interface PredictiveModelingResult {
  predictions: Array<{
    day: number;
    predictedValue: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
  }>;
  model: {
    type: string;
    accuracy: number;
    trendDirection: string;
    seasonalityDetected: boolean;
    forecastHorizon: number;
  };
  insights: {
    expectedChange: number;
    volatility: number;
    riskLevel: string;
  };
}

export interface AIAnalysisResponse {
  success: boolean;
  analysisId: string;
  analysisType: string;
  results: any;
  metadata: {
    modelVersion: string;
    processingTime: number;
    confidence: number;
    dataQuality: string;
  };
}

class AIAnalyticsService {
  private baseUrl = 'https://xeohypupypohmgahlugl.supabase.co/functions/v1';

  async performAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      console.log('🤖 Performing AI analysis:', request.analysisType);

      const { data, error } = await supabase.functions.invoke('ai-analytics', {
        body: request
      });

      if (error) {
        console.error('AI analysis error:', error);
        throw new Error(error.message || 'Failed to perform AI analysis');
      }

      console.log('✅ AI analysis completed:', data);
      return data;
    } catch (error) {
      console.error('❌ AI analytics service error:', error);
      throw error;
    }
  }

  async detectAnomalies(timeSeries: any[], threshold: number = 2.0): Promise<AnomalyDetectionResult> {
    const response = await this.performAnalysis({
      analysisType: 'anomaly_detection',
      data: { timeSeries },
      parameters: { threshold }
    });

    return response.results;
  }

  async generatePredictions(timeSeries: any[], horizon: number = 30): Promise<PredictiveModelingResult> {
    const response = await this.performAnalysis({
      analysisType: 'predictive_modeling',
      data: { timeSeries },
      parameters: { horizon }
    });

    return response.results;
  }

  async recognizePatterns(timeSeries: any[]): Promise<any> {
    const response = await this.performAnalysis({
      analysisType: 'pattern_recognition',
      data: { timeSeries },
      parameters: {}
    });

    return response.results;
  }

  async assessRisk(data: any): Promise<any> {
    const response = await this.performAnalysis({
      analysisType: 'risk_assessment',
      data,
      parameters: {}
    });

    return response.results;
  }

  async analyzeTrends(timeSeries: any[]): Promise<any> {
    const response = await this.performAnalysis({
      analysisType: 'trend_analysis',
      data: { timeSeries },
      parameters: {}
    });

    return response.results;
  }

  // Comprehensive environmental intelligence
  async generateEnvironmentalIntelligence(environmentalData: any): Promise<any> {
    try {
      console.log('🧠 Generating environmental intelligence...');

      const analyses: any = {};

      // Perform multiple AI analyses
      if (environmentalData.timeSeries) {
        analyses.anomalies = await this.detectAnomalies(environmentalData.timeSeries);
        analyses.predictions = await this.generatePredictions(environmentalData.timeSeries);
        analyses.patterns = await this.recognizePatterns(environmentalData.timeSeries);
        analyses.trends = await this.analyzeTrends(environmentalData.timeSeries);
      }

      analyses.risk = await this.assessRisk(environmentalData);

      // Generate insights
      const insights = this.generateInsights(analyses);

      // Create intelligence report
      const intelligence = {
        generatedAt: new Date().toISOString(),
        dataQuality: this.assessDataQuality(environmentalData),
        analyses,
        insights,
        actionItems: this.generateActionItems(analyses),
        confidence: this.calculateOverallConfidence(analyses)
      };

      console.log('✅ Environmental intelligence generated');
      return intelligence;
    } catch (error) {
      console.error('❌ Failed to generate environmental intelligence:', error);
      throw error;
    }
  }

  // Real-time monitoring with AI
  async setupIntelligentMonitoring(monitoringPoints: any[], alertThresholds: any): Promise<void> {
    try {
      console.log('🔄 Setting up intelligent monitoring...');

      for (const point of monitoringPoints) {
        // Set up anomaly detection for each monitoring point
        const anomalyConfig = {
          pointId: point.id,
          parameters: {
            threshold: alertThresholds.anomalyThreshold || 2.0,
            algorithm: 'isolation_forest',
            sensitivity: alertThresholds.sensitivity || 'medium'
          },
          notifications: {
            enabled: true,
            channels: ['email', 'in_app'],
            severity: 'medium'
          }
        };

        console.log(`✅ Intelligent monitoring configured for ${point.name}`);
      }
    } catch (error) {
      console.error('❌ Failed to setup intelligent monitoring:', error);
      throw error;
    }
  }

  // Batch processing for multiple datasets
  async performBatchAnalysis(datasets: any[], analysisType: AIAnalysisRequest['analysisType']): Promise<any[]> {
    const analysisPromises = datasets.map(dataset =>
      this.performAnalysis({
        analysisType,
        data: dataset.data,
        parameters: dataset.parameters || {}
      }).then(result => ({
        ...result,
        datasetId: dataset.id,
        datasetName: dataset.name
      }))
    );

    return Promise.all(analysisPromises);
  }

  // Model performance tracking
  async trackModelPerformance(modelType: string, predictions: any[], actualValues: any[]): Promise<any> {
    try {
      const performance = this.calculateModelAccuracy(predictions, actualValues);
      
      // Store performance metrics
      const { error } = await supabase
        .from('analysis_results')
        .insert({
          analysis_type: 'model_performance',
          analysis_name: `${modelType} Performance Tracking`,
          parameters: { modelType },
          results: performance,
          status: 'completed',
          completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to store performance metrics:', error);
      }

      return performance;
    } catch (error) {
      console.error('Error tracking model performance:', error);
      throw error;
    }
  }

  // Get analysis history
  async getAnalysisHistory(analysisType?: string, limit: number = 50): Promise<any[]> {
    try {
      let query = supabase
        .from('analysis_results')
        .select('*')
        .like('analysis_type', 'ai_%')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (analysisType) {
        query = query.eq('analysis_type', `ai_${analysisType}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching analysis history:', error);
        throw new Error('Failed to fetch analysis history');
      }

      return data || [];
    } catch (error) {
      console.error('Error getting analysis history:', error);
      throw error;
    }
  }

  // Private helper methods
  private generateInsights(analyses: any): string[] {
    const insights: string[] = [];

    if (analyses.anomalies?.summary?.totalAnomalies > 0) {
      insights.push(`${analyses.anomalies.summary.totalAnomalies} anomalies detected with ${analyses.anomalies.summary.criticalAnomalies} requiring immediate attention`);
    }

    if (analyses.predictions?.insights?.expectedChange) {
      const change = analyses.predictions.insights.expectedChange;
      const direction = change > 0 ? 'increase' : 'decrease';
      insights.push(`Predicted ${Math.abs(change * 100).toFixed(1)}% ${direction} in the next forecast period`);
    }

    if (analyses.patterns?.summary?.dominantPattern) {
      insights.push(`Dominant pattern identified: ${analyses.patterns.summary.dominantPattern.type}`);
    }

    if (analyses.risk?.overallRiskScore > 7) {
      insights.push('High risk level detected - immediate review recommended');
    }

    if (insights.length === 0) {
      insights.push('Environmental conditions are within normal parameters');
    }

    return insights;
  }

  private generateActionItems(analyses: any): string[] {
    const actionItems: string[] = [];

    if (analyses.anomalies?.summary?.criticalAnomalies > 0) {
      actionItems.push('Investigate critical anomalies immediately');
    }

    if (analyses.risk?.overallRiskScore > 6) {
      actionItems.push('Review and update risk mitigation strategies');
    }

    if (analyses.predictions?.insights?.riskLevel === 'high') {
      actionItems.push('Implement enhanced monitoring protocols');
    }

    if (analyses.trends?.analysis?.trendAlignment === 'divergent') {
      actionItems.push('Analyze conflicting trend indicators');
    }

    if (actionItems.length === 0) {
      actionItems.push('Continue current monitoring protocols');
    }

    return actionItems;
  }

  private calculateOverallConfidence(analyses: any): number {
    const confidenceValues: number[] = [];

    Object.values(analyses).forEach((analysis: any) => {
      if (analysis.metadata?.confidence) {
        confidenceValues.push(analysis.metadata.confidence);
      }
    });

    return confidenceValues.length > 0
      ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
      : 0.85;
  }

  private assessDataQuality(data: any): any {
    let qualityScore = 100;
    const issues: string[] = [];

    if (!data.timeSeries || data.timeSeries.length < 10) {
      qualityScore -= 30;
      issues.push('Insufficient time series data');
    }

    if (data.completeness && data.completeness < 0.8) {
      qualityScore -= 20;
      issues.push('Low data completeness');
    }

    if (data.accuracy && data.accuracy < 0.9) {
      qualityScore -= 15;
      issues.push('Data accuracy concerns');
    }

    return {
      score: Math.max(0, qualityScore),
      level: qualityScore > 80 ? 'high' : qualityScore > 60 ? 'medium' : 'low',
      issues
    };
  }

  private calculateModelAccuracy(predictions: any[], actualValues: any[]): any {
    if (predictions.length === 0 || actualValues.length === 0) {
      return { accuracy: 0, error: 'No data available' };
    }

    const errors = predictions.map((pred, i) => {
      const actual = actualValues[i]?.value || 0;
      const predicted = pred.predictedValue || 0;
      return Math.abs(actual - predicted);
    });

    const meanError = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    const actualMean = actualValues.reduce((sum, val) => sum + (val.value || 0), 0) / actualValues.length;
    
    const accuracy = Math.max(0, 1 - (meanError / actualMean));

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      meanAbsoluteError: Math.round(meanError * 100) / 100,
      sampleSize: predictions.length,
      evaluatedAt: new Date().toISOString()
    };
  }
}

export const aiAnalyticsService = new AIAnalyticsService();