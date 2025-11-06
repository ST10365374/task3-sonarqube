import "../AppStyles.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">Welcome to Customer International Payments</h1>
        <p className="home-subtitle">Fast • Secure • Reliable Banking</p>
        <div className="home-buttons">
          <Link to="/login" className="primary-button">Login</Link>
          {/* <Link to="/register" className="secondary-button">Register</Link> */}
        </div>
      </div>
    </div>
  );
}

export default Home;