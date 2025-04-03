import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import adminReducer from "./adminSlice";
import discussionReducer from "./discussionSlice";
import resourceReducer from "./resourceSlice";
import notificationReducer from "./notificationSlice";
import helpRequestReducer from './helpRequestSlice';


const store = configureStore({
    reducer: {
        auth: authReducer,
        admin: adminReducer,
        discussions: discussionReducer,
        resources: resourceReducer,
        notifications: notificationReducer,
        helpRequests: helpRequestReducer
    }
})

export default store;