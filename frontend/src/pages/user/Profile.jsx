import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../apiRequests/api";
import { loginSuccess, updateCredits } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import { getCreditBalance, getCreditTransactions } from "../../apiRequests";

const Profile = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [selectedFile, setSelectedFile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!isAuthenticated || !user) return;

            try {
                setLoading(true);

                // Fetch auth status only if user data is incomplete
                let updatedUser = user;
                if (!user.credits || !user.profile_image) {
                    const statusResponse = await api.get("/auth/status/", {
                        withCredentials: true,
                    });
                    if (statusResponse.data.is_authenticated) {
                        updatedUser = { ...user, ...statusResponse.data.user };
                        dispatch(loginSuccess({ user: updatedUser }));
                    }
                }

                // Fetch credits and transactions
                const balance = await getCreditBalance();
                if (balance !== updatedUser.credits) {
                    dispatch(updateCredits(balance));
                }

                const txs = await getCreditTransactions();
                setTransactions(txs);
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isAuthenticated, dispatch]); // Removed 'user' from dependencies

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
            const response = await api.put(
                `/api/users/${user.id}/upload-profile/`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            dispatch(loginSuccess({ user: response.data }));
            alert("Profile image updated successfully");
        } catch (error) {
            console.error("Error updating profile image:", error);
            alert("Error updating profile image. Please try again.");
        }
    };

    const profileImageUrl = user?.profile_image
        ? `http://localhost:8000/${user.profile_image}`
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
                                        <p><strong>Username:</strong> {user.username}</p>
                                        {user.email && <p><strong>Email:</strong> {user.email}</p>}
                                        <p>
                                            <strong>Credits:</strong>{" "}
                                            {user.credits !== undefined ? user.credits : "Loading..."}
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
                                            <button className="btn btn-primary" onClick={handleUpload}>
                                                Upload
                                            </button>
                                        </div>
                                    </div>

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