import React, { useState, memo } from "react";
import { MapContainer } from "./MapContainer";
import { GlassTabs } from "@/components/Layout/GlassTabs";
import { FloatingFeaturePanel } from "@/components/Layout/FloatingFeaturePanel";
import { useFeatures } from "@/hooks/useFeatures";
import { EnvironmentalDashboard } from "@/components/Environmental/EnvironmentalDashboard";
import { ReportsDashboard } from "@/components/Reports/ReportsDashboard";
import { ESIAReportGenerator } from "@/components/Reports/ESIAReportGenerator";
import { ComplianceReportGenerator } from "@/components/Reports/ComplianceReportGenerator";
import { FixedExportButton } from "@/components/Export/FixedExportButton";
import { NEMAMapExportDialog } from "@/components/NEMA/NEMAMapExportDialog";
import { Map as MapIcon, Shield } from "lucide-react";

// Tile layer sources - these map servers are open for public non-commercial/demo usage
export const availableTileLayers = [
  {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    name: "OpenStreetMap (Default)",
  },
  {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    name: "Topo Map",
  },
  {
    // Satellite imagery from Esri
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    name: "Satellite (Esri Imagery)",
  },
  {
    url: "https://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png",
    name: "Stamen Toner (B/W)",
  },
  {
    url: "https://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg",
    name: "Stamen Watercolor",
  },
  {
    url: "https://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg",
    name: "Stamen Terrain",
  },
];

export interface MapSectionProps {
  searchLocation: { lat: number; lng: number; name: string; boundingBox?: number[] } | undefined;
  setSearchLocation: React.Dispatch<React.SetStateAction<{ lat: number; lng: number; name: string; boundingBox?: number[] } | undefined>>;
  currentShape: any;
  setCurrentShape: (shape: any) => void;
  showUpload: boolean;
  setShowUpload: (v: boolean) => void;
}

export const MapSection: React.FC<MapSectionProps> = memo(({
  searchLocation,
  setSearchLocation,
  currentShape,
  setCurrentShape,
  showUpload,
  setShowUpload,
}) => {
  const [activeTab, setActiveTab] = useState<string>('map');
  const [currentMapLayer, setCurrentMapLayer] = useState(availableTileLayers[0].url);

  const { features } = useFeatures();

  const handleLayerChange = (layerUrl: string, layerName: string) => {
    setCurrentMapLayer(layerUrl);
    console.log('Layer changed to:', layerName);
  };

  const handleShapeCreated = (geoJSON: any) => {
    console.log('Shape created:', geoJSON);
    setCurrentShape(geoJSON);
  };

  return (
    <>
      <div className="mb-6">
        <GlassTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <div className="space-y-6 animate-fade-in">
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Map Layer Selector - Premium Style */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-xl shadow-lg border border-white/40 dark:border-slate-700/50">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <MapIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <label htmlFor="mapLayerSelect" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  Map View:
                </label>
                <select
                  id="mapLayerSelect"
                  className="flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={currentMapLayer}
                  onChange={e => handleLayerChange(
                    e.target.value,
                    availableTileLayers.find(l=>l.url===e.target.value)?.name || "Unknown"
                  )}
                >
                  {availableTileLayers.map(layer =>
                    <option key={layer.url} value={layer.url}>{layer.name}</option>
                  )}
                </select>
              </div>
              <div className="hidden sm:flex sm:gap-2">
                <FixedExportButton
                  currentShape={currentShape}
                  searchLocation={searchLocation}
                  features={features}
                />
                <NEMAMapExportDialog 
                  currentShape={currentShape}
                  trigger={
                    <button className="px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      NEMA Export
                    </button>
                  }
                />
              </div>
            </div>

            {/* Main Map Container - Enhanced */}
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/50 overflow-hidden relative animate-slide-up h-[450px] sm:h-[550px] md:h-[650px]">
              <MapContainer 
                onShapeCreated={handleShapeCreated}
                features={features}
                currentMapLayer={currentMapLayer}
                onLayerChange={handleLayerChange}
                searchLocation={searchLocation}
              />
              <FloatingFeaturePanel />
            </div>
          </div>
        )}

        {activeTab === 'environmental' && (
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/50 p-4 sm:p-6 md:p-8 animate-slide-up">
            <div className="mb-4 sm:mb-6 flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg flex-shrink-0">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent break-words">
                  Environmental Monitoring
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">Track and analyze environmental metrics in real-time</p>
              </div>
            </div>
            <EnvironmentalDashboard />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/50 p-4 sm:p-6 md:p-8 animate-slide-up">
              <div className="mb-4 sm:mb-6 flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex-shrink-0">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent break-words">
                    Reports & Compliance
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">Generate professional environmental reports and compliance documents</p>
                </div>
              </div>
              <ReportsDashboard />
            </div>
            
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/50 p-4 sm:p-6 md:p-8 animate-slide-up">
              <ESIAReportGenerator />
            </div>
            
            <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-2xl border border-white/40 dark:border-slate-700/50 p-4 sm:p-6 md:p-8 animate-slide-up">
              <ComplianceReportGenerator />
            </div>
          </div>
        )}
      </div>
    </>
  );
});
