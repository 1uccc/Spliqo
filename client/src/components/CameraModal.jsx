import React, { useRef, useState } from 'react';
import Modal from './Modal';
import api from '../services/api';
import { Camera, Upload, Trash2, Check, RefreshCw, Loader2, CloudUpload } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, currentImageUrl, onImageSelected }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [isCloudinaryUrl, setIsCloudinaryUrl] = useState(() => Boolean(currentImageUrl?.includes('cloudinary.com')));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;
        setPreview(base64Data);
        setUploading(true);

        try {
          const res = await api.post('/upload', { image: base64Data, folder: 'spliqo/bills' });
          if (res?.url) {
            setPreview(res.url);
            if (res.url.includes('cloudinary.com')) {
              setIsCloudinaryUrl(true);
            }
          }
        } catch (err) {
          console.warn('[Cloudinary upload warning - using local data]', err.message);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    onImageSelected(preview);
    onClose();
  };

  const handleDelete = () => {
    setPreview('');
    setIsCloudinaryUrl(false);
    onImageSelected('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hóa đơn thanh toán"
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn-pill px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleConfirm}
              className="tactile-btn-dark px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              Sử dụng ảnh này
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Hidden inputs */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-[#e6e4dc] dark:border-[#2e2e38] hover:border-zinc-800 dark:hover:border-zinc-400 bg-[#f4f3ec] dark:bg-[#1a1a22] hover:bg-[#eae8df] dark:hover:bg-[#22222c] transition-colors text-[#18181b] dark:text-zinc-200 text-xs font-semibold"
          >
            <Camera className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <span>Chụp ảnh hóa đơn</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-[#e6e4dc] dark:border-[#2e2e38] hover:border-zinc-800 dark:hover:border-zinc-400 bg-[#f4f3ec] dark:bg-[#1a1a22] hover:bg-[#eae8df] dark:hover:bg-[#22222c] transition-colors text-[#18181b] dark:text-zinc-200 text-xs font-semibold"
          >
            <Upload className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
            <span>Tải ảnh từ máy</span>
          </button>
        </div>

        {/* Preview Area */}
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden border border-[#e6e4dc] dark:border-[#2e2e38] bg-[#f4f3ec] dark:bg-[#1a1a22] flex items-center justify-center min-h-[220px]">
            <img
              src={preview}
              alt="Hóa đơn"
              className="max-h-[350px] w-auto object-contain rounded-xl"
            />

            {/* Cloudinary Status Indicator */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs bg-black/60 text-white">
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>Đang tải lên Cloudinary...</span>
                </>
              ) : isCloudinaryUrl ? (
                <>
                  <CloudUpload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cloudinary CDN</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã tải ảnh</span>
                </>
              )}
            </div>

            <div className="absolute top-2 right-2 flex items-center gap-2 bg-[#18181b]/80 backdrop-blur-md p-1.5 rounded-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-1 rounded-full text-white hover:text-emerald-400 transition-colors disabled:opacity-50"
                title="Thay thế ảnh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={uploading}
                className="p-1 rounded-full text-white hover:text-rose-400 transition-colors disabled:opacity-50"
                title="Xóa ảnh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-[#e6e4dc] dark:border-[#2e2e38] rounded-2xl p-8 text-center bg-[#f4f3ec] dark:bg-[#1a1a22] text-zinc-400 dark:text-zinc-400 text-xs flex flex-col items-center gap-2">
            <Camera className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
            <span>Chưa có ảnh hóa đơn. Chọn chụp ảnh hoặc tải lên từ máy.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
