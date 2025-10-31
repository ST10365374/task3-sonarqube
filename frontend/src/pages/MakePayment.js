// frontend/src/pages/MakePayment.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../AppStyles.css";

function MakePayment() {
  const [form, setForm] = useState({ receiverAccountNumber: "", amount: "", currency: "", swiftCode: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      // 1) get fresh CSRF token
      const csrfRes = await axiosInstance.get("/api/csrf-token");
      const csrfToken = csrfRes.data.csrfToken;

      // 2) send payment POST with CSRF header
      const res = await axiosInstance.post("/api/payments", form, {
        headers: { "CSRF-Token": csrfToken },
      });

      setMessage(res.data.msg || "Payment submitted successfully!");
      // optionally navigate or refresh dashboard
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      console.error("Payment error:", err);
      setMessage(err.response?.data?.msg || "Error submitting payment");
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2 className="title">Make a Payment</h2>
        <form className="form-layout" onSubmit={handleSubmit}>
          <input className="form-input" name="receiverAccountNumber" placeholder="Payee Account" value={form.receiverAccountNumber} onChange={handleChange} required />
          <input className="form-input" name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} required />
          <input className="form-input" name="currency" placeholder="Currency (e.g. USD)" value={form.currency} onChange={handleChange} required />
          <input className="form-input" name="swiftCode" placeholder="SWIFT Code" value={form.swiftCode} onChange={handleChange} />
          <button className="primary-button" type="submit">Pay Now</button>
        </form>
        {message && <p className="message-text">{message}</p>}
      </div>
    </div>
  );
}

export default MakePayment;
