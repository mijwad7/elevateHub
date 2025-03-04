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

export const createDiscussionPost = async (discussionId, content) => {
  try {
    console.log("Creating new discussion post...");
    const response = await api.post(`/api/discussions/${discussionId}/posts/`, { content });
    console.log("Discussion post created:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error creating discussion post:", error);
    return null;
  }
}

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
      }
    }))
  } catch (error) {
    console.error("Error fetching discussions:", error);
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



export const getDiscussionPosts = async (discussionId) => {
  try {
    console.log("Fetching discussion posts for discussion:", discussionId);
    const response = await api.get(`/api/discussions/${discussionId}/posts/`);
    console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching discussion posts:", error);
  }
};

export const toggleUpvote = async (postId) => {
  try {
    console.log(`Toggling upvote for post ${postId}...`);
    const response = await api.post(`/api/posts/${postId}/toggle-upvote/`);
    console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error toggling upvote:", error);
  }
};

