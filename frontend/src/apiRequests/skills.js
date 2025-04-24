import api from './api';
import { ACCESS_TOKEN } from '../constants';
const getAuthConfig = () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };


// Fetch the current user's skill profiles
export const getUserSkillProfiles = async () => {
    try {
        const config = await getAuthConfig();
        const response = await api.get('/api/user/skill-profiles/', config);
        return response.data;
    } catch (error) {
        console.error("Error fetching user skill profiles:", error);
        throw error;
    }
};

// Create a new skill profile for the current user
export const createUserSkillProfile = async (profileData) => {
    try {
        const config = await getAuthConfig();
        const response = await api.post('/api/user/skill-profiles/', profileData, config);
        return response.data;
    } catch (error) {
        console.error("Error creating skill profile:", error.response?.data || error.message);
        throw error.response?.data || error; // Throw specific backend error if available
    }
};

// Update an existing skill profile owned by the user
export const updateUserSkillProfile = async (profileId, profileData) => {
    try {
        const config = await getAuthConfig();
        const response = await api.put(`/api/user/skill-profiles/${profileId}/`, profileData, config);
        return response.data;
    } catch (error) {
        console.error("Error updating skill profile:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// Delete a skill profile owned by the user
export const deleteUserSkillProfile = async (profileId) => {
    try {
        const config = await getAuthConfig();
        await api.delete(`/api/user/skill-profiles/${profileId}/`, config);
    } catch (error) {
        console.error("Error deleting skill profile:", error);
        throw error;
    }
}; 