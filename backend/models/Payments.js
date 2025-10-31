// backend/models/Payments.js
const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  swiftCode: { type: String, required: true },
  payeeAccount: { type: String, required: true },   // receiver’s account number
  status: { type: String, default: "Pending" },     // Pending → Verified → Submitted
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);
