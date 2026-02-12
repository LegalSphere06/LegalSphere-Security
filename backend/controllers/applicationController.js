import { v2 as cloudinary } from 'cloudinary';
import applicationModel from "../models/applicationModel.js";


// Upload file to Cloudinary
const uploadToCloudinary = async (fileBuffer, fileName, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        // Determine the correct resource type based on file extension
        const fileExtension = fileName.split('.').pop().toLowerCase();
        let finalResourceType = resourceType;

        if (resourceType === 'auto') {
            if (fileExtension === 'pdf') {
                finalResourceType = 'raw';
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                finalResourceType = 'image';
            } else {
                finalResourceType = 'raw'; // Default for other file types
            }
        }

        const uploadOptions = {
            resource_type: finalResourceType,
            public_id: `lawyer_applications/${Date.now()}_${fileName.split('.')[0]}`,
            folder: 'lawyer_applications',
            invalidate: true,
            // For now only pdf's are working
            ...(finalResourceType === 'raw' && fileExtension === 'pdf' && {
                type: 'upload',
                // content type for PDFs
                context: {
                    content_type: 'application/pdf'
                },
                // Add transformation to convert to viewable format
                eager: [
                    {
                        format: 'jpg',
                        page: 1,
                        quality: 'auto:best'
                    }
                ]
            })
        };



        console.log(`📤 Uploading ${fileName} as ${finalResourceType}...`);

        cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('✅ File uploaded successfully:', result.secure_url);
                    resolve(result);
                }
            }
        ).end(fileBuffer);
    });
};

// Helper function to generate viewable PDF URL
const generateViewablePdfUrl = (pdfUrl) => {
    if (!pdfUrl) return '';

    // Extract public_id from the URL
    const urlParts = pdfUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicIdWithExt = urlParts.slice(-2).join('/'); // Get folder/filename
    const publicId = publicIdWithExt.replace('.pdf', '');

    // Generate URL that forces inline viewing
    const baseUrl = pdfUrl.split('/upload/')[0];
    const viewableUrl = `${baseUrl}/image/upload/f_auto,fl_attachment:false/${publicId}.jpg`;

    return {
        originalUrl: pdfUrl,
        viewableUrl: viewableUrl,
        // Alternative: Generate a URL that opens PDF in browser
        inlinePdfUrl: pdfUrl.replace('/upload/', '/upload/fl_attachment/')
    };
};

// Add Application
const addApplication = async (req, res) => {
    try {
        console.log('📝 Processing application submission...');
        console.log('Files received:', Object.keys(req.files || {}));

        const {
            application_name,
            application_email,
            application_password,
            application_phone,
            application_office_phone,
            application_speciality,
            application_gender,
            application_dob,
            application_degree,
            application_district,
            application_license_number,
            application_bar_association,
            application_experience,
            application_languages_spoken,
            application_about,
            application_legal_professionals,
            application_fees,
            application_address,
            application_latitude,
            application_longitude,
            application_court1,
            application_court2
        } = req.body;

        let applicationImageUrl = "";
        let licenseUrls = {};
        let birthCertUrls = {};
        let professionalCertUrls = [];

        // Upload application image
        if (req.files.application_image && req.files.application_image[0]) {
            try {
                const result = await uploadToCloudinary(
                    req.files.application_image[0].buffer,
                    req.files.application_image[0].originalname,
                    'image'
                );
                applicationImageUrl = result.secure_url;
                console.log('🖼️ Application image URL:', applicationImageUrl);
            } catch (error) {
                console.error('Error uploading application image:', error);
                return res.json({ success: false, message: "Error uploading application image" });
            }
        }

        // Upload license certificate (PDF)
        if (req.files.application_license_certificate && req.files.application_license_certificate[0]) {
            try {
                const result = await uploadToCloudinary(
                    req.files.application_license_certificate[0].buffer,
                    req.files.application_license_certificate[0].originalname,
                    'raw'
                );
                licenseUrls = generateViewablePdfUrl(result.secure_url);
                console.log('📄 License certificate URLs:', licenseUrls);
            } catch (error) {
                console.error('Error uploading license certificate:', error);
                return res.json({ success: false, message: "Error uploading license certificate" });
            }
        }

        // Upload birth certificate (PDF)
        if (req.files.application_birth_certificate && req.files.application_birth_certificate[0]) {
            try {
                const result = await uploadToCloudinary(
                    req.files.application_birth_certificate[0].buffer,
                    req.files.application_birth_certificate[0].originalname,
                    'raw'
                );
                birthCertUrls = generateViewablePdfUrl(result.secure_url);
                console.log('📋 Birth certificate URLs:', birthCertUrls);
            } catch (error) {
                console.error('Error uploading birth certificate:', error);
                return res.json({ success: false, message: "Error uploading birth certificate" });
            }
        }

        // Upload professional certificates (multiple PDFs)
        if (req.files.application_legal_professionals_certificate) {
            try {
                console.log(`📚 Uploading ${req.files.application_legal_professionals_certificate.length} professional certificates...`);
                const uploadPromises = req.files.application_legal_professionals_certificate.map((file, index) => {
                    console.log(`📄 Processing file ${index + 1}: ${file.originalname}`);
                    return uploadToCloudinary(file.buffer, file.originalname, 'raw');
                });
                const results = await Promise.all(uploadPromises);
                professionalCertUrls = results.map(result => generateViewablePdfUrl(result.secure_url));
                console.log('📚 All professional certificates uploaded:', professionalCertUrls);
            } catch (error) {
                console.error('Error uploading professional certificates:', error);
                return res.json({ success: false, message: "Error uploading professional certificates" });
            }
        }

        // Create application data
        const applicationData = {
            application_name,
            application_email,
            application_password,
            
            application_phone,
            application_office_phone: application_office_phone || "",
            application_speciality,
            application_gender,
            application_dob: application_dob || "Not Selected",
            application_degree: JSON.parse(application_degree),
            application_district,
            application_license_number,
            application_bar_association,
            application_experience,
            application_languages_spoken: JSON.parse(application_languages_spoken),
            application_about: application_about || "",
            application_legal_professionals: JSON.parse(application_legal_professionals),
            application_fees: Number(application_fees) || 0,
            application_address: JSON.parse(application_address),
            application_latitude: Number(application_latitude) || 0,
            application_longitude: Number(application_longitude) || 0,
            application_court1,
            application_court2: application_court2 || "",
            application_image: applicationImageUrl,
            // Store both original and viewable URLs
            application_license_certificate: licenseUrls,
            application_birth_certificate: birthCertUrls,
            application_legal_professionals_certificate: professionalCertUrls
        };

        console.log('💾 Saving application to database...');
        const newApplication = new applicationModel(applicationData);
        await newApplication.save();

        console.log('✅ Application saved successfully');
        res.json({
            success: true,
            message: "Application submitted successfully",
            application: newApplication
        });

    } catch (error) {
        console.error('❌ Error in addApplication:', error);
        res.json({
            success: false,
            message: error.message
        });
    }
};

export { addApplication };
export { sendOTP, verifyOTP } from './otpController.js';