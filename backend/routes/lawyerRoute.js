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
  lawyerProfile
} from "../controllers/lawyerController.js";
import auth from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { sendEmailToAdmin } from "../controllers/lawyerController.js";
import { updateOnlineLink } from '../controllers/lawyerController.js';
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
lawyerRouter.get('/appointments', auth("lawyer"), appointmentsLawyer);
lawyerRouter.post('/complete-appointment', auth("lawyer"), appointmentComplete);
lawyerRouter.post('/cancel-appointment', auth("lawyer"), appointmentCancel);
lawyerRouter.get('/dashboard', auth("lawyer"), lawyerDashboard);
lawyerRouter.get('/profile', auth("lawyer"), lawyerProfile);
lawyerRouter.post('/update-profile', auth("lawyer"), upload.single('image'), updateLawyerProfile);
lawyerRouter.post('/send-email-to-admin', auth("lawyer"), sendEmailToAdmin);
lawyerRouter.post('/update-online-link', auth("lawyer"), updateOnlineLink);

export default lawyerRouter;