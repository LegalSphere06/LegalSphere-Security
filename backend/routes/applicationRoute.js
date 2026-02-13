import express from "express";
import { addApplication } from "../controllers/applicationController.js";
import applicationModel from "../models/applicationModel.js";
import authAdmin from "../middlewares/authAdmin.js";
import upload from "../middlewares/multer.js";
import { sendOTP, verifyOTP } from '../controllers/otpController.js'; // FIXED: Import from otpController
import { otpLimiter } from "../middlewares/rateLimiter.js";

const applicationRouter = express.Router();

// OTP Routes
applicationRouter.post('/send-otp', otpLimiter, sendOTP);
applicationRouter.post('/verify-otp', verifyOTP);

// Route for submitting application with file uploads
applicationRouter.post(
    "/add-application",
    upload.fields([
        { name: 'application_image', maxCount: 1 },
        { name: 'application_license_certificate', maxCount: 1 },
        { name: 'application_birth_certificate', maxCount: 1 },
        { name: 'application_legal_professionals_certificate', maxCount: 10 }
    ]),
    addApplication
);

// Route for getting all applications (for admin)
applicationRouter.get("/get-applications", authAdmin, async (req, res) => {
    try {
        const applications = await applicationModel.find({}).sort({ application_date: -1 });
        
        res.json({
            success: true,
            applications,
            message: "Applications retrieved successfully"
        });
    } catch (error) {
        console.error("Error fetching applications:", error);
        res.json({
            success: false,
            message: error.message
        });
    }
});

export default applicationRouter;