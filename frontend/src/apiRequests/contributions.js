import api from './api';

export const editContribution = async (contributionType, contributionId, data) => {
  try {
    const response = await api.put(
      `/api/contributions/${contributionType}/${contributionId}/edit/`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error editing contribution:', error);
    throw error;
  }
};

export const deleteContribution = async (contributionType, contributionId) => {
  try {
    const response = await api.delete(
      `/api/contributions/${contributionType}/${contributionId}/delete/`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting contribution:', error);
    throw error;
  }
}; 

export const getUserHelpRequests = async (config) => {
  try {
    const response = await api.get('/api/user/help-requests/', config);
    return response.data;
  } catch (error) {
    console.error('Error fetching help requests:', error);
    throw error;
  }
};

export const editHelpRequest = async (helpRequestId, data) => {
  try {
    const response = await api.put(
      `/api/help-requests/${helpRequestId}/edit/`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error editing help request:', error);
    throw error;
  }
};

export const deleteHelpRequest = async (helpRequestId) => {
  try {
    const response = await api.delete(
      `/api/help-requests/${helpRequestId}/delete/`
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting help request:', error);
    throw error;
  }
};