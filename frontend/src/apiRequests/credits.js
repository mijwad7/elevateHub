import api from "./api";

export const getCreditBalance = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await api.get("/api/credits/balance/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.balance;
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    return 0; // Fallback to 0 if error occurs
  }
};

export const getCreditTransactions = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await api.get("/api/credits/transactions/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching credit transactions:", error);
    return [];
  }
};
