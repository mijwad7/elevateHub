import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import Navbar from "../../components/Navbar";
import { loginSuccess } from "../../redux/authSlice";
import api from "../../apiRequests/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import LoadingIndicator from "../../components/LoadingIndicator";
import { Alert } from "react-bootstrap";
import "../../styles/AuthStyles.css";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // New state for success message

  const handleGoogleLogin = () => {
    window.location.href = "https://elevatehub-proxy.mijuzz007.workers.dev/accounts/google/login/";
  };

  const handleGenerateOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post(
        "api/generate-otp/",
        { email, username, password },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      setOtpSent(true);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post(
        "api/verify-otp/",
        { email, otp_code: otpCode },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000); // Delay navigation by 2 seconds
    } catch (error) {
      setError(error.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="auth-container">
        <div className="container">
          <div className="row g-0 shadow-lg">
            <div className="col-md-6 auth-welcome">
              <h1>Welcome to ElevateHub</h1>
              <p>Join our community to connect, learn, and grow. Create your account now!</p>
            </div>
            <div className="col-md-6 auth-form-card">
              <h2>Sign Up</h2>
              <form onSubmit={otpSent ? handleVerifyOTP : handleGenerateOTP}>
                {error && (
                  <Alert variant="danger" className="rounded-3">
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" className="rounded-3">
                    {success}
                  </Alert>
                )}
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    disabled={loading || otpSent}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control rounded-3"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    disabled={loading || otpSent}
                    required
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className="form-control rounded-3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={loading || otpSent}
                    required
                  />
                </div>
                {otpSent && (
                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control rounded-3"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter OTP"
                      disabled={loading}
                      required
                    />
                  </div>
                )}
                {loading && <LoadingIndicator />}
                <button
                  className="btn auth-btn-primary w-100 mb-3 rounded-3"
                  type="submit"
                  disabled={loading}
                >
                  {otpSent ? "Verify OTP & Sign Up" : "Send OTP"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;