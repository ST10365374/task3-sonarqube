// backend/middleware/sanitize.js
// Express 5–compatible sanitizer — never mutates req.query
module.exports = function sanitizeRequest(req, res, next) {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        const safeKey = key.replace(/\$/g, "_").replace(/\./g, "_");
        obj[safeKey] = obj[key];
        delete obj[key];
      }
      if (typeof obj[safeKey] === "object") {
        sanitize(obj[safeKey]);
      }
    }
  };

  sanitize(req.body);
  sanitize(req.params);
  // 🚫 never touch req.query
  next();
};
