import React from 'react';
import { Share2, UserPlus, Copy, Check } from 'lucide-react';

export default function TripMembersTab({
  trip,
  members = [],
  isCreator,
  copiedCode,
  onCopyCode,
  onOpenInviteLinkModal,
  onOpenInviteFriendsModal,
  onRemoveMember,
  t
}) {
  return (
    <div className="space-y-6">
      {/* Invite Code & Friends Box */}
      <div className="tactile-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f4f3ec] dark:bg-[#1a1a22]">
        <div>
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            {t('addMember', 'Thêm thành viên')}
          </span>
          <h3 className="text-lg font-bold text-[#18181b] dark:text-white mt-0.5">
            {t('inviteFriendsOrShareCode', 'Mời bạn bè hoặc chia sẻ mã chuyến đi')}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t('inviteFriendsDesc', 'Mời trực tiếp bạn bè trong danh bạ hoặc gửi mã Trip Code để họ tự tham gia.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenInviteLinkModal}
            className="tactile-btn-dark py-2.5 px-4 text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>{t('inviteByLinkAndQR', 'Mời bằng link & QR')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenInviteFriendsModal}
            className="tactile-btn-pill py-2.5 px-4 text-xs flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('inviteFromFriends', 'Mời từ bạn bè')}</span>
          </button>

          <div className="flex items-center gap-3 p-1.5 bg-white dark:bg-[#212129] rounded-2xl border border-[#dedbd0] dark:border-[#32323e] shadow-xs">
            <span className="text-lg font-mono font-extrabold tracking-widest px-2.5 text-[#18181b] dark:text-white">
              {trip?.tripCode}
            </span>
            <button
              onClick={onCopyCode}
              className="tactile-btn-pill py-1.5 px-3 text-xs"
              title={t('copyCode', 'Sao chép mã')}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? t('copied', 'Đã chép') : t('copy', 'Sao chép')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="tactile-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e6e4dc] dark:border-[#272732] bg-[#f4f3ec] dark:bg-[#1a1a22] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#18181b] dark:text-white">
            {t('membersList', 'Danh sách thành viên')} ({members.length})
          </h3>
        </div>

        <div className="divide-y divide-[#e6e4dc]/70 dark:divide-[#272732]">
          {members.map((m) => {
            const memberId = m.userId || m.uid || m.id;
            const isMemberCreator = m.role === 'Creator' || memberId === trip?.createdBy;

            return (
              <div key={memberId} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#f4f3ec]/50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3.5">
                  <img
                    src={m.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`}
                    alt=""
                    className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 object-cover border border-[#e6e4dc] dark:border-[#2e2e38]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[#18181b] dark:text-white text-sm">
                        {m.displayName}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isMemberCreator
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-[#f4f3ec] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-[#e6e4dc] dark:border-zinc-700/60'
                        }`}
                      >
                        {isMemberCreator ? t('creator', 'Người tạo') : t('memberRole', 'Thành viên')}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {m.bankName ? (
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {t('bank', 'Ngân hàng')}: {m.bankName} • {m.bankAccountNumber} ({m.bankAccountHolder || m.displayName})
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500">
                          {t('noBankAccountYet', 'Chưa cập nhật tài khoản ngân hàng')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: remove member if creator */}
                {isCreator && !isMemberCreator && (
                  <button
                    onClick={() => onRemoveMember(m)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold p-2 rounded-full hover:bg-rose-50 transition-all cursor-pointer"
                  >
                    {t('remove', 'Xóa')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
