import React, { useRef, useState } from 'react';
import Modal from './Modal';
import { Camera, Upload, Trash2, Check, RefreshCw } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, currentImageUrl, onImageSelected }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [preview, setPreview] = useState(currentImageUrl || '');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
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
    onImageSelected('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hóa đơn / Bill thanh toán" maxWidth="max-w-md">
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
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-[#e6e4dc] hover:border-zinc-800 bg-[#f4f3ec] hover:bg-[#eae8df] transition-colors text-[#18181b] text-xs font-semibold"
          >
            <Camera className="w-6 h-6 text-zinc-700" />
            <span>Chụp ảnh hóa đơn</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-[#e6e4dc] hover:border-zinc-800 bg-[#f4f3ec] hover:bg-[#eae8df] transition-colors text-[#18181b] text-xs font-semibold"
          >
            <Upload className="w-6 h-6 text-zinc-700" />
            <span>Tải ảnh từ máy</span>
          </button>
        </div>

        {/* Preview Area */}
        {preview ? (
          <div className="relative rounded-2xl overflow-hidden border border-[#e6e4dc] bg-[#f4f3ec] flex items-center justify-center min-h-[220px]">
            <img
              src={preview}
              alt="Hóa đơn"
              className="max-h-[350px] w-auto object-contain rounded-xl"
            />
            <div className="absolute top-2 right-2 flex items-center gap-2 bg-[#18181b]/80 backdrop-blur-md p-1.5 rounded-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1 rounded-full text-white hover:text-emerald-400 transition-colors"
                title="Thay thế ảnh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 rounded-full text-white hover:text-rose-400 transition-colors"
                title="Xóa ảnh"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-[#e6e4dc] rounded-2xl p-8 text-center bg-[#f4f3ec] text-zinc-400 text-xs flex flex-col items-center gap-2">
            <Camera className="w-8 h-8 text-zinc-300" />
            <span>Chưa có ảnh hóa đơn. Chọn chụp ảnh hoặc tải lên từ máy.</span>
          </div>
        )}

        {/* Bottom controls */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn-pill"
          >
            Đóng
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleConfirm}
              className="tactile-btn-dark flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              Sử dụng ảnh này
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
