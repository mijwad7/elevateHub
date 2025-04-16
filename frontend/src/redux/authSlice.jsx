import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../apiRequests/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, { rejectWithValue }) => {
        try {
            const refreshToken = localStorage.getItem(REFRESH_TOKEN);
            console.log("Sending refresh token:", refreshToken); // Debug log
            if (refreshToken) {
                await api.post("/api/logout/", { refresh: refreshToken });
                console.log("JWT Logout API call successful"); // Confirm success
            } else {
                console.log("No refresh token found in localStorage");
            }

            // Call session logout endpoint to invalidate session
            await api.post("/api/logout-session/", {}, {
                withCredentials: true, // Ensure session cookie is sent
            });
            console.log("Session logout API call successful");

            return true;
        } catch (error) {
            console.error("Logout error:", error.response?.data);
            return rejectWithValue(error.response?.data || "Logout failed");
        }
    }
);

const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem(ACCESS_TOKEN) || null, // Updated
    isAuthenticated: !!(localStorage.getItem("user")),
    logoutError: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            localStorage.setItem(ACCESS_TOKEN, action.payload.token); // Updated
            localStorage.setItem("user", JSON.stringify(action.payload.user));
        },
        googleLoginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token || null;
            state.isAuthenticated = true;
            localStorage.setItem("user", JSON.stringify(action.payload.user));
            if (action.payload.token) {
                localStorage.setItem(ACCESS_TOKEN, action.payload.token); // Updated
            }
        },
        logOut: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem(ACCESS_TOKEN); // Updated
            localStorage.removeItem(REFRESH_TOKEN); // Updated
            localStorage.removeItem("user");
        },
        updateCredits: (state, action) => {
            if (state.user) {
                state.user.credits = action.payload;
                localStorage.setItem("user", JSON.stringify(state.user));
            }
        },
        setAuthStatus: (state, action) => {
            state.isAuthenticated = action.payload && !!state.token;
            if (!action.payload) {
                state.user = null;
                state.token = null;
                localStorage.removeItem(ACCESS_TOKEN); // Updated
                localStorage.removeItem("user");
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.logoutError = null;
                localStorage.removeItem(ACCESS_TOKEN); // Updated
                localStorage.removeItem(REFRESH_TOKEN); // Updated
                localStorage.removeItem("user");
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.logoutError = action.payload;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                localStorage.removeItem(ACCESS_TOKEN); // Updated
                localStorage.removeItem(REFRESH_TOKEN); // Updated
                localStorage.removeItem("user");
            });
    },
});

export const { loginSuccess, googleLoginSuccess, logOut, updateCredits, setAuthStatus } = authSlice.actions;
export default authSlice.reducer;