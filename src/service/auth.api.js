import api from "../config/axios";

/**
 * Login user with email and password
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Promise} Promise object represents the login response
 */
export const login = async (credentials) => {
  try {
    const response = await api.post("Auth/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise} Promise object represents the registration response
 */
export const register = async (userData) => {
  try {
    const response = await api.post("Auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

/**
 * Logout user
 * @returns {Promise} Promise object represents the logout response
 */
export const logout = async () => {
  try {
    const response = await api.post("Auth/logout");
    return response.data;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
};
