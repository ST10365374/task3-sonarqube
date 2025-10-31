// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // ✅ use shared auth middleware
const Payment = require("../models/Payments");

const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Access denied. Admin role required." });
  next();
};

// GET all payments
router.get("/payments", auth, adminAuth, async (req, res) => {
  try {
    const allPayments = await Payment.find({})
      .populate("sender", "fullName accountNumber")
      .populate("receiver", "fullName accountNumber")
      .sort({ createdAt: -1 });

    res.json(allPayments);
  } catch (err) {
    console.error("Error fetching all payments for admin:", err);
    res.status(500).json({ msg: "Server error." });
  }
});

// POST verify a payment
router.post("/payments/:id/verify", auth, adminAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ msg: "Payment not found." });

    payment.status = "Verified";
    await payment.save();

    res.json({ msg: "Payment verified.", payment });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ msg: "Server error." });
  }
});

// POST submit to SWIFT
router.post("/payments/:id/submit", auth, adminAuth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ msg: "Payment not found." });

    // Simulated SWIFT API submission
    payment.status = "Submitted";
    await payment.save();

    res.json({ msg: "Payment submitted to SWIFT (simulated).", payment });
  } catch (err) {
    console.error("Submit error:", err);
    res.status(500).json({ msg: "Server error." });
  }
});

module.exports = router;