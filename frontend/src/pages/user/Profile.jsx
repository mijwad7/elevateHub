import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../apiRequests/api";
import { useState } from "react";
import { loginSuccess, updateCredits } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import { getCreditBalance, getCreditTransactions } from "../../apiRequests";

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  console.log(user);
  const [selectedFile, setSelectedFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const dispatch = useDispatch();

  if (!user) {
    return <p>Loading...</p>;
  }

  useEffect(() => {
    if (user) {
      getCreditBalance().then((balance) => dispatch(updateCredits(balance)));
      getCreditTransactions().then((transactions) => setTransactions(transactions));
    }
  }, [user, dispatch])

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }
    const formData = new FormData();
    formData.append("profile_image", selectedFile);

    try {
      const token = localStorage.getItem("access_token");
      const response = await api.put(
        `/api/users/${user.id}/upload-profile/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      dispatch(loginSuccess({ user: response.data, token }));
      alert("Profile image updated successfully");
    } catch (error) {
      console.error("Error updating profile image:", error);
      alert("Error updating profile image. Please try again.");
    }
  };

  const profileImageUrl = user.profile_image
    ? `http://127.0.0.1:8000/${user.profile_image}`
    : "default_image.jpg";

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg p-4">
              <h1 className="text-center mb-4">Profile</h1>
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
                <p><strong>Credits:</strong> {user.credits !== undefined ? user.credits : "Loading..."}</p>
              </div>

              {/* Transaction History */}
              <div className="mt-4">
                <h5>Credit Transactions</h5>
                {transactions.length > 0 ? (
                  <ul className="list-group">
                    {transactions.map((tx) => (
                      <li key={tx.timestamp} className="list-group-item">
                        {tx.amount > 0 ? "+" : ""}{tx.amount} credits - {tx.description} 
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

              {/* File Upload */}
              <div className="mt-4">
                <h5>Upload Profile Image</h5>
                <div className="input-group">
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button className="btn btn-primary" onClick={handleUpload}>
                    Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
