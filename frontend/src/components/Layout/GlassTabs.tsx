
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Satellite, Activity, BarChart3, TrendingUp, FileText } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface GlassTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const GlassTabs: React.FC<GlassTabsProps> = ({ activeTab, onTabChange }) => {
  const { isAdmin } = useUserRole();

  const tabs = [
    { id: 'map', label: 'Map & Analysis', shortLabel: 'Map', icon: Map, description: 'Interactive mapping and geospatial tools' },
    { id: 'environmental', label: 'Environmental Monitoring', shortLabel: 'Environment', icon: Satellite, description: 'Track environmental metrics' },
    { id: 'reports', label: 'Reports & Compliance', shortLabel: 'Reports', icon: FileText, description: 'Generate professional reports' },
  ];

  return (
    <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-xl border border-white/40 dark:border-slate-700/50 p-2 w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid grid-cols-3 gap-2 bg-transparent p-0 h-auto">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl
                          bg-white/50 dark:bg-slate-800/50 border border-gray-200/50 dark:border-slate-600/50
                          data-[state=active]:bg-gradient-to-br 
                          data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 
                          data-[state=active]:text-white data-[state=active]:shadow-lg
                          data-[state=active]:border-0
                          hover:bg-white dark:hover:bg-slate-700 hover:shadow-md
                          transition-all duration-300
                          text-gray-700 dark:text-gray-200 font-semibold"
                title={tab.description}
              >
                <IconComponent className={`h-5 w-5 ${isActive ? 'animate-scale-in' : ''}`} />
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-sm">{tab.shortLabel}</span>
                  <span className="text-xs opacity-80 font-normal hidden lg:block">{tab.description}</span>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};
