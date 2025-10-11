import api from "../config/axios";

const API = "/pet-types"

export const fetchTypes = async () => {
    // Implementation of fetch function
    return await api.get(API);
};

export const postType = async (type) => {
    // Implementation of post function
    return await api.post(API, type);
};

export const putType = async (type) => {
    // Implementation of put function
    return await api.put(API, type);
};

export const removeType = async (id) => {
    // Implementation of remove function
    return await api.delete(`${API}/${id}`);
};
