// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerValidation, loginValidation } = require("../middleware/validate");
const csrfProtection = require("../middleware/csrf");
const logAction = require("../utils/auditLogger");
const auth = require("../middleware/auth"); // ✅ use shared middleware

// --- Register (CSRF-protected)
router.post("/register", csrfProtection, registerValidation, async (req, res) => {
  try {
    const { fullName, idNumber, accountNumber, password } = req.body;
    let user = await User.findOne({ accountNumber });
    if (user) return res.status(400).json({ msg: "Account already exists." });

    const hashedPassword = await bcrypt.hash(password, 12);
    user = new User({
      fullName,
      idNumber,
      accountNumber,
      password: hashedPassword,
      role: "customer",
    });
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 60 * 60 * 1000,
    });

    if (logAction) await logAction(user._id, "User Registered", req);

    res.json({
      msg: "Registration successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        idNumber: user.idNumber,
        accountNumber: user.accountNumber,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Server error during registration." });
  }
});

// --- Login (CSRF-protected)
router.post("/login", csrfProtection, loginValidation, async (req, res) => {
  try {
    const { accountNumber, password } = req.body;
    const user = await User.findOne({ accountNumber });
    if (!user) return res.status(401).json({ msg: "Invalid credentials." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials." });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 60 * 60 * 1000,
    });

    if (logAction) await logAction(user._id, "User Logged In", req);

    res.json({ msg: "Login successful", role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login." });
  }
});

// --- Logout
router.post("/logout", auth, csrfProtection, async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    if (req.user?.userId && logAction) await logAction(req.user.userId, "User Logged Out", req);
    res.json({ msg: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ msg: "Error during logout" });
  }
});

module.exports = { router };
