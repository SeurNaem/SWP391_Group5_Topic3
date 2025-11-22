import api from "../config/axios";

const API = "/admin/stations"

/**
 * Get all stations for admin
 * @returns {Promise} Promise object represents all stations data
 */
export const fetchAllStations = async () => {
    try {
        const response = await api.get(API);
        return response.data;
    } catch (error) {
        console.error("Error fetching all stations:", error);
        throw error;
    }
};

/**
 * Get station details by ID including charging points
 * @param {number} stationId - ID of the station
 * @returns {Promise} Promise object represents the station data with charging points
 */
export const fetchStationById = async (stationId) => {
    try {
        const response = await api.get(`${API}/${stationId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching station ${stationId}:`, error);
        throw error;
    }
};

/**
 * Update station status
 * @param {number} stationId - ID of the station
 * @param {string} status - New status (online/offline)
 * @returns {Promise} Promise object represents the update response
 */
export const updateStationStatus = async (stationId, status) => {
    try {
        const response = await api.put(`${API}/${stationId}/status`, { status });
        return response.data;
    } catch (error) {
        console.error(`Error updating station ${stationId} status:`, error);
        throw error;
    }
};

/**
 * Toggle charging point status
 * @param {number} pointId - ID of the charging point
 * @param {number} stationId - ID of the station
 * @param {string} status - New status for the charging point
 * @returns {Promise} Promise object represents the toggle response
 */
export const toggleChargingPointStatus = async (pointId, stationId, status) => {
    try {
        const response = await api.post(`${API}/points/${pointId}/toggle`, {
            stationId: stationId,
            status: status
        });
        return response.data;
    } catch (error) {
        console.error(`Error toggling charging point ${pointId} status:`, error);
        throw error;
    }
};

/**
 * Get charging points status summary for all stations
 * @returns {Promise} Promise object represents the status summary
 */
export const fetchPointsStatusSummary = async () => {
    try {
        const response = await api.get(`${API}/points/status-summary`);
        return response.data;
    } catch (error) {
        console.error("Error fetching points status summary:", error);
        throw error;
    }
};
