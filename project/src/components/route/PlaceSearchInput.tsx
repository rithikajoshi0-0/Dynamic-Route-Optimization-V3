import React, { useState, useEffect, useRef } from 'react';
import { openRouteService } from '../../services/openRouteService';
import { Place } from '../../types';
import { MapPin, Search, Loader } from 'lucide-react';

interface PlaceSearchInputProps {
  placeholder: string;
  onPlaceSelect: (place: Place) => void;
  value?: string;
  className?: string;
}

const PlaceSearchInput: React.FC<PlaceSearchInputProps> = ({
  placeholder,
  onPlaceSelect,
  value = '',
  className = '',
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchPlaces = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const places = await openRouteService.searchPlaces(searchQuery, 5);
      setSuggestions(places);
      setShowSuggestions(places.length > 0);
    } catch (error) {
      console.error('Place search failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(newQuery);
    }, 500); // Increased debounce time
  };

  const handlePlaceSelect = (place: Place) => {
    setQuery(place.name);
    setSuggestions([]);
    setShowSuggestions(false);
    onPlaceSelect(place);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
          {suggestions.map((place) => (
            <button
              key={place.id}
              onClick={() => handlePlaceSelect(place)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-slate-600 focus:bg-slate-600 focus:outline-none transition-colors"
            >
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium text-sm sm:text-base truncate">{place.name}</div>
                  <div className="text-gray-400 text-xs sm:text-sm truncate">{place.address}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 3 && !isLoading && suggestions.length === 0 && !showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg p-3">
          <div className="text-gray-400 text-sm">No places found. Try a different search term.</div>
        </div>
      )}
    </div>
  );
};

export default PlaceSearchInput;