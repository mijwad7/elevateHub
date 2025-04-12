import React, { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../apiRequests/api";
import { loginSuccess, updateCredits } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import { getCreditBalance, getCreditTransactions } from "../../apiRequests";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import { FaUser, FaImage, FaHistory, FaComments, FaSignOutAlt } from "react-icons/fa";
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
  const dispatch = useDispatch();
  const navigate = useNavigate();

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

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserData();
    }
  }, [isAuthenticated, user?.id, fetchUserData]);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
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
        formData.append('profile_image', selectedFile);

        // Get auth config with proper headers
        const config = await getAuthConfig();

        // First ensure we have a CSRF token
        let csrfToken = document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];

        // If no CSRF token found or in incognito mode, fetch it
        if (!csrfToken) {
            const csrfResponse = await api.get('/api/get-csrf/', {
                withCredentials: true,
                headers: {
                    ...config.headers
                }
            });
            csrfToken = csrfResponse.data.csrftoken;
        }

        const headers = {
            ...config.headers,
            'Content-Type': 'multipart/form-data',
            'X-CSRFToken': csrfToken
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
            dispatch(loginSuccess({ user: response.data, token: localStorage.getItem(ACCESS_TOKEN) }));
            setSelectedFile(null);
            setPreviewUrl(null);
            toast.success('Profile image updated successfully!');
        }
    } catch (error) {
        console.error('Error uploading profile image:', error);
        if (error.response?.status === 401) {
            // Token expired, try to refresh
            const newToken = await refreshToken();
            if (newToken) {
                // Retry the upload with new token
                return handleUpload();
            }
        }
        toast.error(error.response?.data?.error || 'Failed to upload profile image');
    } finally {
        setUploadProgress(0);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.info("Logged out successfully");
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
          <div className="col-lg-8">
            {/* Profile Header */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex flex-column flex-md-row align-items-center">
                  <div className="position-relative mb-4 mb-md-0 me-md-4">
                    <div className="rounded-circle overflow-hidden border border-4 border-white shadow" style={{ width: '128px', height: '128px' }}>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-100 h-100 object-fit-cover"
                        />
                      ) : profileImageUrl ? (
                        <img
                          src={profileImageUrl}
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
                          style={{ width: `${uploadProgress}%`, transition: 'width 0.3s' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-center text-md-start flex-grow-1">
                    <h1 className="h2 mb-2">{user.username}</h1>
                    <p className="text-muted mb-3">{user.email}</p>
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3">
                      <div className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                        <span className="fw-semibold">{user.credits || 0}</span> credits
                      </div>
                      <button
                        onClick={handleLogout}
                        className="btn btn-link text-danger p-0 d-flex align-items-center"
                      >
                        <FaSignOutAlt className="me-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>

                {/* Profile Image Upload */}
                <div className="mt-4">
                  <div className="d-flex align-items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="d-none"
                      id="profile-upload"
                    />
                    <label
                      htmlFor="profile-upload"
                      className="btn btn-primary d-flex align-items-center"
                    >
                      <FaImage className="me-2" />
                      {selectedFile ? "Change Image" : "Upload Image"}
                    </label>
                    {selectedFile && (
                      <button
                        onClick={handleUpload}
                        className="btn btn-success"
                      >
                        Save Changes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Chats */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h2 className="h5 mb-4 d-flex align-items-center">
                  <FaComments className="me-2" />
                  Active Chats
                </h2>
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
                              {chat.help_request?.title || "Untitled Chat"}
                            </h3>
                            <p className="small text-muted mb-0">
                              With:{" "}
                              {chat.requester.username === user.username
                                ? chat.helper.username
                                : chat.requester.username}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              navigate(
                                `/help-requests/${chat.help_request?.id || 0}/chat/${chat.id}`
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
            </div>

            {/* Credit Transactions */}
            <div className="card shadow-sm">
              <div className="card-body">
                <h2 className="h5 mb-4 d-flex align-items-center">
                  <FaHistory className="me-2" />
                  Credit Transactions
                </h2>
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
                              {formatDistanceToNow(new Date(tx.timestamp), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <span
                            className={`fw-semibold ${
                              tx.amount > 0 ? "text-success" : "text-danger"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
