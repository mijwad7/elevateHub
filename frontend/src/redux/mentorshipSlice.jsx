import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../apiRequests/api";
import { ACCESS_TOKEN } from "../constants";

export const fetchMentorships = createAsyncThunk("admin/fetchMentorships", async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.get("/api/admin/mentorships/", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
});

export const createMentorship = createAsyncThunk("admin/createMentorship", async (mentorshipData) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.post("/api/admin/mentorships/", {
      ...mentorshipData,
      learner: mentorshipData.learner || mentorshipData.mentee, // Map 'mentee' to 'learner' if needed
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return response.data;
  });

export const editMentorship = createAsyncThunk("admin/editMentorship", async ({ mentorshipId, mentorshipData }) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.patch(`/api/admin/mentorships/${mentorshipId}/`, mentorshipData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    return { mentorshipId, updatedMentorship: response.data };
});

export const deleteMentorship = createAsyncThunk("admin/deleteMentorship", async (mentorshipId) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    await api.delete(`/api/admin/mentorships/${mentorshipId}/`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return mentorshipId;
});

const mentorshipSlice = createSlice({
    name: "mentorships",
    initialState: {
        mentorships: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMentorships.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchMentorships.fulfilled, (state, action) => {
                state.loading = false;
                state.mentorships = action.payload;
            })
            .addCase(deleteMentorship.fulfilled, (state, action) => {
                state.mentorships = state.mentorships.filter(mentorship => mentorship.id !== action.payload);
            })
            .addCase(createMentorship.fulfilled, (state, action) => {
                state.mentorships.push(action.payload);
            })
            .addCase(editMentorship.fulfilled, (state, action) => {
                const { mentorshipId, updatedMentorship } = action.payload;
                const index = state.mentorships.findIndex(mentorship => mentorship.id === mentorshipId);
                if (index !== -1) {
                    state.mentorships[index] = updatedMentorship;
                }
            });
    }
});

export default mentorshipSlice.reducer;