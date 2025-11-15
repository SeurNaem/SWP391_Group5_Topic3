import api from "../config/axios";

/**
 * Start a charging session (driver)
 * @param {object} sessionData - { userId, pointId, reservationId, vehicleId, minutes, paymentMethod }
 * @returns {Promise} Promise object represents the started session data
 */
export const startChargingSession = async (sessionData) => {
    try {
        const response = await api.post("ChargingSession/start", sessionData);
        return response.data;
    } catch (error) {
        console.error("Error starting charging session:", error);
        throw error;
    }
};

/**
 * Stop a charging session (driver)
 * @param {object} stopData - { sessionId, endTime, energyConsumed, paymentMethod, createInvoice }
 * @returns {Promise} Promise object represents the stopped session data
 */
export const stopChargingSession = async (stopData) => {
    try {
        const response = await api.post("ChargingSession/stop", stopData);
        return response.data;
    } catch (error) {
        console.error("Error stopping charging session:", error);
        throw error;
    }
};
