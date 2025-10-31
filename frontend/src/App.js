// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MakePayment from "./pages/MakePayment";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";
import axiosInstance from "./api/axiosInstance";

// --- AuthStatus Component ---
const AuthStatus = () => {
  const isLoggedIn = !!localStorage.getItem("role");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/auth/logout"); // ✅ clear secure cookie
    } catch (err) {
      console.error("Logout error:", err);
    }
    localStorage.removeItem("role");
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // **Hide navbar on home page**
  if (location.pathname === "/") {
    return null;
  }

  // --- Conditional nav links ---
  let navContent;
  if (isLoggedIn) {
    if (role === "admin") {
      navContent = (
        <>
          <button onClick={() => handleNavigate("/admin-dashboard")} className="nav-button">
            All Payments
          </button>
          <span> | </span>
          <button onClick={handleLogout} className="nav-button logout-btn">
            Logout
          </button>
        </>
      );
    } else if (role === "customer") {
      navContent = (
        <>
          <button onClick={() => handleNavigate("/dashboard")} className="nav-button">
            My Dashboard
          </button>
          <span> | </span>
          <button onClick={() => handleNavigate("/make-payment")} className="nav-button">
            Make Payment
          </button>
          <span> | </span>
          <button onClick={handleLogout} className="nav-button logout-btn">
            Logout
          </button>
        </>
      );
    } else {
      navContent = (
        <button onClick={handleLogout} className="nav-button logout-btn">
          Logout
        </button>
      );
    }
  } else {
    navContent = (
      <>
        <button onClick={() => handleNavigate("/login")} className="nav-button">
          Login
        </button>
        <span> | </span>
        <button onClick={() => handleNavigate("/register")} className="nav-button">
          Register
        </button>
      </>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">International Payments</div>
      <div className="nav-links-container">{navContent}</div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <AuthStatus />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/make-payment" element={<MakePayment />} />

        {/* Admin Route */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
