import api from "./api";

export const getDiscussions = async () => {
    const response = await api.get("/api/discussions");
    return response.data;
}

export const getDiscussionPosts = async (discussionId) => {
    const response = await api.get(`/api/discussions/${discussionId}/posts`);
    return response.data;
}