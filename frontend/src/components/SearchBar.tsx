
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, MapPin, Loader2, Navigation, Building, Globe } from 'lucide-react';
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

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, name: string, boundingBox?: number[]) => void;
}

export const SearchBar = ({ onLocationSelect }: SearchBarProps) => {
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
    <div className="relative w-full max-w-2xl">
      {/* Main Search Container */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-4">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search places, addresses, coordinates..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 backdrop-blur-sm"
              disabled={isLoading}
            />
          </div>

          {/* Search Button */}
          <Button 
            onClick={() => searchLocation()}
            disabled={isLoading || !query.trim()}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>

          {/* Current Location Button */}
          <Button
            onClick={getCurrentLocation}
            disabled={isLoading}
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm"
            title="Use current location"
          >
            <Navigation className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Search Options */}
        <div className="flex gap-2 mt-3">
          {quickSearchOptions.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs h-7 bg-white/10 hover:bg-white/20 text-white/90 border-white/20 backdrop-blur-sm"
              onClick={() => {
                setSearchType(option.type);
                if (query) searchLocation();
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
          <div className="p-2">
            {results.map((result, index) => {
              const IconComponent = getSearchIcon(result.type);
              return (
                <div
                  key={`${result.place_id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="flex items-start gap-2 p-3 hover:bg-white/20 cursor-pointer rounded-xl text-sm border-b border-white/10 last:border-b-0 backdrop-blur-sm"
                >
                  <IconComponent className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-white/90 leading-tight block font-medium">
                      {result.display_name}
                    </span>
                    {result.type && (
                      <span className="text-xs text-white/60 capitalize">
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
  );
};
