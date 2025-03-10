import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Form from "../../components/Form";
import Navbar from "../../components/Navbar";
import { loginSuccess, googleLoginSuccess, setAuthStatus } from "../../redux/authSlice";

const Login = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Handle Google login redirect
  const handleGoogleLogin = () => {
    window.location.href = "http://127.0.0.1:8000/accounts/google/login/";
  };

  // Check authentication status (for Google/session auth)
  useEffect(() => {
    fetch("http://127.0.0.1:8000/auth/status/", {
      credentials: "include",
      headers: { "Accept": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Auth status response:", data); // Debug log
        if (data.is_authenticated) {
          dispatch(googleLoginSuccess({ user: data.user }));
          navigate("/");
        } else {
          dispatch(setAuthStatus(false));
        }
      })
      .catch((err) => {
        console.error("Auth status check failed:", err);
        dispatch(setAuthStatus(false));
      });
  }, [dispatch, navigate]);

  // Handle normal login success from Form
  const handleNormalLogin = (response) => {
    dispatch(loginSuccess({
      user: response.user, // Adjust based on your Form response
      token: response.access, // From api/token/
    }));
    navigate("/");
  };

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card p-4 shadow-sm">
              {/* Traditional login form */}
              <Form 
                route="api/token/" 
                method="login" 
                onSuccess={handleNormalLogin} // Pass callback
              />
              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1" />
                <span className="px-2 text-muted">or</span>
                <hr className="flex-grow-1" />
              </div>
              {/* Google login button */}
              <button
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                onClick={handleGoogleLogin}
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