import api from "./api";

export const createDiscussion = async (title, description, categoryId) => {
  try {
    console.log("Creating new discussion...");
    const response = await api.post("/api/discussions/", { title, description, category_id: categoryId });
    console.log("Discussion created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating discussion:", error);
    return null;
  }
};

export const getDiscussions = async () => {
  try {
    console.log("Fetching discussions...");
    const response = await api.get("/api/discussions/");
    console.log("Response received:", response.data);
    return response.data.map((discussion) => ({
      ...discussion,
      posts_count: discussion.posts_count,
      created_by: {
        username: discussion.created_by_username,
        profile: `${import.meta.env.VITE_API_URL}${discussion.created_by_profile}`,
      },
    }));
  } catch (error) {
    console.error("Error fetching discussions:", error);
  }
};

export const getDiscussionsByCategory = async (categoryId) => {
  try {
    const response = await api.get(`/api/discussions/?category=${categoryId}`);
    return response.data.map((discussion) => ({
      ...discussion,
      created_by: {
        username: discussion.created_by_username,
        profile: `${import.meta.env.VITE_API_URL}${discussion.created_by_profile}`,
      },
    }));
  } catch (error) {
    console.error("Error fetching discussions by category:", error);
    return [];
  }
};

export const getDiscussionDetails = async (discussionId) => {
  try {
    const response = await api.get(`/api/discussions/${discussionId}/`);
    console.log("Response received:", response.data);
    return {
      ...response.data,
      created_by: {
        username: response.data.created_by_username,
        profile: `${import.meta.env.VITE_API_URL}${response.data.created_by_profile}`,
      },
    };
  } catch (error) {
    console.error("Error fetching discussion details:", error);
  }
};

export const getCategories = async () => {
  try {
    console.log("Fetching categories...");
    const response = await api.get("/api/categories/");
    console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
};