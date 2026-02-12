import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    application_name: {
        type: String,
        required: [true, "Application name is required"],
        trim: true
    },
    application_email: {
        type: String,
        required: [true, "Email is required"],
        trim: true
    },

    application_password: {
    type: String,
    required: true
    },
    application_phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true
    },
    application_office_phone: {
        type: String,
        default: "",
        trim: true
    },
    application_speciality: {
        type: String,
        required: [true, "Speciality is required"],
        trim: true
    },
    application_gender: {
        type: String,
        required: [true, "Gender is required"]
    },
    application_dob: {
        type: String,
        default: "Not Selected"
    },
    application_degree: {
        type: [String],
        required: [true, "At least one degree is required"]
    },
    application_district: {
        type: String,
        required: [true, "District is required"],
        trim: true
    },
    application_license_number: {
        type: String,
        required: [true, "License number is required"],
        trim: true
    },
    application_bar_association: {
        type: String,
        required: [true, "Bar association is required"],
        trim: true
    },
    application_experience: {
        type: String,
        required: [true, "Experience is required"],
        trim: true
    },
    application_languages_spoken: {
        type: [String],
        required: [true, "At least one language is required"]
    },
    application_about: {
        type: String,
        default: "",
        trim: true
    },
    application_legal_professionals: {
        type: [String],
        required: [true, "Legal professionals information is required"]
    },
    application_fees: {
        type: Number,
        default: 0
    },
    application_address: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, "Address is required"]
    },
    application_latitude: {
        type: Number,
        default: 0
    },
    application_longitude: {
        type: Number,
        default: 0
    },
    application_court1: {
        type: String,
        required: [true, "Primary court is required"],
        trim: true
    },
    application_court2: {
        type: String,
        default: "",
        trim: true
    },
    application_date: {
        type: Number,
        required: true,
        default: Date.now
    },
    application_image: {
        type: String,
        default: ""
    },
    // Updated to store multiple URL formats for PDFs
    application_license_certificate: {
        type: mongoose.Schema.Types.Mixed, // Can store object with multiple URLs
        default: {}
    },
    application_birth_certificate: {
        type: mongoose.Schema.Types.Mixed, // Can store object with multiple URLs
        default: {}
    },
    application_legal_professionals_certificate: {
        type: [mongoose.Schema.Types.Mixed], // Array of objects with multiple URLs
        default: []
    }
}, {
    minimize: false
});

const applicationModel = mongoose.models.application || mongoose.model('application', applicationSchema);

export default applicationModel;