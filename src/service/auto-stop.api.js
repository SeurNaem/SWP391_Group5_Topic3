import api from "../config/axios";

/**
 * Auto-Stop Session Management API
 * Simplified approach using client-side expiry detection
 */

/**
 * Trigger auto-stop for a specific session
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
 * @param {Object} session - Session object with startTime and planned duration (in minutes)
 * @returns {Object} Information about session expiry status
 */
export const checkSessionExpiry = (session) => {
    if (!session.startTime || !session.duration) {
        return { shouldStop: false, reason: "Missing session data" };
    }

    const startTime = new Date(session.startTime);
    const plannedEndTime = new Date(startTime.getTime() + (session.duration * 60 * 1000)); // Changed from hours to minutes
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

/**
 * Get all sessions that have exceeded their planned duration from a list
 * Client-side filtering function
 * @param {Array} sessions - Array of active sessions
 * @returns {Array} Array of expired sessions
 */
export const filterExpiredSessions = (sessions) => {
    if (!Array.isArray(sessions)) {
        return [];
    }

    return sessions.filter(session => {
        const expiryCheck = checkSessionExpiry(session);
        return expiryCheck.shouldStop;
    });
};

export default {
    triggerAutoStop,
    calculateEstimatedEnergy,
    checkSessionExpiry,
    filterExpiredSessions
};
