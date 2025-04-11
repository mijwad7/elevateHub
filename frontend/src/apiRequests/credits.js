import api from "./api";

export const getCreditBalance = async (config = {}) => {
    try {
        const response = await api.get("/api/credits/balance/", config);
        return response.data.balance;
    } catch (error) {
        console.error("Error fetching credit balance:", error);
        return 0; // Fallback
    }
};

export const getCreditTransactions = async (config = {}) => {
    try {
        const response = await api.get("/api/credits/transactions/", config);
        return response.data;
    } catch (error) {
        console.error("Error fetching credit transactions:", error);
        return [];
    }
};