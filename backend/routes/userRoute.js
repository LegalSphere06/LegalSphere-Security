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
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { getUsersForGIS } from "../controllers/userController.js";
import { verifyMFA } from "../controllers/mfaController.js";

const userRouter = express.Router();

userRouter.post("/register", authLimiter, registerUser);
userRouter.post("/login", authLimiter, loginUser);
userRouter.post("/verify-mfa", authLimiter, verifyMFA);

userRouter.get("/get-profile", authUser, getProfile);
userRouter.post(
  "/update-profile",
  upload.single("image"),
  authUser,
  updateProfile
);

userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)
userRouter.post('/payment-razorpay', authUser, paymentRazorpay)
userRouter.post('/verifyRazorpay', authUser, verifyRazorpay)
userRouter.post('/toggle-mfa', authUser, toggleMFA)

userRouter.get('/gis-users', getUsersForGIS);

export default userRouter;
