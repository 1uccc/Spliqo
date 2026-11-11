import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../contexts/LanguageContext';

export default function LegalModal({ isOpen, initialTab = 'terms', onClose }) {
  const { t, isEn } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const termsSections = isEn
    ? [
        {
          title: '1. Scope of Service',
          body: 'Spliqo is a group expense tracking and debt-simplification utility. Spliqo calculates net balances and formats standard VietQR codes for convenience; it does not act as a bank, e-wallet, or payment processor.'
        },
        {
          title: '2. Accuracy & User Responsibility',
          body: 'You are responsible for verifying logged amounts, split weights, foreign exchange rates (reference cached rates from open.er-api.com), receipt uploads, and recipient bank account details before initiating any bank transfer.'
        },
        {
          title: '3. Accounts & Group Governance',
          body: 'Keep your email/Google credentials secure. Trip creators may manage group membership and can lock/complete a trip only once all calculated settlements are mutually confirmed.'
        },
        {
          title: '4. Offline Queue & Availability',
          body: 'Offline expenses are temporarily stored in your browser and synced when connectivity returns. While care is taken to protect group ledger integrity, the service is provided as-is for personal and social group use.'
        }
      ]
    : [
        {
          title: '1. Phạm vi dịch vụ',
          body: 'Spliqo là công cụ hỗ trợ ghi chép chi tiêu nhóm, tối ưu hóa công nợ và tạo mã VietQR thuận tiện giữa bạn bè. Ứng dụng không phải ngân hàng, ví điện tử hay đơn vị trung gian xử lý dòng tiền trực tiếp.'
        },
        {
          title: '2. Trách nhiệm xác thực thông tin',
          body: 'Người dùng tự kiểm tra và chịu trách nhiệm về tính chính xác của số tiền, tỷ lệ chia, tỷ giá tham khảo (từ open.er-api.com), ảnh hóa đơn và thông tin tài khoản ngân hàng người nhận trước khi thực hiện chuyển khoản.'
        },
        {
          title: '3. Tài khoản & Quản lý chuyến đi',
          body: 'Bạn có trách nhiệm bảo mật tài khoản Email/Google của mình. Người tạo chuyến đi có quyền quản lý thành viên và chỉ có thể chốt sổ khi toàn bộ khoản công nợ đã được xác nhận thanh toán.'
        },
        {
          title: '4. Đồng bộ ngoại tuyến & Giới hạn trách nhiệm',
          body: 'Các khoản chi tạo khi mất mạng sẽ được lưu tạm trên trình duyệt và tự động đồng bộ khi có kết nối trở lại. Dịch vụ được cung cấp theo hiện trạng nhằm phục vụ nhu cầu quản lý chi tiêu nhóm cá nhân.'
        }
      ];

  const privacySections = isEn
    ? [
        {
          title: '1. Information We Store',
          body: 'Spliqo stores your authentication profile (display name, email, avatar URL via Firebase Auth), trip ledgers, expenses, settlement statuses, and the bank account info (bank name, account number, account holder) you choose to save for VietQR receipts.'
        },
        {
          title: '2. How Your Data Is Used',
          body: 'Your information is used strictly to synchronize shared trip balances in real time, deliver in-app notifications, and generate recap summaries. Spliqo does not sell your personal data or run third-party advertising trackers.'
        },
        {
          title: '3. Infrastructure & Third-Party Services',
          body: 'Authentication and trip data run on Google Firebase/Firestore; uploaded receipt or avatar photos use Cloudinary; VietQR images are rendered via img.vietqr.io using recipient account fields inside your trip.'
        },
        {
          title: '4. Your Control',
          body: 'You can update or clear your saved bank details in Profile settings, edit or delete expenses you recorded, or leave trips at any time.'
        }
      ]
    : [
        {
          title: '1. Dữ liệu được lưu trữ',
          body: 'Spliqo lưu thông tin tài khoản (tên hiển thị, email, ảnh đại diện qua Firebase Auth), danh sách chuyến đi, khoản chi, trạng thái tất toán và thông tin ngân hàng nhận tiền (tên ngân hàng, số tài khoản, tên chủ TK) mà bạn chủ động cập nhật.'
        },
        {
          title: '2. Mục đích sử dụng dữ liệu',
          body: 'Dữ liệu chỉ được dùng để đồng bộ số dư nhóm theo thời gian thực, gửi thông báo nhắc nợ theo thao tác của thành viên và dựng thẻ tổng kết chuyến đi. Spliqo không bán dữ liệu hay gắn trình theo dõi quảng cáo.'
        },
        {
          title: '3. Hạ tầng & Dịch vụ bên thứ ba',
          body: 'Xác thực và lưu trữ dùng Google Firebase/Firestore; ảnh đại diện/hóa đơn khi tải lên đi qua Cloudinary; mã QR thanh toán được tạo qua img.vietqr.io dựa trên thông tin tài khoản trong chuyến đi.'
        },
        {
          title: '4. Quyền kiểm soát của bạn',
          body: 'Bạn có thể chỉnh sửa hoặc xóa thông tin ngân hàng trong mục Hồ sơ, chỉnh sửa/xóa khoản chi hoặc rời khỏi chuyến đi bất kỳ lúc nào.'
        }
      ];

  const sections = activeTab === 'privacy' ? privacySections : termsSections;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === 'privacy' ? t('privacyPolicy', 'Chính sách bảo mật') : t('termsOfUse', 'Điều khoản sử dụng')}
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="tactile-btn-dark text-xs px-5 py-2.5 font-bold cursor-pointer"
          >
            {t('understoodBtn', 'Đã hiểu')}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Segmented Legal Tab Switcher */}
        <div
          role="tablist"
          aria-label={isEn ? 'Legal documents' : 'Tài liệu pháp lý'}
          className="grid grid-cols-2 gap-1.5 p-1 rounded-full bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e]"
        >
          <button
            type="button"
            role="tab"
            id="legal-tab-terms"
            aria-selected={activeTab === 'terms'}
            aria-controls="legal-panel"
            onClick={() => setActiveTab('terms')}
            className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('termsOfUse', 'Điều khoản sử dụng')}</span>
          </button>

          <button
            type="button"
            role="tab"
            id="legal-tab-privacy"
            aria-selected={activeTab === 'privacy'}
            aria-controls="legal-panel"
            onClick={() => setActiveTab('privacy')}
            className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-[#18181b] dark:bg-white text-white dark:text-[#18181b] shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('privacyPolicy', 'Chính sách bảo mật')}</span>
          </button>
        </div>

        {/* Document Content */}
        <div
          id="legal-panel"
          role="tabpanel"
          aria-labelledby={activeTab === 'privacy' ? 'legal-tab-privacy' : 'legal-tab-terms'}
          className="space-y-3"
        >
          {sections.map((item) => (
            <section
              key={item.title}
              className="p-3.5 rounded-2xl bg-[#f4f3ec] dark:bg-[#212129] border border-[#e6e4dc] dark:border-[#32323e] space-y-1"
            >
              <h4 className="text-xs sm:text-sm font-bold text-[#18181b] dark:text-white">
                {item.title}
              </h4>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed text-pretty">
                {item.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}

