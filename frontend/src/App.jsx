import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import Discussions from "./pages/discussions/Discussions";
import DiscussionPosts from "./pages/discussions/DiscussionPosts";
import CreateDiscussion from "./pages/discussions/CreateDiscussion";
import CreateDiscussionPost from "./pages/discussions/CreateDiscussionPost";
import Resources from "./pages/resources/Resources";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import { Provider } from "react-redux";
import store from "./redux/store";
import AdminDiscussions from "./pages/admin/AdminDiscussions";
import Profile from "./pages/user/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotAuthorized from "./pages/NotAuthorized";
import "@fortawesome/fontawesome-free/css/all.min.css";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/reset-password/:uid/:token"
            element={<ResetPassword />}
          />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/" element={<Home />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/discussions" element={<Discussions />} />
          <Route
            path="/create-discussion"
            element={
              <ProtectedRoute>
                <CreateDiscussion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discussions/:discussionId"
            element={<DiscussionPosts />}
          />
          <Route
            path="/discussions/:discussionId/create-discussion-post"
            element={
              <ProtectedRoute>
                <CreateDiscussionPost />
              </ProtectedRoute>
            }
          />
          <Route path="/resources" element={<Resources />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/discussions"
            element={
              <AdminProtectedRoute>
                <AdminDiscussions />
              </AdminProtectedRoute>
            }
          />

          {/* Error Handling */}
          <Route path="*" element={<NotFound />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
