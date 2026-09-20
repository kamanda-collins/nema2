import React from 'react';
import { 
  PremiumCard, 
  MetricCard, 
  ProgressIndicator, 
  MapSkeleton,
  EnvironmentalDashboard,
  EnhancedLoader,
  SpotlightBackground 
} from '@/components/ui/premium-components';
import { Wind, Droplets, TreePine, Activity, TrendingUp, AlertCircle } from 'lucide-react';

const UIShowcase = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      <SpotlightBackground />
      
      <div className="relative z-10 p-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Premium UI Components
          </h1>
          <p className="text-xl text-gray-600">
            Geo-Shape-Capture-Portal at its highest form
          </p>
          <div className="flex justify-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-premium text-white">Modern</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-ocean text-white">Professional</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-gray-300 text-gray-700">Enterprise-Ready</span>
          </div>
        </div>

        {/* Environmental Dashboard */}
        <section className="space-y-4 animate-slide-up">
          <h2 className="text-2xl font-bold text-gray-800">Environmental Metrics Dashboard</h2>
          <EnvironmentalDashboard />
        </section>

        {/* Premium Cards Showcase */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Premium Card Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PremiumCard variant="default">
              <h3 className="text-lg font-semibold mb-2">Default Card</h3>
              <p className="text-gray-600">Clean, professional white card with subtle shadow</p>
            </PremiumCard>
            
            <PremiumCard variant="gradient">
              <h3 className="text-lg font-semibold mb-2">Gradient Card</h3>
              <p className="text-gray-600">Elegant gradient background for featured content</p>
            </PremiumCard>
            
            <PremiumCard variant="glass">
              <h3 className="text-lg font-semibold mb-2">Glass Card</h3>
              <p className="text-gray-600">Modern glassmorphism effect with backdrop blur</p>
            </PremiumCard>
          </div>
        </section>

        {/* Progress Indicators */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Progress Indicators</h2>
          <PremiumCard variant="gradient">
            <div className="space-y-6">
              <ProgressIndicator 
                current={75} 
                total={100} 
                label="Site Analysis Progress"
              />
              <ProgressIndicator 
                current={45} 
                total={100} 
                label="Environmental Compliance"
              />
              <ProgressIndicator 
                current={90} 
                total={100} 
                label="Data Processing"
              />
            </div>
          </PremiumCard>
        </section>

        {/* Interactive Components */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Interactive Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PremiumCard variant="glass">
              <h3 className="text-lg font-semibold mb-4">Action Buttons</h3>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 text-white font-medium">
                  Primary Action
                </button>
                <button className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 hover:scale-105 transition-transform text-gray-700 font-medium">
                  Secondary
                </button>
                <button className="px-4 py-2 rounded-lg hover:bg-gray-100 hover:scale-105 transition-transform text-gray-700 font-medium">
                  Tertiary
                </button>
              </div>
            </PremiumCard>
            
            <PremiumCard variant="glass">
              <h3 className="text-lg font-semibold mb-4">Status Badges</h3>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500 text-white">✓ Active</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">⚡ Processing</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500 text-white">⚠ Warning</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500 text-white">✕ Error</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border border-gray-300 text-gray-700">◎ Pending</span>
              </div>
            </PremiumCard>
          </div>
        </section>

        {/* Loading States */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PremiumCard variant="default">
              <h3 className="text-lg font-semibold mb-4">Enhanced Loader</h3>
              <EnhancedLoader message="Analyzing environmental data..." />
            </PremiumCard>
            
            <PremiumCard variant="default">
              <h3 className="text-lg font-semibold mb-4">Map Skeleton</h3>
              <div className="h-64">
                <MapSkeleton />
              </div>
            </PremiumCard>
          </div>
        </section>

        {/* Micro-interactions Demo */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Micro-interactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="transform hover:scale-105 transition-all duration-300 cursor-pointer">
              <PremiumCard variant="gradient">
                <div className="text-center space-y-2">
                  <Wind className="w-12 h-12 mx-auto text-blue-600" />
                  <h3 className="font-semibold">Hover Me</h3>
                  <p className="text-sm text-gray-600">Scale animation</p>
                </div>
              </PremiumCard>
            </div>
            
            <div className="animate-pulse">
              <PremiumCard variant="gradient">
                <div className="text-center space-y-2">
                  <Activity className="w-12 h-12 mx-auto text-purple-600" />
                  <h3 className="font-semibold">Pulsing</h3>
                  <p className="text-sm text-gray-600">Pulse animation</p>
                </div>
              </PremiumCard>
            </div>
            
            <div className="animate-bounce">
              <PremiumCard variant="gradient">
                <div className="text-center space-y-2">
                  <AlertCircle className="w-12 h-12 mx-auto text-orange-600" />
                  <h3 className="font-semibold">Bouncing</h3>
                  <p className="text-sm text-gray-600">Bounce animation</p>
                </div>
              </PremiumCard>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">UI Quality Levels</h2>
          <PremiumCard variant="glass">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl mb-2">😐</div>
                  <h3 className="font-semibold text-lg">Basic</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Static components</li>
                  <li>• Basic styling</li>
                  <li>• No animations</li>
                  <li>• Hard to learn</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl mb-2">🙂</div>
                  <h3 className="font-semibold text-lg">Good (Current)</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Modern framework</li>
                  <li>• Professional design</li>
                  <li>• Basic animations</li>
                  <li>• Medium learning curve</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-4xl mb-2">🤩</div>
                  <h3 className="font-semibold text-lg">Highest Form</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Premium animations</li>
                  <li>• Glassmorphism</li>
                  <li>• Micro-interactions</li>
                  <li>• Delightful UX</li>
                </ul>
              </div>
            </div>
          </PremiumCard>
        </section>

        {/* Call to Action */}
        <section className="text-center space-y-4 pb-12">
          <PremiumCard variant="gradient" className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Ready to Implement?</h2>
            <p className="text-gray-600 mb-6">
              All these components are now available in your project. Check the UI_ENHANCEMENT_GUIDE.md for implementation details.
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 text-white font-semibold text-lg">
                Start Building
              </button>
              <button className="px-6 py-3 rounded-lg border-2 border-gray-300 hover:bg-gray-50 hover:scale-105 transition-all text-gray-700 font-semibold text-lg">
                View Docs
              </button>
            </div>
          </PremiumCard>
        </section>
      </div>
    </div>
  );
};

export default UIShowcase;
