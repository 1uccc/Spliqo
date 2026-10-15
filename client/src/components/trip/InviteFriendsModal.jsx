import React from 'react';
import { Link } from 'react-router-dom';
import Modal from '../Modal';
import { Loader2, CheckCircle2, UserPlus } from 'lucide-react';

export default function InviteFriendsModal({
  isOpen,
  onClose,
  trip,
  friendsList = [],
  loadingFriends = false,
  invitingFriendId = null,
  members = [],
  onInviteFriend,
  t
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t ? t('inviteFriendsModalTitle', 'Mời bạn bè vào chuyến đi') : 'Mời bạn bè vào chuyến đi'}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            to="/friends"
            className="text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white underline"
          >
            Quản lý bạn bè
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn-pill py-1.5 px-4 text-xs font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">
          Chọn bạn bè từ danh bạ để thêm trực tiếp vào chuyến đi "{trip?.name}" mà họ không cần phải tự nhập mã mời.
        </p>

        {loadingFriends ? (
          <div className="py-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">Đang tải danh sách bạn bè...</p>
          </div>
        ) : friendsList.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-[#2e2e38] text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
            <p>Bạn chưa có người bạn nào trong danh sách.</p>
            <Link
              to="/friends"
              className="inline-block text-xs font-bold text-zinc-900 dark:text-white underline"
            >
              Đi đến mục Bạn bè để kết bạn ngay →
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {friendsList.map((friend) => {
              const friendId = friend.uid || friend.id || friend.userId;
              const alreadyInTrip = members.some((m) => (m.userId || m.uid || m.id) === friendId);
              const isInvitingThis = invitingFriendId === friendId;

              return (
                <div
                  key={friend.uid}
                  className="p-3 rounded-2xl bg-white dark:bg-[#212129] border border-[#dedbd0] dark:border-[#2e2e38] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#18181b] dark:text-white truncate">
                        {friend.displayName}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate">{friend.email}</p>
                    </div>
                  </div>

                  <div>
                    {alreadyInTrip ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Đã tham gia
                      </span>
                    ) : (
                      <button
                        onClick={() => onInviteFriend(friend)}
                        disabled={isInvitingThis}
                        className="tactile-btn-dark py-1.5 px-3 text-xs flex items-center gap-1.5"
                      >
                        {isInvitingThis ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang thêm...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Thêm vào chuyến</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
