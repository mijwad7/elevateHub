import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../apiRequests/api";
import { loginSuccess, updateCredits } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { getCreditBalance, getCreditTransactions } from "../../apiRequests";
import { ACCESS_TOKEN } from "../../constants";

const Profile = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [selectedFile, setSelectedFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const [activeChats, setActiveChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchActiveChats = async () => {
      try {
        const accessToken = localStorage.getItem(ACCESS_TOKEN);
        const config = accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : { withCredentials: true }; // Fallback to session auth
        const response = await api.get("api/active-chats/", config);
        setActiveChats(response.data);
      } catch (error) {
        console.error("Error fetching active chats:", error);
      }
    };

    fetchActiveChats();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated || !user) return;

      try {
        setLoading(true);

        // Use existing user data if complete, otherwise fetch
        let updatedUser = user;
        const accessToken = localStorage.getItem(ACCESS_TOKEN);
        const config = accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : { withCredentials: true }; // Fallback to session auth

        if (!user.credits || !user.profile_image) {
          const statusResponse = await api.get("/auth/status/", config);
          if (statusResponse.data.is_authenticated) {
            updatedUser = { ...user, ...statusResponse.data.user };
            dispatch(loginSuccess({ user: updatedUser, token: accessToken }));
          }
        }

        // Fetch credits and transactions
        const balance = await getCreditBalance(config); // Pass config
        if (balance !== updatedUser.credits) {
          dispatch(updateCredits(balance));
        }

        const txs = await getCreditTransactions(config); // Pass config
        setTransactions(txs);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated, dispatch, user]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // Add this helper function at the top of the file if not already present
  const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }
    const formData = new FormData();
    formData.append("profile_image", selectedFile);
  
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN);
      let config;
      if (accessToken && accessToken !== "null") {
        config = {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        };
      } else {
        // Fetch CSRF token for session auth
        const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1];
        if (!csrfToken) {
          await api.get("/auth/status/"); // Trigger CSRF fetch if needed
        }
        config = {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-CSRFToken": csrfToken || getCsrfToken(), // Use fetched token
          },
          withCredentials: true,
        };
      }
      const response = await api.put(`/api/users/${user.id}/upload-profile/`, formData, config);
      dispatch(loginSuccess({ user: response.data, token: accessToken }));
      alert("Profile image updated successfully");
    } catch (error) {
      console.error("Error updating profile image:", error);
      alert("Error updating profile image. Please try again.");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const profileImageUrl = user?.profile_image
    ? `http://localhost:8000${user.profile_image}`
    : "default_image.jpg";

  if (!isAuthenticated || !user) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg p-4">
              <h1 className="text-center mb-4">Profile</h1>
              {loading ? (
                <p className="text-center">Loading profile...</p>
              ) : (
                <>
                  <div className="text-center">
                    {user.profile_image ? (
                      <img
                        src={profileImageUrl}
                        alt="Profile"
                        className="img-fluid rounded-circle border shadow-sm"
                        width="150"
                      />
                    ) : (
                      <p className="text-muted">No profile image uploaded.</p>
                    )}
                  </div>

                  <div className="mt-3">
                    <p>
                      <strong>Username:</strong> {user.username}
                    </p>
                    {user.email && (
                      <p>
                        <strong>Email:</strong> {user.email}
                      </p>
                    )}
                    <p>
                      <strong>Credits:</strong>{" "}
                      {user.credits !== undefined ? user.credits : 0}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h5>Upload Profile Image</h5>
                    <div className="input-group">
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleUpload}
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  <h2>Active Chats</h2>
                  {activeChats.length === 0 ? (
                    <p>No active chats.</p>
                  ) : (
                    <ul className="list-group">
                      {activeChats.map((chat) => (
                        <li key={chat.id} className="list-group-item">
                          <div>
                            <strong>Chat #{chat.id}</strong> -
                            {chat.help_request
                              ? ` ${chat.help_request.title}`
                              : " No Request"}
                          </div>
                          <div>
                            With:{" "}
                            {chat.requester.username === user.username
                              ? chat.helper.username
                              : chat.requester.username}
                          </div>
                          <button
                            className="btn btn-primary btn-sm mt-2"
                            onClick={() =>
                              navigate(
                                `/help-requests/${chat.help_request?.id || 0}/chat/${chat.id}`
                              )
                            }
                          >
                            Join Chat
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4">
                    <h5>Credit Transactions</h5>
                    {transactions.length > 0 ? (
                      <ul className="list-group">
                        {transactions.map((tx) => (
                          <li key={tx.timestamp} className="list-group-item">
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount} credits - {tx.description}
                            <small className="text-muted d-block">
                              {new Date(tx.timestamp).toLocaleString()}
                            </small>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">No transactions yet.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
