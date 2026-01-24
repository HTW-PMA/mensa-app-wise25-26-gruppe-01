/**
 * Location utility functions
 * Extracted from useLocation hook to avoid circular dependencies
 */

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