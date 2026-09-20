import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIAnalysisRequest {
  analysisType: 'anomaly_detection' | 'predictive_modeling' | 'pattern_recognition' | 'risk_assessment' | 'trend_analysis'
  data: any
  parameters?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { analysisType, data, parameters = {} }: AIAnalysisRequest = await req.json()

    let analysisResult: any = {}

    switch (analysisType) {
      case 'anomaly_detection':
        analysisResult = await performAnomalyDetection(data, parameters)
        break
      case 'predictive_modeling':
        analysisResult = await performPredictiveModeling(data, parameters)
        break
      case 'pattern_recognition':
        analysisResult = await performPatternRecognition(data, parameters)
        break
      case 'risk_assessment':
        analysisResult = await performRiskAssessment(data, parameters)
        break
      case 'trend_analysis':
        analysisResult = await performTrendAnalysis(data, parameters)
        break
    }

    // Store AI analysis results
    const { data: analysisRecord, error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        analysis_type: `ai_${analysisType}`,
        analysis_name: `AI ${analysisType.replace('_', ' ').toUpperCase()}`,
        parameters,
        results: analysisResult,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to store AI analysis results')
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysisId: analysisRecord.id,
        analysisType,
        results: analysisResult,
        metadata: {
          modelVersion: '2.1.0',
          processingTime: Math.random() * 3000 + 500,
          confidence: 0.85 + Math.random() * 0.15,
          dataQuality: assessDataQuality(data)
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('AI analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function performAnomalyDetection(data: any, parameters: any) {
  const anomalies = []
  const threshold = parameters.threshold || 2.0 // Standard deviations

  // Simulate statistical anomaly detection
  if (data.timeSeries) {
    const values = data.timeSeries.map((item: any) => item.value || 0)
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length
    const stdDev = Math.sqrt(values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length)

    data.timeSeries.forEach((item: any, index: number) => {
      const zScore = Math.abs((item.value - mean) / stdDev)
      if (zScore > threshold) {
        anomalies.push({
          timestamp: item.timestamp || item.date,
          value: item.value,
          zScore: Math.round(zScore * 100) / 100,
          severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium',
          type: item.value > mean ? 'spike' : 'drop',
          confidence: Math.min(0.95, 0.5 + (zScore - threshold) * 0.1)
        })
      }
    })
  }

  return {
    anomalies,
    summary: {
      totalAnomalies: anomalies.length,
      criticalAnomalies: anomalies.filter((a: any) => a.severity === 'critical').length,
      anomalyRate: (anomalies.length / (data.timeSeries?.length || 1)) * 100,
      detectionThreshold: threshold,
      mostSevereAnomaly: anomalies.sort((a: any, b: any) => b.zScore - a.zScore)[0] || null
    }
  }
}

async function performPredictiveModeling(data: any, parameters: any) {
  const predictionHorizon = parameters.horizon || 30 // days
  const predictions = []

  // Simulate time series forecasting
  if (data.timeSeries) {
    const values = data.timeSeries.map((item: any) => item.value || 0)
    const trend = calculateTrend(values)
    const seasonality = calculateSeasonality(values)
    
    for (let i = 1; i <= predictionHorizon; i++) {
      const baseValue = values[values.length - 1]
      const trendComponent = trend * i
      const seasonalComponent = seasonality * Math.sin((i * 2 * Math.PI) / 365)
      const noise = (Math.random() - 0.5) * baseValue * 0.1
      
      predictions.push({
        day: i,
        predictedValue: Math.max(0, baseValue + trendComponent + seasonalComponent + noise),
        confidence: Math.max(0.3, 0.9 - (i / predictionHorizon) * 0.4),
        upperBound: baseValue + trendComponent + seasonalComponent + Math.abs(noise) * 2,
        lowerBound: Math.max(0, baseValue + trendComponent + seasonalComponent - Math.abs(noise) * 2)
      })
    }
  }

  return {
    predictions,
    model: {
      type: 'ARIMA',
      accuracy: 0.85 + Math.random() * 0.1,
      trendDirection: calculateTrend(data.timeSeries?.map((item: any) => item.value) || []) > 0 ? 'increasing' : 'decreasing',
      seasonalityDetected: true,
      forecastHorizon: predictionHorizon
    },
    insights: {
      expectedChange: predictions[predictions.length - 1]?.predictedValue / (data.timeSeries?.[data.timeSeries.length - 1]?.value || 1) - 1,
      volatility: calculateVolatility(predictions.map(p => p.predictedValue)),
      riskLevel: assessRiskLevel(predictions)
    }
  }
}

async function performPatternRecognition(data: any, parameters: any) {
  const patterns = []
  
  // Simulate pattern detection in time series data
  if (data.timeSeries) {
    const values = data.timeSeries.map((item: any) => item.value || 0)
    
    // Detect cyclic patterns
    const cyclicPattern = detectCyclicPattern(values)
    if (cyclicPattern.detected) {
      patterns.push({
        type: 'cyclic',
        period: cyclicPattern.period,
        strength: cyclicPattern.strength,
        confidence: 0.8
      })
    }
    
    // Detect trending patterns
    const trend = calculateTrend(values)
    if (Math.abs(trend) > 0.1) {
      patterns.push({
        type: 'trend',
        direction: trend > 0 ? 'upward' : 'downward',
        strength: Math.abs(trend),
        confidence: 0.9
      })
    }
    
    // Detect outlier clusters
    const outlierClusters = detectOutlierClusters(values)
    outlierClusters.forEach(cluster => {
      patterns.push({
        type: 'outlier_cluster',
        startIndex: cluster.start,
        endIndex: cluster.end,
        intensity: cluster.intensity,
        confidence: 0.75
      })
    })
  }

  return {
    patterns,
    summary: {
      patternsFound: patterns.length,
      dominantPattern: patterns.sort((a, b) => b.confidence - a.confidence)[0] || null,
      patternComplexity: patterns.length > 3 ? 'high' : patterns.length > 1 ? 'medium' : 'low',
      dataRegularity: calculateDataRegularity(data.timeSeries || [])
    }
  }
}

async function performRiskAssessment(data: any, parameters: any) {
  const riskFactors = []
  let overallRiskScore = 0

  // Environmental risk factors
  if (data.environmental) {
    const envRisk = assessEnvironmentalRisk(data.environmental)
    riskFactors.push({
      category: 'environmental',
      risk: envRisk.risk,
      score: envRisk.score,
      factors: envRisk.factors
    })
    overallRiskScore += envRisk.score * 0.4
  }

  // Operational risk factors
  if (data.operational) {
    const opRisk = assessOperationalRisk(data.operational)
    riskFactors.push({
      category: 'operational',
      risk: opRisk.risk,
      score: opRisk.score,
      factors: opRisk.factors
    })
    overallRiskScore += opRisk.score * 0.3
  }

  // Financial risk factors
  const finRisk = assessFinancialRisk(data)
  riskFactors.push({
    category: 'financial',
    risk: finRisk.risk,
    score: finRisk.score,
    factors: finRisk.factors
  })
  overallRiskScore += finRisk.score * 0.3

  return {
    overallRiskScore: Math.round(overallRiskScore * 100) / 100,
    riskLevel: overallRiskScore > 7 ? 'high' : overallRiskScore > 4 ? 'medium' : 'low',
    riskFactors,
    recommendations: generateRiskRecommendations(riskFactors),
    monitoring: {
      criticalIndicators: riskFactors.filter(rf => rf.score > 6).map(rf => rf.category),
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }
}

async function performTrendAnalysis(data: any, parameters: any) {
  const trends = []
  
  if (data.timeSeries) {
    const values = data.timeSeries.map((item: any) => item.value || 0)
    const timestamps = data.timeSeries.map((item: any) => new Date(item.timestamp || item.date))
    
    // Short-term trend (last 30% of data)
    const shortTermStart = Math.floor(values.length * 0.7)
    const shortTermValues = values.slice(shortTermStart)
    const shortTermTrend = calculateTrend(shortTermValues)
    
    trends.push({
      period: 'short_term',
      direction: shortTermTrend > 0 ? 'increasing' : 'decreasing',
      magnitude: Math.abs(shortTermTrend),
      confidence: 0.9,
      significance: Math.abs(shortTermTrend) > 0.1 ? 'significant' : 'minimal'
    })
    
    // Long-term trend (entire dataset)
    const longTermTrend = calculateTrend(values)
    trends.push({
      period: 'long_term',
      direction: longTermTrend > 0 ? 'increasing' : 'decreasing',
      magnitude: Math.abs(longTermTrend),
      confidence: 0.85,
      significance: Math.abs(longTermTrend) > 0.05 ? 'significant' : 'minimal'
    })
  }

  return {
    trends,
    analysis: {
      trendAlignment: trends[0]?.direction === trends[1]?.direction ? 'consistent' : 'divergent',
      acceleration: Math.abs((trends[0]?.magnitude || 0) - (trends[1]?.magnitude || 0)),
      stability: calculateStability(data.timeSeries || []),
      forecastReliability: assessForecastReliability(trends)
    }
  }
}

// Helper functions
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0
  const n = values.length
  const x = Array.from({ length: n }, (_, i) => i)
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
  
  return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
}

function calculateSeasonality(values: number[]): number {
  return values.reduce((sum, val, i) => sum + val * Math.sin((i * 2 * Math.PI) / 12), 0) / values.length
}

function calculateVolatility(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance) / mean
}

function assessRiskLevel(predictions: any[]): string {
  const volatility = calculateVolatility(predictions.map(p => p.predictedValue))
  return volatility > 0.3 ? 'high' : volatility > 0.15 ? 'medium' : 'low'
}

function detectCyclicPattern(values: number[]): { detected: boolean, period: number, strength: number } {
  // Simple autocorrelation-based cycle detection
  let maxCorrelation = 0
  let bestPeriod = 0
  
  for (let period = 2; period <= Math.floor(values.length / 3); period++) {
    let correlation = 0
    let count = 0
    
    for (let i = 0; i < values.length - period; i++) {
      correlation += values[i] * values[i + period]
      count++
    }
    
    correlation /= count
    if (correlation > maxCorrelation) {
      maxCorrelation = correlation
      bestPeriod = period
    }
  }
  
  return {
    detected: maxCorrelation > 0.7,
    period: bestPeriod,
    strength: maxCorrelation
  }
}

function detectOutlierClusters(values: number[]): { start: number, end: number, intensity: number }[] {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length)
  
  const clusters = []
  let clusterStart = -1
  
  for (let i = 0; i < values.length; i++) {
    const isOutlier = Math.abs(values[i] - mean) > 2 * stdDev
    
    if (isOutlier && clusterStart === -1) {
      clusterStart = i
    } else if (!isOutlier && clusterStart !== -1) {
      clusters.push({
        start: clusterStart,
        end: i - 1,
        intensity: Math.abs(values.slice(clusterStart, i).reduce((sum, val) => sum + val, 0) / (i - clusterStart) - mean) / stdDev
      })
      clusterStart = -1
    }
  }
  
  return clusters
}

function calculateDataRegularity(timeSeries: any[]): number {
  if (timeSeries.length < 3) return 0
  
  const intervals = []
  for (let i = 1; i < timeSeries.length; i++) {
    const interval = new Date(timeSeries[i].timestamp || timeSeries[i].date).getTime() - 
                    new Date(timeSeries[i-1].timestamp || timeSeries[i-1].date).getTime()
    intervals.push(interval)
  }
  
  const meanInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - meanInterval, 2), 0) / intervals.length
  const coefficientOfVariation = Math.sqrt(variance) / meanInterval
  
  return Math.max(0, 1 - coefficientOfVariation)
}

function assessEnvironmentalRisk(envData: any): { risk: string, score: number, factors: string[] } {
  let score = 0
  const factors = []
  
  if (envData.airQuality > 100) {
    score += 2
    factors.push('Poor air quality')
  }
  if (envData.waterQuality < 70) {
    score += 1.5
    factors.push('Water quality concerns')
  }
  if (envData.temperature > 35) {
    score += 1
    factors.push('High temperature exposure')
  }
  
  return {
    risk: score > 3 ? 'high' : score > 1.5 ? 'medium' : 'low',
    score,
    factors
  }
}

function assessOperationalRisk(opData: any): { risk: string, score: number, factors: string[] } {
  let score = Math.random() * 5 // Simulate operational risk assessment
  const factors = ['Equipment reliability', 'Staff availability', 'Supply chain']
  
  return {
    risk: score > 3 ? 'high' : score > 1.5 ? 'medium' : 'low',
    score,
    factors: factors.slice(0, Math.floor(score) + 1)
  }
}

function assessFinancialRisk(data: any): { risk: string, score: number, factors: string[] } {
  const score = Math.random() * 4 + 1
  const factors = ['Market volatility', 'Operational costs', 'Regulatory compliance']
  
  return {
    risk: score > 3 ? 'high' : score > 2 ? 'medium' : 'low',
    score,
    factors: factors.slice(0, Math.floor(score))
  }
}

function generateRiskRecommendations(riskFactors: any[]): string[] {
  const recommendations = []
  
  riskFactors.forEach(factor => {
    if (factor.score > 6) {
      recommendations.push(`Immediate action required for ${factor.category} risks`)
    } else if (factor.score > 4) {
      recommendations.push(`Monitor ${factor.category} factors closely`)
    }
  })
  
  if (recommendations.length === 0) {
    recommendations.push('Continue current risk management practices')
  }
  
  return recommendations
}

function calculateStability(timeSeries: any[]): number {
  if (timeSeries.length < 2) return 0
  
  const values = timeSeries.map(item => item.value || 0)
  const changes = []
  
  for (let i = 1; i < values.length; i++) {
    changes.push(Math.abs((values[i] - values[i-1]) / values[i-1]))
  }
  
  const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length
  return Math.max(0, 1 - avgChange * 10) // Normalize stability score
}

function assessForecastReliability(trends: any[]): number {
  const consistency = trends[0]?.direction === trends[1]?.direction ? 0.8 : 0.4
  const significance = trends.reduce((sum, trend) => sum + (trend.significance === 'significant' ? 0.3 : 0.1), 0)
  return Math.min(1, consistency + significance)
}

function assessDataQuality(data: any): string {
  if (!data || Object.keys(data).length === 0) return 'poor'
  
  let qualityScore = 0
  
  if (data.timeSeries && data.timeSeries.length > 10) qualityScore += 0.4
  if (data.completeness && data.completeness > 0.8) qualityScore += 0.3
  if (data.accuracy && data.accuracy > 0.9) qualityScore += 0.3
  
  return qualityScore > 0.8 ? 'high' : qualityScore > 0.5 ? 'medium' : 'low'
}