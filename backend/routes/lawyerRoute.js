import express from "express";
import multer from "multer";
import { 
  appointmentCancel, 
  appointmentComplete, 
  appointmentsLawyer, 
  lawyerDashboard, 
  lawyerList, 
  loginLawyer, 
  updateLawyerProfile, 
  lawyerProfile,
  sendEmailToAdmin,
  updateOnlineLink
} from "../controllers/lawyerController.js";
import authLawyer from "../middlewares/authLawyer.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
const lawyerRouter = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes
lawyerRouter.get('/list', lawyerList);
lawyerRouter.post('/login', authLimiter, loginLawyer);
lawyerRouter.get('/appointments', authLawyer, appointmentsLawyer);
lawyerRouter.post('/complete-appointment', authLawyer, appointmentComplete);
lawyerRouter.post('/cancel-appointment', authLawyer, appointmentCancel);
lawyerRouter.get('/dashboard', authLawyer, lawyerDashboard);
lawyerRouter.get('/profile', authLawyer, lawyerProfile);
lawyerRouter.post('/update-profile', authLawyer, upload.single('image'), updateLawyerProfile);
lawyerRouter.post('/send-email-to-admin', authLawyer, sendEmailToAdmin);
lawyerRouter.post('/update-online-link', authLawyer, updateOnlineLink);

export default lawyerRouter;