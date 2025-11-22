import api from "../config/axios";

const API = "/admin/reports"

// Get revenue report by station
export const fetchRevenueReport = async () => {
    try {
        const response = await api.get(`${API}/revenue`);
        return response.data;
    } catch (error) {
        console.error("Error fetching revenue report:", error);
        throw error;
    }
};

// Get usage report by station
export const fetchUsageReport = async () => {
    try {
        const response = await api.get(`${API}/usage`);
        return response.data;
    } catch (error) {
        console.error("Error fetching usage report:", error);
        throw error;
    }
};

// Get peak hours report
export const fetchPeakHoursReport = async () => {
    try {
        const response = await api.get(`${API}/peak-hours`);
        return response.data;
    } catch (error) {
        console.error("Error fetching peak hours report:", error);
        throw error;
    }
};

// Get summary report
export const fetchSummaryReport = async () => {
    try {
        const response = await api.get(`${API}/summary`);
        return response.data;
    } catch (error) {
        console.error("Error fetching summary report:", error);
        throw error;
    }
};
