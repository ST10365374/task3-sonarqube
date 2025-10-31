// backend/routes/payments.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Payment = require("../models/Payments");
const User = require("../models/User");
const { paymentValidation } = require("../middleware/validate");
const csrfProtection = require("../middleware/csrf");
const logAction = require("../utils/auditLogger"); // optional

// auth middleware (reads JWT from cookie)
const authCookie = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId, role: decoded.role };
    return next();
  } catch (err) {
    console.error("JWT Verify Error:", err.message);
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

// GET /api/payments/me
router.get("/me", authCookie, async (req, res) => {
  try {
    const userId = req.user.userId;
    const payments = await Payment.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "fullName accountNumber")
      .populate("receiver", "fullName accountNumber")
      .sort({ createdAt: -1 });

    if (logAction) await logAction(userId, "Viewed Own Payment History", req);

    return res.json(payments);
  } catch (err) {
    console.error("Error fetching user payments:", err);
    return res.status(500).json({ msg: "Server error fetching payments." });
  }
});

// POST /api/payments (CSRF-protected)
router.post("/", authCookie, csrfProtection, paymentValidation, async (req, res) => {
  try {
    const { receiverAccountNumber, amount, currency, swiftCode } = req.body;
    const senderId = req.user.userId;

    const receiver = await User.findOne({ accountNumber: receiverAccountNumber });
    if (!receiver) {
      return res.status(404).json({ msg: "Receiver account not found." });
    }
    if (receiver._id.toString() === senderId.toString()) {
      return res.status(400).json({ msg: "Cannot send funds to your own account." });
    }

    const newPayment = new Payment({
      sender: senderId,
      receiver: receiver._id,
      amount,
      currency: currency || "USD",
      swiftCode: swiftCode || "NOT_REQUIRED_YET",
      payeeAccount: receiverAccountNumber,
    });

    await newPayment.save();

    if (logAction) await logAction(senderId, `Created Payment ${newPayment._id}`, req);

    return res.status(201).json({ msg: "Payment processed successfully.", payment: newPayment });
  } catch (err) {
    console.error("Payment Creation Error:", err);
    return res.status(500).json({ msg: "Server error during payment creation." });
  }
});

module.exports = router;
