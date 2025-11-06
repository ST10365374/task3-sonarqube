// backend/middleware/cleanXSS.js
// Simple replacement for xss-clean that doesn't touch req.query

function cleanString(str) {
  return str
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=".*?"/gi, "");
}

function deepClean(obj) {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") obj[key] = cleanString(obj[key]);
    else if (typeof obj[key] === "object") deepClean(obj[key]);
  }
}

module.exports = function cleanXSS(req, res, next) {
  try {
    deepClean(req.body);
    deepClean(req.params);
    // 🚫 Do not touch req.query
  } catch (err) {
    console.warn("⚠️ XSS cleaner error:", err.message);
  }
  next();
};
