import api from "../config/axios";

const API = "/Wallet"

export const fetchWallets = async () => {
    // Implementation of fetch all wallets function
    return await api.get(API);
};

export const fetchWalletById = async (id) => {
    // Implementation of fetch wallet by id function
    return await api.get(`${API}/${id}`);
};

export const deductFromWallet = async (walletId, amount) => {
    // Implementation of wallet deduction function
    const deductRequest = {
        walletId: walletId,
        amount: amount
    };
    return await api.post(`${API}/Deduct`, deductRequest);
};
