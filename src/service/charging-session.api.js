import api from "../config/axios";

/**
 * Start a charging session for user
 * @param {Object} sessionData - The session data
 * @param {number} sessionData.pointId - Charging point ID
 * @param {number} sessionData.reservationId - Reservation ID
 * @param {number} sessionData.vehicleId - Vehicle ID (optional, can be 0)
 * @param {number} sessionData.minutes - Duration in minutes
 * @param {string} sessionData.paymentMethod - Payment method (e.g., "wallet", "card")
 * @returns {Promise} Promise object represents the started session data
 */
export const startChargingSession = async (sessionData) => {
  try {
    console.log("API: Calling POST ChargingSession/start with data:", sessionData);
    const response = await api.post("ChargingSession/start", sessionData);
    console.log("API: Charging session start successful, response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API: Error starting charging session:", error);
    console.error("API: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    throw error;
  }
};

/**
 * Stop a charging session for user
 * @param {Object} sessionData - The session data
 * @param {number} sessionData.sessionId - Session ID to stop
 * @param {number} sessionData.pointId - Charging point ID
 * @returns {Promise} Promise object represents the stopped session data
 */
export const stopChargingSession = async (sessionData) => {
  try {
    console.log("API: Calling POST ChargingSession/stop with data:", sessionData);
    const response = await api.post("ChargingSession/stop", sessionData);
    console.log("API: Charging session stop successful, response:", response.data);
    return response.data;
  } catch (error) {
    console.error("API: Error stopping charging session:", error);
    console.error("API: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    throw error;
  }
};
