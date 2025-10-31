// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const https = require("https");
const http = require("http");              // ✅ Added: optional HTTP redirect
const cookieParser = require("cookie-parser");
const csrfProtection = require("./middleware/csrf");
const mongoSanitize = require("express-mongo-sanitize"); // ✅ Added
const xss = require("xss-clean");                       // ✅ Added

const app = express();
app.set("trust proxy", 1);

// SSL paths
const certPath = "./certs/cert.pem";
const keyPath = "./certs/key.pem";

// ✅ Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.disable("x-powered-by");
app.use(mongoSanitize()); // ✅ Prevent NoSQL injection
app.use(xss());           // ✅ Prevent reflected XSS

// ✅ CORS — same as yours
app.use(
  cors({
    origin: "https://localhost:3000",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization", "CSRF-Token"],
  })
);

// ✅ Rate limiter (unchanged)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { msg: "Too many requests, please try again later" },
  })
);

// ✅ Body & cookie parsing
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ✅ Optional HTTPS enforcement (redirect HTTP → HTTPS)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure && req.get("x-forwarded-proto") !== "https") {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    }
    next();
  });
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
}

// ✅ CSRF token route
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  return res.json({ csrfToken: req.csrfToken() });
});

// ✅ Connect Mongo
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ✅ Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes.router);
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));

// ✅ Health check (helps CircleCI/Sonar runs)
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  if (err && err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ msg: "Invalid or missing CSRF token" });
  }
  res.status(err.status || 500).json({ msg: err.message || "Server error." });
});

// ✅ HTTPS server
const HTTPS_PORT = process.env.PORT || 5001;
try {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  https.createServer(options, app).listen(HTTPS_PORT, () => {
    console.log(`🚀 Secure Server running on https://localhost:${HTTPS_PORT}`);
  });
} catch (error) {
  console.error("❌ ERROR STARTING HTTPS SERVER:", error.message);
  http.createServer(app).listen(HTTP_PORT || 5000, () => {
    console.log(`Server running on http://localhost:${HTTP_PORT || 5000}`);
  });
}

// ✅ Optional redirector (for local demo)
if (process.env.ENABLE_HTTP_REDIRECT === "true") {
  const HTTP_PORT = process.env.HTTP_PORT || 5000;
  http.createServer((req, res) => {
    const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
    res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
    res.end();
  }).listen(HTTP_PORT, () =>
    console.log(`🔁 HTTP redirector active on http://localhost:${HTTP_PORT}`)
  );
}
