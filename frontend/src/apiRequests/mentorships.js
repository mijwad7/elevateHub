import api from './api';
import { ACCESS_TOKEN } from '../constants';

// Helper to get Authorization header
const getAuthConfig = () => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Fetch mentorships for the current user
export const getUserMentorships = async () => {
  try {
    const config = getAuthConfig();
    const response = await api.get('/api/user/mentorships/', config);
    return response.data;
  } catch (error) {
    console.error("Error fetching user mentorships:", error);
    throw error; // Re-throw error to be caught by the component
  }
};

// Add other mentorship API functions here later (e.g., getMentorshipDetail, createMentorship, etc.) 