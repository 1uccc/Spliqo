import {
  Laptop,
  GraduationCap,
  Coffee,
  Utensils,
  Palmtree,
  Mountain,
  Plane,
  Tent,
  Car,
  Bike,
  PartyPopper,
  Compass,
  Camera,
  ShoppingBag
} from 'lucide-react';

export const TRIP_VISUAL_THEMES = [
  {
    id: 'tech',
    Icon: Laptop,
    emoji: '💻',
    label: 'Học tập & Công nghệ',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
    keywords: ['tin học', 'code', 'it', 'dev', 'cntt', 'lập trình', 'tech', 'bài tập', 'dự án', 'máy tính']
  },
  {
    id: 'study',
    Icon: GraduationCap,
    emoji: '🎓',
    label: 'Học tập & Nghiên cứu',
    gradient: 'from-indigo-500 to-blue-700',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40',
    keywords: ['học', 'lớp', 'khoá', 'học nhóm', 'ôn thi', 'đồ án', 'luận văn', 'trường', 'đại học']
  },
  {
    id: 'beach',
    Icon: Palmtree,
    emoji: '🏖️',
    label: 'Biển đảo & Nghỉ dưỡng',
    gradient: 'from-teal-400 to-emerald-600',
    lightBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 border-teal-200 dark:border-teal-800/40',
    keywords: ['biển', 'vũng tàu', 'nha trang', 'phú quốc', 'quy nhơn', 'đảo', 'bãi', 'resort', 'hè', 'sóng']
  },
  {
    id: 'mountain',
    Icon: Mountain,
    emoji: '🏔️',
    label: 'Núi rừng & Trekking',
    gradient: 'from-emerald-500 to-teal-700',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    keywords: ['đà lạt', 'sapa', 'núi', 'trekking', 'tam đảo', 'tây bắc', 'hà giang', 'đèo', 'leo núi', 'rừng']
  },
  {
    id: 'flight',
    Icon: Plane,
    emoji: '✈️',
    label: 'Du lịch & Chuyến bay',
    gradient: 'from-sky-400 to-blue-600',
    lightBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800/40',
    keywords: ['bay', 'du lịch', 'thái lan', 'singapore', 'nhật', 'hàn', 'tour', 'sân bay', 'nước ngoài', 'trip']
  },
  {
    id: 'food',
    Icon: Utensils,
    emoji: '🍲',
    label: 'Ăn uống & Ẩm thực',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800/40',
    keywords: ['ăn', 'lẩu', 'nướng', 'haidilao', 'bbq', 'buffet', 'cơm', 'bữa', 'nhậu', 'quán', 'ẩm thực', 'bò', 'gà']
  },
  {
    id: 'cafe',
    Icon: Coffee,
    emoji: '☕',
    label: 'Cafe & Trà sữa',
    gradient: 'from-amber-600 to-amber-800',
    lightBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    keywords: ['cafe', 'cà phê', 'trà', 'trà sữa', 'coffee', 'boba', 'hẹn', 'họp mặt']
  },
  {
    id: 'camping',
    Icon: Tent,
    emoji: '⛺',
    label: 'Cắm trại & Picnic',
    gradient: 'from-emerald-600 to-green-700',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    keywords: ['camp', 'cắm trại', 'picnic', 'glamping', 'dã ngoại', 'lều', 'nướng ngoài trời']
  },
  {
    id: 'roadtrip',
    Icon: Car,
    emoji: '🚗',
    label: 'Phượt & Xe hơi',
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
    keywords: ['xe', 'roadtrip', 'phượt', 'ô tô', 'về quê', 'đường dài', 'lái xe']
  },
  {
    id: 'scooter',
    Icon: Bike,
    emoji: '🛵',
    label: 'Dạo phố & Xe máy',
    gradient: 'from-violet-500 to-purple-700',
    lightBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
    keywords: ['xe máy', 'dạo phố', 'vi vu', 'tuk', 'lượn']
  },
  {
    id: 'party',
    Icon: PartyPopper,
    emoji: '🎉',
    label: 'Tiệc tùng & Sự kiện',
    gradient: 'from-fuchsia-500 to-pink-600',
    lightBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800/40',
    keywords: ['tiệc', 'party', 'sinh nhật', 'kỷ niệm', 'liên hoan', 'quẩy', 'hội', 'tất niên']
  },
  {
    id: 'explore',
    Icon: Compass,
    emoji: '🧭',
    label: 'Khám phá & Check-in',
    gradient: 'from-cyan-500 to-blue-600',
    lightBg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40',
    keywords: ['huế', 'hà nội', 'sài gòn', 'đà nẵng', 'khám phá', 'checkin', 'check-in', 'phố cổ', 'di tích']
  },
  {
    id: 'photo',
    Icon: Camera,
    emoji: '📸',
    label: 'Nhiếp ảnh & Kỷ niệm',
    gradient: 'from-purple-500 to-indigo-600',
    lightBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
    keywords: ['ảnh', 'chụp', 'photo', 'studio', 'kỷ yếu', 'sống ảo']
  },
  {
    id: 'shopping',
    Icon: ShoppingBag,
    emoji: '🛍️',
    label: 'Mua sắm & Giải trí',
    gradient: 'from-pink-500 to-rose-600',
    lightBg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-800/40',
    keywords: ['mua sắm', 'shopping', 'mall', 'chợ', 'quà']
  }
];

export function getTripVisual(trip = {}) {
  const name = (trip.name || '').toLowerCase().trim();
  const desc = (trip.description || '').toLowerCase().trim();
  const combined = `${name} ${desc}`;

  // 1. Keyword matching
  for (const theme of TRIP_VISUAL_THEMES) {
    if (theme.keywords.some((kw) => combined.includes(kw))) {
      return theme;
    }
  }

  // 2. Deterministic hash fallback
  const seed = trip.id || trip.tripCode || trip.name || 'default';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TRIP_VISUAL_THEMES.length;
  return TRIP_VISUAL_THEMES[index];
}
