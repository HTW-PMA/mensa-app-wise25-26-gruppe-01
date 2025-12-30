import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook zum Abrufen des aktuellen Standorts
 */
export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const getLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Berechtigung anfordern
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setPermissionDenied(true);
        setError('Standortzugriff wurde verweigert');
        setLoading(false);
        return;
      }

      setPermissionDenied(false);

      // Aktuellen Standort abrufen
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (err) {
      console.error('Location error:', err);
      setError('Standort konnte nicht ermittelt werden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    loading,
    error,
    permissionDenied,
    refresh: getLocation,
  };
}

/**
 * Berechnet die Distanz zwischen zwei Koordinaten in Kilometern
 * Verwendet die Haversine-Formel
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Erdradius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Formatiert die Distanz für die Anzeige
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    // Unter 1 km in Metern anzeigen
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  // Ab 1 km mit einer Dezimalstelle
  return `${distanceKm.toFixed(1)} km`;
}
