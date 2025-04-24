import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../apiRequests/api";
import { loginSuccess, updateCredits } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import {
  getCreditBalance,
  getCreditTransactions,
  editContribution,
  deleteContribution,
  getUserHelpRequests,
  editHelpRequest,
  deleteHelpRequest,
  getUserMentorships,
} from "../../apiRequests";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import {
  FaUser,
  FaImage,
  FaHistory,
  FaComments,
  FaSignOutAlt,
  FaFileAlt,
  FaCommentDots,
  FaUserEdit,
  FaEdit,
  FaTrash,
  FaQuestionCircle,
  FaChalkboardTeacher,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

const Profile = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChats, setActiveChats] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [editError, setEditError] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [contributionsLoading, setContributionsLoading] = useState(true);
  const [contributionsError, setContributionsError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [editingContribution, setEditingContribution] = useState(null);
  const [deleteContributionId, setDeleteContributionId] = useState(null);
  const [deleteContributionType, setDeleteContributionType] = useState(null);
  const [helpRequests, setHelpRequests] = useState([]);
  const [helpRequestsLoading, setHelpRequestsLoading] = useState(true);
  const [helpRequestsError, setHelpRequestsError] = useState(null);
  const [deleteHelpRequestId, setDeleteHelpRequestId] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [mentorships, setMentorships] = useState([]);
  const [mentorshipsLoading, setMentorshipsLoading] = useState(true);
  const [mentorshipsError, setMentorshipsError] = useState(null);

  // Validate authentication and redirect if needed
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Handle token refresh
  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await api.post("/api/token/refresh/", {
        refresh: refreshToken,
      });

      if (response.data.access) {
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        return response.data.access;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      dispatch(logoutUser());
      navigate("/login");
      return null;
    }
  }, [dispatch, navigate]);

  // Get auth config with token refresh
  const getAuthConfig = useCallback(async () => {
    let accessToken = localStorage.getItem(ACCESS_TOKEN);

    if (!accessToken || accessToken === "null") {
      return { withCredentials: true };
    }

    try {
      await api.get("/auth/status/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      if (error.response?.status === 401) {
        accessToken = await refreshToken();
        if (!accessToken) {
          return { withCredentials: true };
        }
      }
    }

    return {
      headers: { Authorization: `Bearer ${accessToken}` },
    };
  }, [refreshToken]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);
      const config = await getAuthConfig();

      const [statusResponse, balance, txs, chats] = await Promise.all([
        api.get("/auth/status/", config),
        getCreditBalance(config),
        getCreditTransactions(config),
        api.get("api/active-chats/", config),
      ]);

      if (statusResponse.data.is_authenticated) {
        const updatedUser = { ...user, ...statusResponse.data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      if (balance !== user.credits) {
        dispatch(updateCredits(balance));
      }
      setTransactions(txs);
      setActiveChats(chats.data);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError("Failed to load profile data. Please try again.");
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, dispatch, getAuthConfig]);

  // Fetch user contributions
  const fetchContributions = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setContributionsLoading(true);
      setContributionsError(null);
      const config = await getAuthConfig();

      const response = await api.get("/api/user/contributions/", config);
      setContributions(response.data);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      setContributionsError("Failed to load contributions. Please try again.");
      toast.error("Failed to load contributions");
    } finally {
      setContributionsLoading(false);
    }
  }, [isAuthenticated, user, getAuthConfig]);

  const fetchHelpRequests = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setHelpRequestsLoading(true);
      setHelpRequestsError(null);
      const config = await getAuthConfig();

      const response = await getUserHelpRequests(config);
      setHelpRequests(response);
    } catch (error) {
      console.error("Error fetching help requests:", error);
      setHelpRequestsError("Failed to load help requests. Please try again.");
      toast.error("Failed to load help requests");
    } finally {
      setHelpRequestsLoading(false);
    }
  }, [isAuthenticated, user, getAuthConfig]);

  // Fetch user mentorships
  const fetchMentorships = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setMentorshipsLoading(true);
      setMentorshipsError(null);
      // Use the dedicated API function (handles auth config internally)
      const data = await getUserMentorships(); 
      setMentorships(data);
    } catch (error) {
      console.error("Error fetching mentorships:", error);
      setMentorshipsError("Failed to load mentorships. Please try again.");
      toast.error("Failed to load mentorships");
    } finally {
      setMentorshipsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserData();
      fetchContributions();
      fetchHelpRequests();
      fetchMentorships();
    }
  }, [
    isAuthenticated,
    user?.id,
    fetchUserData,
    fetchContributions,
    fetchHelpRequests,
    fetchMentorships,
  ]);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle profile image upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("profile_image", selectedFile);

      // Get auth config with proper headers
      const config = await getAuthConfig();

      // First ensure we have a CSRF token
      let csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrftoken="))
        ?.split("=")[1];

      // If no CSRF token found or in incognito mode, fetch it
      if (!csrfToken) {
        const csrfResponse = await api.get("/api/get-csrf/", {
          withCredentials: true,
          headers: {
            ...config.headers,
          },
        });
        csrfToken = csrfResponse.data.csrftoken;
      }

      const headers = {
        ...config.headers,
        "Content-Type": "multipart/form-data",
        "X-CSRFToken": csrfToken,
      };

      const response = await api.put(
        `/api/users/${user.id}/upload-profile/`,
        formData,
        {
          ...config,
          headers,
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (response.data) {
        dispatch(
          loginSuccess({
            user: response.data,
            token: localStorage.getItem(ACCESS_TOKEN),
          })
        );
        setSelectedFile(null);
        setPreviewUrl(null);
        toast.success("Profile image updated successfully!");
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      if (error.response?.status === 401) {
        // Token expired, try to refresh
        const newToken = await refreshToken();
        if (newToken) {
          // Retry the upload with new token
          return handleUpload();
        }
      }
      toast.error(
        error.response?.data?.error || "Failed to upload profile image"
      );
    } finally {
      setUploadProgress(0);
    }
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);

    try {
      const config = await getAuthConfig();
      const response = await api.put(
        `/api/users/${user?.id}/update/`,
        {
          username: editedUser.username,
          email: editedUser.email,
        },
        {
          ...config,
          headers: {
            ...config.headers,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data) {
        dispatch(
          loginSuccess({
            user: response.data,
            token: localStorage.getItem(ACCESS_TOKEN),
          })
        );
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setEditError(error.response?.data?.error || "Failed to update profile");
      toast.error(error.response?.data?.error || "Failed to update profile");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.info("Logged out successfully");
  };

  // Handle contribution edit
  const handleEditContribution = async (e) => {
    e.preventDefault();
    if (!editingContribution) return;

    try {
      const data = {
        content: editingContribution.content,
        title: editingContribution.title,
        description: editingContribution.description,
      };

      // For discussion posts, use post_id instead of id
      const contributionId =
        editingContribution.type === "discussion"
          ? editingContribution.post_id
          : editingContribution.id;

      const updatedContribution = await editContribution(
        editingContribution.type,
        contributionId,
        data
      );

      setContributions(
        contributions.map((contribution) =>
          contribution.id === editingContribution.id &&
          contribution.type === editingContribution.type
            ? updatedContribution
            : contribution
        )
      );
      setEditingContribution(null);
      toast.success("Contribution updated successfully!");
    } catch (error) {
      console.error("Error updating contribution:", error);
      toast.error(
        error.response?.data?.error || "Failed to update contribution"
      );
    }
  };

  // Handle contribution delete
  const handleDeleteContribution = async () => {
    if (!deleteContributionId || !deleteContributionType) return;

    try {
      // For discussion posts, use post_id instead of id
      const contributionId =
        deleteContributionType === "discussion"
          ? contributions.find((c) => c.id === deleteContributionId)?.post_id
          : deleteContributionId;

      await deleteContribution(deleteContributionType, contributionId);

      setContributions(
        contributions.filter(
          (contribution) =>
            !(
              contribution.id === deleteContributionId &&
              contribution.type === deleteContributionType
            )
        )
      );
      setDeleteContributionId(null);
      setDeleteContributionType(null);
      toast.success("Contribution deleted successfully!");
    } catch (error) {
      console.error("Error deleting contribution:", error);
      toast.error(
        error.response?.data?.error || "Failed to delete contribution"
      );
    }
  };

  const handleEditHelpRequest = async (e) => {
    e.preventDefault();
    if (!editingContribution) return;

    try {
      const data = {
        title: editingContribution.title,
        description: editingContribution.description,
        status: editingContribution.status,
        credit_offer_chat: editingContribution.credit_offer_chat,
        credit_offer_video: editingContribution.credit_offer_video,
        category: editingContribution.category,
      };

      const updatedHelpRequest = await editHelpRequest(
        editingContribution.id,
        data
      );

      setHelpRequests(
        helpRequests.map((request) =>
          request.id === editingContribution.id ? updatedHelpRequest : request
        )
      );
      setEditingContribution(null);
      toast.success("Help request updated successfully!");
    } catch (error) {
      console.error("Error updating help request:", error);
      toast.error(
        error.response?.data?.error || "Failed to update help request"
      );
    }
  };

  const handleDeleteHelpRequest = async () => {
    if (!deleteHelpRequestId) return;

    try {
      await deleteHelpRequest(deleteHelpRequestId);

      setHelpRequests(
        helpRequests.filter((request) => request.id !== deleteHelpRequestId)
      );
      setDeleteHelpRequestId(null);
      toast.success("Help request deleted successfully!");
    } catch (error) {
      console.error("Error deleting help request:", error);
      toast.error(
        error.response?.data?.error || "Failed to delete help request"
      );
    }
  };

  // Update the handlePasswordChange function
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      const config = await getAuthConfig();
      const response = await api.put(
        "/api/change-password/",
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        },
        config
      );

      if (response.data.message) {
        setPasswordSuccess("Password changed successfully!");
        toast.success("Password changed successfully!");
        
        // Clear the form but keep it visible
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });

        // Hide the form after 2 seconds
        setTimeout(() => {
          setIsChangingPassword(false);
          setPasswordSuccess(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(error.response?.data?.error || "Failed to change password");
      toast.error(error.response?.data?.error || "Failed to change password");
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const profileImageUrl = user?.profile_image
    ? `http://localhost:8000${user.profile_image}`
    : null;

  return (
    <div className="bg-light min-vh-100">
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            {/* Profile Header with Tabs */}
            <div className="card shadow-sm mb-4">
              <div className="card-body p-0">
                <div className="d-flex flex-column flex-md-row">
                  {/* Profile Image Section */}
                  <div className="p-4 text-center bg-primary bg-opacity-10">
                    <div className="position-relative d-inline-block mb-3">
                      <div
                        className="rounded-circle overflow-hidden border border-4 border-white shadow"
                        style={{ width: "150px", height: "150px" }}
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-100 h-100 object-fit-cover"
                          />
                        ) : profileImageUrl ? (
                          <img
                            src={
                              profileImageUrl ||
                              "https://avatar.iran.liara.run/public/4"
                            }
                            alt="Profile"
                            className="w-100 h-100 object-fit-cover"
                          />
                        ) : (
                          <div className="w-100 h-100 bg-secondary d-flex align-items-center justify-content-center">
                            <FaUser className="text-white fs-1" />
                          </div>
                        )}
                      </div>
                      {uploadProgress > 0 && (
                        <div className="position-absolute bottom-0 start-0 end-0 bg-light">
                          <div
                            className="bg-primary h-1"
                            style={{
                              width: `${uploadProgress}%`,
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="d-none"
                        id="profile-upload"
                      />
                      <label
                        htmlFor="profile-upload"
                        className="btn btn-primary btn-sm"
                      >
                        <FaImage className="me-2" />
                        {selectedFile ? "Change Image" : "Upload Image"}
                      </label>
                      {selectedFile && (
                        <button
                          onClick={handleUpload}
                          className="btn btn-success btn-sm"
                        >
                          Save Changes
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Profile Info and Tabs */}
                  <div className="flex-grow-1 p-4">
                    <div className="d-flex flex-column h-100">
                      <div className="mb-4">
                        <h1 className="h3 mb-2">{user.username}</h1>
                        <p className="text-muted mb-3">{user.email}</p>
                        <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 mb-3">
                          <span className="fw-semibold text-light">
                            {user.credits || 0} credits
                          </span>
                        </div>
                      </div>

                      {/* Navigation Tabs */}
                      <ul className="nav nav-tabs mb-4" role="tablist">
                        <li
                          className="nav-item text-primary"
                          role="presentation"
                        >
                          <button
                            className={`nav-link ${
                              activeTab === "profile" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("profile")}
                          >
                            <FaUserEdit className="me-2" />
                            Profile
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${
                              activeTab === "chats" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("chats")}
                          >
                            <FaComments className="me-2" />
                            Active Chats
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${
                              activeTab === "transactions" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("transactions")}
                          >
                            <FaHistory className="me-2" />
                            Transactions
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${
                              activeTab === "contributions" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("contributions")}
                          >
                            <FaFileAlt className="me-2" />
                            Contributions
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${
                              activeTab === "help_requests" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("help_requests")}
                          >
                            <FaQuestionCircle className="me-2" />
                            Help Requests
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${
                              activeTab === "mentorships" ? "active" : ""
                            }`}
                            onClick={() => setActiveTab("mentorships")}
                          >
                            <FaChalkboardTeacher className="me-2" />
                            Mentorships
                          </button>
                        </li>
                      </ul>

                      {/* Tab Content */}
                      <div className="tab-content flex-grow-1">
                        {/* Profile Tab */}
                        <div
                          className={`tab-pane fade ${
                            activeTab === "profile" ? "show active" : ""
                          }`}
                        >
                          {isEditing ? (
                            <form onSubmit={handleEditSubmit} className="mb-3">
                              <div className="mb-3">
                                <label
                                  htmlFor="username"
                                  className="form-label"
                                >
                                  Username
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  id="username"
                                  name="username"
                                  value={editedUser.username}
                                  onChange={handleEditChange}
                                  required
                                />
                              </div>
                              <div className="mb-3">
                                <label htmlFor="email" className="form-label">
                                  Email
                                </label>
                                <input
                                  type="email"
                                  className="form-control"
                                  id="email"
                                  name="email"
                                  value={editedUser.email}
                                  onChange={handleEditChange}
                                  required
                                />
                              </div>
                              {editError && (
                                <div
                                  className="alert alert-danger"
                                  role="alert"
                                >
                                  {editError}
                                </div>
                              )}
                              <div className="d-flex gap-2">
                                <button
                                  type="submit"
                                  className="btn btn-primary"
                                >
                                  Save Changes
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary"
                                  onClick={() => {
                                    setIsEditing(false);
                                    setEditedUser({
                                      username: user?.username || "",
                                      email: user?.email || "",
                                    });
                                    setEditError(null);
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="d-flex gap-2">
                              <button
                                onClick={() => setIsEditing(true)}
                                className="btn btn-outline-primary"
                              >
                                <i className="bi bi-pencil-square me-2"></i>
                                Edit Profile
                              </button>
                              <button
                              onClick={() => setIsChangingPassword(true)}
                              className="btn btn-outline-primary"
                            >
                              <i className="bi bi-shield-lock me-2"></i>
                              Change Password
                            </button>
                              <button
                                onClick={handleLogout}
                                className="btn btn-outline-danger d-flex align-items-center"
                              >
                                <FaSignOutAlt className="me-2" />
                                Logout
                              </button>
                            </div>
                          )}
                          {isChangingPassword ? (
                            <div className="card shadow-sm mt-4">
                              <div className="card-header bg-primary bg-opacity-10 d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                  <i className="bi bi-shield-lock me-2"></i>
                                  Change Password
                                </h5>
                                <button
                                  type="button"
                                  className="btn-close"
                                  onClick={() => {
                                    setIsChangingPassword(false);
                                    setPasswordData({
                                      current_password: "",
                                      new_password: "",
                                      confirm_password: "",
                                    });
                                    setPasswordError(null);
                                    setPasswordSuccess(null);
                                  }}
                                ></button>
                              </div>
                              <div className="card-body">
                                <form onSubmit={handlePasswordChange}>
                                  <div className="row g-4">
                                    <div className="col-12">
                                      <div className="form-floating">
                                        <input
                                          type="password"
                                          className="form-control"
                                          id="current_password"
                                          value={passwordData.current_password}
                                          onChange={(e) =>
                                            setPasswordData({ ...passwordData, current_password: e.target.value })
                                          }
                                          required
                                          placeholder="Enter your current password"
                                        />
                                        <label htmlFor="current_password">
                                          <i className="bi bi-key me-2"></i>
                                          Current Password
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-12">
                                      <div className="form-floating">
                                        <input
                                          type="password"
                                          className="form-control"
                                          id="new_password"
                                          value={passwordData.new_password}
                                          onChange={(e) =>
                                            setPasswordData({ ...passwordData, new_password: e.target.value })
                                          }
                                          required
                                          placeholder="Enter your new password"
                                        />
                                        <label htmlFor="new_password">
                                          <i className="bi bi-lock me-2"></i>
                                          New Password
                                        </label>
                                      </div>
                                    </div>
                                    <div className="col-12">
                                      <div className="form-floating">
                                        <input
                                          type="password"
                                          className="form-control"
                                          id="confirm_password"
                                          value={passwordData.confirm_password}
                                          onChange={(e) =>
                                            setPasswordData({ ...passwordData, confirm_password: e.target.value })
                                          }
                                          required
                                          placeholder="Confirm your new password"
                                        />
                                        <label htmlFor="confirm_password">
                                          <i className="bi bi-lock-fill me-2"></i>
                                          Confirm New Password
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  {passwordError && (
                                    <div className="alert alert-danger mt-4 d-flex align-items-center" role="alert">
                                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                                      <div>{passwordError}</div>
                                    </div>
                                  )}

                                  {passwordSuccess && (
                                    <div className="alert alert-success mt-4 d-flex align-items-center" role="alert">
                                      <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                                      <div>{passwordSuccess}</div>
                                    </div>
                                  )}

                                  <div className="d-flex gap-3 mt-4">
                                    <button type="submit" className="btn btn-primary flex-grow-1">
                                      <i className="bi bi-check-lg me-2"></i>
                                      Update Password
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary"
                                      onClick={() => {
                                        setIsChangingPassword(false);
                                        setPasswordData({
                                          current_password: "",
                                          new_password: "",
                                          confirm_password: "",
                                        });
                                        setPasswordError(null);
                                        setPasswordSuccess(null);
                                      }}
                                    >
                                      <i className="bi bi-x-lg me-2"></i>
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          ) : (
                            <></>
                          )}
                        </div>

                        {/* Active Chats Tab */}
                        <div
                          className={`tab-pane fade ${
                            activeTab === "chats" ? "show active" : ""
                          }`}
                        >
                          {activeChats.length === 0 ? (
                            <p className="text-muted">No active chats</p>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {activeChats.map((chat) => (
                                <div
                                  key={chat.id}
                                  className="border rounded p-3 hover-bg-light"
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <h3 className="h6 mb-1">
                                        {chat.help_request?.title ||
                                          "Untitled Chat"}
                                      </h3>
                                      <p className="small text-muted mb-0">
                                        With:{" "}
                                        {chat.requester.username ===
                                        user.username
                                          ? chat.helper.username
                                          : chat.requester.username}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/help-requests/${
                                            chat.help_request?.id || 0
                                          }/chat/${chat.id}`
                                        )
                                      }
                                      className="btn btn-primary btn-sm"
                                    >
                                      Join Chat
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Transactions Tab */}
                        <div
                          className={`tab-pane fade ${
                            activeTab === "transactions" ? "show active" : ""
                          }`}
                        >
                          {transactions.length === 0 ? (
                            <p className="text-muted">No transactions yet</p>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {transactions.map((tx) => (
                                <div
                                  key={tx.timestamp}
                                  className="border rounded p-3 hover-bg-light"
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <p className="mb-1">{tx.description}</p>
                                      <p className="small text-muted mb-0">
                                        {formatDistanceToNow(
                                          new Date(tx.timestamp),
                                          {
                                            addSuffix: true,
                                          }
                                        )}
                                      </p>
                                    </div>
                                    <span
                                      className={`fw-semibold ${
                                        tx.amount > 0
                                          ? "text-success"
                                          : "text-danger"
                                      }`}
                                    >
                                      {tx.amount > 0 ? "+" : ""}
                                      {tx.amount} credits
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Contributions Tab */}
                        <div
                          className={`tab-pane fade ${
                            activeTab === "contributions" ? "show active" : ""
                          }`}
                        >
                          {contributionsLoading ? (
                            <div className="d-flex justify-content-center">
                              <div
                                className="spinner-border text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">
                                  Loading...
                                </span>
                              </div>
                            </div>
                          ) : contributionsError ? (
                            <div className="alert alert-danger" role="alert">
                              {contributionsError}
                            </div>
                          ) : contributions.length === 0 ? (
                            <p className="text-muted">No contributions yet</p>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {contributions.map((contribution) => (
                                <div
                                  key={`${contribution.type}-${contribution.id}`}
                                  className="border rounded p-3 hover-bg-light"
                                >
                                  <div className="d-flex align-items-center mb-2">
                                    {contribution.type === "resource" ? (
                                      <FaFileAlt className="me-2 text-primary" />
                                    ) : (
                                      <FaCommentDots className="me-2 text-primary" />
                                    )}
                                    <Link
                                      to={`/${
                                        contribution.type === "resource"
                                          ? "resources"
                                          : "discussions"
                                      }/${contribution.id}`}
                                      className="text-decoration-none text-dark flex-grow-1"
                                    >
                                      <h3 className="h6 mb-0">
                                        {contribution.title}
                                      </h3>
                                    </Link>
                                    <div className="ms-auto">
                                      <button
                                        className="btn btn-sm btn-outline-primary me-2"
                                        onClick={() =>
                                          setEditingContribution(contribution)
                                        }
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => {
                                          setDeleteContributionId(
                                            contribution.id
                                          );
                                          setDeleteContributionType(
                                            contribution.type
                                          );
                                        }}
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="small text-muted mb-2">
                                    {contribution.type === "resource"
                                      ? `Downloads: ${contribution.download_count} | Upvotes: ${contribution.upvotes}`
                                      : `Upvotes: ${contribution.upvotes}`}
                                  </p>
                                  <p className="small text-muted mb-0">
                                    {formatDistanceToNow(
                                      new Date(contribution.created_at),
                                      {
                                        addSuffix: true,
                                      }
                                    )}
                                  </p>
                                  {contribution.type === "discussion" && (
                                    <p className="mt-2 mb-0 small">
                                      {contribution.content.length > 150
                                        ? `${contribution.content.substring(
                                            0,
                                            150
                                          )}...`
                                        : contribution.content}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div
                          className={`tab-pane fade ${
                            activeTab === "help_requests" ? "show active" : ""
                          }`}
                        >
                          {helpRequestsLoading ? (
                            <div className="d-flex justify-content-center">
                              <div
                                className="spinner-border text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">
                                  Loading...
                                </span>
                              </div>
                            </div>
                          ) : helpRequestsError ? (
                            <div className="alert alert-danger" role="alert">
                              {helpRequestsError}
                            </div>
                          ) : helpRequests.length === 0 ? (
                            <p className="text-muted">No help requests yet</p>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {helpRequests.map((request) => (
                                <div
                                  key={`help_request-${request.id}`}
                                  className="border rounded p-3 hover-bg-light"
                                >
                                  <div className="d-flex align-items-center mb-2">
                                    <FaQuestionCircle className="me-2 text-primary" />
                                    <Link
                                      to={`/help-requests/${request.id}`}
                                      className="text-decoration-none text-dark flex-grow-1"
                                    >
                                      <h3 className="h6 mb-0">
                                        {request.title}
                                      </h3>
                                    </Link>
                                    <div className="ms-auto">
                                      <button
                                        className="btn btn-sm btn-outline-primary me-2"
                                        onClick={() =>
                                          setEditingContribution(request)
                                        }
                                      >
                                        <FaEdit />
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() =>
                                          setDeleteHelpRequestId(request.id)
                                        }
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="small text-muted mb-2">
                                    Status: {request.status} | Category:{" "}
                                    {request.category || "None"} | Chat Credits:{" "}
                                    {request.credit_offer_chat} | Video Credits:{" "}
                                    {request.credit_offer_video}
                                  </p>
                                  <p className="small text-muted mb-0">
                                    {formatDistanceToNow(
                                      new Date(request.created_at),
                                      {
                                        addSuffix: true,
                                      }
                                    )}
                                  </p>
                                  <p className="mt-2 mb-0 small">
                                    {request.description.length > 150
                                      ? `${request.description.substring(
                                          0,
                                          150
                                        )}...`
                                      : request.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Mentorships Tab */}
                        <div
                          className={`tab-pane fade ${activeTab === "mentorships" ? "show active" : ""}`}
                        >
                          {mentorshipsLoading ? (
                            <div className="d-flex justify-content-center">
                              <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                          ) : mentorshipsError ? (
                            <div className="alert alert-danger" role="alert">
                              {mentorshipsError}
                            </div>
                          ) : mentorships.length === 0 ? (
                            <p className="text-muted">No active mentorships</p>
                          ) : (
                            <div className="d-flex flex-column gap-3">
                              {mentorships.map((mentorship) => (
                                <div
                                  key={`mentorship-${mentorship.id}`}
                                  className="border rounded p-3 hover-bg-light"
                                >
                                  <div className="d-flex align-items-center mb-2">
                                    <FaChalkboardTeacher className="me-2 text-primary" />
                                    <Link
                                      // Link to the existing mentorship detail route
                                      to={`/mentorships/${mentorship.id}`}
                                      className="text-decoration-none text-dark flex-grow-1"
                                    >
                                      <h3 className="h6 mb-0">
                                        Mentorship: {mentorship.topic || 'Untitled'}
                                      </h3>
                                    </Link>
                                    {/* Optional: Add Edit/Delete buttons if needed based on status/role */}
                                  </div>
                                  <p className="small text-muted mb-2">
                                    Status: <span className={`badge bg-${mentorship.status === 'active' ? 'success' : mentorship.status === 'pending' ? 'warning' : 'secondary'}`}>{mentorship.status || 'N/A'}</span> |
                                    Role: <span className="fw-semibold">{mentorship.mentor.username === user.username ? 'Mentor' : 'Mentee'}</span> |
                                    Partner: {mentorship.mentor.username === user.username ? mentorship.mentee.username : mentorship.mentor.username}
                                  </p>
                                  <p className="small text-muted mb-0">
                                    Started: {formatDistanceToNow(
                                      new Date(mentorship.created_at),
                                      {
                                        addSuffix: true,
                                      }
                                    )}
                                  </p>
                                  {/* Optional: Display a snippet of description or last message if available */}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Contribution Modal */}
      {editingContribution && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit{" "}
                  {editingContribution.type === "help_request"
                    ? "Help Request"
                    : "Contribution"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingContribution(null)}
                ></button>
              </div>
              <div className="modal-body">
                <form
                  onSubmit={
                    editingContribution.type === "help_request"
                      ? handleEditHelpRequest
                      : handleEditContribution
                  }
                >
                  {editingContribution.type === "resource" ? (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingContribution.title}
                          onChange={(e) =>
                            setEditingContribution({
                              ...editingContribution,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          value={editingContribution.description}
                          onChange={(e) =>
                            setEditingContribution({
                              ...editingContribution,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  ) : editingContribution.type === "discussion" ? (
                    <div className="mb-3">
                      <label className="form-label">Content</label>
                      <textarea
                        className="form-control"
                        value={editingContribution.content}
                        onChange={(e) =>
                          setEditingContribution({
                            ...editingContribution,
                            content: e.target.value,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingContribution.title}
                          onChange={(e) =>
                            setEditingContribution({
                              ...editingContribution,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-control"
                          value={editingContribution.description}
                          onChange={(e) =>
                            setEditingContribution({
                              ...editingContribution,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Status</label>
                        <select
                          className="form-control"
                          value={editingContribution.status}
                          onChange={(e) =>
                            setEditingContribution({
                              ...editingContribution,
                              status: e.target.value,
                            })
                          }
                        >
                          <option value="open">Open</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Chat Credit Offer</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editingContribution.credit_offer_chat}
                          onChange={(e) =>
                            setEditingContribution({
                              ...editingContribution,
                              credit_offer_chat: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Video Credit Offer</label>
                        <input
                          type="number"
                          className="form-control"
                          value={editingContribution.credit_offer_video}
                          onChange={(e) =>
                            setEditingContribution({
                              ...editingContribution,
                              credit_offer_video: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Category</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editingContribution.category || ""}
                          onChange={(e) =>
                            setEditingContribution({
                              ...editingContribution,
                              category: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditingContribution(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {(deleteContributionId || deleteHelpRequestId) && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setDeleteContributionId(null);
                    setDeleteContributionType(null);
                    setDeleteHelpRequestId(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete this{" "}
                {deleteHelpRequestId ? "help request" : "contribution"}? This
                action cannot be undone.
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setDeleteContributionId(null);
                    setDeleteContributionType(null);
                    setDeleteHelpRequestId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={
                    deleteHelpRequestId
                      ? handleDeleteHelpRequest
                      : handleDeleteContribution
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
