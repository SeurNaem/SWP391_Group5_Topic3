import api from "../config/axios";

const API = "/Payment"

export const fetchPayments = async () => {
    // Implementation of fetch all payments function
    return await api.get(API);
};

export const fetchPaymentById = async (id) => {
    // Implementation of fetch payment by id function
    return await api.get(`${API}/${id}`);
};
