import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../apiRequests/api";
import { ACCESS_TOKEN } from "../constants";

export const fetchUsers = createAsyncThunk("admin/fetchUsers", async (query = "") => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.get(`/api/users/?q=${query}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return response.data;
})

export const createUser = createAsyncThunk("admin/createUser", async (userData) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.post("/api/users/", userData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    return response.data;
})

export const editUser = createAsyncThunk("admin/editUser", async ({userId, userData}) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const response = await api.patch(`/api/users/${userId}/`, userData, {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    return { userId, updatedUser: response.data };
})

export const deleteUser = createAsyncThunk("admin/deleteUser", async (userId) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    await api.delete(`/api/users/${userId}/`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return userId;
})

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        users: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter((user) => user.id !== action.payload);
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.users.push(action.payload);
            })
            .addCase(editUser.fulfilled, (state, action) => {
                const { userId, updatedUser } = action.payload;
                // Update the user data in the state
                const index = state.users.findIndex(user => user.id === userId);
                if (index !== -1) {
                    state.users[index] = updatedUser;
                }
            })
    }
})

export default adminSlice.reducer;