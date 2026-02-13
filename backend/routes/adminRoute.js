import express from "express";
import {
  addLawyer,
  adminDashboard,
  allLawyers,
  appointmentCancel,
  appointmentsAdmin,
  loginAdmin,
  approveApplication,  
  rejectApplication,    
  deleteLawyer,  
  updateLawyer,
  getLawyer,
  sendEmailToLawyers
} from "../controllers/adminController.js";

import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailability } from "../controllers/lawyerController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const adminRouter = express.Router();

console.log("Admin router loaded");

adminRouter.post(
  "/add-lawyer", (req, res, next) => {
    console.log("POST /add-lawyer route matched!");
    next();
  },
  authAdmin,
  upload.single("image"),
  addLawyer
);

adminRouter.post("/login", authLimiter,loginAdmin);
adminRouter.post("/all-lawyers", authAdmin, allLawyers);
adminRouter.post("/change-availability", authAdmin, changeAvailability);
adminRouter.get('/appointments', authAdmin, appointmentsAdmin);
adminRouter.post('/cancel-appointment', authAdmin, appointmentCancel);
adminRouter.get('/dashboard', authAdmin, adminDashboard);

//Email sending from the dashboard (like a regular mail)
adminRouter.post("/send-email-to-lawyers", authAdmin, sendEmailToLawyers);

// TWO ROUTES FOR APPLICATION APPROVAL/REJECTION
adminRouter.post("/approve-application", authAdmin, approveApplication);
adminRouter.post("/reject-application", authAdmin, rejectApplication);


adminRouter.get("/lawyer/:lawyerId", authAdmin, getLawyer);
adminRouter.put("/lawyer/:lawyerId", authAdmin, upload.single("image"), updateLawyer);
adminRouter.delete("/lawyer/:lawyerId", authAdmin, deleteLawyer);

export default adminRouter;