import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import adminReducer from "./adminSlice";
import discussionReducer from "./discussionSlice";
import resourceReducer from "./resourceSlice";


const store = configureStore({
    reducer: {
        auth: authReducer,
        admin: adminReducer,
        discussions: discussionReducer,
        resources: resourceReducer
    }
})

export default store;