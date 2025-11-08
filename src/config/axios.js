import axios from "axios";

// Set config defaults when creating the instance
const api = axios.create({
  baseURL: "https://thioacetic-danny-postpositively.ngrok-free.dev/api/",
});

// Add ngrok-skip-browser-warning header for ngrok
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")?.replaceAll('"', "");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    // Add ngrok header to skip browser warning
    config.headers["ngrok-skip-browser-warning"] = "true";
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

export default api;
