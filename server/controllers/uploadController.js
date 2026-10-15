import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export async function uploadImage(req, res) {
  try {
    const { image, folder = 'spliqo/bills' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu hình ảnh (base64 hoặc URL).' });
    }

    // Validate input format: must be base64 data URI or valid HTTPS URL
    if (typeof image !== 'string' || (!image.startsWith('data:image/') && !image.startsWith('https://'))) {
      return res.status(400).json({ error: 'Định dạng hình ảnh không hợp lệ. Chỉ chấp nhận Base64 ảnh hoặc đường dẫn HTTPS hợp lệ.' });
    }

    // Block SSRF to local/private metadata addresses
    if (image.startsWith('https://')) {
      const lower = image.toLowerCase();
      if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('169.254.') || lower.includes('10.') || lower.includes('192.168.')) {
        return res.status(400).json({ error: 'Đường dẫn ảnh không được phép trỏ tới địa chỉ mạng nội bộ.' });
      }
    }

    // If Cloudinary is configured, upload to Cloudinary CDN
    if (isCloudinaryConfigured) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: 'spliqo/bills',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_bytes: 5 * 1024 * 1024 // 5MB limit
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
