import api from "../config/axios";

const API = "/service-group"

export const fetchServiceGroup = async () => {
    // Implementation of fetch function
    return await api.get(API);
};

export const postServiceGroup = async (serviceGroup) => {
    // Implementation of post function
    return await api.post(API, serviceGroup);
};

export const putServiceGroup = async (serviceGroup) => {
    // Implementation of put function
    return await api.put(API, serviceGroup);
};

export const removeServiceGroup = async (id) => {
    // Implementation of remove function
    return await api.delete(`${API}/${id}`);
};
