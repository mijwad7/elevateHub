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

export const getDiscussions = async (url = "/api/discussions/") => {
  try {
    console.log("Fetching discussions from:", url);
    const response = await api.get(url);
    console.log("Response received:", response.data);
    return response.data.map((discussion) => ({
      ...discussion,
      posts_count: discussion.posts_count,
      created_by: {
        username: discussion.created_by_username,
        profile: discussion.created_by_profile,
      },
    }));
  } catch (error) {
    console.error("Error fetching discussions:", error);
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
        profile: `${response.data.created_by_profile}`,
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