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
  Dice5
} from 'lucide-react';
import confetti from 'canvas-confetti';

// High-contrast Neo-Retro graphic palette (Tangerine, Black, Cream, Yellow, Burnt Orange)
const RETRO_WHEEL_PALETTE = [
  { bg: '#ff5400', text: '#ffffff' }, // Tangerine Orange
  { bg: '#18181b', text: '#ffffff' }, // Jet Black
  { bg: '#fef08a', text: '#18181b' }, // Retro Yellow
  { bg: '#ffffff', text: '#18181b' }, // Paper White
  { bg: '#fed7aa', text: '#18181b' }, // Warm Peach
  { bg: '#ea580c', text: '#ffffff' }, // Burnt Tangerine
  { bg: '#f4f3ec', text: '#18181b' }, // Warm Cream Grey
  { bg: '#27272a', text: '#ffffff' }  // Dark Slate
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
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
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
        gain.gain.setValueAtTime(0.16, startTime);
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

  // Draw the Wheel onto Canvas in Neo-Retro Brutalism style
  const drawWheel = (currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas || members.length === 0) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 20;
    const numSlices = members.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, width, height);

    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    // Draw Slices with Brutalist solid borders
    members.forEach((member, i) => {
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;
      const sliceStyle = RETRO_WHEEL_PALETTE[i % RETRO_WHEEL_PALETTE.length];

      // Wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();
      ctx.fillStyle = sliceStyle.bg;
      ctx.fill();

      // Sharp Brutalist Divider Lines
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#18181b';
      ctx.stroke();

      // Slice Text
      ctx.save();
      const textAngle = startA + sliceAngle / 2;
      ctx.rotate(textAngle);
      ctx.textAlign = 'right';
      ctx.fillStyle = sliceStyle.text;
      ctx.font = '900 13px monospace, system-ui, sans-serif';

      const name = (member.displayName || `MEMBER ${i + 1}`).toUpperCase();
      const truncated = name.length > 12 ? name.substring(0, 10) + '..' : name;
      ctx.fillText(truncated, radius - 24, 5);
      ctx.restore();
    });

    ctx.restore();

    // Outer Thick Brutalist Rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, 2 * Math.PI);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#18181b';
    ctx.stroke();

    // Outer Rivet Studs (Retro Arcade detail)
    const numStuds = Math.max(12, numSlices * 2);
    for (let s = 0; s < numStuds; s++) {
      const studAngle = (s * 2 * Math.PI) / numStuds;
      const sx = centerX + (radius + 10) * Math.cos(studAngle);
      const sy = centerY + (radius + 10) * Math.sin(studAngle);
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff5400';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#18181b';
      ctx.stroke();
    }

    // Center Brutalist Hub with Hard Drop Shadow look
    ctx.beginPath();
    ctx.arc(centerX, centerY, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#18181b';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ff5400';
    ctx.stroke();

    // Center Star Icon ★
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', centerX, centerY);
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
    const extraSpins = 6 + Math.floor(Math.random() * 3); // 6 to 8 full rotations
    const sliceCenterAngle = targetIndex * sliceAngle + sliceAngle / 2;
    
    const targetOffset = (3 * Math.PI / 2) - sliceCenterAngle;
    const currentRot = rotationRef.current % (2 * Math.PI);
    let finalRotation = rotationRef.current - currentRot + (extraSpins * 2 * Math.PI) + targetOffset;
    if (finalRotation < rotationRef.current) {
      finalRotation += 2 * Math.PI * (extraSpins + 1);
    }

    const startRot = rotationRef.current;
    const totalDelta = finalRotation - startRot;
    const duration = 4600; // 4.6 seconds
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Deceleration easing (ease-out quintic)
      const easeOut = 1 - Math.pow(1 - progress, 5);
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
          particleCount: 90,
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
      title: '👑 AI BAO TRỌN?',
      desc: 'Người được quay trúng sẽ là đại gia thanh toán toàn bộ cho cả nhóm.',
      banner: '★ ĐẠI GIA CHẦU NÀY ĐÃ LỘ DIỆN! ★'
    },
    advance: {
      title: '💳 AI ỨNG TRƯỚC?',
      desc: 'Người này quẹt thẻ/chuyển khoản trả trước, sau đó chia bill đều.',
      banner: '★ THỦ QUỸ LÂM THỜI ĐƯỢC CHỌN! ★'
    },
    lucky_free: {
      title: '🎁 AI ĐƯỢC KHAO 0Đ?',
      desc: 'Cả nhóm chia tiền, riêng bạn này may mắn được khao miễn phí.',
      banner: '★ SỐ ĐỎ HÔM NAY: ĐƯỢC KHAO 0Đ! ★'
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={spinning ? () => {} : onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md bg-[#ff5400] text-white font-black text-xs tracking-wider uppercase">
            NEO-RETRO
          </span>
          <span className="font-black text-[#18181b] dark:text-white uppercase tracking-tight">
            Vòng Xoay May Mắn 🎡
          </span>
        </div>
      }
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl border-2 border-[#18181b] bg-white text-[#18181b] shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#ff5400] stroke-[2.5]" /> : <VolumeX className="w-4 h-4 text-zinc-400 stroke-[2.5]" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={spinning}
              className="px-4 py-2 rounded-xl border-2 border-[#18181b] bg-white text-[#18181b] font-bold text-xs shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
            >
              {t('close', 'Đóng')}
            </button>
            {winner && (
              <button
                type="button"
                onClick={handleUseWinner}
                className="px-4 py-2 rounded-xl border-2 border-[#18181b] bg-[#ff5400] hover:bg-[#ea580c] text-white font-black text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_#18181b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
              >
                <span>Tạo khoản chi với {winner.displayName}</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      }
    >
      <div 
        className="space-y-4 p-4 rounded-3xl border-[3px] border-[#18181b] shadow-[6px_6px_0px_#18181b] bg-[#fbf9f3] text-[#18181b] relative overflow-hidden select-none"
        style={{
          backgroundImage: 'radial-gradient(#18181b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundColor: '#fbf9f3'
        }}
      >
        {/* Top Tape Sticker */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-0.5 bg-[#18181b] border-2 border-[#18181b] text-white text-[10px] font-mono font-black uppercase tracking-widest rotate-[1deg] shadow-[2px_2px_0px_#ff5400]">
          ★ SPLIQO ARCADE WHEEL ★
        </div>

        {/* Brutalist Mode Selector */}
        <div className="grid grid-cols-3 gap-2 pt-2">
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
                className={`py-2 px-1.5 rounded-xl border-2 border-[#18181b] text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#ff5400] text-white shadow-[3px_3px_0px_#18181b] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white text-[#18181b] shadow-[2px_2px_0px_#18181b] hover:bg-zinc-50'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.5]" />
                <span className="text-[10px] font-mono uppercase truncate w-full text-center tracking-tight">
                  {mode.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subtitle tag */}
        <div className="p-2 rounded-xl bg-white border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] text-center">
          <p className="text-[11px] font-bold text-zinc-700 font-mono">
            {modeDescriptions[gameMode]?.desc}
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative flex flex-col items-center justify-center pt-2 pb-1">
          {/* Top Brutalist Indicator Arrow */}
          <div className="absolute top-0 z-20 flex flex-col items-center -translate-y-2">
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-[#ff5400] drop-shadow-[0_3px_0_#18181b] animate-bounce" />
          </div>

          {/* Canvas Wheel */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 drop-shadow-[4px_4px_0_#18181b]">
            <canvas
              ref={canvasRef}
              width={288}
              height={288}
              className="w-full h-full"
            />
          </div>

          {/* Brutalist Spin Button */}
          <button
            type="button"
            onClick={spinWheel}
            disabled={spinning || members.length < 2}
            className={`mt-4 px-9 py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center gap-2 border-[3px] border-[#18181b] transition-all cursor-pointer ${
              spinning
                ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed shadow-none'
                : 'bg-[#ff5400] hover:bg-[#ea580c] text-white shadow-[4px_4px_0px_#18181b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#18181b]'
            }`}
          >
            <RotateCw className={`w-4 h-4 stroke-[3] ${spinning ? 'animate-spin' : ''}`} />
            <span>{spinning ? 'ĐANG QUAY...' : 'QUAY NGAY 🎲'}</span>
          </button>
        </div>

        {/* Result Announcement in Neo-Retro Brutalism Card */}
        {winner && (
          <div className="p-4 rounded-2xl bg-white border-[3px] border-[#18181b] shadow-[4px_4px_0px_#18181b] text-center space-y-2 animate-fade-in">
            <div className="inline-block px-3 py-0.5 rounded-md bg-[#ff5400] text-white text-[10px] font-mono font-black uppercase tracking-wider border border-[#18181b]">
              {modeDescriptions[gameMode]?.banner}
            </div>

            <div className="flex items-center justify-center gap-3 py-1">
              <div className="w-14 h-14 rounded-2xl bg-[#fef08a] border-2 border-[#18181b] shadow-[3px_3px_0px_#18181b] p-0.5 overflow-hidden">
                <img
                  src={winner.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.userId || winner.uid || winner.id}`}
                  alt=""
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-xl font-black text-[#18181b] uppercase tracking-tight">
                  {winner.displayName}
                </div>
                <div className="text-xs font-mono font-bold text-zinc-600">
                  {gameMode === 'payer' ? 'HÔM NAY LÀM ĐẠI GIA KHAO NHÓM!' : gameMode === 'advance' ? 'QUẸT THẺ ỨNG TIỀN TRƯỚC!' : 'ĐƯỢC CẢ NHÓM BAO TRỌN 0Đ!'}
                </div>
              </div>
            </div>
          </div>
        )}

        {members.length < 2 && (
          <p className="text-xs text-rose-600 text-center font-black font-mono">
            CẦN ÍT NHẤT 2 THÀNH VIÊN ĐỂ BẮT ĐẦU VÒNG XOAY.
          </p>
        )}

        {/* Bottom Vintage Barcode Stamp */}
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-500 pt-2 border-t border-dashed border-[#18181b]/20">
          <span>|||| | || |||| |</span>
          <span>SPLIQO ROULETTE 2026</span>
        </div>
      </div>
    </Modal>
  );
}
