// frontend/src/pages/Login.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../AppStyles.css";
import axiosInstance from "../api/axiosInstance";

function Login() {
  const [form, setForm] = useState({ accountNumber: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      // 1) fetch fresh CSRF token (also sets the CSRF cookie)
      const csrfRes = await axiosInstance.get("/api/csrf-token");
      const csrfToken = csrfRes.data.csrfToken;

      // 2) POST login with CSRF token header (cookie JWT will be set by server)
      const res = await axiosInstance.post("/api/auth/login", form, {
        headers: { "CSRF-Token": csrfToken },
      });

      localStorage.setItem("role", res.data.role);

      setMessage("Login successful!");
      window.dispatchEvent(new Event("storage"));

      if (res.data.role === "admin") navigate("/admin-dashboard");
      else navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.msg || err.message;
      setMessage("Login failed: " + errorMessage);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2 className="title">Welcome Back</h2>
        <p className="subtitle">Log in to access your secure banking dashboard.</p>
        <form className="form-layout" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input className="form-input" name="accountNumber" value={form.accountNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <button className="primary-button" type="submit">Login</button>
        </form>
        {message && <p className="message-text">{message}</p>}
      </div>
    </div>
  );
}

export default Login;
