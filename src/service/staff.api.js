import api from "../config/axios";

/**
 * Get assigned stations for the logged-in staff
 * @returns {Promise} Promise object represents the assigned stations data
 */
export const getAssignedStations = async () => {
  try {
    const response = await api.get("Staff/assigned-stations");
    return response.data;
  } catch (error) {
    console.error("Error fetching assigned stations:", error);
    throw error;
  }
};

/**
 * Get station details by ID
 * @param {number} stationId - The ID of the station
 * @returns {Promise} Promise object represents the station data
 */
export const getStationById = async (stationId) => {
  try {
    const response = await api.get(`Staff/assigned-stations/${stationId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching station ${stationId}:`, error);
    throw error;
  }
};

/**
 * Get all charging points for a specific station
 * @param {number} stationId - The ID of the station
 * @returns {Promise} Promise object represents the charging points data
 */
export const getStationChargingPoints = async (stationId) => {
  try {
    const response = await api.get(`Staff/station/${stationId}/points`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching charging points for station ${stationId}:`, error);
    throw error;
  }
};

/**
 * Get session details by session ID
 * @param {number} sessionId - The ID of the session
 * @returns {Promise} Promise object represents the session data
 */
export const getSessionById = async (sessionId) => {
  try {
    const response = await api.get(`Staff/session/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching session ${sessionId}:`, error);
    throw error;
  }
};
