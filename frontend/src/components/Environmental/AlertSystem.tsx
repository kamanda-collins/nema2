
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Bell, BellOff, Settings, Mail, Smartphone, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RealTimeEnvironmentalData } from '@/services/environmentalDataService';

interface AlertThreshold {
  id: string;
  parameter: string;
  threshold: number;
  operator: 'greater' | 'less' | 'equal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface AlertSystemProps {
  data: RealTimeEnvironmentalData | null;
}

export const AlertSystem: React.FC<AlertSystemProps> = ({ data }) => {
  const { toast } = useToast();
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([
    {
      id: '1',
      parameter: 'aqi',
      threshold: 150,
      operator: 'greater',
      severity: 'high',
      enabled: true,
      notifications: { email: true, push: true, sms: false }
    },
    {
      id: '2',
      parameter: 'pm25',
      threshold: 75,
      operator: 'greater',
      severity: 'medium',
      enabled: true,
      notifications: { email: true, push: false, sms: false }
    },
    {
      id: '3',
      parameter: 'temperature',
      threshold: 35,
      operator: 'greater',
      severity: 'medium',
      enabled: true,
      notifications: { email: false, push: true, sms: false }
    }
  ]);

  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (data && alertsEnabled) {
      checkThresholds();
    }
  }, [data, thresholds, alertsEnabled]);

  const checkThresholds = () => {
    const newAlerts: any[] = [];
    
    thresholds.forEach(threshold => {
      if (!threshold.enabled) return;
      
      let currentValue: number = 0;
      let parameterName = '';
      
      switch (threshold.parameter) {
        case 'aqi':
          currentValue = data?.airQuality.aqi || 0;
          parameterName = 'Air Quality Index';
          break;
        case 'pm25':
          currentValue = data?.airQuality.pm25 || 0;
          parameterName = 'PM2.5';
          break;
        case 'temperature':
          currentValue = data?.weather.temperature || 0;
          parameterName = 'Temperature';
          break;
        case 'humidity':
          currentValue = data?.weather.humidity || 0;
          parameterName = 'Humidity';
          break;
      }
      
      const thresholdMet = 
        (threshold.operator === 'greater' && currentValue > threshold.threshold) ||
        (threshold.operator === 'less' && currentValue < threshold.threshold) ||
        (threshold.operator === 'equal' && currentValue === threshold.threshold);
      
      if (thresholdMet) {
        newAlerts.push({
          id: threshold.id,
          parameter: parameterName,
          currentValue,
          threshold: threshold.threshold,
          severity: threshold.severity,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }
    });
    
    // Only update if alerts have changed
    if (newAlerts.length !== activeAlerts.length || 
        !newAlerts.every(alert => activeAlerts.some(existing => existing.id === alert.id))) {
      setActiveAlerts(newAlerts);
      
      if (newAlerts.length > 0) {
        toast({
          title: "Environmental Alert",
          description: `${newAlerts.length} threshold(s) exceeded`,
          variant: newAlerts.some(a => a.severity === 'critical' || a.severity === 'high') ? 'destructive' : 'default'
        });
      }
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const updateThreshold = (id: string, updates: Partial<AlertThreshold>) => {
    setThresholds(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const acknowledgeAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  return (
    <div className="space-y-6">
      {/* Alert Overview */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Alert System</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Alerts</span>
            <Switch 
              checked={alertsEnabled} 
              onCheckedChange={setAlertsEnabled}
            />
            {alertsEnabled ? <Bell className="h-4 w-4 text-green-500" /> : <BellOff className="h-4 w-4 text-gray-400" />}
          </div>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-medium text-red-600">Active Alerts ({activeAlerts.length})</h4>
            {activeAlerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${alert.acknowledged ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{alert.parameter}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Current: {alert.currentValue} | Threshold: {alert.threshold}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!alert.acknowledged && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Threshold Configuration */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold">Alert Thresholds</h3>
        </div>
        
        <div className="space-y-4">
          {thresholds.map((threshold) => (
            <div key={threshold.id} className="border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <label className="text-sm font-medium">Parameter</label>
                  <Select 
                    value={threshold.parameter} 
                    onValueChange={(value) => updateThreshold(threshold.id, { parameter: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aqi">Air Quality Index</SelectItem>
                      <SelectItem value="pm25">PM2.5</SelectItem>
                      <SelectItem value="temperature">Temperature</SelectItem>
                      <SelectItem value="humidity">Humidity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Operator</label>
                  <Select 
                    value={threshold.operator} 
                    onValueChange={(value: 'greater' | 'less' | 'equal') => updateThreshold(threshold.id, { operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="greater">Greater than</SelectItem>
                      <SelectItem value="less">Less than</SelectItem>
                      <SelectItem value="equal">Equal to</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Threshold</label>
                  <Input 
                    type="number" 
                    value={threshold.threshold}
                    onChange={(e) => updateThreshold(threshold.id, { threshold: Number(e.target.value) })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Select 
                    value={threshold.severity} 
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => updateThreshold(threshold.id, { severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={threshold.enabled} 
                    onCheckedChange={(enabled) => updateThreshold(threshold.id, { enabled })}
                  />
                  <span className="text-sm">Enabled</span>
                </div>
              </div>
              
              {/* Notification Settings */}
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium mb-2">Notifications:</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={threshold.notifications.email}
                      onChange={(e) => updateThreshold(threshold.id, { 
                        notifications: { ...threshold.notifications, email: e.target.checked }
                      })}
                    />
                    <Mail className="h-3 w-3" />
                    Email
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={threshold.notifications.push}
                      onChange={(e) => updateThreshold(threshold.id, { 
                        notifications: { ...threshold.notifications, push: e.target.checked }
                      })}
                    />
                    <Bell className="h-3 w-3" />
                    Push
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input 
                      type="checkbox" 
                      checked={threshold.notifications.sms}
                      onChange={(e) => updateThreshold(threshold.id, { 
                        notifications: { ...threshold.notifications, sms: e.target.checked }
                      })}
                    />
                    <Smartphone className="h-3 w-3" />
                    SMS
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Alert History */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold">Recent Alert History</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Alert history will appear here as thresholds are triggered.</p>
          <p className="text-sm mt-1">Currently showing real-time alerts only.</p>
        </div>
      </Card>
    </div>
  );
};
