// backend/middleware/csrf.js
const csrf = require("csurf");

const isProd = process.env.NODE_ENV === "production";

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: isProd,               // true in production, false during local dev
    sameSite: isProd ? "strict" : "lax",
  },
});

module.exports = csrfProtection;
