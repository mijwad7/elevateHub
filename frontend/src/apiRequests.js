import api from "./api";

export const getDiscussions = async () => {
    try {
        console.log("Fetching discussions...");
        const response = await api.get('/api/discussions/');
        console.log("Response received:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching discussions:", error);
    }
};


export const getDiscussionPosts = async (discussionId) => {
    try {
        console.log("Fetching discussion posts for discussion:", discussionId);
        const response = await api.get(`/api/discussions/${discussionId}/posts/`);
        console.log("Response received:", response.data);
        return response.data;
    } catch(error) {
        console.error("Error fetching discussion posts:", error);
    }
}