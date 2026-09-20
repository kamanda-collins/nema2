import React, { useState, lazy, Suspense } from 'react';
import { LocationProvider } from '@/contexts/LocationContext';
import { useFeatures } from '@/hooks/useFeatures';
import { useUserRole } from '@/hooks/useUserRole';
import { EnhancedHeader } from '@/components/Layout/EnhancedHeader';
// import { PrototypeNotice } from "@/components/Layout/PrototypeNotice";
import { SpotlightBackground } from "@/components/ui/premium-components";
import { EnhancedLoader } from "@/components/ui/premium-components";

// Lazy load heavy components for better performance
const StreamlinedFileUpload = lazy(() => import('@/components/StreamlinedFileUpload').then(module => ({ default: module.StreamlinedFileUpload })));
const MapSection = lazy(() => import("@/components/Map/MapSection").then(module => ({ default: module.MapSection })));
const AIAgent = lazy(() => import('@/components/AI/AIAgent').then(module => ({ default: module.AIAgent })));

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>('map');
  const [showUpload, setShowUpload] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; name: string; boundingBox?: number[] }>();
  const [currentShape, setCurrentShape] = useState<any>(null);
  // const [showNotice, setShowNotice] = useState(true);
  
  const { features } = useFeatures();
  const { isAdmin } = useUserRole();

  return (
    <LocationProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative transition-colors duration-300">
        {/* Premium Spotlight Background Effect */}
        <SpotlightBackground />
        {/* Refactored: Top Interactive Prototype Notice */}
        {/* <PrototypeNotice show={showNotice} onClose={() => setShowNotice(false)} /> */}

        {/* Enhanced Header */}
        <EnhancedHeader
          showUpload={showUpload}
          onToggleUpload={() => setShowUpload(!showUpload)}
          currentShape={currentShape}
          searchLocation={searchLocation}
          onLocationSelect={(
            lat: number,
            lng: number,
            name: string,
            boundingBox?: number[]
          ) => {
            const validLat = typeof lat === 'number' ? lat : parseFloat(String(lat));
            const validLng = typeof lng === 'number' ? lng : parseFloat(String(lng));
            if (isNaN(validLat) || isNaN(validLng)) return;
            setSearchLocation({ lat: validLat, lng: validLng, name: name || "Selected Location", boundingBox });
          }}
        />

        {/* Upload Section - Streamlined Premium Design */}
        {showUpload && (
          <div className="animate-slide-up border-b border-white/20 dark:border-slate-700/50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Suspense fallback={<EnhancedLoader message="Loading upload tools..." />}>
                <StreamlinedFileUpload onShapefileLoad={(data: any) => { 
                  console.log('Shapefile loaded:', data);
                  setCurrentShape(data);
                }} />
              </Suspense>
            </div>
          </div>
        )}

        {/* Main Content (delegated to MapSection) */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Suspense fallback={<EnhancedLoader message="Loading map interface..." />}>
            <MapSection
              searchLocation={searchLocation}
              setSearchLocation={setSearchLocation}
              currentShape={currentShape}
              setCurrentShape={setCurrentShape}
              showUpload={showUpload}
              setShowUpload={setShowUpload}
            />
          </Suspense>
        </main>

        {/* AI Agent - Floating Bot Icon */}
        <Suspense fallback={null}>
          <AIAgent />
        </Suspense>
      </div>
    </LocationProvider>
  );
};

export default Index;
