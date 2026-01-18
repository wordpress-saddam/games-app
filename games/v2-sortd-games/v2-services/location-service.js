const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  const flagMap = {
    'US': '🇺🇸', 'IN': '🇮🇳', 'GB': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
    'DE': '🇩🇪', 'FR': '🇫🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'BR': '🇧🇷',
    'RU': '🇷🇺', 'IT': '🇮🇹', 'ES': '🇪🇸', 'MX': '🇲🇽', 'KR': '🇰🇷',
    'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮'
  };
  
  return flagMap[countryCode.toUpperCase()] || 
         String.fromCodePoint(0x1F1E6 + countryCode.charCodeAt(0) - 65, 0x1F1E6 + countryCode.charCodeAt(1) - 65);
};

const fetchIPLocation = async () => {
  const locationServices = [
    {
      name: 'ipapi.co',
      url: 'https://ipapi.co/json/',
      parser: (data) => ({
        success: true,
        city: data.city,
        region: data.region,
        country: data.country_name,
        countryCode: data.country_code,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        flag: {
          emoji: getCountryFlag(data.country_code)
        },
        source: 'ipapi.co'
      })
    }
  ];

  for (const service of locationServices) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(service.url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const parsedData = service.parser(data);
      
      if (parsedData.success && parsedData.city) {
        return parsedData;
      }
    } catch (error) {
      console.log(`Failed to get location from ${service.name}:`, error);
      continue;
    }
  }

  return {
    success: false,
    error: 'Unable to detect location from IP address',
    source: 'none'
  };
};

const fetchBrowserLocation = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
        
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'YourAppName/1.0' 
              }
            }
          );
          
          if (!response.ok) {
            throw new Error('Reverse geocoding failed');
          }
          
          const data = await response.json();
          const address = data.address || {};
          
          resolve({
            success: true,
            city: address.city || address.town || address.village || address.municipality,
            region: address.state || address.region,
            country: address.country,
            countryCode: address.country_code?.toUpperCase(),
            latitude,
            longitude,
            flag: {
              emoji: getCountryFlag(address.country_code?.toUpperCase())
            },
            source: 'browser-gps',
            accuracy: position.coords.accuracy
          });
          
        } catch (error) {
          reject(new Error(`Reverse geocoding failed: ${error.message}`));
        }
      },
      (error) => {
        let errorMessage = 'Unknown geolocation error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  });
};

const fetchLocationWithFallback = async () => {
  try {
    console.log('Attempting browser geolocation...');
    const browserLocation = await fetchBrowserLocation();
    if (browserLocation.success && browserLocation.city) {
      return browserLocation;
    }
  } catch (error) {
    console.log('Browser geolocation failed:', error.message);
  }
  
  console.log('Falling back to IP geolocation...');
  return await fetchIPLocation();
};

export const LocationService = {
  fetchIPLocation,
  fetchBrowserLocation,
  fetchLocationWithFallback
};

// For TypeScript files that import this, we need to keep the type definition
export const LocationData = {};