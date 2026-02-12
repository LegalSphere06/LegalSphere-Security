import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = async () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
      secure: true // Important: ensure HTTPS URLs
    });

    console.log('✅ Cloudinary connected successfully');

    // Test the connection
    const result = await cloudinary.api.ping();
    console.log('📡 Cloudinary ping result:', result);

  } catch (error) {
    console.error('❌ Cloudinary connection error:', error);
    throw error;
  }
};

export default connectCloudinary;