import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

// Fetch discussions
export const fetchDiscussions = createAsyncThunk("admin/fetchDiscussions", async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.get("/api/discussions/", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
});

// Create a new discussion
export const createDiscussion = createAsyncThunk("admin/createDiscussion", async (discussionData) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.post("/api/discussions/", discussionData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    return response.data;
});

// Edit discussion
export const editDiscussion = createAsyncThunk("admin/editDiscussion", async ({ discussionId, discussionData }) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.patch(`/api/discussions/${discussionId}/`, discussionData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    return { discussionId, updatedDiscussion: response.data };
});

// Delete discussion
export const deleteDiscussion = createAsyncThunk("admin/deleteDiscussion", async (discussionId) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    await api.delete(`/api/discussions/${discussionId}/`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return discussionId;
});

const discussionSlice = createSlice({
    name: "discussions",
    initialState: {
        discussions: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDiscussions.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchDiscussions.fulfilled, (state, action) => {
                state.loading = false;
                state.discussions = action.payload;
            })
            .addCase(deleteDiscussion.fulfilled, (state, action) => {
                state.discussions = state.discussions.filter(discussion => discussion.id !== action.payload);
            })
            .addCase(createDiscussion.fulfilled, (state, action) => {
                state.discussions.push(action.payload);
            })
            .addCase(editDiscussion.fulfilled, (state, action) => {
                const { discussionId, updatedDiscussion } = action.payload;
                const index = state.discussions.findIndex(discussion => discussion.id === discussionId);
                if (index !== -1) {
                    state.discussions[index] = updatedDiscussion;
                }
            });
    }
});

export default discussionSlice.reducer;
