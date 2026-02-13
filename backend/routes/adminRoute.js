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
import auth from "../middlewares/auth.js";
import { changeAvailability } from "../controllers/lawyerController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const adminRouter = express.Router();

console.log("Admin router loaded");

adminRouter.post(
  "/add-lawyer", (req, res, next) => {
    console.log("POST /add-lawyer route matched!");
    next();
  },
  auth("admin"),
  upload.single("image"),
  addLawyer
);

adminRouter.post("/login", authLimiter, loginAdmin);
adminRouter.post("/all-lawyers", auth("admin"), allLawyers);
adminRouter.post("/change-availability", auth("admin"), changeAvailability);
adminRouter.get('/appointments', auth("admin"), appointmentsAdmin);
adminRouter.post('/cancel-appointment', auth("admin"), appointmentCancel);
adminRouter.get('/dashboard', auth("admin"), adminDashboard);

//Email sending from the dashboard (like a regular mail)
adminRouter.post("/send-email-to-lawyers", auth("admin"), sendEmailToLawyers);

// TWO ROUTES FOR APPLICATION APPROVAL/REJECTION
adminRouter.post("/approve-application", auth("admin"), approveApplication);
adminRouter.post("/reject-application", auth("admin"), rejectApplication);


adminRouter.get("/lawyer/:lawyerId", auth("admin"), getLawyer);
adminRouter.put("/lawyer/:lawyerId", auth("admin"), upload.single("image"), updateLawyer);
adminRouter.delete("/lawyer/:lawyerId", auth("admin"), deleteLawyer);

export default adminRouter;