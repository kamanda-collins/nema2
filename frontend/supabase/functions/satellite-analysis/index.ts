import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SatelliteAnalysisRequest {
  lat: number
  lng: number
  startDate: string
  endDate: string
  analysisType: 'ndvi' | 'change_detection' | 'land_cover' | 'water_quality' | 'thermal'
  satellite?: 'landsat' | 'sentinel' | 'modis'
}

interface NDVIResult {
  date: string
  ndvi: number
  vegetation_health: 'poor' | 'moderate' | 'good' | 'excellent'
  cloud_coverage: number
}

interface ChangeDetectionResult {
  change_type: 'deforestation' | 'urbanization' | 'water_change' | 'agriculture' | 'mining'
  change_percentage: number
  confidence: number
  affected_area_km2: number
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

    const { lat, lng, startDate, endDate, analysisType, satellite = 'sentinel' }: SatelliteAnalysisRequest = await req.json()

    // Simulate advanced satellite analysis
    let analysisResult: any = {}

    switch (analysisType) {
      case 'ndvi':
        analysisResult = await performNDVIAnalysis(lat, lng, startDate, endDate)
        break
      case 'change_detection':
        analysisResult = await performChangeDetection(lat, lng, startDate, endDate)
        break
      case 'land_cover':
        analysisResult = await performLandCoverAnalysis(lat, lng)
        break
      case 'water_quality':
        analysisResult = await performWaterQualityAnalysis(lat, lng, startDate, endDate)
        break
      case 'thermal':
        analysisResult = await performThermalAnalysis(lat, lng, startDate, endDate)
        break
    }

    // Store analysis results in database
    const { data: analysisRecord, error: dbError } = await supabase
      .from('analysis_results')
      .insert({
        analysis_type: `satellite_${analysisType}`,
        analysis_name: `Satellite ${analysisType.toUpperCase()} Analysis`,
        location: `POINT(${lng} ${lat})`,
        parameters: { lat, lng, startDate, endDate, satellite },
        results: analysisResult,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to store analysis results')
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysisId: analysisRecord.id,
        analysisType,
        results: analysisResult,
        satellite,
        metadata: {
          processingTime: Math.random() * 5000 + 1000,
          dataQuality: 'high',
          cloudCoverage: Math.random() * 30,
          spatialResolution: satellite === 'landsat' ? 30 : satellite === 'sentinel' ? 10 : 250
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Satellite analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function performNDVIAnalysis(lat: number, lng: number, startDate: string, endDate: string): Promise<{ timeSeries: NDVIResult[], summary: any }> {
  const timeSeries: NDVIResult[] = []
  const days = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i < Math.min(days, 20); i += Math.floor(days / 20) || 1) {
    const date = new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000)
    const ndvi = 0.2 + Math.random() * 0.6 + Math.sin(i * 0.3) * 0.2
    
    timeSeries.push({
      date: date.toISOString().split('T')[0],
      ndvi: Math.round(ndvi * 1000) / 1000,
      vegetation_health: ndvi > 0.7 ? 'excellent' : ndvi > 0.5 ? 'good' : ndvi > 0.3 ? 'moderate' : 'poor',
      cloud_coverage: Math.random() * 40
    })
  }

  const avgNDVI = timeSeries.reduce((sum, item) => sum + item.ndvi, 0) / timeSeries.length
  
  return {
    timeSeries,
    summary: {
      averageNDVI: Math.round(avgNDVI * 1000) / 1000,
      trend: timeSeries[timeSeries.length - 1].ndvi > timeSeries[0].ndvi ? 'improving' : 'declining',
      seasonalVariation: Math.max(...timeSeries.map(t => t.ndvi)) - Math.min(...timeSeries.map(t => t.ndvi)),
      dataPoints: timeSeries.length
    }
  }
}

async function performChangeDetection(lat: number, lng: number, startDate: string, endDate: string): Promise<{ changes: ChangeDetectionResult[], summary: any }> {
  const changes: ChangeDetectionResult[] = []
  const changeTypes = ['deforestation', 'urbanization', 'water_change', 'agriculture', 'mining'] as const
  
  // Simulate detected changes
  for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
    changes.push({
      change_type: changeTypes[Math.floor(Math.random() * changeTypes.length)],
      change_percentage: Math.random() * 15 + 1,
      confidence: 0.7 + Math.random() * 0.3,
      affected_area_km2: Math.random() * 10 + 0.1
    })
  }

  return {
    changes,
    summary: {
      totalAffectedArea: changes.reduce((sum, c) => sum + c.affected_area_km2, 0),
      majorChangeType: changes.sort((a, b) => b.affected_area_km2 - a.affected_area_km2)[0]?.change_type || 'none',
      changeDetected: changes.length > 0,
      averageConfidence: changes.reduce((sum, c) => sum + c.confidence, 0) / changes.length || 0
    }
  }
}

async function performLandCoverAnalysis(lat: number, lng: number): Promise<{ landCover: any, classification: any }> {
  const landCoverTypes = {
    forest: Math.random() * 40,
    agriculture: Math.random() * 30,
    urban: Math.random() * 20,
    water: Math.random() * 10,
    barren: Math.random() * 15,
    grassland: Math.random() * 25
  }

  // Normalize to 100%
  const total = Object.values(landCoverTypes).reduce((sum, val) => sum + val, 0)
  Object.keys(landCoverTypes).forEach(key => {
    landCoverTypes[key as keyof typeof landCoverTypes] = (landCoverTypes[key as keyof typeof landCoverTypes] / total) * 100
  })

  return {
    landCover: landCoverTypes,
    classification: {
      dominantType: Object.entries(landCoverTypes).sort(([,a], [,b]) => b - a)[0][0],
      diversity: Object.values(landCoverTypes).filter(v => v > 5).length,
      urbanizationLevel: landCoverTypes.urban > 30 ? 'high' : landCoverTypes.urban > 10 ? 'medium' : 'low'
    }
  }
}

async function performWaterQualityAnalysis(lat: number, lng: number, startDate: string, endDate: string): Promise<{ waterQuality: any, indicators: any }> {
  return {
    waterQuality: {
      turbidity: Math.random() * 50 + 10,
      chlorophyll_a: Math.random() * 30 + 5,
      suspended_sediments: Math.random() * 100 + 20,
      water_temperature: Math.random() * 15 + 15
    },
    indicators: {
      eutrophication_risk: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      pollution_level: Math.random() > 0.6 ? 'elevated' : 'normal',
      water_clarity: Math.random() > 0.5 ? 'good' : 'poor'
    }
  }
}

async function performThermalAnalysis(lat: number, lng: number, startDate: string, endDate: string): Promise<{ thermal: any, analysis: any }> {
  const thermalData = []
  const days = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
  
  for (let i = 0; i < Math.min(days, 10); i += Math.floor(days / 10) || 1) {
    thermalData.push({
      date: new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      surface_temperature: Math.random() * 20 + 15,
      heat_island_intensity: Math.random() * 5,
      thermal_anomaly: Math.random() > 0.8
    })
  }

  return {
    thermal: {
      timeSeries: thermalData,
      averageTemperature: thermalData.reduce((sum, t) => sum + t.surface_temperature, 0) / thermalData.length,
      maxTemperature: Math.max(...thermalData.map(t => t.surface_temperature)),
      minTemperature: Math.min(...thermalData.map(t => t.surface_temperature))
    },
    analysis: {
      temperatureTrend: Math.random() > 0.5 ? 'warming' : 'cooling',
      heatIslandEffect: Math.random() > 0.6 ? 'significant' : 'minimal',
      thermalAnomaliesDetected: thermalData.filter(t => t.thermal_anomaly).length
    }
  }
}