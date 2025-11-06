//Registration has been disabled

/*
// frontend/src/pages/Register.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../AppStyles.css";
import axiosInstance from "../api/axiosInstance";

function Register() {
  const [form, setForm] = useState({ fullName: "", idNumber: "", accountNumber: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const csrfRes = await axiosInstance.get("/api/csrf-token");
      const csrfToken = csrfRes.data.csrfToken;

      const res = await axiosInstance.post("/api/auth/register", form, {
        headers: { "CSRF-Token": csrfToken },
      });

      localStorage.setItem("role", res.data.user?.role || "customer");
      setMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1100);
    } catch (err) {
      console.error("Register error:", err);
      const errorMessage = err.response?.data?.msg || err.message;
      setMessage("Registration failed: " + errorMessage);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2 className="title">Open Your Account</h2>
        <p className="subtitle">Please fill in your details to register.</p>
        <form className="form-layout" onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="fullName" value={form.fullName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">ID Number</label>
            <input className="form-input" name="idNumber" value={form.idNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input className="form-input" name="accountNumber" value={form.accountNumber} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} required />
          </div>
          <button className="primary-button" type="submit">Register</button>
        </form>
        {message && <p className="message-text">{message}</p>}
      </div>
    </div>
  );
}

export default Register;

*/