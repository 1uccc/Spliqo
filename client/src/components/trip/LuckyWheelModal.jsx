import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { 
  Sparkles, 
  RotateCw, 
  Crown, 
  CreditCard, 
  Gift, 
  ArrowRight, 
  Check, 
  PartyPopper,
  Volume2,
  VolumeX,
  Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Harmonious Spliqo Fintech & Tactile Palette (Amber, Emerald, Indigo, Teal, Violet, Sunset)
const SPLIQO_WHEEL_PALETTE = [
  '#f59e0b', // Warm Amber (Spliqo Brand)
  '#10b981', // Emerald Green (Cash Balance)
  '#6366f1', // Indigo (Tech / Smart)
  '#ec4899', // Soft Coral Pink
  '#0d9488', // Deep Teal
  '#8b5cf6', // Electric Violet
  '#f97316', // Sunset Orange
  '#3b82f6', // Bright Azure
  '#14b8a6', // Mint
  '#f43f5e'  // Warm Crimson
];

export default function LuckyWheelModal({
  isOpen,
  onClose,
  members = [],
  onPickWinnerForExpense,
  t
}) {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameMode, setGameMode] = useState('payer'); // 'payer' (Ai bao), 'advance' (Ai ứng trước), 'lucky_free' (Ai được bao)

  const rotationRef = useRef(0);
  const animFrameRef = useRef(null);
  const lastSliceTickRef = useRef(-1);

  // Audio helper functions
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // AudioContext policy
    }
  };

  const playFanfare = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.09;
        gain.gain.setValueAtTime(0.14, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.38);
      });
    } catch {
      // AudioContext policy
    }
  };

  // Draw the Wheel onto Canvas with Spliqo Tactile Bento styling
  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas || members.length === 0) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 18;
    const numSlices = members.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, width, height);

    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    // Draw Slices with smooth vibrant colors and crisp white dividers
    members.forEach((member, i) => {
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;
      const color = SPLIQO_WHEEL_PALETTE[i % SPLIQO_WHEEL_PALETTE.length];

      // Wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // Clean White Divider Line
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Slice Text
      ctx.save();
      const textAngle = startA + sliceAngle / 2;
      ctx.rotate(textAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12.5px Outfit, Plus Jakarta Sans, system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 3;

      const name = member.displayName || `Thành viên ${i + 1}`;
      const truncated = name.length > 13 ? name.substring(0, 11) + '..' : name;
      ctx.fillText(truncated, radius - 24, 4.5);
      ctx.restore();
    });

    ctx.restore();

    // Outer Bento Ring (Dark with subtle gold accent)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 3, 0, 2 * Math.PI);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#18181b';
    ctx.stroke();

    // Subtle Gold Inner Accent Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, 2 * Math.PI);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    // Center Bento Hub (Tactile dark circle with gold metallic border)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    // Center Gold Accent Dot
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
  };

  useEffect(() => {
    if (isOpen) {
      setWinner(null);
      drawWheel(rotationRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, members]);

  // Spin Action with Physics Deceleration
  const spinWheel = () => {
    if (spinning || members.length < 2) return;
    setSpinning(true);
    setWinner(null);

    const numSlices = members.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // Pick random target index
    const targetIndex = Math.floor(Math.random() * numSlices);

    // Calculate angle: Pointer is at top (3 * PI / 2)
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5 to 7 full rotations
    const sliceCenterAngle = targetIndex * sliceAngle + sliceAngle / 2;
    
    const targetOffset = (3 * Math.PI / 2) - sliceCenterAngle;
    const currentRot = rotationRef.current % (2 * Math.PI);
    let finalRotation = rotationRef.current - currentRot + (extraSpins * 2 * Math.PI) + targetOffset;
    if (finalRotation < rotationRef.current) {
      finalRotation += 2 * Math.PI * (extraSpins + 1);
    }

    const startRot = rotationRef.current;
    const totalDelta = finalRotation - startRot;
    const duration = 4400; // 4.4 seconds
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Deceleration easing (ease-out quintic)
      const easeOut = 1 - Math.pow(1 - progress, 4.5);
      const currentAngle = startRot + totalDelta * easeOut;
      rotationRef.current = currentAngle;

      // Tick sound detection on slice boundary
      const normalizedAngle = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const currentSlice = Math.floor(normalizedAngle / sliceAngle);
      if (currentSlice !== lastSliceTickRef.current) {
        lastSliceTickRef.current = currentSlice;
        playTickSound();
      }

      drawWheel(currentAngle);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        const winMember = members[targetIndex];
        setWinner(winMember);
        playFanfare();
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 }
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handleUseWinner = () => {
    if (!winner) return;
    onPickWinnerForExpense(winner, gameMode);
    onClose();
  };

  const modeDescriptions = {
    payer: {
      title: '👑 Ai bao trọn?',
      desc: 'Người được quay trúng sẽ là đại gia thanh toán toàn bộ cho cả nhóm.',
      banner: 'Đại gia chầu này đã lộ diện!'
    },
    advance: {
      title: '💳 Ai ứng trước?',
      desc: 'Người này quẹt thẻ/chuyển khoản trả trước, sau đó chia bill đều.',
      banner: 'Thủ quỹ lâm thời được chọn!'
    },
    lucky_free: {
      title: '🎁 Ai được khao 0đ?',
      desc: 'Cả nhóm chia tiền, riêng bạn này may mắn được khao miễn phí.',
      banner: 'Số đỏ hôm nay: Được cả nhóm bao trọn 0đ!'
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={spinning ? () => {} : onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <RotateCw className="w-3.5 h-3.5 stroke-[2.4]" />
          </div>
          <span className="font-extrabold text-[#18181b] dark:text-white">
            Vòng Xoay May Mắn
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            🎡 Game
          </span>
        </div>
      }
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-[#f4f3ec] dark:hover:bg-[#252530] transition-colors cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500 stroke-[2.2]" /> : <VolumeX className="w-4 h-4 text-zinc-400 stroke-[2.2]" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={spinning}
              className="tactile-btn-pill text-xs px-4 py-2 cursor-pointer"
            >
              {t('close', 'Đóng')}
            </button>
            {winner && (
              <button
                type="button"
                onClick={handleUseWinner}
                className="tactile-btn-dark text-xs px-4 py-2 flex items-center gap-1.5 font-bold cursor-pointer shadow-md"
              >
                <span>Tạo khoản chi với {winner.displayName}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Bento Mode Selector (Matching Spliqo tactile tabs) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#f4f3ec] dark:bg-[#1a1a22] border border-[#e6e4dc] dark:border-[#2e2e38]">
          {[
            { id: 'payer', label: 'Ai bao trọn', icon: Crown },
            { id: 'advance', label: 'Ai ứng trước', icon: CreditCard },
            { id: 'lucky_free', label: 'Ai được khao', icon: Gift }
          ].map((mode) => {
            const Icon = mode.icon;
            const active = gameMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                disabled={spinning}
                onClick={() => {
                  setGameMode(mode.id);
                  setWinner(null);
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-[#2c2c36] text-[#18181b] dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-500' : ''}`} />
                <span className="text-[11px] truncate w-full text-center tracking-tight">
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subtitle helper */}
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
          {modeDescriptions[gameMode]?.desc}
        </p>

        {/* Wheel Container */}
        <div className="relative flex flex-col items-center justify-center pt-2 pb-1 select-none">
          {/* Top Amber Arrow Indicator */}
          <div className="absolute top-0 z-20 flex flex-col items-center -translate-y-1">
            <div className="w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-md animate-bounce" />
          </div>

          {/* Canvas Wheel */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72">
            <canvas
              ref={canvasRef}
              width={288}
              height={288}
              className="w-full h-full drop-shadow-xl"
            />
          </div>

          {/* Tactile Spin Button (Warm Amber & Dark Bento) */}
          <button
            type="button"
            onClick={spinWheel}
            disabled={spinning || members.length < 2}
            className={`mt-4 px-8 py-3 rounded-full font-extrabold text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              spinning
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-amber-500/25 hover:scale-105 active:scale-95'
            }`}
          >
            <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
            <span>{spinning ? 'Đang quay...' : 'QUAY NGAY 🎲'}</span>
          </button>
        </div>

        {/* Winner Announcement Card (Matching Tactile Bento card) */}
        {winner && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-emerald-500/10 border border-amber-500/30 text-center space-y-2 animate-fade-in">
            <div className="flex items-center justify-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <PartyPopper className="w-4 h-4 text-amber-500" />
              <span>{modeDescriptions[gameMode]?.banner}</span>
            </div>

            <div className="flex items-center justify-center gap-3 py-1">
              <img
                src={winner.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.userId || winner.uid || winner.id}`}
                alt=""
                className="w-12 h-12 rounded-2xl bg-white shadow-md ring-2 ring-amber-400 object-cover"
              />
              <div className="text-left">
                <div className="text-lg font-extrabold text-[#18181b] dark:text-white">
                  {winner.displayName}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  {gameMode === 'payer' ? 'Hôm nay được làm đại gia khao nhóm!' : gameMode === 'advance' ? 'Được chọn quẹt thẻ thanh toán trước!' : 'Được cả nhóm bao trọn 0đ!'}
                </div>
              </div>
            </div>
          </div>
        )}

        {members.length < 2 && (
          <p className="text-xs text-rose-500 text-center font-medium">
            Chuyến đi cần ít nhất 2 thành viên để bắt đầu vòng xoay.
          </p>
        )}
      </div>
    </Modal>
  );
}
