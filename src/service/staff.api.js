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

/**
 * Get all active sessions for a specific station
 * @param {number} stationId - The ID of the station
 * @returns {Promise} Promise object represents the active sessions data
 */
export const getStationActiveSessions = async (stationId) => {
  try {
    console.log(`API: Fetching active sessions from Staff/station/${stationId}/active-sessions`);
    const response = await api.get(`Staff/station/${stationId}/active-sessions`);
    console.log("API: Active sessions data received:", response.data);
    return response.data;
  } catch (error) {
    console.error(`API: Error fetching active sessions for station ${stationId}:`, error);
    throw error;
  }
};

/**
 * Get all reservations for a specific station
 * @param {number} stationId - The ID of the station
 * @returns {Promise} Promise object represents the reservations data
 */
export const getStationReservations = async (stationId) => {
  try {
    console.log(`API: Fetching reservations from Staff/station/${stationId}/reservations`);
    const response = await api.get(`Staff/station/${stationId}/reservations`);
    console.log("API: Reservations data received:", response.data);
    return response.data;
  } catch (error) {
    console.error(`API: Error fetching reservations for station ${stationId}:`, error);
    throw error;
  }
};

/**
 * Get reservation details by reservation ID
 * @param {number} reservationId - The ID of the reservation
 * @returns {Promise} Promise object represents the reservation data with userId
 */
export const getReservationById = async (reservationId) => {
  try {
    console.log(`API: Fetching reservation from Staff/reservation/${reservationId}`);
    // Try Staff endpoint first, which might include more details
    const response = await api.get(`Staff/reservation/${reservationId}`);
    console.log("API: Reservation data received:", response.data);
    return response.data;
  } catch (error) {
    console.error(`API: Error fetching from Staff endpoint:`, error.response?.status);
    // Fallback to regular Reservation endpoint if Staff endpoint doesn't exist
    try {
      console.log(`API: Trying fallback Reservation/${reservationId}`);
      const fallbackResponse = await api.get(`Reservation/${reservationId}`);
      console.log("API: Fallback reservation data received:", fallbackResponse.data);
      return fallbackResponse.data;
    } catch (fallbackError) {
      console.error(`API: Fallback reservation fetch also failed:`, fallbackError);
      throw error; // Throw the original error
    }
  }
};

/**
 * Start a charging session
 * @param {object} sessionData - The session data
 * @param {number} sessionData.userId - User ID
 * @param {number} sessionData.pointId - Charging point ID  
 * @param {number} sessionData.reservationId - Reservation ID
 * @param {number} sessionData.vehicleId - Vehicle ID (optional, can be 0)
 * @param {number} sessionData.minutes - Duration in minutes for auto-stop
 * @param {string} sessionData.paymentMethod - Payment method
 * @returns {Promise} Promise object represents the started session data
 */
export const startSession = async (sessionData) => {
  try {
    console.log("API: Calling POST Staff/session/start with data:", sessionData);
    console.log("API: Session will auto-stop after", sessionData.minutes, "minutes");
    const response = await api.post("Staff/session/start", sessionData);
    console.log("API: Session start successful, response:", response);
    return response.data;
  } catch (error) {
    console.error("API: Error starting session:", error);
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
 * Stop a charging session
 * @param {object} sessionData - The session data (pointId, sessionId, etc.)
 * @returns {Promise} Promise object represents the stopped session data
 */
export const stopSession = async (sessionData) => {
  try {
    console.log("API: Calling POST Staff/session/stop with data:", sessionData);
    const response = await api.post("Staff/session/stop", sessionData);
    console.log("API: Session stop successful, response:", response);
    return response.data;
  } catch (error) {
    console.error("API: Error stopping session:", error);
    console.error("API: Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    throw error;
  }
};