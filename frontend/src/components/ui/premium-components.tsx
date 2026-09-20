import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Wind, Droplets, TreePine } from 'lucide-react';

// Premium Card Component with variants
export const PremiumCard = ({ 
  children, 
  variant = 'default',
  className = ''
}: {
  children: React.ReactNode;
  variant?: 'default' | 'gradient' | 'glass';
  className?: string;
}) => {
  const variants = {
    default: 'bg-white shadow-lg hover:shadow-xl',
    gradient: 'bg-gradient-to-br from-white to-blue-50 shadow-lg hover:shadow-xl',
    glass: 'glass shadow-xl'
  };
  
  return (
    <div className={`
      ${variants[variant]}
      ${className}
      rounded-xl p-6 
      transform transition-all duration-300
      hover:-translate-y-1
      border border-gray-100
      animate-fade-in
    `}>
      {children}
    </div>
  );
};

// Enhanced Metric Card
export const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  trend = 'up',
  subtitle
}: {
  title: string;
  value: string | number;
  change?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}) => {
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50'
  };
  
  const trendIcons = {
    up: <TrendingUp className="w-3 h-3" />,
    down: <TrendingDown className="w-3 h-3" />,
    neutral: <Activity className="w-3 h-3" />
  };
  
  return (
    <PremiumCard variant="gradient">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 animate-scale-in">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {change && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendColors[trend]}`}>
              {trendIcons[trend]}
              {change}
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </PremiumCard>
  );
};

// Progress Indicator Component
export const ProgressIndicator = ({ 
  current, 
  total, 
  label,
  showPercentage = true 
}: { 
  current: number; 
  total: number; 
  label?: string;
  showPercentage?: boolean;
}) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="w-full space-y-2 animate-slide-up">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">{label}</span>
          <span className="text-muted-foreground">
            {showPercentage ? `${percentage}%` : `${current} / ${total}`}
          </span>
        </div>
      )}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader for Maps
export const MapSkeleton = () => (
  <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-100 animate-pulse">
      <div className="absolute top-4 left-4 w-64 h-12 bg-white/50 rounded-lg"></div>
      <div className="absolute top-4 right-4 flex gap-2">
        <div className="w-10 h-10 bg-white/50 rounded-lg"></div>
        <div className="w-10 h-10 bg-white/50 rounded-lg"></div>
      </div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 font-medium">Loading map...</p>
      </div>
    </div>
  </div>
);

// Environmental Dashboard Example
export const EnvironmentalDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      <MetricCard
        title="Air Quality Index"
        value="45"
        change="+5 from yesterday"
        trend="up"
        subtitle="Good"
        icon={Wind}
      />
      
      <MetricCard
        title="Water Quality"
        value="8.2 pH"
        change="Stable"
        trend="neutral"
        subtitle="Optimal range"
        icon={Droplets}
      />
      
      <MetricCard
        title="Forest Cover"
        value="85%"
        change="+2% this year"
        trend="up"
        subtitle="Protected areas"
        icon={TreePine}
      />
      
      <MetricCard
        title="Compliance Score"
        value="94"
        change="+3 points"
        trend="up"
        subtitle="NEMA standards"
        icon={Activity}
      />
    </div>
  );
};

// Enhanced Loading Component
export const EnhancedLoader = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
    <p className="text-gray-600 font-medium animate-pulse">{message}</p>
  </div>
);

// Spotlight Background Effect
export const SpotlightBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
  </div>
);

export default {
  PremiumCard,
  MetricCard,
  ProgressIndicator,
  MapSkeleton,
  EnvironmentalDashboard,
  EnhancedLoader,
  SpotlightBackground
};
