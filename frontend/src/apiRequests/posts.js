import api from "./api";

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

export const getDiscussionPosts = async (discussionId) => {
  try {
    console.log("Fetching discussion posts for discussion:", discussionId);
    const response = await api.get(`/api/discussions/${discussionId}/posts/`);
    console.log("Response received:", response.data);
    return response.data.map((post) => ({
      ...post,
      user: {
        username: post.user_username,
        profile: post.user_profile
          ? `${post.user_profile}`
          : "https://avatar.iran.liara.run/public/4",
      },
    }));
  } catch (error) {
    console.error("Error fetching discussion posts:", error);
  }
};