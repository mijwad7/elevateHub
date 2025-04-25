import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../apiRequests/api";
import { ACCESS_TOKEN } from "../constants";

export const fetchSkillProfiles = createAsyncThunk("admin/fetchSkillProfiles", async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.get("/api/skill-profiles/", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
});

export const createSkillProfile = createAsyncThunk("admin/createSkillProfile", async (skillProfileData) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.post("/api/skill-profiles/", skillProfileData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    return response.data;
});

export const editSkillProfile = createAsyncThunk("admin/editSkillProfile", async ({ skillProfileId, skillProfileData }) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.patch(`/api/skill-profiles/${skillProfileId}/`, skillProfileData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    return { skillProfileId, updatedSkillProfile: response.data };
});

export const deleteSkillProfile = createAsyncThunk("admin/deleteSkillProfile", async (skillProfileId) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    await api.delete(`/api/skill-profiles/${skillProfileId}/`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return skillProfileId;
});

const skillProfileSlice = createSlice({
    name: "skillProfiles",
    initialState: {
        skillProfiles: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchSkillProfiles.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSkillProfiles.fulfilled, (state, action) => {
                state.loading = false;
                state.skillProfiles = action.payload;
            })
            .addCase(deleteSkillProfile.fulfilled, (state, action) => {
                state.skillProfiles = state.skillProfiles.filter(skillProfile => skillProfile.id !== action.payload);
            })
            .addCase(createSkillProfile.fulfilled, (state, action) => {
                state.skillProfiles.push(action.payload);
            })
            .addCase(editSkillProfile.fulfilled, (state, action) => {
                const { skillProfileId, updatedSkillProfile } = action.payload;
                const index = state.skillProfiles.findIndex(skillProfile => skillProfile.id === skillProfileId);
                if (index !== -1) {
                    state.skillProfiles[index] = updatedSkillProfile;
                }
            });
    }
});

export default skillProfileSlice.reducer;