import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log(`[Cloudinary] Initialized with cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  console.log('[Cloudinary] Running in Fallback mode (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET not set).');
}

export { cloudinary, isCloudinaryConfigured };
