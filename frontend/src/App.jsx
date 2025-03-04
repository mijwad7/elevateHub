import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Discussions from './pages/Discussions'
import DiscussionPosts from './pages/DiscussionPosts'
import CreateDiscussion from './pages/CreateDiscussion'
import CreateDiscussionPost from './pages/CreateDiscussionPost'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import "./App.css"
import { Provider } from 'react-redux'
import store from './redux/store'
import AdminDiscussions from './pages/AdminDiscussions'
import Profile from './pages/Profile'
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotAuthorized from './pages/NotAuthorized'
import "@fortawesome/fontawesome-free/css/all.min.css";

function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout(){
  localStorage.clear()
  return <Register />
}

function App() {
  

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/create-discussion" element={<ProtectedRoute><CreateDiscussion /></ProtectedRoute>} />
          <Route path="/discussions/:discussionId" element={<DiscussionPosts />} />
          <Route path="/discussions/:discussionId/create-discussion-post" element={<CreateDiscussionPost />} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/discussions" element={<AdminProtectedRoute><AdminDiscussions /></AdminProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
