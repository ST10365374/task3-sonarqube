// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const logAction = require("../utils/auditLogger");

// ✅ Give the middleware a descriptive name
function authenticateUser(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    logAction(null, "Unauthorized access attempt - no token", req);
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    // FIX: Robust error handling resolves the Code Smell (L17)
    logAction(null, "Invalid JWT detected", req);
    console.error('JWT verification failed:', err.message); 
    return res.status(401).json({ message: "Access denied. Invalid token." }); 
  }
}

module.exports = authenticateUser;