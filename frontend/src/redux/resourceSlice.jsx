import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../apiRequests/api";
import { ACCESS_TOKEN } from "../constants";

export const fetchResources = createAsyncThunk("admin/fetchResources", async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.get("/api/resources/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Error fetching resources");
  }
});

export const createResource = createAsyncThunk("admin/createResource", async (formData, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.post("/api/resources/", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Error creating resource");
  }
});

export const editResource = createAsyncThunk("admin/editResource", async ({ resourceId, resourceData }, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.patch(`/api/resources/${resourceId}/`, resourceData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;  // Return full updated resource
  } catch (error) {
    return rejectWithValue(error.response?.data || "Error editing resource");
  }
});

export const deleteResource = createAsyncThunk("admin/deleteResource", async (resourceId, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN);
    await api.delete(`/api/resources/${resourceId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return resourceId;
  } catch (error) {
    return rejectWithValue(error.response?.data || "Error deleting resource");
  }
});

const resourceSlice = createSlice({
  name: "resources",
  initialState: {
    resources: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Resources
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = action.payload;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Resource
      .addCase(createResource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createResource.fulfilled, (state, action) => {
        state.loading = false;
        state.resources.push(action.payload);
      })
      .addCase(createResource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit Resource
      .addCase(editResource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editResource.fulfilled, (state, action) => {
        state.loading = false;
        const updatedResource = action.payload;
        const index = state.resources.findIndex((r) => r.id === updatedResource.id);
        if (index !== -1) state.resources[index] = updatedResource;
      })
      .addCase(editResource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Resource
      .addCase(deleteResource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteResource.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = state.resources.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteResource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default resourceSlice.reducer;