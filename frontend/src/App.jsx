import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { googleLoginSuccess, setAuthStatus } from "./redux/authSlice";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import Discussions from "./pages/discussions/Discussions";
import DiscussionPosts from "./pages/discussions/DiscussionPosts";
import CreateDiscussion from "./pages/discussions/CreateDiscussion";
import CreateDiscussionPost from "./pages/discussions/CreateDiscussionPost";
import Resources from "./pages/resources/Resources";
import ResourceDetail from "./pages/resources/ResourceDetail";
import UploadResource from "./pages/resources/UploadResource";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { Provider } from "react-redux";
import store from "./redux/store";
import AdminDiscussions from "./pages/admin/AdminDiscussions";
import AdminResources from "./pages/admin/AdminResources";
import Profile from "./pages/user/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotAuthorized from "./pages/NotAuthorized";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./App.css";

function Logout() {
  const dispatch = useDispatch();
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    }).then(() => {
      localStorage.clear();
      dispatch(setAuthStatus(false));
    });
  }, [dispatch]);
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function AuthWrapper({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/auth/status/", {
      credentials: "include",
      headers: { "Accept": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("AuthWrapper status:", data);
        if (data.is_authenticated) {
          dispatch(googleLoginSuccess({ user: { email: data.email } }));
        } else {
          dispatch(setAuthStatus(false));
        }
      })
      .catch((err) => {
        console.error("Auth fetch error:", err);
        dispatch(setAuthStatus(false));
      });
  }, [dispatch]); // Only run on mount, not on path change

  // Redirect logic
  if (isAuthenticated && (location.pathname === "/login" || location.pathname === "/register")) {
    return <Navigate to="/" />;
  }
 

  return children;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthWrapper>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
            <Route path="/register" element={<RegisterAndLogout />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="/create-discussion" element={<ProtectedRoute><CreateDiscussion /></ProtectedRoute>} />
            <Route path="/resources/upload" element={<ProtectedRoute><UploadResource /></ProtectedRoute>} />
            <Route path="/discussions/:discussionId" element={<DiscussionPosts />} />
            <Route path="/discussions/:discussionId/create-discussion-post" element={<ProtectedRoute><CreateDiscussionPost /></ProtectedRoute>} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:id" element={<ResourceDetail />} />
            <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/discussions" element={<AdminProtectedRoute><AdminDiscussions /></AdminProtectedRoute>} />
            <Route path="/admin/resources" element={<AdminProtectedRoute><AdminResources /></AdminProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            <Route path="/not-authorized" element={<NotAuthorized />} />
          </Routes>
        </AuthWrapper>
      </BrowserRouter>
    </Provider>
  );
}

export default App;