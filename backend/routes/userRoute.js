import express from "express";
import { body, validationResult } from "express-validator";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";
import { getUsersForGIS } from "../controllers/userController.js";

const userRouter = express.Router();

// ========================================
// 🛡️ VALIDATION MIDDLEWARE
// ========================================

// Validation middleware handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array()
    });
  }
  next();
};

// Registration validation rules
const registerValidation = [
  body("name")
    .trim()
    .escape()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .isEmail().withMessage("Enter a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage("Password must contain uppercase, lowercase, and number")
];

// Login validation rules
const loginValidation = [
  body("email")
    .trim()
    .isEmail().withMessage("Enter a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
];

// Profile update validation rules
const updateProfileValidation = [
  body("name")
    .trim()
    .escape()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("phone")
    .trim()
    .matches(/^[0-9]{10,15}$/).withMessage("Enter a valid phone number"),
  body("dob")
    .optional()
    .isISO8601().withMessage("Enter a valid date"),
  body("gender")
    .optional()
    .isIn(["Male", "Female", "Other"]).withMessage("Invalid gender value")
];

// Appointment booking validation rules
const bookAppointmentValidation = [
  body("lawyerId")
    .trim()
    .notEmpty().withMessage("Lawyer ID is required")
    .isMongoId().withMessage("Invalid Lawyer ID"),
  body("slotDate")
    .trim()
    .notEmpty().withMessage("Slot date is required"),
  body("slotTime")
    .trim()
    .notEmpty().withMessage("Slot time is required"),
  body("consultationType")
    .optional()
    .trim()
    .escape()
];

// Cancel appointment validation rules
const cancelAppointmentValidation = [
  body("appointmentId")
    .trim()
    .notEmpty().withMessage("Appointment ID is required")
    .isMongoId().withMessage("Invalid Appointment ID")
];

// Payment validation rules
const paymentValidation = [
  body("appointmentId")
    .trim()
    .notEmpty().withMessage("Appointment ID is required")
    .isMongoId().withMessage("Invalid Appointment ID")
];

// ========================================
// 🔒 PROTECTED ROUTES WITH VALIDATION
// ========================================

userRouter.post("/register", registerValidation, validate, registerUser);
userRouter.post("/login", loginValidation, validate, loginUser);

userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfileValidation,
  validate,
  updateProfile
);

userRouter.post('/book-appointment', authUser, bookAppointmentValidation, validate, bookAppointment);
userRouter.get('/appointments', authUser, listAppointment);
userRouter.post('/cancel-appointment', authUser, cancelAppointmentValidation, validate, cancelAppointment);
userRouter.post('/payment-razorpay', authUser, paymentValidation, validate, paymentRazorpay);
userRouter.post('/verifyRazorpay', authUser, verifyRazorpay);

userRouter.get('/gis-users', getUsersForGIS);

export default userRouter;
