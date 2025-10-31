// backend/middleware/validate.js
const { body, validationResult } = require("express-validator");

// Regex whitelist patterns
const fullNameRegex = /^[A-Za-z\s.'-]{2,100}$/;
const idNumberRegex = /^\d{13}$/; // SA ID
const accountNumberRegex = /^\w[\w\-]{5,30}$/; // allow letters/numbers/hyphen
const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const currencyRegex = /^[A-Z]{3}$/;

// ✅ NEW: Register validation
const registerValidation = [
  body("fullName")
    .exists()
    .matches(fullNameRegex)
    .withMessage("Full name is required and must be valid."),
  body("idNumber")
    .exists()
    .matches(idNumberRegex)
    .withMessage("ID number must be a valid 13-digit number."),
  body("accountNumber")
    .exists()
    .matches(accountNumberRegex)
    .withMessage("Invalid account number format."),
  body("password")
    .exists()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters."),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ msg: "Validation error", errors: errors.array() });
    next();
  },
];

const loginValidation = [
  body("accountNumber")
    .exists()
    .matches(accountNumberRegex)
    .withMessage("Invalid account number"),
  body("password")
    .exists()
    .isLength({ min: 8 })
    .withMessage("Invalid password"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ msg: "Validation error", errors: errors.array() });
    next();
  },
];

const paymentValidation = [
  body("receiverAccountNumber")
    .exists()
    .matches(accountNumberRegex)
    .withMessage("Invalid receiver account number"),
  body("amount")
    .exists()
    .isFloat({ gt: 0 })
    .withMessage("Amount must be a positive number"),
  body("currency")
    .exists()
    .matches(currencyRegex)
    .withMessage("Currency must be a 3-letter code"),
  body("swiftCode")
    .optional()
    .matches(swiftRegex)
    .withMessage("Invalid SWIFT code"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ msg: "Validation error", errors: errors.array() });
    next();
  },
];

const profileUpdateValidation = [
  body("fullName").optional().matches(fullNameRegex).withMessage("Invalid full name"),
  body("idNumber").optional().matches(idNumberRegex).withMessage("Invalid ID number"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ msg: "Validation error", errors: errors.array() });
    next();
  },
];

module.exports = {
  registerValidation,
  loginValidation,
  paymentValidation,
  profileUpdateValidation,
};
