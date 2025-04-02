// redux/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem("access_token") || null,
    isAuthenticated: !!(localStorage.getItem("user"))
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            localStorage.setItem("access_token", action.payload.token);
            localStorage.setItem("user", JSON.stringify(action.payload.user));
        },
        googleLoginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token || null;  // Token optional
            state.isAuthenticated = true;  // Always true if user exists
            localStorage.setItem("user", JSON.stringify(action.payload.user));
            if (action.payload.token) {
                localStorage.setItem("access", action.payload.token);
            }
        },
        logOut: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem("access_token");
            localStorage.removeItem("user");
        },
        updateCredits: (state, action) => {
            if (state.user) {
                state.user.credits = action.payload;
                localStorage.setItem("user", JSON.stringify(state.user));
            }
        },
        setAuthStatus: (state, action) => {
            state.isAuthenticated = action.payload && !!state.token;  // Require token
            if (!action.payload) {
                state.user = null;
                state.token = null;
                localStorage.removeItem("access_token");
                localStorage.removeItem("user");
            }
        },
    },
});

export const { loginSuccess, googleLoginSuccess, logOut, updateCredits, setAuthStatus } = authSlice.actions;
export default authSlice.reducer;