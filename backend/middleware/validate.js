// backend/middleware/validate.js
const { body, validationResult } = require("express-validator");
const xss = require("xss"); // ✅ NEW: Import xss package

// ✅ Stricter, safer regex whitelist patterns
const fullNameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]{2,100}$/; // allows international names
const idNumberRegex = /^\d{13}$/;
const accountNumberRegex = /^[A-Z0-9_-]{5,30}$/i; // restrict to alphanumeric + _ -
const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const currencyRegex = /^[A-Z]{3}$/;
const amountRegex = /^\d+(\.\d{1,2})?$/; // 2 decimal places max

// ✅ Helper: Use the comprehensive xss package to sanitize strings (SAFE XSS FIX)
const sanitizeInput = (value) => {
  if (typeof value !== "string") return value;
  // Use the xss package to strip dangerous code
  return xss(value); 
};

// ✅ Universal validation handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ msg: "Validation error", errors: errors.array() });
  }
  next();
};

// ✅ Login validation
const loginValidation = [
  body("accountNumber")
    .exists()
    .trim()
    .customSanitizer(sanitizeInput) // ⬅️ XSS CLEANING APPLIED HERE
    .matches(accountNumberRegex)
    .withMessage("Invalid account number."),
  body("password")
    .exists()
    .isLength({ min: 8 })
    .withMessage("Invalid password."),
  handleValidationErrors,
];

// ✅ Payment validation (NoSQL and XSS protection applied via customSanitizer)
const paymentValidation = [
  body("receiverAccountNumber")
    .exists()
    .trim()
    .customSanitizer(sanitizeInput) // ⬅️ XSS CLEANING APPLIED HERE
    .matches(accountNumberRegex)
    .withMessage("Invalid receiver account number."),
  body("amount")
    .exists()
    .customSanitizer(sanitizeInput) // ⬅️ XSS CLEANING APPLIED HERE
    .matches(amountRegex)
    .withMessage("Amount must be a positive number with up to 2 decimals."),
  body("currency")
    .exists()
    .trim()
    .customSanitizer(sanitizeInput) // ⬅️ XSS CLEANING APPLIED HERE
    .matches(currencyRegex)
    .withMessage("Currency must be a 3-letter code (e.g., USD, EUR)."),
  body("swiftCode")
    .optional()
    .trim()
    .customSanitizer(sanitizeInput) // ⬅️ XSS CLEANING APPLIED HERE
    .matches(swiftRegex)
    .withMessage("Invalid SWIFT code."),
  handleValidationErrors,
];

// ✅ Profile update validation
const profileUpdateValidation = [
  body("fullName")
    .optional()
    .trim()
    .customSanitizer(sanitizeInput) // ⬅️ XSS CLEANING APPLIED HERE
    .matches(fullNameRegex)
    .withMessage("Invalid full name."),
  body("idNumber")
    .optional()
    .trim()
    .customSanitizer(sanitizeInput) // ⬅️ XSS CLEANING APPLIED HERE
    .matches(idNumberRegex)
    .withMessage("Invalid ID number."),
  handleValidationErrors,
];

// Export all validation chains
module.exports = {
  loginValidation,
  paymentValidation,
  profileUpdateValidation,
};