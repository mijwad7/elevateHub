import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import Navbar from "../../components/Navbar";
import { loginSuccess } from "../../redux/authSlice";
import api from "../../apiRequests/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants"; // Already correct
import LoadingIndicator from "../../components/LoadingIndicator";
import "../../styles/Form.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/accounts/google/login/";
  };

  const handleNormalLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { username, password };
    try {
      // Perform login
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

        // Verify session is set
        try {
          const authStatus = await api.get("auth/status/", {
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
      alert(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card p-4 shadow-sm">
              <form onSubmit={handleNormalLogin} className="form-container">
                <h1>Login</h1>
                <input
                  className="form-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  disabled={loading}
                />
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={loading}
                />
                {loading && <LoadingIndicator />}
                <button className="form-button" type="submit" disabled={loading}>
                  Login
                </button>
                <Link className="link-primary" to="/forgot-password">
                  Forgot password?
                </Link>
              </form>
              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1" />
                <span className="px-2 text-muted">or</span>
                <hr className="flex-grow-1" />
              </div>
              <button
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <i className="bi bi-google me-2"></i> Login with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;