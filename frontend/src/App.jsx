import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Discussions from './pages/Discussions'
import DiscussionPosts from './pages/DiscussionPosts'
import CreateDiscussion from './pages/CreateDiscussion'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import "./App.css"
import { Provider } from 'react-redux'
import store from './redux/store'
import Profile from './pages/Profile'
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotAuthorized from './pages/NotAuthorized'
import CreateUser from './pages/CreateUser'

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
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/discussions" element={<ProtectedRoute><Discussions /></ProtectedRoute>} />
          <Route path="/create-discussion" element={<CreateDiscussion />} />
          <Route path="/discussions/:discussionId" element={<DiscussionPosts />} />
          <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/create" element={<AdminProtectedRoute><CreateUser /></AdminProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
