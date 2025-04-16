import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import Navbar from "../../components/Navbar";
import { loginSuccess } from "../../redux/authSlice";
import api from "../../apiRequests/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import LoadingIndicator from "../../components/LoadingIndicator";
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

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/accounts/google/login/";
  };

  const handleGenerateOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await api.post("api/generate-otp/", { 
        email,
        username,
        password 
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
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
    
    try {
      const res = await api.post("api/verify-otp/", { 
        email, 
        otp_code: otpCode 
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      navigate("/login");
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
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
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
                    className="form-control"
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
                    className="form-control"
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
                      className="form-control"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter OTP"
                      disabled={loading}
                      required
                    />
                  </div>
                )}
                {loading && <LoadingIndicator />}
                <button className="btn auth-btn-primary w-100 mb-3" type="submit" disabled={loading}>
                  {otpSent ? "Verify OTP & Sign Up" : "Send OTP"}
                </button>
              </form>
              <div className="divider">
                <hr /><span>OR</span><hr />
              </div>
              <button
                className="google-btn w-100"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" />
                Sign up with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;