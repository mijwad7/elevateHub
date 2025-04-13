// redux/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../apiRequests/api";

export const fetchNotifications = createAsyncThunk(
    "notifications/fetchNotifications",
    async () => {
        const response = await api.get('/api/notifications/');
        return response.data;
    }
);

export const markNotificationAsRead = createAsyncThunk(
    "notifications/markAsRead",
    async (notificationId) => {
        await api.post(`/api/notifications/${notificationId}/mark_as_read/`);
        return notificationId;
    }
);

export const markAllAsRead = createAsyncThunk(
    "notifications/markAllAsRead",
    async () => {
        await api.post('/api/notifications/mark_all_as_read/');
    }
);

const notificationSlice = createSlice({
    name: "notifications",
    initialState: {
        notifications: [],
        status: "idle",
        error: null,
    },
    reducers: {
        addNotification: (state, action) => {
            if (!Array.isArray(state.notifications)) {
                state.notifications = [];
            }
            state.notifications.unshift(action.payload);
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => {
                state.status = "loading";
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.notifications = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.error.message;
                state.notifications = [];
            })
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                if (Array.isArray(state.notifications)) {
                    const notification = state.notifications.find(
                        (n) => n.id === action.payload
                    );
                    if (notification) {
                        notification.is_read = true;
                    }
                }
            })
            .addCase(markAllAsRead.fulfilled, (state) => {
                if (Array.isArray(state.notifications)) {
                    state.notifications.forEach((notification) => {
                        notification.is_read = true;
                    });
                }
            });
    },
});

export const { addNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
