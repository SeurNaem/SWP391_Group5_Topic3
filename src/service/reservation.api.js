import api from "../config/axios";

const API = "Reservation"

/**
 * Create a new reservation
 * @param {Object} reservationData - Reservation data
 * @param {number} reservationData.stationId - ID of the charging station
 * @param {number} reservationData.chargingPointId - ID of the charging point
 * @param {string} reservationData.startTime - Start time of the reservation (ISO string)
 * @param {string} reservationData.endTime - End time of the reservation (ISO string)
 * @param {string} reservationData.vehicleType - Type of vehicle
 * @param {string} reservationData.licensePlate - License plate of the vehicle
 * @returns {Promise} Promise object represents the reservation creation response
 */
export const createReservation = async (reservationData) => {
    try {
        const response = await api.post(API, reservationData);
        return response.data;
    } catch (error) {
        console.error("Error creating reservation:", error);
        throw error;
    }
};

/**
 * Get all reservations for the current user
 * @returns {Promise} Promise object represents the user's reservations
 */
export const getUserReservations = async () => {
    try {
        const response = await api.get(`${API}/user`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user reservations:", error);
        throw error;
    }
};

/**
 * Delete a reservation by ID
 * @param {number} reservationId - ID of the reservation to delete
 * @returns {Promise} Promise object represents the deletion response
 */
export const deleteReservation = async (reservationId) => {
    try {
        const response = await api.delete(`${API}/${reservationId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting reservation ${reservationId}:`, error);
        throw error;
    }
};

/**
 * Get reservation details by ID
 * @param {number} reservationId - ID of the reservation
 * @returns {Promise} Promise object represents the reservation data
 */
export const getReservationById = async (reservationId) => {
    try {
        const response = await api.get(`${API}/${reservationId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching reservation ${reservationId}:`, error);
        throw error;
    }
};

/**
 * Update a reservation
 * @param {number} reservationId - ID of the reservation to update
 * @param {Object} reservationData - Updated reservation data
 * @returns {Promise} Promise object represents the update response
 */
export const updateReservation = async (reservationId, reservationData) => {
    try {
        const response = await api.put(`${API}/${reservationId}`, reservationData);
        return response.data;
    } catch (error) {
        console.error(`Error updating reservation ${reservationId}:`, error);
        throw error;
    }
};

/**
 * Stop a running reservation / charging session
 * @param {number|string} reservationId
 * @returns {Promise}
 */
export const stopReservation = async (reservationId) => {
    try {
        // Try a dedicated stop endpoint first
        const response = await api.post(`${API}/${reservationId}/stop`);
        return response.data;
    } catch (error) {
        // Fallback: update reservation status to 'stopped'
        try {
            const response = await api.put(`${API}/${reservationId}`, { status: 'stopped' });
            return response.data;
        } catch (err) {
            console.error(`Error stopping reservation ${reservationId}:`, err);
            throw err;
        }
    }
};

/**
 * Check reservation availability for a time slot
 * @param {Object} availabilityData - Availability check data
 * @param {number} availabilityData.stationId - ID of the charging station
 * @param {number} availabilityData.chargingPointId - ID of the charging point (optional)
 * @param {string} availabilityData.startTime - Start time to check (ISO string)
 * @param {string} availabilityData.endTime - End time to check (ISO string)
 * @returns {Promise} Promise object represents the availability response
 */
export const checkAvailability = async (availabilityData) => {
    try {
        const response = await api.post(`${API}/check-availability`, availabilityData);
        return response.data;
    } catch (error) {
        console.error("Error checking availability:", error);
        throw error;
    }
};
