import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import Navbar from "../../components/Navbar";
import { loginSuccess } from "../../redux/authSlice";
import api from "../../apiRequests/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants";
import LoadingIndicator from "../../components/LoadingIndicator";
import "../../styles/AuthStyles.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = () => {
    window.location.href = "https://elevatehub-proxy.mijuzz007.workers.dev/accounts/google/login/";
  };

  const handleNormalLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const payload = { username, password };
    try {
      const res = await api.post("api/token/", payload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (res.data.access && res.data.user) {
        dispatch(loginSuccess({
          user: res.data.user,
          token: res.data.access,
        }));
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        try {
          const authStatus = await api.get("api/auth/status/", {
            withCredentials: true,
          });
          console.log("Auth status response:", authStatus.data);
        } catch (statusError) {
          console.log("Auth status check failed, proceeding anyway:", statusError);
        }
        
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      setError(error.response?.data?.detail || "Login failed. Please try again.");
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
              <p>Connect, learn, and grow with our vibrant community. Sign in to start your journey!</p>
            </div>
            <div className="col-md-6 auth-form-card">
              <h2>Sign In</h2>
              <form onSubmit={handleNormalLogin}>
                {error && <div className="alert alert-danger">{error}</div>}
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    disabled={loading}
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
                    disabled={loading}
                    required
                  />
                </div>
                {loading && <LoadingIndicator />}
                <button className="btn auth-btn-primary w-100 mb-3" type="submit" disabled={loading}>
                  Sign In
                </button>
                <div className="text-center">
                  <Link to="/forgot-password" className="text-primary text-decoration-none fw-semibold small d-inline-block mb-3 hover-underline">
                    Forgot password?
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;