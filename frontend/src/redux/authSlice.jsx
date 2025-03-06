import { createSlice } from "@reduxjs/toolkit";
import api from "../apiRequests/api";
import { ACCESS_TOKEN } from "../constants";

const initialState = {
    user: JSON.parse(localStorage.getItem("user")) || null,
    token: localStorage.getItem(ACCESS_TOKEN) || null,
    isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN), // Ensuring authentication state persists
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.token = action.payload.token;
            localStorage.setItem('access_token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        }, logOut: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.token = null;
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }, updateCredits: (state, action) => {
            if (state.user){
                state.user.credits = action.payload;
            }
        }
    }
})

export const { loginSuccess, logOut, updateCredits } = authSlice.actions;
export default authSlice.reducer