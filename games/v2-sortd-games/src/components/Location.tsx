import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, RotateCcw, Navigation, Globe } from 'lucide-react';
import { LocationService, LocationData } from '../../v2-services/location-service';

interface LocationProps {
  isOpen: boolean;
  onLocationUpdate: (locationData: LocationData | null) => void;
  onLocationConfirmed: (confirmed: boolean) => void;
  onCustomLocationChange: (location: string) => void;
  locationConfirmed?: boolean | null;
  customLocation?: string;
  disabled?: boolean;
}

type DetectionMethod = 'auto' | 'gps' | 'ip';

const Location: React.FC<LocationProps> = ({
  isOpen,
  onLocationUpdate,
  onLocationConfirmed,
  onCustomLocationChange,
  locationConfirmed = null,
  customLocation = '',
  disabled = false
}) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [detectionMethod, setDetectionMethod] = useState<DetectionMethod>('auto');

  useEffect(() => {
    if (!isOpen) return;
    
    fetchLocation('auto');
  }, [isOpen]);

  const fetchLocation = async (method: DetectionMethod): Promise<void> => {
    setIsLoadingLocation(true);
    setDetectionMethod(method);
    console.log(method)
    try {
      let location: LocationData;
      
      switch (method) {
        case 'gps':
          location = await LocationService.fetchBrowserLocation();
          break;
        case 'ip':
          location = await LocationService.fetchIPLocation();
          break;
        case 'auto':
        default:
          location = await LocationService.fetchLocationWithFallback();
          break;
      }
      
      setLocationData(location);
      onLocationUpdate(location);
      
    } catch (error) {
      console.error('Failed to fetch location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorData: LocationData = {
        success: false,
        error: errorMessage,
        source: 'error'
      };
      setLocationData(errorData);
      onLocationUpdate(errorData);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleLocationChoice = (confirmed: boolean): void => {
    onLocationConfirmed(confirmed);
  };

  const handleCustomLocationInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onCustomLocationChange(e.target.value);
  };

  const getMethodDisplayName = (method: DetectionMethod): string => {
    switch (method) {
      case 'auto':
        return 'Auto (GPS + IP)';
      case 'gps':
        return 'GPS';
      case 'ip':
        return 'IP';
      default:
        return method;
    }
  };

  const formatLocationString = (data: LocationData): string => {
    const parts: string[] = [];
    
    if (data.city) parts.push(data.city);
    if (data.region) parts.push(data.region);
    if (data.country) parts.push(data.country);
    
    return parts.join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="space-y-4">
     

      {isLoadingLocation ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Fetching your location...
          </div>
          {/* <div className="text-xs text-muted-foreground">
            Method: {getMethodDisplayName(detectionMethod)}
          </div> */}
        </div>
      ) : locationData?.success ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            {locationData.flag?.emoji && (
              <span className="text-lg">{locationData.flag.emoji}</span>
            )}
            <span>
              Are you from{" "}
              <strong>{formatLocationString(locationData)}</strong>?
            </span>
          </div>
          
         

          <div className="flex gap-2">
            <Button
              type="button"
              variant={locationConfirmed === true ? "default" : "outline"}
              size="sm"
              onClick={() => handleLocationChoice(true)}
              disabled={disabled}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={locationConfirmed === false ? "default" : "outline"}
              size="sm"
              onClick={() => handleLocationChoice(false)}
              disabled={disabled}
            >
              No
            </Button>
          </div>

          {/* <div className="flex gap-1 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fetchLocation('gps')}
              disabled={disabled || isLoadingLocation}
              className="text-xs h-7 px-2"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Try GPS
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fetchLocation('ip')}
              disabled={disabled || isLoadingLocation}
              className="text-xs h-7 px-2"
            >
              <Globe className="h-3 w-3 mr-1" />
              Try IP
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fetchLocation('auto')}
              disabled={disabled || isLoadingLocation}
              className="text-xs h-7 px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div> */}

          {locationConfirmed === false && (
            <div className="space-y-2">
              <Label htmlFor="customLocation" className="text-sm">
                Enter your location
              </Label>
              <Input
                id="customLocation"
                type="text"
                placeholder="Your location..."
                value={customLocation}
                onChange={handleCustomLocationInput}
                maxLength={50}
                disabled={disabled}
                autoComplete="off"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {locationData?.error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {locationData.error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="manualLocation" className="text-sm">
              Enter your location
            </Label>
            <Input
              id="manualLocation"
              type="text"
              placeholder="Your location..."
              value={customLocation}
              onChange={handleCustomLocationInput}
              maxLength={50}
              disabled={disabled}
              autoComplete="off"
            />
          </div>
          
          {/* <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchLocation('auto')}
              disabled={disabled || isLoadingLocation}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry Auto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fetchLocation('gps')}
              disabled={disabled || isLoadingLocation}
            >
              <Navigation className="h-4 w-4 mr-1" />
              Try GPS
            </Button>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default Location;