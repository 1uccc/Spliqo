import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../Modal';
import { ArrowRight, CreditCard, Crown, Gift, PartyPopper, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLanguage } from '../../contexts/LanguageContext';

const TAU = Math.PI * 2;
const SIZE = 720;
const CENTER = SIZE / 2;
const RADIUS = 337;
const SPIN_DURATION = 5200;
const WHITE = '#ffffff';
const CREAM = '#fff5be';
const BLACK = '#17191d';
const normalized = (value) => ((value % TAU) + TAU) % TAU;
const fallbackAvatar = (member) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(String(member.userId || member.uid || member.id || member.displayName || 'member'))}`;

function makeAudioPlayer() {
  let ctx;
  return {
    tick(enabled) {
      if (!enabled) return;
      try {
        ctx ||= new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        const time = ctx.currentTime;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(680, time);
        oscillator.frequency.exponentialRampToValueAtTime(220, time + 0.04);
        gain.gain.setValueAtTime(0.065, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.05);
      } catch { /* Browsers may block audio. */ }
    },
    fanfare(enabled) {
      if (!enabled) return;
      try {
        ctx ||= new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const at = ctx.currentTime + i * 0.1;
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.value = freq;
          gain.gain.setValueAtTime(0.001, at);
          gain.gain.linearRampToValueAtTime(0.12, at + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.001, at + 0.38);
          oscillator.connect(gain).connect(ctx.destination);
          oscillator.start(at);
          oscillator.stop(at + 0.39);
        });
      } catch { /* Audio is optional. */ }
    },
    close() { ctx?.close().catch(() => { }); }
  };
}

export default function LuckyWheelModal({
  isOpen,
  onClose,
  members = [],
  onPickWinnerForExpense,
  t: tProp
}) {
  const { t: tLang, isEn } = useLanguage();
  const t = tProp || tLang;
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const rotationRef = useRef(0);
  const picturesRef = useRef(new Map());
  const audioRef = useRef(null);
  const mountedRef = useRef(false);
  const spinningRef = useRef(false);
  const soundRef = useRef(true);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [gameMode, setGameMode] = useState('payer');
  const [imageVersion, setImageVersion] = useState(0);

  const participants = useMemo(() => members.map((member, i) => ({
    member,
    name: member.displayName || (isEn ? `Member ${i + 1}` : `Thành viên ${i + 1}`),
    photo: member.photoURL || fallbackAvatar(member)
  })), [members, isEn]);

  const modeDescriptions = {
    payer: {
      title: t('modePayerLabel', 'Ai bao trọn'),
      desc: t('modePayerDesc', 'Người được chọn thanh toán toàn bộ cho cả nhóm.'),
      banner: t('modePayerBanner', 'Đại gia chầu này đã lộ diện!')
    },
    advance: {
      title: t('modeAdvanceLabel', 'Ai ứng trước'),
      desc: t('modeAdvanceDesc', 'Người được chọn ứng tiền trước, sau đó cả nhóm chia bill.'),
      banner: t('modeAdvanceBanner', 'Thủ quỹ lâm thời được chọn!')
    },
    lucky_free: {
      title: t('modeLuckyFreeLabel', 'Ai được khao'),
      desc: t('modeLuckyFreeDesc', 'Người được chọn được miễn phần tiền của mình.'),
      banner: t('modeLuckyFreeBanner', 'Hôm nay được cả nhóm khao!')
    }
  };

  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => {
    audioRef.current = makeAudioPlayer();
    return () => audioRef.current?.close();
  }, []);

  // Cache images once. Cross-origin images are only drawn, never exported.
  useEffect(() => {
    if (!isOpen) return;
    let disposed = false;
    participants.forEach(({ photo }) => {
      if (picturesRef.current.has(photo)) return;
      picturesRef.current.set(photo, null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (disposed) return;
        picturesRef.current.set(photo, img);
        setImageVersion((v) => v + 1);
      };
      img.onerror = () => {
        if (disposed) return;
        picturesRef.current.set(photo, false);
        setImageVersion((v) => v + 1);
      };
      img.src = photo;
    });
    return () => { disposed = true; };
  }, [participants, isOpen]);

  const drawWheel = useCallback((rotation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    const n = participants.length;
    if (!n) return;
    const slice = TAU / n;

    // Black outer rim and shallow shadow.
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.22)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 12;
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS + 17, 0, TAU);
    ctx.fillStyle = BLACK;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(rotation);
    participants.forEach(({ member, name, photo }, i) => {
      const from = i * slice;
      const mid = from + slice / 2;
      const to = from + slice;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, RADIUS - 5, from, to);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? CREAM : WHITE;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#e5e7eb';
      ctx.stroke();

      // Arrange the avatar and name along each segment's radius.
      ctx.save();
      ctx.rotate(mid);
      const avatarX = RADIUS * 0.58;
      const avatarSize = Math.max(39, Math.min(79, RADIUS * slice * 0.38));
      const img = picturesRef.current.get(photo);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, 0, avatarSize / 2 + 3, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.clip();
      if (img && img.complete && img.naturalWidth) {
        const dim = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - dim) / 2;
        const sy = (img.naturalHeight - dim) / 2;
        ctx.drawImage(img, sx, sy, dim, dim, avatarX - avatarSize / 2, -avatarSize / 2, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(avatarX - avatarSize / 2, -avatarSize / 2, avatarSize, avatarSize);
        ctx.fillStyle = '#1e40af';
        ctx.font = '800 26px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name[0]?.toUpperCase() || '?', avatarX, 1);
      }
      ctx.restore();

      // Name is tangential to the circle, like the reference photo.
      const textX = RADIUS * 0.83;
      ctx.translate(textX, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#17191d';
      const fontSize = Math.max(14, Math.min(25, n > 10 ? 16 : 23));
      ctx.font = `800 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const maxTextWidth = Math.max(48, 2 * Math.PI * textX / n * 0.86);
      let label = name;
      while (label.length > 2 && ctx.measureText(label).width > maxTextWidth) {
        label = label.slice(0, -2).trimEnd() + '…';
      }
      ctx.fillText(label, 0, 0, maxTextWidth);
      ctx.restore();
    });
    ctx.restore();

    // Black border, secondary inner ring, metallic rivets.
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS + 8, 0, TAU);
    ctx.lineWidth = 15;
    ctx.strokeStyle = BLACK;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, RADIUS - 2, 0, TAU);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i * TAU) / 12;
      const r = RADIUS + 8;
      ctx.beginPath();
      ctx.arc(CENTER + Math.cos(a) * r, CENTER + Math.sin(a) * r, 3.1, 0, TAU);
      ctx.fillStyle = '#f9fafb';
      ctx.fill();
    }
    // The center hub is fixed so it doesn't spin with the participants.
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 76, 0, TAU);
    ctx.fillStyle = BLACK;
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#565c68';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 65, 0, TAU);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();
  }, [participants, imageVersion]);

  useEffect(() => {
    if (!isOpen) return;
    mountedRef.current = true;
    setWinner(null);
    return () => {
      mountedRef.current = false;
      if (animationRef.current != null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      spinningRef.current = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !spinningRef.current) drawWheel(rotationRef.current);
  }, [isOpen, drawWheel]);

  const spinWheel = () => {
    if (spinningRef.current || participants.length < 2) return;
    spinningRef.current = true;
    setSpinning(true);
    setWinner(null);
    const n = participants.length;
    const slice = TAU / n;
    const targetIndex = Math.floor(Math.random() * n);
    // Pointer is fixed at 12 o'clock (-PI / 2).
    const target = -Math.PI / 2 - (targetIndex + 0.5) * slice;
    const start = rotationRef.current;
    const additional = normalized(target - normalized(start));
    const revolutions = 5 + Math.floor(Math.random() * 3);
    const delta = revolutions * TAU + additional;
    const duration = SPIN_DURATION;
    const startTime = performance.now();
    let priorIndex = -1;

    const step = (now) => {
      if (!mountedRef.current) return;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 5);
      const angle = start + delta * eased;
      rotationRef.current = angle;
      drawWheel(angle);

      const underPointer = Math.floor(normalized(-Math.PI / 2 - angle) / slice);
      if (underPointer !== priorIndex) {
        priorIndex = underPointer;
        audioRef.current?.tick(soundRef.current);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        rotationRef.current = normalized(target);
        drawWheel(rotationRef.current);
        animationRef.current = null;
        spinningRef.current = false;
        setSpinning(false);
        setWinner(participants[targetIndex].member);
        audioRef.current?.fanfare(soundRef.current);
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.57 } });
      }
    };
    animationRef.current = requestAnimationFrame(step);
  };

  const handleUseWinner = () => {
    if (!winner || spinningRef.current) return;
    onPickWinnerForExpense?.(winner, gameMode);
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={spinning ? () => { } : onClose}
      title={<span className="font-extrabold text-zinc-900 dark:text-white">🎡 {t('luckyWheelTitle', 'Vòng Xoay May Mắn')}</span>}
      maxWidth="max-w-lg"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <button type="button" onClick={() => setSoundEnabled((v) => !v)}
            className="rounded-xl p-2 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}>
            {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" disabled={spinning} onClick={onClose}
              className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold dark:border-zinc-700">
              {t('close', 'Đóng')}
            </button>
            {winner && <button type="button" onClick={handleUseWinner}
              className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-4 py-2 text-xs font-bold text-white dark:bg-white dark:text-black">
              {t('createExpenseWithWinner', 'Tạo khoản chi với {name}').replace('{name}', winner.displayName || '')}
              <ArrowRight className="h-4 w-4" />
            </button>}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {[
            { id: 'payer', icon: Crown },
            { id: 'advance', icon: CreditCard },
            { id: 'lucky_free', icon: Gift }
          ].map(({ id, icon: Icon }) => (
            <button key={id} type="button" disabled={spinning} onClick={() => { setGameMode(id); setWinner(null); }}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-bold transition ${gameMode === id ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
              <Icon className="h-4 w-4" />{modeDescriptions[id].title}
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">{modeDescriptions[gameMode].desc}</p>

        <div className="relative overflow-hidden rounded-3xl bg-[#4599f7] px-2 pb-5 pt-5 sm:px-4"
          style={{ backgroundImage: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.09) 0deg 12deg, transparent 12deg 24deg)' }}>
          <div className="relative mx-auto w-full max-w-[440px] select-none" style={{ aspectRatio: '1 / 1' }}>
            <canvas ref={canvasRef} width={SIZE} height={SIZE} className="block h-full w-full" role="img" aria-label="Vòng quay chọn thành viên" />
            {/* Fixed pointer at the top of the wheel. */}
            <div className="pointer-events-none absolute left-1/2 top-[1.1%] z-20 -translate-x-1/2 -translate-y-[38%] drop-shadow-lg">
              <div className="relative h-8 w-7 rounded-full bg-[#ef3b2d] shadow-[inset_-3px_-4px_0_rgba(0,0,0,.12)]">
                <div className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-white" />
                <div className="absolute left-1/2 top-[24px] h-0 w-0 -translate-x-1/2 border-x-[9px] border-t-[18px] border-x-transparent border-t-[#ef3b2d]" />
              </div>
            </div>
            <button type="button" onClick={spinWheel} disabled={spinning || participants.length < 2}
              className="absolute left-1/2 top-1/2 z-10 flex h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center font-black italic text-[#fde047] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
              style={{ fontSize: 'clamp(12px, 4vw, 20px)' }}>
              <span>{spinning ? '...' : 'START'}</span>
              {!spinning && <span className="text-[10px] not-italic tracking-[.2em]">&gt;&gt;</span>}
            </button>
          </div>
          <p className="mt-1 text-center text-[11px] font-bold uppercase tracking-widest text-white/95">
            {spinning ? t('spinning', 'Đang quay...') : t('spinNow', 'Chạm START để quay')}
          </p>
        </div>

        {winner && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-center dark:border-amber-700 dark:bg-amber-950/30" aria-live="polite">
            <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <PartyPopper className="h-4 w-4" />{modeDescriptions[gameMode].banner}
            </div>
            <div className="flex items-center justify-center gap-3">
              <img src={winner.photoURL || fallbackAvatar(winner)} alt="" className="h-14 w-14 rounded-full border-4 border-white object-cover shadow" />
              <strong className="text-xl font-black text-zinc-900 dark:text-white">{winner.displayName || 'Thành viên'}</strong>
            </div>
          </div>
        )}
        {participants.length < 2 && (
          <p className="text-center text-xs font-medium text-rose-500">
            {t('needAtLeastTwoMembers', 'Cần ít nhất 2 thành viên để quay.')}
          </p>
        )}
      </div>
    </Modal>
  );
}
