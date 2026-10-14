# SplitMate - Split Expenses. Stay Friends. 💸

> **Web App quản lý và chia sẻ chi phí nhóm** thông minh, minh bạch và sòng phẳng dành cho các hoạt động du lịch, ăn uống, cà phê, tiệc tùng, team building và sinh hoạt nhóm.

---

## 🌟 Điểm nổi bật & Triết lý thiết kế

SplitMate được thiết kế theo đúng bài toán thực tế:
- **1 Chuyến đi (Trip) có nhiều thành viên (Members)**.
- **Nhiều khoản chi (Expenses)** diễn ra liên tục (tiền xe, khách sạn, ăn trưa, cà phê, vé tham quan...).
- **Mỗi khoản chi do một thành viên khác nhau thanh toán** (không cố định người tạo).
- **Mỗi khoản chi có danh sách người sử dụng riêng** (người không tham gia không phải trả).
- **Hỗ trợ cả Chia đều (Equal Split) và Chia tùy chỉnh (Custom Split)**.
- **Tổng kết toàn cầu (Global Calculation)**:
  - $\sum \text{Paid} = \text{Total Expense}$
  - $\sum \text{Owed} = \text{Total Expense}$
  - $\sum \text{Balance} = 0$ (Định luật bất biến bảo toàn tài chính)
- **Tối ưu hóa công nợ (Settlement Optimization)**:
  - Thuật toán Greedily Debt Minimization (Rút gọn tối đa số lượng giao dịch chuyển khoản).
  - Tự động sinh mã **VietQR** chuẩn ngân hàng Việt Nam kèm số tiền và nội dung chuyển khoản.
  - Quy trình 2 bước: Người chuyển bấm **"Đã thanh toán (Mark as Paid)"** $\rightarrow$ Người nhận kiểm tra tài khoản và bấm **"Xác nhận đã nhận (Confirm Payment)"** $\rightarrow$ Trạng thái **Đã tất toán (CONFIRMED)**.

---

## 🏗️ Kiến trúc & Công nghệ

### Frontend (`client/`)
- **React.js 18** + **Vite**
- **Tailwind CSS** (Modern Finance SaaS UI, Clean, Responsive)
- **React Router v6**
- **Axios** (kèm interceptor tự động đính kèm token xác thực)
- **Firebase SDK** (Authentication, Firestore, Storage)
- **Lucide React** (Bộ icon trực quan cao cấp)
- **Canvas Confetti** (Hiệu ứng chúc mừng khi hoàn tất tất toán)

### Backend (`server/`)
- **Node.js** + **Express.js** (RESTful API)
- **Firebase Admin SDK** (Xác thực token người dùng)
- **Calculation Service** (`calculationService.js`): Đảm bảo tính toán công nợ và kiểm tra invariant.
- **Settlement Service** (`settlementService.js`): Tối ưu hóa chuỗi giao dịch và sinh link VietQR (`vietqr.io`).
- **Store Service** (`dbService.js`): Hỗ trợ chạy Dual-mode (kết nối Firestore khi có cấu hình, hoặc lưu trữ JSON store tự động khi chưa cấu hình Firebase).

---

## 🚀 Hướng dẫn khởi chạy

### 1. Khởi động Backend Server
```bash
cd server
npm install
npm run dev
# Server chạy tại: http://localhost:5000 (Health check: http://localhost:5000/api/health)
```

### 2. Khởi động Frontend Client
```bash
cd client
npm install
npm run dev
# Mở trình duyệt tại: http://localhost:5173
```

---

## 📱 Dữ liệu mẫu khởi tạo sẵn để test ngay

Hệ thống đã có sẵn kịch bản mẫu **Đà Lạt 3 ngày 2 đêm** (Trip Code: **`DL26A8`**) với 5 thành viên:
1. **Nguyễn Văn A** (Creator, VCB)
2. **Trần Thị B** (Member, MB Bank)
3. **Lê Văn C** (Member, Techcombank)
4. **Phạm Minh D** (Member, ACB)
5. **Hoàng Thị E** (Member, VPBank)

> **Mẹo:** Trên thanh điều hướng Navbar trên cùng có sẵn thanh **Chuyển đổi người dùng nhanh (Quick User Switcher)** để bạn dễ dàng đóng vai A, B, C, D hoặc E kiểm tra luồng thanh toán và xác nhận tiền mà không cần mở nhiều trình duyệt khác nhau!
