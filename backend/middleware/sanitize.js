// backend/middleware/sanitize.js - FINAL CORRECTED VERSION
const mongoSanitize = require("express-mongo-sanitize");

module.exports = (req, res, next) => {
  try {
    // The library cleans req.body, req.params, and req.query in place.
    // Manual loops are NOT needed and cause the "Cannot set property query" error.
    mongoSanitize.sanitize(req.body);
    mongoSanitize.sanitize(req.params);
    mongoSanitize.sanitize(req.query);
    
    next();
  } catch (err) {
    console.error("❌ sanitize.js error:", err);
    next(err);
  }
};