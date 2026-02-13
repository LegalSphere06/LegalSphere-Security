import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  toggleMFA
} from "../controllers/userController.js";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multer.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { getUsersForGIS } from "../controllers/userController.js";
import { verifyMFA } from "../controllers/mfaController.js";

const userRouter = express.Router();

userRouter.post("/register", authLimiter, registerUser);
userRouter.post("/login", authLimiter, loginUser);
userRouter.post("/verify-mfa", authLimiter, verifyMFA);

userRouter.get("/get-profile", auth("user"), getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  auth("user"),
  updateProfile
);

userRouter.post('/book-appointment', auth("user"), bookAppointment)
userRouter.get('/appointments', auth("user"), listAppointment)
userRouter.post('/cancel-appointment', auth("user"), cancelAppointment)
userRouter.post('/payment-razorpay', auth("user"), paymentRazorpay)
userRouter.post('/verifyRazorpay', auth("user"), verifyRazorpay)
userRouter.post('/toggle-mfa', auth("user"), toggleMFA)

userRouter.get('/gis-users', getUsersForGIS);

export default userRouter;
