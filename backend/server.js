require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const fs = require("fs");
const https = require("https");
const http = require("http");
const cookieParser = require("cookie-parser");

const csrfProtection = require("./middleware/csrf");
const logAction = require("./utils/auditLogger");

const app = express();
app.set("trust proxy", 1);

// ✅ SSL certs (development self-signed)
// 🔑 CRITICAL FIX: The correct path is just ./certs/
const certPath = "./certs/cert.pem"; 
const keyPath = "./certs/key.pem";   

/* =========================
   🔐 SECURITY MIDDLEWARES
========================= */

// Helmet – sets various HTTP headers and integrates HSTS
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
    strictTransportSecurity: {
      maxAge: 31536000, 
      includeSubDomains: true,
      preload: true,
    }
  })
);
app.disable("x-powered-by");

// HPP – prevent HTTP Parameter Pollution
app.use(hpp());

// CORS – allow frontend on localhost:3000
app.use(
  cors({
    origin: "https://localhost:3000",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization", "CSRF-Token"],
  })
);

// Rate limiter – brute-force protection
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
    message: { msg: "Too many requests, try again later." },
  })
);

// 🔑 Request Parsers (MUST BE FIRST)
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// XSS and Injection protection are now handled safely in `validate.js`.


// ✅ Redirect HTTP→HTTPS only in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure && req.get("x-forwarded-proto") !== "https") {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    }
    next();
  });
}

/* =========================
   🌐 BASIC ROUTES
========================= */

// CSRF token endpoint
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

/* =========================
   🗄️ DATABASE CONNECTION
========================= */

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
})();

/* =========================
   📦 ROUTES
========================= */

const authRoutes = require("./routes/auth");
const paymentRoutes = require("./routes/payments");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes.router);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);

/* =========================
   📋 LOGGING & ERRORS
========================= */

// Log all failed requests for auditing
app.use((req, res, next) => {
  res.on("finish", () => {
    if (res.statusCode >= 400) {
      logAction(
        null,
        `Failed request: ${req.method} ${req.originalUrl} (${res.statusCode})`,
        req
      );
    }
  });
  next();
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  if (err?.code === "EBADCSRFTOKEN") {
    // Example: res.redirect(req.query.redirectTo);
    return res.redirect('/login'); // Or '/' - CRITICAL FIX applied here
  }
  res.status(err.status || 500).json({ msg: err.message || "Server error." });
});

/* =========================
   🚀 SERVER STARTUP
========================= */

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
  console.error("❌ HTTPS startup error:", error.message);
  const HTTP_PORT = process.env.HTTP_PORT || 5000;
  http.createServer(app).listen(HTTP_PORT, () => {
    console.log(`Server running on http://localhost:${HTTP_PORT}`);
  });
}

// Optional HTTP→HTTPS redirect (for dev)
if (process.env.ENABLE_HTTP_REDIRECT === "true") {
  const HTTP_PORT = process.env.HTTP_PORT || 5000;
  http
    .createServer((req, res) => {
      const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
      res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
      res.end();
    })
    .listen(HTTP_PORT, () =>
      console.log(`🔁 HTTP redirector active on http://localhost:${HTTP_PORT}`)
    );
}