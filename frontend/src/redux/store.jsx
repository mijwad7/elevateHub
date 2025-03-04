import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import adminReducer from "./adminSlice";
import discussionReducer from "./discussionSlice";


const store = configureStore({
    reducer: {
        auth: authReducer,
        admin: adminReducer,
        discussions: discussionReducer,
    }
})

export default store;