// backend/utils/auditLogger.js
const AuditLog = require("../models/AuditLog");

const logAction = async (userId, action, req) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      ip: req.ip || req.headers["x-forwarded-for"],
      userAgent: req.get("User-Agent"),
    });
  } catch (err) {
    console.error("❌ Failed to write audit log:", err.message);
  }
};

module.exports = logAction;
