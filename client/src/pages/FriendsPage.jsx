import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../services/api';
import Modal from '../components/Modal';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search, 
  Send, 
  Compass, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  Calendar, 
  Smile, 
  Mail, 
  Plus, 
  Clock 
} from 'lucide-react';

export default function FriendsPage() {
  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [friends, setFriends] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: ALL (Bạn bè) | SUGGESTED (Gợi ý kết bạn) | REQUESTS (Lời mời)
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal: Mời vào chuyến đi
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [invitingTripId, setInvitingTripId] = useState(null);

  const fetchFriendsAndTrips = useCallback(async () => {
    try {
      setLoading(true);
      const [friendsRes, tripsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/trips')
      ]);

      setFriends(friendsRes.friends || []);
      setSuggested(friendsRes.suggested || []);
      setRequests(friendsRes.requests || { incoming: [], outgoing: [] });
      setUserTrips(tripsRes || []);
    } catch (err) {
      console.error('[fetchFriendsAndTrips] Error:', err);
      showToast(err.message || 'Lỗi khi tải dữ liệu bạn bè', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFriendsAndTrips();
  }, [fetchFriendsAndTrips]);

  // 1. Gửi lời mời kết bạn (Friend Request)
  const handleSendRequest = async (targetUserId, targetName) => {
    try {
      const res = await api.post('/friends/request', { targetUserId });
      showToast(res.message || `Đã gửi lời mời kết bạn đến ${targetName}!`, 'success');
      fetchFriendsAndTrips();
    } catch (err) {
      showToast(err.message || 'Lỗi khi gửi lời mời kết bạn', 'error');
    }
  };

  // 2. Hủy lời mời kết bạn đã gửi
  const handleCancelRequest = async (targetUserId, requestId, _targetName) => {
    try {
      const res = await api.post('/friends/cancel', { targetUserId, requestId });
      showToast(res.message || 'Đã hủy lời mời kết bạn', 'info');
      fetchFriendsAndTrips();
    } catch (err) {
      showToast(err.message || 'Lỗi khi hủy lời mời kết bạn', 'error');
    }
  };

  // 3. Chấp nhận lời mời kết bạn
  const handleAcceptRequest = async (fromUserId, requestId, fromName) => {
    try {
      const res = await api.post('/friends/accept', { fromUserId, requestId });
      showToast(res.message || `Đã chấp nhận kết bạn với ${fromName || 'thành viên'}!`, 'success');
      fetchFriendsAndTrips();
    } catch (err) {
      showToast(err.message || 'Lỗi khi chấp nhận lời mời', 'error');
    }
  };

  // 4. Từ chối lời mời kết bạn
  const handleRejectRequest = async (fromUserId, requestId, _fromName) => {
    try {
      const res = await api.post('/friends/reject', { fromUserId, requestId });
      showToast(res.message || 'Đã từ chối lời mời kết bạn', 'info');
      fetchFriendsAndTrips();
    } catch (err) {
      showToast(err.message || 'Lỗi khi từ chối lời mời', 'error');
    }
  };

  // 5. Hủy kết bạn
  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`Bạn có chắc muốn hủy kết bạn với ${friendName}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/friends/${friendId}`);
      showToast(res.message || 'Đã hủy kết bạn', 'info');
      fetchFriendsAndTrips();
    } catch (err) {
      showToast(err.message || 'Lỗi khi hủy kết bạn', 'error');
    }
  };

  // Mở modal mời vào chuyến đi
  const openInviteModal = (friend) => {
    setSelectedFriend(friend);
    setInviteModalOpen(true);
  };

  // Thực hiện mời bạn vào chuyến đi
  const handleInviteToTrip = async (tripId) => {
    if (!selectedFriend) return;
    try {
      setInvitingTripId(tripId);
      const res = await api.post('/friends/invite-trip', {
        friendId: selectedFriend.uid,
        tripId
      });
      showToast(res.message || `Đã mời ${selectedFriend.displayName} vào chuyến đi!`, 'success');
      fetchFriendsAndTrips();
    } catch (err) {
      showToast(err.message || 'Lỗi khi mời bạn bè vào chuyến đi', 'error');
    } finally {
      setInvitingTripId(null);
    }
  };

  // Chuẩn hóa văn bản tiếng Việt để tìm kiếm không phụ thuộc dấu
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .trim();
  };

  const matchesSearch = (item, query) => {
    if (!item) return false;
    if (!query || !query.trim()) return true;
    const rawQ = query.toLowerCase().trim();
    const normQ = normalizeText(query);
    const cleanNumQ = query.replace(/[\s.-]/g, '');

    // 1. Tên hiển thị (DisplayName) - hỗ trợ cả tiếng Việt có dấu và không dấu (VD: "luc" -> "Lực")
    const name = item.displayName || '';
    if (name.toLowerCase().includes(rawQ) || normalizeText(name).includes(normQ)) return true;

    // 2. Email
    const email = item.email || '';
    if (email.toLowerCase().includes(rawQ)) return true;

    // 3. Số điện thoại (Phone)
    const phone = (item.phone || '').toString().replace(/[\s.-]/g, '');
    if (cleanNumQ && phone && phone.includes(cleanNumQ)) return true;

    // 4. Tên ngân hàng (Bank Name)
    const bankName = item.bankName || '';
    if (bankName.toLowerCase().includes(rawQ) || normalizeText(bankName).includes(normQ)) return true;

    // 5. Số tài khoản ngân hàng (STK - bankAccountNumber / accountNumber)
    const rawStk = item.bankAccountNumber || item.accountNumber || '';
    const stk = rawStk.toString().replace(/[\s.-]/g, '');
    if (cleanNumQ && stk && stk.includes(cleanNumQ)) return true;

    // 6. Tên chủ tài khoản ngân hàng (bankAccountHolder)
    const holder = item.bankAccountHolder || item.accountHolder || '';
    if (holder.toLowerCase().includes(rawQ) || normalizeText(holder).includes(normQ)) return true;

    return false;
  };

  // Lọc tìm kiếm
  const filteredFriends = friends.filter(f => matchesSearch(f, searchQuery));
  const filteredSuggested = suggested.filter(u => matchesSearch(u, searchQuery));
  const filteredRequests = (requests.incoming || []).filter(r => matchesSearch(r.fromUser, searchQuery));
  const filteredOutgoingRequests = (requests.outgoing || []).filter(r => matchesSearch(r.toUser, searchQuery));

  // Render Friend Card
  const renderFriendCard = (friend) => (
    <div
      key={friend.uid}
      className="tactile-card p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300"
    >
      <div>
        {/* Friend Header: Avatar + Name + Status Pill */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={friend.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.uid}`}
              alt={friend.displayName}
              className="w-11 h-11 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/10 shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-[#18181b] dark:text-white truncate">
                {friend.displayName}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-400 truncate">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{friend.email}</span>
              </div>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0">
            {t('friendBadge', 'Bạn bè')}
          </span>
        </div>

        {/* Dual Micro-boxes (Matching Tactile Bento Card Pattern) */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Box 1: Bank Account info */}
          <div className="tactile-chip p-2.5 flex flex-col justify-between min-h-[56px]">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> {t('bankHeader', 'NGÂN HÀNG')}
            </span>
            <div className="truncate">
              {(friend.bankName || friend.bankAccountNumber) ? (
                <>
                  <span className="text-xs font-bold text-[#18181b] dark:text-white block truncate">
                    {friend.bankName || 'Ngân hàng'}
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 block truncate">
                    STK: {friend.bankAccountNumber || friend.accountNumber || 'Chưa cập nhật'}
                  </span>
                </>
              ) : (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-400 italic">{t('notUpdated', 'Chưa cập nhật')}</span>
              )}
            </div>
          </div>

          {/* Box 2: Mutual trips */}
          <div className="tactile-chip p-2.5 flex flex-col justify-between min-h-[56px]">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3" /> {t('mutualTripsHeader', 'CHUYẾN ĐI CHUNG')}
            </span>
            <div>
              <span className="text-xs font-bold text-[#18181b] dark:text-white">
                {friend.mutualTripsCount || 0} {t('tripsUnit', 'chuyến đi')}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-400 block truncate">
                {friend.mutualTripsCount > 0 ? t('activeCompanion', 'Đang đồng hành') : t('noMutualTrips', 'Chưa có chung')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Actions: Primary Button "Mời vào chuyến đi" + Secondary "Hủy kết bạn" */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#dedbd0]/50 dark:border-[#2e2e38]">
        <button
          onClick={() => openInviteModal(friend)}
          className="flex-1 tactile-btn-dark py-2 text-xs flex items-center justify-center gap-1.5 shadow-xs"
          title={language === 'en' ? `Invite ${friend.displayName} to join a trip` : `Mời ${friend.displayName} tham gia một chuyến đi của bạn`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{t('inviteToTripBtn', 'Mời vào chuyến đi')}</span>
        </button>

        <button
          onClick={() => handleRemoveFriend(friend.uid, friend.displayName)}
          className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          title={t('unfriendTitle', 'Hủy kết bạn')}
        >
          <UserX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Render Suggested User Card (Hoặc thành viên tìm thấy trong hệ thống)
  const renderSuggestedCard = (user) => {
    const isOutgoing = (requests.outgoing || []).find(r => r.toUserId === user.uid);
    const isIncoming = (requests.incoming || []).find(r => r.fromUserId === user.uid);

    return (
      <div
        key={user.uid}
        className="tactile-card p-5 flex flex-col justify-between hover:shadow-md transition-all duration-300"
      >
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                alt={user.displayName}
                className="w-11 h-11 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#18181b] dark:text-white truncate">
                  {user.displayName}
                </h4>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              isIncoming
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
                : isOutgoing
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                : 'bg-[#edebe4] dark:bg-[#252530] text-zinc-600 dark:text-zinc-300 border border-[#dedbd0] dark:border-[#32323e]'
            }`}>
              {isIncoming ? 'Đã gửi lời mời cho bạn' : isOutgoing ? 'Đã gửi lời mời' : t('suggestedBadge', 'Gợi ý')}
            </span>
          </div>

          {(user.bankName || user.bankAccountNumber || user.accountNumber) ? (
            <div className="tactile-chip p-2.5 text-xs mb-3 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
                {user.bankName ? `${user.bankName} • ` : ''}STK: {user.bankAccountNumber || user.accountNumber}
              </span>
            </div>
          ) : (
            <div className="tactile-chip p-2.5 text-xs mb-3 text-zinc-400 dark:text-zinc-500 italic">
              Chưa cập nhật STK ngân hàng
            </div>
          )}
        </div>

        {isIncoming ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleAcceptRequest(user.uid, isIncoming.id, user.displayName)}
              className="flex-1 tactile-btn-dark py-2 text-xs flex items-center justify-center gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Chấp nhận</span>
            </button>
            <button
              onClick={() => handleRejectRequest(user.uid, isIncoming.id, user.displayName)}
              className="px-3 py-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold border border-[#dedbd0] dark:border-[#32323e] transition-colors"
              title="Từ chối lời mời"
            >
              Từ chối
            </button>
          </div>
        ) : isOutgoing ? (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 py-1.5 px-3 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-amber-200 dark:border-amber-800/40">
              <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Chờ chấp nhận</span>
            </div>
            <button
              onClick={() => handleCancelRequest(user.uid, isOutgoing.id, user.displayName)}
              className="px-3 py-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold border border-[#dedbd0] dark:border-[#32323e] transition-colors"
              title="Hủy lời mời kết bạn"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleSendRequest(user.uid, user.displayName)}
            className="w-full tactile-btn-dark py-2 text-xs flex items-center justify-center gap-1.5 shadow-xs hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Kết bạn</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#18181b]">
      
      {/* 1. Top Section Header & Segmented Tactile Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div className="shrink-0 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181b] dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#18181b] dark:text-white shrink-0" />
            <span className="whitespace-nowrap">{t('friendsHeader', 'Bạn bè & Kết nối')}</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {t('friendsSubtitle', 'Kết nối cùng bạn bè, quản lý số tài khoản và mời tham gia các chuyến du lịch dễ dàng')}
          </p>
        </div>

        {/* Tactile Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full md:w-auto shrink-0 flex-nowrap">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`tactile-tab shrink-0 whitespace-nowrap ${activeTab === 'ALL' ? 'active-purple' : ''}`}
          >
            <UserCheck className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="whitespace-nowrap shrink-0">{t('myFriendsTab', 'Bạn bè của tôi')}</span>
            <span className="tactile-badge w-5 h-5 rounded-full bg-white/80 dark:bg-white/15 dark:text-white text-[11px] font-bold flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 leading-none">
              {searchQuery.trim() ? filteredFriends.length : friends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SUGGESTED')}
            className={`tactile-tab shrink-0 whitespace-nowrap ${activeTab === 'SUGGESTED' ? 'active-purple' : ''}`}
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap shrink-0">{t('suggestedFriendsTab', 'Gợi ý kết bạn')}</span>
            <span className="tactile-badge w-5 h-5 rounded-full bg-white/80 dark:bg-white/15 dark:text-white text-[11px] font-bold flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 leading-none">
              {searchQuery.trim() ? filteredSuggested.length : suggested.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`tactile-tab shrink-0 whitespace-nowrap ${activeTab === 'REQUESTS' ? 'active-purple' : ''}`}
          >
            <Send className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="whitespace-nowrap shrink-0">Lời mời kết bạn</span>
            {requests.incoming?.length > 0 && (
              <span className="tactile-badge w-5 h-5 rounded-full bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 leading-none">
                {requests.incoming.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Search Bar & Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchFriendsPlaceholder', 'Tìm theo tên, email, ngân hàng, STK...')}
            className="w-full pl-10 pr-9 py-2 bg-white dark:bg-[#1f1f26] rounded-full border border-[#dedbd0] dark:border-[#2e2e38] text-xs font-medium text-[#18181b] dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-white shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 flex items-center justify-center text-[10px] hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors cursor-pointer"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-[#1a1a20] text-zinc-700 dark:text-zinc-300 rounded-full border border-[#dedbd0] dark:border-[#2e2e38] shadow-xs text-xs font-semibold self-start sm:self-auto">
          <Smile className="w-4 h-4 text-amber-500" />
          <span>{friends.length} {t('friendsUnit', 'bạn bè')} • {t('readyToInviteStatus', 'Sẵn sàng mời vào')} {userTrips.length} {t('readyToInviteTrips', 'chuyến đi')}</span>
        </div>
      </div>

      {/* 3. Main Content Views */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-56 bg-white dark:bg-[#1f1f26] rounded-3xl border border-[#dedbd0] dark:border-[#2e2e38] animate-pulse p-5" />
          ))}
        </div>
      ) : activeTab === 'ALL' ? (
        /* --- TAB: DANH SÁCH BẠN BÈ --- */
        searchQuery.trim() ? (
          /* Khi người dùng gõ tìm kiếm */
          filteredFriends.length === 0 && filteredSuggested.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1a1a20] border border-[#dedbd0] dark:border-[#2e2e38] shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#edebe4] dark:bg-[#252530] text-zinc-500 dark:text-zinc-400 mx-auto flex items-center justify-center">
                <Search className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="font-bold text-[#18181b] dark:text-white text-base">
                Không tìm thấy kết quả cho "{searchQuery}"
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                Không tìm thấy bạn bè hoặc thành viên nào khớp với tên, email hoặc số tài khoản (STK) này.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="tactile-btn-pill text-xs font-semibold px-4 py-2 mt-2"
              >
                Xóa từ khóa tìm kiếm
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. Bạn bè khớp tìm kiếm */}
              {filteredFriends.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-[#18181b] dark:text-white">
                      Bạn bè của bạn ({filteredFriends.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredFriends.map((friend) => renderFriendCard(friend))}
                  </div>
                </div>
              )}

              {/* 2. Thành viên khác khớp tìm kiếm (Gợi ý kết bạn ngay) */}
              {filteredSuggested.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#dedbd0]/60 dark:border-[#2e2e38]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-bold text-[#18181b] dark:text-white">
                        {filteredFriends.length > 0 ? 'Thành viên khác tìm thấy' : 'Thành viên tìm thấy trong hệ thống'} ({filteredSuggested.length})
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-zinc-400">Chưa kết bạn</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSuggested.map((user) => renderSuggestedCard(user))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* Khi không gõ tìm kiếm: Danh sách bạn bè bình thường */
          filteredFriends.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1a1a20] border border-[#dedbd0] dark:border-[#2e2e38] shadow-xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#edebe4] dark:bg-[#252530] text-zinc-600 dark:text-zinc-400 mx-auto flex items-center justify-center">
                <Users className="w-7 h-7 stroke-[1.8]" />
              </div>
              <h3 className="font-bold text-[#18181b] dark:text-white text-base">
                {t('noFriendsYet', 'Bạn chưa có người bạn nào trong danh sách')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                {t('exploreSuggested', 'Khám phá các thành viên trong mục Gợi ý kết bạn để cùng lập chuyến đi và chia tiền!')}
              </p>
              <button
                onClick={() => setActiveTab('SUGGESTED')}
                className="tactile-btn-dark mt-2"
              >
                <UserPlus className="w-4 h-4" /> {t('viewSuggestedBtn', 'Xem gợi ý kết bạn')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFriends.map((friend) => renderFriendCard(friend))}
            </div>
          )
        )
      ) : activeTab === 'SUGGESTED' ? (
        /* --- TAB: GỢI Ý KẾT BẠN --- */
        filteredSuggested.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1a1a20] border border-[#dedbd0] dark:border-[#2e2e38] shadow-xs space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              {searchQuery.trim() ? <Search className="w-7 h-7 stroke-[1.8]" /> : <CheckCircle2 className="w-7 h-7 stroke-[1.8]" />}
            </div>
            <h3 className="font-bold text-[#18181b] dark:text-white text-base">
              {searchQuery.trim() ? `Không tìm thấy thành viên nào khớp với "${searchQuery}"` : t('friendedAll', 'Bạn đã kết bạn với tất cả mọi người!')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {searchQuery.trim()
                ? 'Vui lòng kiểm tra lại Tên, Email hoặc Số tài khoản ngân hàng (STK).'
                : t('noMoreSuggested', 'Không còn thành viên gợi ý mới nào. Bạn có thể mời họ vào các chuyến đi của mình bất cứ lúc nào!')}
            </p>
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="tactile-btn-pill text-xs font-semibold px-4 py-2 mt-2"
              >
                Xóa từ khóa tìm kiếm
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('ALL')}
                className="tactile-btn-dark mt-2"
              >
                <Users className="w-4 h-4" /> {t('myFriendsTab', 'Xem danh sách bạn bè')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSuggested.map((user) => renderSuggestedCard(user))}
          </div>
        )
      ) : (
        /* --- TAB: LỜI MỜI KẾT BẠN --- */
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* 1. Lời mời kết bạn nhận được */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#18181b] dark:text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-600 rotate-180" />
                <span>Lời mời nhận được ({filteredRequests.length})</span>
              </h3>
              {filteredRequests.length > 0 && (
                <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                  Cần phản hồi
                </span>
              )}
            </div>

            {filteredRequests.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white dark:bg-[#1a1a20] border border-[#dedbd0] dark:border-[#2e2e38] text-xs text-zinc-400 dark:text-zinc-500">
                {searchQuery.trim()
                  ? `Không có lời mời nhận được nào khớp với "${searchQuery}".`
                  : 'Bạn không có lời mời kết bạn nào đang chờ chấp nhận.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    className="tactile-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={req.fromUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.fromUserId}`}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#18181b] dark:text-white truncate">
                          {req.fromUser?.displayName || 'Người dùng'}
                        </h4>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-400 truncate">{req.fromUser?.email}</p>
                        {(req.fromUser?.bankName || req.fromUser?.bankAccountNumber) && (
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                            <CreditCard className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{req.fromUser?.bankName} • {req.fromUser?.bankAccountNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleAcceptRequest(req.fromUserId, req.id, req.fromUser?.displayName)}
                        className="tactile-btn-dark py-1.5 px-3.5 text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Chấp nhận</span>
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.fromUserId, req.id, req.fromUser?.displayName)}
                        className="py-1.5 px-3 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold border border-[#dedbd0] dark:border-[#32323e] transition-colors"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Lời mời kết bạn đã gửi đi */}
          <div className="space-y-3 pt-4 border-t border-[#dedbd0]/60 dark:border-[#2e2e38]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#18181b] dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Lời mời đã gửi ({filteredOutgoingRequests.length})</span>
              </h3>
            </div>

            {filteredOutgoingRequests.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-white dark:bg-[#1a1a20] border border-[#dedbd0] dark:border-[#2e2e38] text-xs text-zinc-400 dark:text-zinc-500">
                {searchQuery.trim()
                  ? `Không có lời mời đã gửi nào khớp với "${searchQuery}".`
                  : 'Bạn chưa gửi lời mời kết bạn nào đang chờ xử lý.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOutgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="tactile-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={req.toUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.toUserId}`}
                        alt=""
                        className="w-11 h-11 rounded-full object-cover bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/10 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#18181b] dark:text-white truncate">
                          {req.toUser?.displayName || 'Người dùng'}
                        </h4>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-400 truncate">{req.toUser?.email}</p>
                        {(req.toUser?.bankName || req.toUser?.bankAccountNumber) && (
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5 truncate">
                            <CreditCard className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{req.toUser?.bankName} • {req.toUser?.bankAccountNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-pulse" /> Chờ chấp nhận
                      </span>
                      <button
                        onClick={() => handleCancelRequest(req.toUserId, req.id, req.toUser?.displayName)}
                        className="py-1 px-3 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold border border-[#dedbd0] dark:border-[#32323e] transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL: MỜI BẠN VÀO CHUYẾN ĐI (Exact tactile popup) */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setSelectedFriend(null);
        }}
        title={`${t('inviteModalTitle', 'Mời')} ${selectedFriend?.displayName || ''} ${t('readyToInviteTrips', 'vào chuyến đi')}`}
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-end w-full">
            <button
              onClick={() => {
                setInviteModalOpen(false);
                setSelectedFriend(null);
              }}
              className="px-5 py-2 bg-[#edebe4] dark:bg-[#252530] hover:bg-[#dedbd0] dark:hover:bg-[#2e2e3a] text-[#18181b] dark:text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              {t('close', 'Đóng')}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-[#edebe4]/70 dark:bg-[#252530] rounded-2xl flex items-center gap-3 border border-[#dedbd0] dark:border-[#32323e]">
            <img
              src={selectedFriend?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFriend?.uid}`}
              alt=""
              className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 object-cover border border-black/5 dark:border-white/10"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-[#18181b] dark:text-white truncate">{selectedFriend?.displayName}</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{selectedFriend?.email}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-[#1a1a20] text-zinc-700 dark:text-zinc-300 border border-[#dedbd0] dark:border-[#32323e]">
              {t('friendBadge', 'Bạn bè')}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-[#18181b] dark:text-white uppercase tracking-wider mb-2">
              {t('selectTripToInvite', 'Chọn chuyến đi cần mời')} ({userTrips.length})
            </h4>

            {userTrips.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-zinc-50 dark:bg-[#1a1a20] border border-zinc-200 dark:border-[#32323e] text-xs text-zinc-500 dark:text-zinc-400">
                {t('noTripsToInvite', 'Bạn chưa tham gia chuyến đi nào. Hãy tạo chuyến đi mới trước nhé!')}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {userTrips.map((trip) => {
                  // Check if friend is already member of this trip
                  const alreadyMember = selectedFriend?.mutualTrips?.some(t => t.id === trip.id);
                  const isInvitingThis = invitingTripId === trip.id;

                  return (
                    <div
                      key={trip.id}
                      className="p-3 rounded-2xl bg-white dark:bg-[#212129] border border-[#dedbd0] dark:border-[#32323e] flex items-center justify-between gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#18181b] dark:text-white truncate block">
                            {trip.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-[#2a2a35] px-1.5 py-0.2 rounded">
                            #{trip.tripCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {trip.startDate}
                          </span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {trip.status === 'COMPLETED' ? t('completedTrip', 'Đã hoàn thành') : t('activeTrip', 'Đang hoạt động')}
                          </span>
                        </div>
                      </div>

                      <div>
                        {alreadyMember ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {t('alreadyJoined', 'Đã tham gia')}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleInviteToTrip(trip.id)}
                            disabled={isInvitingThis}
                            className="tactile-btn-dark py-1.5 px-3.5 text-xs flex items-center gap-1.5"
                          >
                            {isInvitingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>{t('inviting', 'Đang mời...')}</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>{t('inviteJoin', 'Mời tham gia')}</span>
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
        </div>
      </Modal>

    </div>
  );
}
