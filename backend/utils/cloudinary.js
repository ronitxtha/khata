import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary only if the credentials are provided
const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log("☁️  Cloudinary configured successfully");
} else {
  console.warn("⚠️  Cloudinary environment variables are missing! Uploads will fallback to local storage.");
}

/**
 * Uploads a local file to Cloudinary and deletes the local file afterwards.
 * @param {string} localFilePath - Path to the locally stored file
 * @param {string} folderName - Cloudinary folder name
 * @returns {Promise<string>} The Cloudinary URL, or local path fallback if not configured
 */
export const uploadToCloudinary = async (localFilePath, folderName = "khata-ecommerce") => {
  if (!localFilePath) return null;

  if (!isConfigured) {
    // If not configured, we keep the local file and just return the path relative to the backend
    return localFilePath.replace(/\\/g, "/");
  }

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: folderName,
      resource_type: "auto",
    });

    // Successfully uploaded, now delete local file to save space
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error);
    
    // Attempt to delete local file on error as well to prevent storage leaks
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    } catch (cleanupError) {
      console.error("❌ Failed to delete local temp file:", cleanupError);
    }
    
    throw new Error("Failed to upload image to Cloudinary");
  }
};
