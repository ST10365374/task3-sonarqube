// frontend/src/pages/Dashboard.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../AppStyles.css";

function Dashboard() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPayments = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await axiosInstance.get("/api/payments/me");
        setPayments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Payment Fetch Error:", err);
        setError(err.response?.data?.msg || "Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="page-container light-theme">
      <div className="card wide clean-card">
        <h2 className="title">Welcome to Your Payments</h2>
        <p className="subtitle">Track your international transfers securely in real-time.</p>

        {loading && <p className="info-text">Loading payments...</p>}
        {error && <p className="message-text error">{error}</p>}

        {!loading && !error && payments.length === 0 && (
          <div className="empty-state">
            <p className="info-text">Start by submitting your first international payment.</p>
            <button className="primary-button large" onClick={() => navigate("/make-payment")}>Make Payment</button>
          </div>
        )}

        {!loading && payments.length > 0 && (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Currency</th>
                <th>Payee Account</th>
                <th>SWIFT Code</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p.amount}</td>
                  <td>{p.currency}</td>
                  <td>{p.payeeAccount}</td>
                  <td>{p.swiftCode}</td>
                  <td className="status success">{p.status || "Processed"}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
