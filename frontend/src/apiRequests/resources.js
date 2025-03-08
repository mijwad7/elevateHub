import api from "./api";

// Resources API calls (aligned with discussions)
export const getResources = async (url = "/api/resources/") => {
  try {
    console.log("Fetching resources from:", url);
    const response = await api.get(url);
    console.log("Response received:", response.data);
    return response.data.map((resource) => ({
      ...resource,
      uploaded_by: {
        username: resource.uploaded_by_username,
        profile: resource.uploaded_by_profile
          ? `${import.meta.env.VITE_API_URL}${resource.uploaded_by_profile}`
          : "/default-avatar.png",
      },
    }));
  } catch (error) {
    console.error("Error fetching resources:", error);
    return [];
  }
};

export const getResourceDetails = async (resourceId) => {
  try {
    console.log(`Fetching details for resource ${resourceId}...`);
    const response = await api.get(`/api/resources/${resourceId}/`);
    console.log("Response received:", response.data);
    return {
      ...response.data,
      uploaded_by: {
        username: response.data.uploaded_by_username,
        profile: response.data.uploaded_by_profile
          ? `${import.meta.env.VITE_API_URL}${
              response.data.uploaded_by_profile
            }`
          : "/default-avatar.png",
      },
    };
  } catch (error) {
    console.error(`Error fetching resource details for ${resourceId}:`, error);
    return null;
  }
};


export const uploadResource = async (formData) => {
  try {
    console.log("Uploading new resource...");
    const response = await api.post("/api/resources/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("Resource uploaded:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error uploading resource:", error);
    return null;
  }
};

export const toggleVote = async (resourceId) => {
  try {
    console.log(`Toggling vote for resource ${resourceId}...`);
    const response = await api.post(`/api/resources/${resourceId}/vote/`);
    console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error toggling vote for resource ${resourceId}:`, error);
    return null;
  }
};

export const downloadResource = async (resourceId) => {
  try {
    console.log(`Downloading resource ${resourceId}...`);
    const response = await api.post(`/api/resources/${resourceId}/download/`);
    console.log("Response received:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Error downloading resource ${resourceId}:`, error);
    return null;
  }
};
