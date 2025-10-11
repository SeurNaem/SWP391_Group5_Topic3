import api from "../config/axios";

const API = "/service"

export const fetchService = async () => {
    // Implementation of fetch function
    return await api.get(API);
};

export const postService = async (service) => {
    // Implementation of post function
    return await api.post(API, service);
};

export const putService = async (service) => {
    // Implementation of put function
    return await api.put(API, service);
};

export const removeService = async (id) => {
    // Implementation of remove function
    return await api.delete(`${API}/${id}`);
};
