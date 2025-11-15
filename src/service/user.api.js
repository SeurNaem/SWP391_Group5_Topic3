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

/**
 * Get charging sessions for the current user (charging history)
 * Tries common endpoint variations: User/sessions, Users/sessions, Session/user
 * @param {Object} params Optional query params (page, pageSize, filters)
 */
export const getUserSessions = async (params = {}) => {
    // Try common endpoint variations (backend might use singular or different path)
    const endpoints = ['User/sessions', 'Users/sessions', 'users/sessions', 'Session/user'];
    
    const rawToken = localStorage.getItem('token') || '';
    const token = String(rawToken).replaceAll('"', '');
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Try each endpoint
    for (const endpoint of endpoints) {
        try {
            const response = await api.get(endpoint, { params, headers });
            const payload = response?.data;
            
            // If we got data, return it immediately
            if (Array.isArray(payload) && payload.length > 0) return response;
            if (payload && Array.isArray(payload.data) && payload.data.length > 0) return response;
            if (payload && typeof payload === 'object') return response; // return any successful response
        } catch (error) {
            const status = error?.response?.status;
            // Continue to next endpoint on 404/405, otherwise break
            if (status !== 404 && status !== 405) {
                console.debug('getUserSessions failed with non-404 error:', status);
                break;
            }
        }
    }

    // FETCH fallback: call the same endpoint using the browser fetch API and include token from localStorage.
    // This helps in cases where axios instance config or interceptors differ from the Swagger request.
    try {
        const base = api.defaults?.baseURL || '';
        // normalize slashes
        const url = new URL(endpoint, base).href;
        const rawToken = localStorage.getItem('token') || '';
        const token = String(rawToken).replaceAll('"', '');
        const headers = { 'ngrok-skip-browser-warning': 'true' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(url + (Object.keys(params).length ? ('?' + new URLSearchParams(params).toString()) : ''), {
            method: 'GET',
            headers,
            credentials: 'same-origin'
        });

        if (res.ok) {
            const json = await res.json();
            // normalize to axios-like shape
            return { data: Array.isArray(json) ? json : (json?.data ?? json) };
        }

        // If fetch returned 404/405, return empty-shaped response
        if (res.status === 404 || res.status === 405) return { data: [] };

        // otherwise throw to let caller handle
        const bodyText = await res.text().catch(() => '');
        const err = new Error(`Fetch failed ${res.status}: ${bodyText}`);
        err.status = res.status;
        throw err;
    } catch (fetchErr) {
        // Give up and return empty-shaped response — caller should handle auth/server errors separately
        return { data: [] };
    }
};
