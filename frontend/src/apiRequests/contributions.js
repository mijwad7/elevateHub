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