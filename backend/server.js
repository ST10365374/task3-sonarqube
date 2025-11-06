require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const https = require("https");
const http = require("http");
const cookieParser = require("cookie-parser");
const csrfProtection = require("./middleware/csrf");
const sanitizeRequest = require("./middleware/sanitize");
const cleanXSS = require("./middleware/cleanXSS"); // ✅ new XSS cleaner
const logAction = require("./utils/auditLogger");

const app = express();
app.set("trust proxy", 1);

const certPath = "./certs/cert.pem";
const keyPath = "./certs/key.pem";

// ✅ Helmet security
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

// ✅ Sanitize and XSS clean
app.use(sanitizeRequest);
app.use(cleanXSS);

// ✅ CORS
app.use(
  cors({
    origin: "https://localhost:3000",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "Authorization", "CSRF-Token"],
  })
);

// ✅ Rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { msg: "Too many requests, try again later." },
  })
);

// ✅ Body & cookies
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// ✅ HSTS
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  })
);

// ✅ Redirect HTTP→HTTPS only in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (!req.secure && req.get("x-forwarded-proto") !== "https") {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    }
    next();
  });
}

// ✅ CSRF token
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ✅ Health
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// ✅ MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err);
  }
})();

// ✅ Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes.router);
app.use("/api/payments", require("./routes/payments"));
app.use("/api/admin", require("./routes/admin"));

// ✅ Log failed requests
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

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  if (err?.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ msg: "Invalid or missing CSRF token" });
  }
  res.status(err.status || 500).json({ msg: err.message || "Server error." });
});

// ✅ HTTPS
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

// ✅ Optional HTTP redirect
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
