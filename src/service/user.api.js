import api from "../config/axios";

/**
 * Get all users (admin only)
 * @returns {Promise} Promise object represents the users list response
 */
export const getAllUsers = async () => {
    try {
        const response = await api.get("User");
        return response.data;
    } catch (error) {
        console.error("Get all users error:", error);
        throw error;
    }
};

/**
 * Get user by ID
 * @param {string|number} id - User ID
 * @returns {Promise} Promise object represents the user data response
 */
export const getUserById = async (id) => {
    try {
        const response = await api.get(`User/${id}`);
        return response.data;
    } catch (error) {
        console.error("Get user by ID error:", error);
        throw error;
    }
};

/**
 * Get current user profile
 * @returns {Promise} Promise object represents the user profile response
 */
export const getUserProfile = async () => {
    try {
        const response = await api.get("User/profile");
        return response.data;
    } catch (error) {
        console.error("Get user profile error:", error);
        throw error;
    }
};

/**
 * Update current user profile
 * @param {Object} profileData - Profile data to update
 * @returns {Promise} Promise object represents the update response
 */
export const updateUserProfile = async (profileData) => {
    try {
        const response = await api.put("User/profile", profileData);
        return response.data;
    } catch (error) {
        console.error("Update user profile error:", error);
        throw error;
    }
};
