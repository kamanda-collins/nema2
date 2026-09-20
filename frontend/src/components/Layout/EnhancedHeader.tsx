
import React, { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FixedExportButton } from '@/components/Export/FixedExportButton';
import { AuthModal } from '@/components/Auth/AuthModal';
import { UserProfile } from '@/components/Auth/UserProfile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Upload, Map, Bot, Search, MapPin, Loader2, Navigation, Building, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: string[];
  type: string;
  importance: number;
  place_id: string;
}

interface EnhancedHeaderProps {
  showUpload: boolean;
  onToggleUpload: () => void;
  currentShape: any;
  searchLocation?: { lat: number; lng: number; name: string; boundingBox?: number[] };
  onLocationSelect: (lat: number, lng: number, name: string, boundingBox?: number[]) => void;
}

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = memo(({
  showUpload,
  onToggleUpload,
  currentShape,
  onLocationSelect
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const { toast } = useToast();

  const getSearchIcon = (type: string) => {
    if (type.includes('building') || type.includes('house')) return Building;
    if (type.includes('administrative')) return Globe;
    return MapPin;
  };

  const searchLocation = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch.trim()) return;

    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams({
        format: 'json',
        q: queryToSearch,
        limit: '10',
        addressdetails: '1',
        extratags: '1',
        namedetails: '1',
        dedupe: '1'
      });

      if (searchType !== 'all') {
        searchParams.append('class', searchType);
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`
      );
      
      if (!response.ok) throw new Error('Search failed');
      
      const data: SearchResult[] = await response.json();
      const sortedResults = data.sort((a, b) => (b.importance || 0) - (a.importance || 0));
      
      setResults(sortedResults);
      setShowResults(sortedResults.length > 0);
      
      if (sortedResults.length === 0) {
        toast({
          title: "No Results",
          description: "No locations found. Try a different search term.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for locations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const boundingBox = result.boundingbox ? result.boundingbox.map(Number) : undefined;
    
    onLocationSelect(lat, lng, result.display_name, boundingBox);
    setShowResults(false);
    setQuery('');
    
    toast({
      title: "Location Found",
      description: `Navigating to ${result.display_name}`,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationSelect(latitude, longitude, "Your Location");
        setIsLoading(false);
        toast({
          title: "Location Found",
          description: "Showing your current location",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        toast({
          title: "Location Error",
          description: "Could not get your location. Please search manually.",
          variant: "destructive"
        });
      }
    );
  };

  const quickSearchOptions = [
    { label: 'Buildings', type: 'building' },
    { label: 'Cities', type: 'place' },
    { label: 'Roads', type: 'highway' },
  ];

  return (
    <header className="backdrop-blur-xl bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-slate-900/95 dark:to-slate-800/95 border-b border-white/30 dark:border-slate-700/50 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simplified Search bar - cleaner, professional */}
        <div className="py-2 sm:py-3 border-b border-white/20 dark:border-slate-700/30">
          <div className="w-full max-w-3xl mx-auto">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search locations..."
                  className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm bg-white/90 dark:bg-slate-800/90 border-gray-200 dark:border-slate-600 shadow-sm rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
                  disabled={isLoading}
                />
              </div>
              <Button 
                onClick={() => searchLocation()}
                disabled={isLoading || !query.trim()}
                size="sm"
                className="h-9 sm:h-10 px-2 sm:px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">Search</span>
                  </>
                )}
              </Button>
              <Button
                onClick={getCurrentLocation}
                disabled={isLoading}
                size="sm"
                variant="outline"
                title="Use current location"
                className="h-9 sm:h-10 px-2 sm:px-3 md:px-4 flex-shrink-0"
              >
                <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:mr-2" />
                <span className="hidden md:inline text-sm">My Location</span>
              </Button>
            </div>

            {/* Search Results */}
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg">
                <div className="p-1">
                  {results.map((result, index) => {
                    const IconComponent = getSearchIcon(result.type);
                    return (
                      <div
                        key={`${result.place_id}-${index}`}
                        onClick={() => handleResultClick(result)}
                        className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer rounded text-xs border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                      >
                        <IconComponent className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-900 dark:text-gray-100 leading-tight block font-medium break-words">
                            {result.display_name}
                          </span>
                          {result.type && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {result.type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main header row */}
        <div className="flex items-center justify-between h-12 gap-4">
          {/* Logo and Title - Cleaner, more professional */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Map className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
                GeoShape
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium hidden md:block truncate">Environmental Intelligence Platform</p>
            </div>
          </div>

          {/* Action Buttons - Streamlined */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            <Button
              onClick={onToggleUpload}
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 px-2 sm:px-3 backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline text-sm">Upload</span>
            </Button>

            <div className="hidden sm:block">
              <FixedExportButton 
                currentShape={currentShape}
              />
            </div>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />

            <ThemeToggle />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden md:block">
                <UserProfile />
              </div>
              <Button
                onClick={() => setShowAuthModal(true)}
                size="sm"
                className="h-8 sm:h-9 px-2.5 sm:px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm whitespace-nowrap"
              >
                <span className="hidden xs:inline">Sign In</span>
                <span className="xs:hidden">Sign</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal 
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
      />
    </header>
  );
});
