import api from "../config/axios";

/**
 * Auto-Stop Session Management API
 * Handles duration-based automatic session termination
 */

/**
 * Get sessions that have exceeded their planned duration
 * @param {number} stationId - The ID of the station
 * @returns {Promise} Promise object represents expired sessions
 */
export const getExpiredSessions = async (stationId) => {
    try {
        console.log(`API: Checking for expired sessions at station ${stationId}`);
        const response = await api.get(`Staff/station/${stationId}/expired-sessions`);
        console.log("API: Expired sessions data received:", response.data);
        return response.data;
    } catch (error) {
        console.error(`API: Error checking expired sessions for station ${stationId}:`, error);
        throw error;
    }
};

/**
 * Manually trigger auto-stop for a specific session
 * @param {number} sessionId - The ID of the session to auto-stop
 * @param {Object} stopData - Additional stop data
 * @returns {Promise} Promise object represents the auto-stop response
 */
export const triggerAutoStop = async (sessionId, stopData = {}) => {
    try {
        console.log(`API: Triggering auto-stop for session ${sessionId}`);

        const autoStopPayload = {
            sessionId: sessionId,
            endTime: new Date().toISOString(),
            energyConsumed: stopData.energyConsumed || 0,
            paymentMethod: stopData.paymentMethod || "e-wallet",
            createInvoice: true,
            autoStopped: true // Flag to indicate this was an automatic stop
        };

        console.log("API: Auto-stop payload:", autoStopPayload);

        // Use the existing stop session API
        const response = await api.post("Staff/session/stop", autoStopPayload);
        console.log("API: Auto-stop successful, response:", response);
        return response.data;
    } catch (error) {
        console.error(`API: Error auto-stopping session ${sessionId}:`, error);
        throw error;
    }
};

/**
 * Get sessions that are approaching their end time (for warnings)
 * @param {number} stationId - The ID of the station
 * @param {number} warningMinutes - Minutes before expiry to warn (default: 15)
 * @returns {Promise} Promise object represents sessions approaching expiry
 */
export const getSessionsNearingExpiry = async (stationId, warningMinutes = 15) => {
    try {
        console.log(`API: Checking for sessions nearing expiry at station ${stationId}`);
        const response = await api.get(`Staff/station/${stationId}/sessions/nearing-expiry?minutes=${warningMinutes}`);
        console.log("API: Sessions nearing expiry:", response.data);
        return response.data;
    } catch (error) {
        console.error(`API: Error checking sessions nearing expiry for station ${stationId}:`, error);
        // Return empty array if endpoint doesn't exist yet
        return [];
    }
};

/**
 * Calculate estimated energy consumption for auto-stop
 * @param {Object} session - Session object with duration and charging point info
 * @returns {number} Estimated energy consumed in kWh
 */
export const calculateEstimatedEnergy = (session) => {
    if (!session.startTime || !session.maxPower) {
        return 0;
    }

    const startTime = new Date(session.startTime);
    const currentTime = new Date();
    const actualHours = (currentTime - startTime) / (1000 * 60 * 60);

    // Estimate energy with 80% charging efficiency
    const estimatedEnergy = actualHours * session.maxPower * 0.8;

    console.log(`Energy calculation: ${actualHours.toFixed(2)}h × ${session.maxPower}kW × 0.8 = ${estimatedEnergy.toFixed(2)}kWh`);

    return Math.round(estimatedEnergy * 100) / 100; // Round to 2 decimal places
};

/**
 * Check if a session should be auto-stopped based on planned duration
 * @param {Object} session - Session object with startTime and planned duration
 * @returns {Object} Information about session expiry status
 */
export const checkSessionExpiry = (session) => {
    if (!session.startTime || !session.duration) {
        return { shouldStop: false, reason: "Missing session data" };
    }

    const startTime = new Date(session.startTime);
    const plannedEndTime = new Date(startTime.getTime() + (session.duration * 60 * 60 * 1000));
    const currentTime = new Date();
    const remainingMinutes = (plannedEndTime - currentTime) / (1000 * 60);

    if (remainingMinutes <= 0) {
        const overrunMinutes = Math.abs(remainingMinutes);
        return {
            shouldStop: true,
            reason: `Session exceeded planned duration by ${overrunMinutes.toFixed(1)} minutes`,
            overrunMinutes: overrunMinutes,
            plannedEndTime: plannedEndTime
        };
    }

    return {
        shouldStop: false,
        remainingMinutes: remainingMinutes,
        plannedEndTime: plannedEndTime,
        reason: `${remainingMinutes.toFixed(1)} minutes remaining`
    };
};

export default {
    getExpiredSessions,
    triggerAutoStop,
    getSessionsNearingExpiry,
    calculateEstimatedEnergy,
    checkSessionExpiry
};
