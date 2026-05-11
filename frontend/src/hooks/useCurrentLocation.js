import { useEffect, useState } from 'react';

export function useCurrentLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => setError('We could not access your location.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, locationError: error };
}
