import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export async function uploadImage(req, res) {
  try {
    const { image, folder = 'spliqo/bills' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu hình ảnh (base64 hoặc URL).' });
    }

    // If Cloudinary is configured, upload to Cloudinary CDN
    if (isCloudinaryConfigured) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder,
        resource_type: 'auto',
      });

      return res.json({
        url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
        format: uploadResponse.format,
        width: uploadResponse.width,
        height: uploadResponse.height,
        bytes: uploadResponse.bytes,
      });
    }

    // Fallback: If Cloudinary is not yet configured, return original image data
    console.warn('[Upload] Cloudinary credentials not configured, using fallback image data.');
    return res.json({
      url: image,
      fallback: true,
      message: 'Hình ảnh được lưu tạm thời. Hãy cấu hình Cloudinary để lưu trên Cloud CDN.',
    });
  } catch (err) {
    console.error('[uploadImage] Error:', err);
    return res.status(500).json({ error: err.message || 'Lỗi khi tải ảnh lên Cloudinary.' });
  }
}
