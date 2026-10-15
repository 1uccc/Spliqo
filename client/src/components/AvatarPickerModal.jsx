import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { 
  Sparkles, 
  Check, 
  RefreshCw, 
  Palette 
} from 'lucide-react';

const AVATAR_COLLECTIONS = {
  all: [
    'Felix', 'Aneka', 'Alexander', 'Molly', 'Jack', 'Sophie', 'Oliver', 'Mia', 
    'Lucas', 'Emma', 'Ethan', 'Chloe', 'Noah', 'Maya', 'Ryan', 'Lily', 
    'Liam', 'Zoe', 'Max', 'Bella', 'Dylan', 'Elena', 'Samuel', 'Amber', 
    'Jason', 'Vicky', 'George', 'Natalie', 'Kevin', 'Grace',
    'Rocker', 'Ninja', 'Gamer', 'Hacker', 'Phoenix', 'Shadow', 'Cyber', 'Blaze',
    'Mochi', 'Boba', 'Peanut', 'Cookie', 'Sunny', 'Jelly', 'Neko', 'Chibi'
  ],
  male: [
    'Felix', 'Alexander', 'Jack', 'Oliver', 'Lucas', 'Ethan', 'Noah', 'Ryan', 
    'Liam', 'Max', 'Dylan', 'Samuel', 'Jason', 'George', 'Kevin', 'Daniel', 
    'Caleb', 'Brian', 'Aaron', 'Leo', 'Justin', 'Mason', 'Logan', 'Henry'
  ],
  female: [
    'Aneka', 'Molly', 'Sophie', 'Mia', 'Emma', 'Chloe', 'Maya', 'Lily', 
    'Zoe', 'Bella', 'Elena', 'Amber', 'Vicky', 'Natalie', 'Grace', 'Ruby', 
    'Alice', 'Hailey', 'Ivy', 'Clara', 'Stella', 'Luna', 'Ava', 'Zuri'
  ],
  cool: [
    'Rocker', 'Ninja', 'Gamer', 'Hacker', 'Phoenix', 'Shadow', 'Cyber', 'Blaze', 
    'Pixel', 'Star', 'Nova', 'Turbo', 'Maverick', 'Rebel', 'Echo', 'Viper', 
    'Storm', 'Titan', 'Ghost', 'Bandit'
  ],
  cute: [
    'Mochi', 'Boba', 'Peanut', 'Cookie', 'Sunny', 'Jelly', 'Neko', 'Chibi', 
    'Puffy', 'Honey', 'Kiki', 'Toto', 'Taro', 'Matcha', 'Dango', 'BaoBao', 
    'Pudding', 'Clover', 'Cinnabon', 'Cupcake'
  ]
};

const RANDOM_SEEDS = [
  'Captain', 'Explorer', 'Voyager', 'Hero', 'Spark', 'Galaxy', 'Miracle', 
  'Awesome', 'Winner', 'Legend', 'Dreamer', 'Starlight', 'Comet', 'Cosmo'
];

export default function AvatarPickerModal({ isOpen, onClose, currentPhotoURL, onSelectAvatar }) {
  const [activeTab, setActiveTab] = useState('all');
  const [customSeed, setCustomSeed] = useState('');
  const [selectedSeed, setSelectedSeed] = useState(() => {
    if (currentPhotoURL && currentPhotoURL.includes('seed=')) {
      try {
        const urlObj = new URL(currentPhotoURL);
        return decodeURIComponent(urlObj.searchParams.get('seed') || 'Felix');
      } catch {
        return 'Felix';
      }
    }
    return 'Felix';
  });

  const getDicebearUrl = (seed) => {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  const previewUrl = useMemo(() => {
    return getDicebearUrl(selectedSeed);
  }, [selectedSeed]);

  const avatarList = AVATAR_COLLECTIONS[activeTab] || AVATAR_COLLECTIONS.all;

  const handleRandomize = () => {
    const pool = [...AVATAR_COLLECTIONS.all, ...RANDOM_SEEDS];
    const random = pool[Math.floor(Math.random() * pool.length)];
    const uniqueSeed = `${random}_${Math.floor(Math.random() * 899 + 100)}`;
    setSelectedSeed(uniqueSeed);
    setCustomSeed('');
  };

  const handleApplyCustomSeed = (e) => {
    e.preventDefault();
    if (customSeed.trim()) {
      setSelectedSeed(customSeed.trim());
    }
  };

  const handleConfirm = () => {
    onSelectAvatar(getDicebearUrl(selectedSeed));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">
              Kho Avatar
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-tight">
              Chọn avatar hoạt hình độc đáo, không cần tải ảnh cá nhân
            </p>
          </div>
        </div>
      }
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 min-w-0 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="shrink-0 hidden xs:inline">Đang chọn:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 font-mono truncate max-w-[120px] sm:max-w-[200px]">
              "{selectedSeed}"
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#dedbd0] dark:border-[#32323e] text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer text-xs"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="tactile-btn-dark py-2 px-5 text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Áp dụng</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs">
        
        {/* Top Feature Box: Live Selected Preview + Randomize + Custom Seed Input */}
        <div className="p-3.5 rounded-2xl bg-[#edebe4]/70 dark:bg-[#1f1f28] border border-[#dedbd0] dark:border-[#2e2e38] flex flex-col sm:flex-row items-center gap-3.5 shadow-xs">
          {/* Live Avatar Preview */}
          <div className="relative shrink-0">
            <img
              src={previewUrl}
              alt="Avatar Preview"
              className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white dark:bg-[#18181f] object-cover ring-4 ring-amber-500/80 shadow-md transition-all duration-300"
            />
            <span className="absolute -bottom-0.5 -right-0.5 p-1 bg-amber-500 text-white rounded-full shadow-xs">
              <Sparkles className="w-3 h-3" />
            </span>
          </div>

          {/* Seed Controls */}
          <div className="flex-1 min-w-0 space-y-2 w-full text-center sm:text-left">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Avatar đang chọn
                </span>
                <span className="font-mono text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white truncate block max-w-[200px]">
                  "{selectedSeed}"
                </span>
              </div>
              <button
                type="button"
                onClick={handleRandomize}
                className="tactile-btn-pill py-1.5 px-3 text-[11px] flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400 cursor-pointer"
                title="Tạo ngẫu nhiên một avatar mới"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Ngẫu nhiên 🎲</span>
              </button>
            </div>

            {/* Custom Seed form */}
            <form onSubmit={handleApplyCustomSeed} className="flex items-center gap-2">
              <input
                type="text"
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder="Gõ tên/biệt danh để tự tạo..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181f] border border-[#dedbd0] dark:border-[#2e2e38] text-xs text-zinc-800 dark:text-zinc-200 outline-none focus:border-amber-500 transition-colors font-medium placeholder:text-zinc-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] text-[11px] font-bold shadow-xs hover:opacity-90 shrink-0 cursor-pointer"
              >
                Áp dụng
              </button>
            </form>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#edebe4]/60 dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38] overflow-x-auto">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'male', label: 'Nam' },
            { id: 'female', label: 'Nữ' },
            { id: 'cool', label: 'Cá tính' },
            { id: 'cute', label: 'Ngộ nghĩnh' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#18181f] text-[#18181b] dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Avatar Grid Gallery (No nested scroll trap - flows naturally in modal) */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-2.5 pt-1">
          {avatarList.map((seed) => {
            const isSelected = selectedSeed.toLowerCase() === seed.toLowerCase();
            const url = getDicebearUrl(seed);

            return (
              <button
                key={seed}
                type="button"
                onClick={() => setSelectedSeed(seed)}
                onDoubleClick={() => {
                  setSelectedSeed(seed);
                  onSelectAvatar(getDicebearUrl(seed));
                  onClose();
                }}
                title={`Chọn ${seed} (Nhấp đúp để chọn ngay)`}
                className={`group relative p-2 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-100 dark:bg-amber-950/70 ring-2 ring-amber-500 shadow-sm scale-105'
                    : 'bg-white/80 dark:bg-[#18181f] border border-[#e6e4dc] dark:border-[#2e2e38] hover:border-amber-400/80 hover:bg-amber-50/50 dark:hover:bg-amber-950/30'
                }`}
              >
                <img
                  src={url}
                  alt={seed}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 truncate w-full text-center">
                  {seed}
                </span>

                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </Modal>
  );
}
