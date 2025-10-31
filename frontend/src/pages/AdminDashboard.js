// frontend/src/pages/AdminDashboard.js
import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import "../AppStyles.css";

const formatCurrency = (amount, currency) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: 2 }).format(amount);
  } catch {
    return `${amount} ${currency || ""}`;
  }
};
const getStatusClass = (status) => {
  switch ((status || "").toLowerCase()) {
    case "completed": return "status-completed";
    case "pending": return "status-pending";
    case "failed": return "status-failed";
    default: return "status-default";
  }
};

function AdminDashboard() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await axiosInstance.get("/api/admin/payments");
        setPayments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("API Call Error:", err.response || err);
        setError(err.response?.data?.msg || err.message || "Could not connect to server or fetch payments.");
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div className="dashboard-layout">
      <div className="data-card">
        <h2 className="card-title">All Payments <span className="title-count">({payments.length})</span></h2>
        <hr className="divider" />
        {loading && <p className="status-message loading-message">Loading payments...</p>}
        {error && <p className="status-message error-message">{error}</p>}
        {!loading && payments.length === 0 && !error && <p className="status-message no-data-message">No payments found.</p>}
        {payments.length > 0 && (
          <div className="table-wrapper">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Account #</th>
                  <th className="th-right">Amount</th>
                  <th>Payee Account</th>
                  <th>SWIFT Code</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="user-details">
                        <span className="user-name">{p.sender?.fullName || "N/A"}</span>
                        <span className="user-account-number">{p.sender?.accountNumber || "N/A"}</span>
                      </div>
                    </td>
                    <td>{p.sender?.accountNumber || "N/A"}</td>
                    <td className="td-right">{formatCurrency(p.amount, p.currency)}</td>
                    <td>{p.payeeAccount}</td>
                    <td>{p.swiftCode}</td>
                    <td><span className={`status-badge ${getStatusClass(p.status)}`}>{p.status}</span></td>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
