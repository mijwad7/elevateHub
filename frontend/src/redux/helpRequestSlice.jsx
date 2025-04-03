import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../apiRequests/api";
import { ACCESS_TOKEN } from "../constants";

export const fetchHelpRequests = createAsyncThunk("admin/fetchHelpRequests", async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.get("/api/help-requests/", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
});

export const createHelpRequest = createAsyncThunk("admin/createHelpRequest", async (helpRequestData) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.post("/api/help-requests/", helpRequestData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    return response.data;
});

export const editHelpRequest = createAsyncThunk("admin/editHelpRequest", async ({ helpRequestId, helpRequestData }) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.patch(`/api/help-requests/${helpRequestId}/`, helpRequestData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
    return { helpRequestId, updatedHelpRequest: response.data };
});

export const deleteHelpRequest = createAsyncThunk("admin/deleteHelpRequest", async (helpRequestId) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    await api.delete(`/api/help-requests/${helpRequestId}/`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return helpRequestId;
});

const helpRequestSlice = createSlice({
    name: "helpRequests",
    initialState: {
        helpRequests: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchHelpRequests.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchHelpRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.helpRequests = action.payload;
            })
            .addCase(deleteHelpRequest.fulfilled, (state, action) => {
                state.helpRequests = state.helpRequests.filter(req => req.id !== action.payload);
            })
            .addCase(createHelpRequest.fulfilled, (state, action) => {
                state.helpRequests.push(action.payload);
            })
            .addCase(editHelpRequest.fulfilled, (state, action) => {
                const { helpRequestId, updatedHelpRequest } = action.payload;
                const index = state.helpRequests.findIndex(req => req.id === helpRequestId);
                if (index !== -1) {
                    state.helpRequests[index] = updatedHelpRequest;
                }
            });
    }
});

export default helpRequestSlice.reducer;