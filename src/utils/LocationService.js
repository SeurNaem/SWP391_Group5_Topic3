// LocationService.js - Utility functions for geolocation and distance calculations

/**
 * Get user's current location using Geolocation API
 * @returns {Promise<{lat: number, lng: number}>}
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                let errorMessage = 'Unable to get location';
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
            options
        );
    });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
};

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m away`;
    } else if (distance < 10) {
        return `${distance.toFixed(1)}km away`;
    } else {
        return `${Math.round(distance)}km away`;
    }
};

/**
 * Estimate travel time (rough calculation)
 * @param {number} distance - Distance in kilometers
 * @param {string} mode - Travel mode ('driving', 'walking', 'cycling')
 * @returns {string} Estimated time string
 */
export const estimateTravelTime = (distance, mode = 'driving') => {
    const speeds = {
        driving: 40, // km/h average city driving
        walking: 5,  // km/h
        cycling: 15  // km/h
    };

    const speed = speeds[mode] || speeds.driving;
    const timeInHours = distance / speed;
    const timeInMinutes = Math.round(timeInHours * 60);

    if (timeInMinutes < 60) {
        return `~${timeInMinutes} min`;
    } else {
        const hours = Math.floor(timeInMinutes / 60);
        const minutes = timeInMinutes % 60;
        return `~${hours}h ${minutes}min`;
    }
};

/**
 * Default location (Ho Chi Minh City center) as fallback
 */
export const DEFAULT_LOCATION = {
    lat: 10.8231,
    lng: 106.6297
};
