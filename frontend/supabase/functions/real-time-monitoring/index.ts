import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const { headers } = req
  const upgradeHeader = headers.get("upgrade") || ""

  if (upgradeHeader.toLowerCase() !== "websocket") {
    // Handle HTTP requests for real-time data
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )

      const url = new URL(req.url)
      const action = url.searchParams.get('action')

      if (action === 'stream') {
        return await handleDataStream(supabase, req)
      } else if (action === 'alerts') {
        return await handleAlerts(supabase, req)
      } else if (action === 'sensors') {
        return await handleSensorData(supabase, req)
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )

    } catch (error) {
      console.error('Real-time monitoring error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }
  }

  // Handle WebSocket connections
  const { socket, response } = Deno.upgradeWebSocket(req)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )

  let monitoringInterval: number | null = null
  let userPoints: any[] = []

  socket.onopen = async () => {
    console.log("WebSocket connection opened")
    socket.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      timestamp: new Date().toISOString()
    }))

    // Start real-time monitoring
    monitoringInterval = setInterval(async () => {
      try {
        const realTimeData = await generateRealTimeData(userPoints)
        socket.send(JSON.stringify({
          type: 'data_update',
          data: realTimeData,
          timestamp: new Date().toISOString()
        }))
      } catch (error) {
        console.error('Error generating real-time data:', error)
      }
    }, 5000) // Update every 5 seconds
  }

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'subscribe_points':
          userPoints = message.points || []
          socket.send(JSON.stringify({
            type: 'subscription_confirmed',
            points: userPoints.length,
            timestamp: new Date().toISOString()
          }))
          break

        case 'create_alert':
          const alert = await createAlert(supabase, message.alert)
          socket.send(JSON.stringify({
            type: 'alert_created',
            alert,
            timestamp: new Date().toISOString()
          }))
          break

        case 'sensor_reading':
          await storeSensorReading(supabase, message.reading)
          socket.send(JSON.stringify({
            type: 'reading_stored',
            timestamp: new Date().toISOString()
          }))
          break

        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type',
            timestamp: new Date().toISOString()
          }))
      }
    } catch (error) {
      console.error('WebSocket message error:', error)
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }))
    }
  }

  socket.onclose = () => {
    console.log("WebSocket connection closed")
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
    }
  }

  socket.onerror = (error) => {
    console.error("WebSocket error:", error)
    if (monitoringInterval) {
      clearInterval(monitoringInterval)
    }
  }

  return response
})

async function handleDataStream(supabase: any, req: Request) {
  const url = new URL(req.url)
  const pointId = url.searchParams.get('point_id')
  
  if (!pointId) {
    return new Response(
      JSON.stringify({ error: 'point_id required' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }

  // Get recent sensor readings
  const { data: readings, error } = await supabase
    .from('sensor_readings')
    .select('*')
    .eq('monitoring_point_id', pointId)
    .order('recorded_at', { ascending: false })
    .limit(100)

  if (error) {
    throw new Error('Failed to fetch sensor readings')
  }

  return new Response(
    JSON.stringify({
      success: true,
      readings,
      realTime: generateRealTimeDataForPoint(pointId)
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleAlerts(supabase: any, req: Request) {
  if (req.method === 'POST') {
    const alertData = await req.json()
    const alert = await createAlert(supabase, alertData)
    
    return new Response(
      JSON.stringify({ success: true, alert }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // GET - fetch active alerts
  const { data: alerts, error } = await supabase
    .from('environmental_alerts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch alerts')
  }

  return new Response(
    JSON.stringify({ success: true, alerts }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

async function handleSensorData(supabase: any, req: Request) {
  if (req.method === 'POST') {
    const sensorData = await req.json()
    await storeSensorReading(supabase, sensorData)
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    }
  )
}

async function generateRealTimeData(userPoints: any[]) {
  const data: any = {
    timestamp: new Date().toISOString(),
    points: []
  }

  for (const point of userPoints) {
    const pointData = generateRealTimeDataForPoint(point.id)
    data.points.push({
      id: point.id,
      name: point.name,
      location: point.location,
      ...pointData
    })
  }

  // Global environmental indicators
  data.global = {
    airQualityIndex: Math.floor(Math.random() * 200) + 50,
    weatherConditions: {
      temperature: Math.round((Math.random() * 30 + 5) * 10) / 10,
      humidity: Math.floor(Math.random() * 40) + 40,
      pressure: Math.round((Math.random() * 50 + 980) * 10) / 10,
      windSpeed: Math.round((Math.random() * 20) * 10) / 10
    },
    alerts: Math.floor(Math.random() * 5),
    activeSensors: userPoints.length + Math.floor(Math.random() * 10)
  }

  return data
}

function generateRealTimeDataForPoint(pointId: string) {
  const baseTime = Date.now()
  const timeSeries = []

  // Generate last 24 hours of data
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(baseTime - (23 - i) * 60 * 60 * 1000)
    timeSeries.push({
      timestamp: timestamp.toISOString(),
      airQuality: Math.floor(Math.random() * 150) + 25,
      temperature: Math.round((Math.random() * 25 + 10) * 10) / 10,
      humidity: Math.floor(Math.random() * 60) + 30,
      windSpeed: Math.round((Math.random() * 15) * 10) / 10,
      pressure: Math.round((Math.random() * 30 + 985) * 10) / 10,
      pm25: Math.round((Math.random() * 50 + 5) * 10) / 10,
      pm10: Math.round((Math.random() * 80 + 10) * 10) / 10,
      co2: Math.floor(Math.random() * 200) + 300,
      ozone: Math.round((Math.random() * 0.1 + 0.05) * 1000) / 1000
    })
  }

  // Current readings
  const current = timeSeries[timeSeries.length - 1]
  
  // Anomaly detection
  const anomalies = []
  if (current.airQuality > 120) {
    anomalies.push({
      type: 'air_quality',
      severity: 'high',
      value: current.airQuality,
      threshold: 120,
      message: 'Air quality exceeds healthy levels'
    })
  }
  
  if (current.pm25 > 35) {
    anomalies.push({
      type: 'pm25',
      severity: 'medium',
      value: current.pm25,
      threshold: 35,
      message: 'PM2.5 levels elevated'
    })
  }

  return {
    timeSeries,
    current,
    anomalies,
    status: anomalies.length > 0 ? 'warning' : 'normal',
    dataQuality: 0.9 + Math.random() * 0.1,
    sensorHealth: Math.random() > 0.9 ? 'degraded' : 'good'
  }
}

async function createAlert(supabase: any, alertData: any) {
  const alert = {
    alert_type: alertData.type || 'environmental',
    severity: alertData.severity || 'medium',
    title: alertData.title || 'Environmental Alert',
    description: alertData.description || 'Alert triggered by monitoring system',
    trigger_value: alertData.triggerValue,
    threshold_value: alertData.thresholdValue,
    metadata: {
      source: 'real_time_monitoring',
      auto_generated: true,
      ...alertData.metadata
    },
    status: 'active'
  }

  const { data, error } = await supabase
    .from('environmental_alerts')
    .insert(alert)
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create alert')
  }

  return data
}

async function storeSensorReading(supabase: any, readingData: any) {
  const reading = {
    monitoring_point_id: readingData.pointId,
    sensor_type: readingData.sensorType || 'environmental',
    measurement_type: readingData.measurementType || 'air_quality',
    value: readingData.value,
    unit: readingData.unit || 'µg/m³',
    quality_flag: readingData.qualityFlag || 'good',
    metadata: {
      source: 'real_time_sensor',
      calibration_status: 'calibrated',
      ...readingData.metadata
    }
  }

  const { error } = await supabase
    .from('sensor_readings')
    .insert(reading)

  if (error) {
    throw new Error('Failed to store sensor reading')
  }

  return true
}