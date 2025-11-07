// backend/middleware/sanitize.js
const mongoSanitize = require("express-mongo-sanitize");

// FIX: Named function resolves the Code Smell
module.exports = function mongoSanitizeMiddleware(req, res, next) {
  try {
    mongoSanitize.sanitize(req.body);
    mongoSanitize.sanitize(req.params);
    mongoSanitize.sanitize(req.query);
    next();
  } catch (err) {
    console.error("❌ sanitize.js error:", err);
    next(err);
  }
};