import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import xss from "xss-clean";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import lawyerRouter from "./routes/lawyerRoute.js";
import userRouter from "./routes/userRoute.js";
import applicationRouter from "./routes/applicationRoute.js";
import mongoose from "mongoose";
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// app config
const app = express();
const port = process.env.PORT || 4000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Connect to database and fix old indexes
const initializeApp = async () => {
  try {
    await connectDB();
    await connectCloudinary();

    // Fix old indexes after database connection
    await dropOldIndexes();

  } catch (error) {
    console.log("Initialization error:", error);
  }
};

// Function to drop old problematic indexes
const dropOldIndexes = async () => {
  try {
    const db = mongoose.connection.db;

    // Drop old email index from applications collection
    try {
      await db.collection('applications').dropIndex('email_1');
      console.log('Dropped old email_1 index from applications collection');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('email_1 index not found (already dropped or never existed)');
      } else {
        console.log('Error dropping email_1 index:', error.message);
      }
    }

    // Drop old license number index if it exists
    try {
      await db.collection('applications').dropIndex('application_license_number_1');
      console.log('Dropped old application_license_number_1 index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('application_license_number_1 index not found');
      } else {
        console.log('Error dropping license index:', error.message);
      }
    }

  } catch (error) {
    console.log('Error in dropOldIndexes function:', error.message);
  }
};

// Initialize the app
initializeApp();

// ========================================
// SECURITY MIDDLEWARES
// ========================================

// Security Headers & Content Security Policy (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginResourcePolicy: { policy: "cross-origin" } // Allow cross-origin access to static files (uploads)
  })
);

// Enable CORS securely
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Parse JSON with size limit
app.use(express.json({ limit: "10mb" }));

// Sanitize user imput
app.use(xss());

// Logging (API Monitoring)
app.use(morgan("combined"));

// ========================================
// RATE LIMITING (API Abuse Prevention)
// ========================================

// General API Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Strict Rate Limiting for Login Endpoints (Brute Force Protection)
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 login attempts per window
  message: "Too many login attempts. Please try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Rate Limiting for Registration (Prevent Account Creation Abuse)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registration attempts per hour
  message: "Too many accounts created from this IP. Please try again after an hour.",
  standardHeaders: true,
  legacyHeaders: false
});

// Apply login rate limiter to all login routes
app.use("/api/user/login", loginLimiter);
app.use("/api/admin/login", loginLimiter);
app.use("/api/lawyer/login", loginLimiter);

// Apply registration rate limiter to all register routes
app.use("/api/user/register", registerLimiter);
app.use("/api/admin/register", registerLimiter);
app.use("/api/lawyer/register", registerLimiter);

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Add debugging middleware
app.use("/api/admin", function (req, res, next) {
  console.log(`Admin route hit: ${req.method} ${req.path}`);
  next();
});

// api endpoints
app.use("/api/admin", adminRouter);
app.use("/api/lawyer", lawyerRouter);
app.use("/api/user", userRouter);
app.use("/api/application", applicationRouter);

app.get("/", function (req, res) {
  res.send("API WORKING");
});

app.listen(port, function () {
  console.log("Server Started on port:", port);
});