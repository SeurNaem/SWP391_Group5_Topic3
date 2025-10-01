import axios from "axios";

// Set config defaults when creating the instance
const api = axios.create({
    baseURL: 'http://14.225.212.245:8080/api'
});

export default api;