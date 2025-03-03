import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.new_password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await axios.post(`http://127.0.0.1:8000/api/reset-password/${uid}/${token}/`, {
        password: formData.new_password,
      });
      alert("Password reset successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong.");
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          name="new_password"
          placeholder="New Password"
          value={formData.new_password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirm_password"
          placeholder="Confirm Password"
          value={formData.confirm_password}
          onChange={handleChange}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;
