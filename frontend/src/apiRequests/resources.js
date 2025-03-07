import api from "./api";

export const getResources = async () => {
  const response = await api.get("/api/resources");
  return response.data;
};

export const uploadResource = async (formData) => {
  const response = await api.post("/api/resources/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const toggleVote = async (resourceId) => {
  // Removed isUpvote param
  const response = await api.post(`/api/resources/${resourceId}/vote/`);
  return response.data;
};

export const downloadResource = async (resourceId) => {
  const response = await api.post(`/api/resources/${resourceId}/download/`);
  return response.data;
};
