import api from '../config/axios';

/**
 * Get vehicle information by driver ID
 * @param {string} driverId - The driver ID
 * @returns {Promise} Vehicle information including model, battery, and connector type
 */
export const getVehicleByDriverId = async (driverId) => {
    try {
        const response = await api.get(`VehicleSim/driver/${driverId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vehicle info:', error);
        throw error;
    }
};
