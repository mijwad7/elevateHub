import api from "./api";  // Assuming this is your axios instance from apiRequests/api.js

export const createHelpRequest = async (title, description, categoryId, creditOfferChat, creditOfferVideo) => {
    try {
        console.log("Creating new help request...");
        const response = await api.post("/api/help-requests/", {
            title,
            description,
            category_id: categoryId,  // Matches backend field name
            credit_offer_chat: creditOfferChat,
            credit_offer_video: creditOfferVideo,
        });
        console.log("Help request created:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error creating help request:", error.response?.data || error.message);
        return null;
    }
};

export const getHelpRequests = async (url = "/api/help-requests/") => {
    try {
        console.log("Fetching help requests from:", url);
        const response = await api.get(url);
        console.log("Response received:", response.data);
        return response.data.map((request) => ({
            ...request,
            created_by: {
                username: request.created_by.username,
                profile: request.created_by.profile_image
            },
        }));
    } catch (error) {
        console.error("Error fetching help requests:", error.response?.data || error.message);
        return [];
    }
};

export const getHelpRequestDetails = async (requestId) => {
    try {
        console.log("Fetching help request details for ID:", requestId);
        const response = await api.get(`/api/help-requests/${requestId}/`);
        console.log("Response received:", response.data);
        return {
            ...response.data,
            created_by: {
                username: response.data.created_by.username,
                profile: response.data.created_by.profile_image
            },
        };
    } catch (error) {
        console.error("Error fetching help request details:", error.response?.data || error.message);
        return null;
    }
};

export const createHelpComment = async (requestId, content) => {
    try {
        console.log("Posting comment to help request:", requestId);
        const response = await api.post(`/api/help-requests/${requestId}/comments/`, { content });
        console.log("Comment posted:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error posting comment:", error.response?.data || error.message);
        return null;
    }
};

export const toggleCommentUpvote = async (requestId, commentId) => {
    try {
        console.log("Toggling upvote for comment:", commentId);
        const response = await api.post(`/api/help-requests/${requestId}/comments/${commentId}/toggle-upvote/`);
        console.log("Upvote response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error toggling upvote:", error.response?.data || error.message);
        return null;
    }
};

export const startChat = async (requestId) => {
    try {
        const response = await api.post(`api/help-requests/${requestId}/start-chat/`);
        return response.data;
    } catch (error) {
        console.error("Error starting chat:", error.response?.data || error.message);
        return null;
    }
};

export const endChat = async (chatId) => {
    try {
        const response = await api.post(`api/chat/${chatId}/end/`);
        return response.data;
    } catch (error) {
        console.error("Error ending chat:", error.response?.data || error.message);
        return null;
    }
};