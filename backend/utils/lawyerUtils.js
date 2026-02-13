import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import validator from "validator";
import mongoose from "mongoose";

/**
 * Sanitize string input to prevent NoSQL injection
 * @param {any} input - Input to sanitize
 * @returns {string|null} Sanitized string or null
 */
const sanitizeString = (input) => {
    // Only allow string primitives
    if (typeof input !== 'string') {
        return null;
    }
    // Trim whitespace
    return input.trim();
};

/**
 * Sanitize and validate MongoDB ObjectId
 * @param {any} id - ID to sanitize and validate
 * @returns {string|null} Valid ObjectId string or null
 */
export const sanitizeMongoId = (id) => {
    // Ensure it's a string
    const sanitized = sanitizeString(id);

    // Check if it's a valid MongoDB ObjectId
    if (!sanitized || !mongoose.Types.ObjectId.isValid(sanitized)) {
        return null;
    }

    return sanitized;
};

/**
 * Sanitize email input
 * @param {any} email - Email to sanitize
 * @returns {string|null} Sanitized email or null
 */
const sanitizeEmail = (email) => {
    const sanitized = sanitizeString(email);
    if (!sanitized || !validator.isEmail(sanitized)) {
        return null;
    }
    return validator.normalizeEmail(sanitized);
};

/**
 * Upload image to Cloudinary from buffer
 * @param {Object} imageFile - Multer file object with buffer
 * @returns {Promise<string>} Cloudinary secure URL
 */
export const uploadImageToCloudinary = async (imageFile) => {
    if (!imageFile) {
        return '';
    }

    try {
        console.log("Processing image upload...");
        console.log("Image buffer length:", imageFile.buffer.length);
        console.log("Image mimetype:", imageFile.mimetype);

        const b64 = Buffer.from(imageFile.buffer).toString("base64");
        const dataURI = `data:${imageFile.mimetype};base64,${b64}`;

        console.log("DataURI created, length:", dataURI.length);

        const imageUpload = await cloudinary.uploader.upload(dataURI, {
            resource_type: "image",
            folder: "lawyers",
            timeout: 60000,
        });

        console.log("Image uploaded successfully:", imageUpload.secure_url);
        return imageUpload.secure_url;

    } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
    }
};

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
    if (!password || password.trim() === '') {
        throw new Error("Password cannot be empty");
    }

    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
    }

    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, message: string }
 */
export const validatePassword = (password) => {
    if (!password || password.trim() === '') {
        return { valid: false, message: "Password is required" };
    }

    if (password.length < 8) {
        return { valid: false, message: "Password must be at least 8 characters long" };
    }

    return { valid: true, message: "Password is valid" };
};

/**
 * Build lawyer data object from request data
 * @param {Object} data - Request body data
 * @param {string} imageUrl - Cloudinary image URL
 * @param {string} hashedPassword - Hashed password
 * @returns {Object} Lawyer data object
 */
export const buildLawyerData = (data, imageUrl, hashedPassword) => {
    const {
        name,
        email,
        phone,
        office_phone,
        speciality,
        gender,
        dob,
        degree,
        district,
        license_number,
        bar_association,
        experience,
        languages_spoken,
        about,
        available,
        legal_professionals,
        fees,
        total_reviews,
        address,
        latitude,
        longitude,
        court1,
        court2,
        method,
        online_link,
    } = data;

    return {
        name,
        email,
        image: imageUrl || '',
        password: hashedPassword,
        phone,
        office_phone: office_phone || '',
        speciality,
        gender,
        dob: dob || 'Not Selected',
        degree: degree || [],
        district,
        license_number,
        bar_association,
        experience,
        languages_spoken: Array.isArray(languages_spoken)
            ? languages_spoken
            : [languages_spoken].filter(Boolean),
        about: about || 'No additional information provided',
        available: available === undefined ? true : available,
        legal_professionals: legal_professionals || [],
        fees: fees ? Number(fees) : 0,
        total_reviews: total_reviews || 0,
        address: typeof address === 'string' ? JSON.parse(address) : address,
        latitude: latitude ? Number(latitude) : 0,
        longitude: longitude ? Number(longitude) : 0,
        court1: court1 || '',
        court2: court2 || '',
        date: Date.now(),
        slots_booked: {},
        method: method || 'both',
        online_link: online_link || '',
    };
};

/**
 * Check if lawyer exists by email or license number
 * SECURE VERSION - Prevents NoSQL injection
 * @param {Model} lawyerModel - Mongoose lawyer model
 * @param {string} email - Email to check
 * @param {string} licenseNumber - License number to check
 * @param {string} excludeId - ID to exclude from check (for updates)
 * @returns {Promise<Object|null>} Existing lawyer or null
 */
export const checkLawyerExists = async (lawyerModel, email, licenseNumber, excludeId = null) => {
    // CRITICAL: Sanitize inputs to prevent NoSQL injection
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedLicense = sanitizeString(licenseNumber);

    // If inputs are invalid, return null (no match)
    if (!sanitizedEmail || !sanitizedLicense) {
        console.warn('Invalid input detected in checkLawyerExists');
        return null;
    }

    // Build query with sanitized strings only
    const query = {
        $or: [
            { email: sanitizedEmail },
            { license_number: sanitizedLicense }
        ]
    };

    // CRITICAL: Sanitize excludeId if provided
    if (excludeId) {
        const sanitizedId = sanitizeMongoId(excludeId);
        if (!sanitizedId) {
            console.warn('Invalid excludeId detected in checkLawyerExists');
            return null;
        }
        query._id = { $ne: sanitizedId };
    }

    return await lawyerModel.findOne(query);
};

/**
 * Parse address safely
 * @param {string|Object} address - Address to parse
 * @returns {Object} Parsed address object
 */
export const parseAddress = (address) => {
    if (typeof address === 'string') {
        try {
            return JSON.parse(address);
        } catch (error) {
            console.error('Address parsing error:', error.message);
            throw new Error("Invalid address format");
        }
    }
    return address;
};