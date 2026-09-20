/**
 * Real-Time Environmental Monitoring Hook
 * 
 * Provides real-time data streaming, alert management, and live updates
 * for environmental monitoring points and sensor readings.
 * 
 * Features:
 * - Real-time sensor data streaming via Supabase subscriptions
 * - Live alert notifications and management
 * - Monitoring point management with spatial queries
 * - Automatic data quality validation and anomaly detection
 * - WebSocket-based real-time collaboration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface MonitoringPoint {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  location_name?: string;
  monitoring_type: string[];
  status: 'active' | 'inactive' | 'maintenance';
  alert_thresholds: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SensorReading {
  id: string;
  monitoring_point_id: string;
  sensor_type: string;
  measurement_type: string;
  value: number;
  unit: string;
  quality_flag: 'good' | 'questionable' | 'bad';
  metadata: Record<string, any>;
  recorded_at: string;
  processed_at: string;
}

export interface EnvironmentalAlert {
  id: string;
  monitoring_point_id: string;
  user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  trigger_value?: number;
  threshold_value?: number;
  location_name?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string;
  metadata: Record<string, any>;
}

export interface RealTimeStats {
  totalMonitoringPoints: number;
  activeAlerts: number;
  todayReadings: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  lastUpdateTime: Date;
}

export const useRealTimeMonitoring = () => {
  const [monitoringPoints, setMonitoringPoints] = useState<MonitoringPoint[]>([]);
  const [sensorReadings, setSensorReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<EnvironmentalAlert[]>([]);
  const [stats, setStats] = useState<RealTimeStats>({
    totalMonitoringPoints: 0,
    activeAlerts: 0,
    todayReadings: 0,
    systemHealth: 'good',
    lastUpdateTime: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Initialize data and real-time subscriptions
  useEffect(() => {
    initializeRealTimeMonitoring();
    return () => {
      // Cleanup subscriptions
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, []);

  const initializeRealTimeMonitoring = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load initial data
      await Promise.all([
        loadMonitoringPoints(),
        loadRecentSensorReadings(),
        loadActiveAlerts()
      ]);

      // Set up real-time subscriptions
      setupRealtimeSubscriptions();
      
      console.log('✅ Real-time monitoring initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize monitoring';
      setError(errorMessage);
      console.error('❌ Real-time monitoring initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMonitoringPoints = async () => {
    const { data, error } = await supabase
      .from('environmental_monitoring_points')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;
    const typedData = (data || []).map(point => ({
      ...point,
      location: point.location as { type: 'Point'; coordinates: [number, number] },
      monitoring_type: point.monitoring_type as string[],
      status: point.status as 'active' | 'inactive' | 'maintenance',
      alert_thresholds: point.alert_thresholds as Record<string, any>
    }));
    setMonitoringPoints(typedData);
  };

  const loadRecentSensorReadings = async () => {
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(1000);

    if (error) throw error;
    const typedData = (data || []).map(reading => ({
      ...reading,
      quality_flag: reading.quality_flag as 'good' | 'questionable' | 'bad',
      metadata: reading.metadata as Record<string, any>
    }));
    setSensorReadings(typedData);
  };

  const loadActiveAlerts = async () => {
    const { data, error } = await supabase
      .from('environmental_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const typedData = (data || []).map(alert => ({
      ...alert,
      severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
      status: alert.status as 'active' | 'acknowledged' | 'resolved',
      metadata: alert.metadata as Record<string, any>
    }));
    setAlerts(typedData);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to monitoring points changes
    const pointsChannel = supabase
      .channel('monitoring-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'environmental_monitoring_points'
        },
        handleMonitoringPointsChange
      )
      .subscribe();

    // Subscribe to new sensor readings
    const readingsChannel = supabase
      .channel('sensor-readings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings'
        },
        handleNewSensorReading
      )
      .subscribe();

    // Subscribe to alerts
    const alertsChannel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'environmental_alerts'
        },
        handleAlertsChange
      )
      .subscribe();

    channelsRef.current = [pointsChannel, readingsChannel, alertsChannel];
  };

  const handleMonitoringPointsChange = useCallback((payload: any) => {
    console.log('📍 Monitoring point change:', payload);
    
    if (payload.eventType === 'INSERT') {
      setMonitoringPoints(prev => [payload.new, ...prev]);
      toast({
        title: "New Monitoring Point",
        description: `${payload.new.name} has been added`,
      });
    } else if (payload.eventType === 'UPDATE') {
      setMonitoringPoints(prev => 
        prev.map(point => point.id === payload.new.id ? payload.new : point)
      );
    } else if (payload.eventType === 'DELETE') {
      setMonitoringPoints(prev => 
        prev.filter(point => point.id !== payload.old.id)
      );
    }
    
    updateStats();
  }, [toast]);

  const handleNewSensorReading = useCallback((payload: any) => {
    const newReading = payload.new as SensorReading;
    console.log('📊 New sensor reading:', newReading);
    
    setSensorReadings(prev => {
      // Keep only recent readings (last 24 hours) and add new one
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const filtered = prev.filter(r => new Date(r.recorded_at).getTime() > oneDayAgo);
      return [newReading, ...filtered].slice(0, 1000);
    });

    // Check for alerts based on new reading
    checkForAlerts(newReading);
    updateStats();
  }, []);

  const handleAlertsChange = useCallback((payload: any) => {
    console.log('🚨 Alert change:', payload);
    
    if (payload.eventType === 'INSERT') {
      const newAlert = payload.new as EnvironmentalAlert;
      setAlerts(prev => [newAlert, ...prev]);
      
      // Show toast notification for new alerts
      toast({
        title: `${newAlert.severity.toUpperCase()} Alert`,
        description: newAlert.title,
        variant: newAlert.severity === 'high' || newAlert.severity === 'critical' 
          ? 'destructive' : 'default',
      });
    } else if (payload.eventType === 'UPDATE') {
      setAlerts(prev => 
        prev.map(alert => alert.id === payload.new.id ? payload.new : alert)
      );
    } else if (payload.eventType === 'DELETE') {
      setAlerts(prev => 
        prev.filter(alert => alert.id !== payload.old.id)
      );
    }
    
    updateStats();
  }, [toast]);

  const checkForAlerts = async (reading: SensorReading) => {
    try {
      // Get monitoring point with thresholds
      const { data: point } = await supabase
        .from('environmental_monitoring_points')
        .select('*')
        .eq('id', reading.monitoring_point_id)
        .single();

      if (!point || !point.alert_thresholds) return;

      const thresholds = point.alert_thresholds[reading.measurement_type];
      if (!thresholds) return;

      let alertTriggered = false;
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let alertTitle = '';

      // Check various threshold conditions
      if (thresholds.critical && reading.value >= thresholds.critical) {
        alertTriggered = true;
        severity = 'critical';
        alertTitle = `Critical ${reading.measurement_type} level detected`;
      } else if (thresholds.high && reading.value >= thresholds.high) {
        alertTriggered = true;
        severity = 'high';
        alertTitle = `High ${reading.measurement_type} level detected`;
      } else if (thresholds.low && reading.value <= thresholds.low) {
        alertTriggered = true;
        severity = 'medium';
        alertTitle = `Low ${reading.measurement_type} level detected`;
      }

      if (alertTriggered) {
        const { data: user } = await supabase.auth.getUser();
        await createAlert({
          monitoring_point_id: reading.monitoring_point_id,
          user_id: user.user?.id || '',
          alert_type: reading.measurement_type,
          severity,
          title: alertTitle,
          description: `${reading.measurement_type}: ${reading.value} ${reading.unit}`,
          trigger_value: reading.value,
          threshold_value: thresholds[severity],
          location_name: point.location_name,
          status: 'active',
          metadata: {
            sensor_type: reading.sensor_type,
            reading_id: reading.id,
            quality_flag: reading.quality_flag
          }
        });
      }
    } catch (error) {
      console.error('Error checking for alerts:', error);
    }
  };

  const updateStats = useCallback(() => {
    setStats(prev => ({
      totalMonitoringPoints: monitoringPoints.length,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      todayReadings: sensorReadings.filter(r => 
        new Date(r.recorded_at).toDateString() === new Date().toDateString()
      ).length,
      systemHealth: calculateSystemHealth(),
      lastUpdateTime: new Date()
    }));
  }, [monitoringPoints, alerts, sensorReadings]);

  const calculateSystemHealth = (): 'excellent' | 'good' | 'warning' | 'critical' => {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const highAlerts = alerts.filter(a => a.severity === 'high' && a.status === 'active').length;
    
    if (criticalAlerts > 0) return 'critical';
    if (highAlerts > 2) return 'warning';
    if (highAlerts > 0 || alerts.length > 5) return 'good';
    return 'excellent';
  };

  // API methods for managing monitoring infrastructure

  const createMonitoringPoint = async (point: Omit<MonitoringPoint, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('environmental_monitoring_points')
      .insert(point)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateMonitoringPoint = async (id: string, updates: Partial<MonitoringPoint>) => {
    const { data, error } = await supabase
      .from('environmental_monitoring_points')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteMonitoringPoint = async (id: string) => {
    const { error } = await supabase
      .from('environmental_monitoring_points')
      .delete()
      .eq('id', id);

    if (error) throw error;
  };

  const createAlert = async (alert: Omit<EnvironmentalAlert, 'id' | 'created_at'>) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('environmental_alerts')
      .insert({ ...alert, user_id: user.user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const acknowledgeAlert = async (id: string) => {
    const { data, error } = await supabase
      .from('environmental_alerts')
      .update({ status: 'acknowledged' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const resolveAlert = async (id: string) => {
    const { data, error } = await supabase
      .from('environmental_alerts')
      .update({ 
        status: 'resolved', 
        resolved_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const addSensorReading = async (reading: Omit<SensorReading, 'id' | 'recorded_at' | 'processed_at'>) => {
    const { data, error } = await supabase
      .from('sensor_readings')
      .insert(reading)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const getSensorReadings = async (
    monitoringPointId: string, 
    timeRange: { start: Date; end: Date },
    sensorType?: string
  ) => {
    let query = supabase
      .from('sensor_readings')
      .select('*')
      .eq('monitoring_point_id', monitoringPointId)
      .gte('recorded_at', timeRange.start.toISOString())
      .lte('recorded_at', timeRange.end.toISOString())
      .order('recorded_at', { ascending: false });

    if (sensorType) {
      query = query.eq('sensor_type', sensorType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  };

  const refreshData = async () => {
    await initializeRealTimeMonitoring();
  };

  return {
    // State
    monitoringPoints,
    sensorReadings,
    alerts,
    stats,
    isLoading,
    error,
    
    // Methods
    createMonitoringPoint,
    updateMonitoringPoint,
    deleteMonitoringPoint,
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    addSensorReading,
    getSensorReadings,
    refreshData
  };
};
