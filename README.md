# Cổng Thông Tin & Tư Vấn Tuyển Sinh Thông Minh Heulwen AI

> **Đồ án Chuyên ngành:** Nghiên cứu và xây dựng Cổng thông tin & Tư vấn tuyển sinh tích hợp Trí tuệ nhân tạo (Heulwen AI) cho Trường Đại học Vinh.

Heulwen AI là giải pháp tự động hóa lên tới 90% công việc tư vấn tuyển sinh thông qua trợ lý ảo AI thông minh, sử dụng Mô hình ngôn ngữ lớn (LLM) kết hợp cơ chế RAG (Retrieval-Augmented Generation) lấy dữ liệu grounding trực tiếp từ các tài liệu nội bộ của nhà trường. Đồng thời, hệ thống tích hợp các công cụ định hướng nghề nghiệp (Trắc nghiệm tính cách Holland AI), đánh giá cơ hội trúng tuyển học bạ và cổng chat trực tuyến thời gian thực (Real-time Live Chat) giữa thí sinh và cán bộ hỗ trợ.

---

## 🌟 Tính Năng Nổi Bật

### 1. Phân Hệ Thí Sinh (Chưa Đăng Nhập / Khách Vãng Lai)
* **Tra cứu ngành học**: Tìm kiếm, lọc ngành đào tạo theo mã ngành, tên ngành, khoa/viện và xem chi tiết chỉ tiêu, học phí, tổ hợp môn, điểm chuẩn của các năm trước.
* **Xem tin tức & quy chế**: Xem các bài viết cẩm nang tuyển sinh, quy chế xét tuyển mới nhất của nhà trường.
* **Heulwen AI Chatbot**: Trợ lý ảo tư vấn thông tin tuyển sinh chung (học phí, ký túc xá, mốc thời gian nộp hồ sơ...) hoạt động 24/7.

### 2. Phân Hệ Thí Sinh Đăng Nhập (Student - Xác thực qua Google OAuth)
* **Trắc Nghiệm Tính Cách Holland AI**: 
  * Trả lời bộ câu hỏi trắc nghiệm hành vi/sở thích để xác định mã tính cách RIASEC.
  * Hiển thị trực quan kết quả bằng biểu đồ mạng nhện (**Radar Chart** từ Recharts).
  * Gửi mã kết quả sang Gemini AI để phân tích chuyên sâu tính cách, gợi ý công việc thực tế và đề xuất các ngành đào tạo tương ứng tại Trường Đại học Vinh.
* **Đánh Giá Học Bạ Số AI**:
  * Thí sinh nhập điểm trung bình xét tuyển và tổ hợp môn.
  * Hệ thống tự động đối chiếu với điểm chuẩn của các năm gần nhất.
  * Trợ lý ảo AI phân tích và đưa ra tỷ lệ phần trăm cơ hội đỗ kèm lời khuyên tối ưu hóa hồ sơ.
* **Hỗ Trợ Trực Tuyến (Live Chat)**: Kết nối trực tiếp thời gian thực qua WebSocket với cán bộ tuyển sinh khi AI không thể phản hồi câu hỏi chuyên sâu.

### 3. Phân Hệ Cán Bộ Tư Vấn (Staff)
* **Hàng đợi yêu cầu**: Quản lý danh sách thí sinh đang cần hỗ trợ trực tiếp.
* **Chat thời gian thực**: Tiếp nhận phòng chat và trao đổi trực tiếp với thí sinh thông qua giao diện Socket.io mượt mà.

### 4. Phân Hệ Quản Trị Viên (Admin)
* **Bảng điều khiển thống kê (Dashboard)**: Thống kê chỉ tiêu tuyển sinh (Biểu đồ Cột) và cơ cấu phân bổ ngành học (Biểu đồ Tròn) sử dụng thư viện Recharts.
* **Quản lý dữ liệu**: 
  * CRUD ngành học, chỉ tiêu tuyển sinh, học phí và tổ hợp xét tuyển.
  * CRUD ngân hàng câu hỏi thường gặp (FAQs) - Dữ liệu này tự động cập nhật làm nguồn tri thức RAG cho AI.
  * Quản lý bài viết tin tức, cẩm nang tuyển sinh.
* **Quản trị người dùng**: Quản lý tài khoản, phân quyền (Admin, Staff, Student) và khóa/mở khóa tài khoản.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Giao Diện (Frontend)
* **Core**: React.js (Vite)
* **Styling**: Tailwind CSS, Framer Motion (hiệu ứng mượt mà), Lucide Icons (bộ icon hiện đại)
* **Biểu đồ**: Recharts (vẽ biểu đồ Radar, Bar và Pie)
* **Xác thực**: Google OAuth (`@react-oauth/google`)

### Máy Chủ (Backend)
* **Ngôn ngữ**: Node.js & TypeScript (tsx)
* **Web Framework**: Express.js
* **Thời gian thực**: WebSocket (Socket.io)
* **Gửi mail**: Nodemailer
* **Trình biên dịch**: esbuild

### Trí Tuệ Nhân Tạo (AI & LLM)
* **LLM**: Google Gemini Pro (Sử dụng SDK `@google/genai` chính thức)
* **Cơ chế RAG**: Trích xuất dữ liệu grounding từ các tệp cơ sở dữ liệu nội bộ (`faqs.json`, `majors.json`, `documents.json`) để đưa vào ngữ cảnh Prompt, triệt tiêu hiện tượng ảo giác (hallucination) của AI.

---

## 🔒 Cơ Chế Bảo Mật & Chống Spam

Để đảm bảo hệ thống vận hành ổn định và chống phá hoại, các cơ chế sau đã được thiết lập:
1. **Login Gates (Cổng đăng nhập)**: Khóa các tính năng AI nâng cao (Holland test, Đánh giá học bạ) bằng màn hình phủ mờ (glassmorphism) sang trọng. Chỉ thí sinh đã xác thực qua Google mới có thể kích hoạt sử dụng.
2. **Rate Limit & Chặn trùng lặp**: Giới hạn tần suất gửi tin nhắn (tối đa 1 tin nhắn/giây) và chặn tin nhắn trùng lặp hoàn toàn trong vòng 10 giây.
3. **Giới hạn ký tự**: Tin nhắn chat giới hạn tối đa 1500 ký tự.
4. **Kiểm duyệt nội dung nhạy cảm**: Tự động lọc các từ ngữ tục tĩu, nội dung quấy phá ở Backend và hiển thị cảnh báo đỏ trực quan ở Frontend nếu vi phạm.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
├── assets/                     # Các file hình ảnh và tài nguyên tĩnh
├── uploads/                    # Thư mục lưu file upload tạm thời (được ignore)
├── src/
│   ├── components/
│   │   ├── admin/              # Component quản trị (FAQList, MajorForm, LiveChatTab...)
│   │   ├── chat/               # Heulwen AI Chatbot giao diện chính
│   │   ├── home/               # HeroSection, FeaturedSection...
│   │   ├── layout/             # Navbar, Footer, SmartSearchModal...
│   │   └── majors/             # Hiển thị thông tin ngành học
│   ├── pages/                  # Các trang chính (Home, Admin, Majors, FAQ, Recommendation...)
│   ├── App.jsx                 # Cấu hình routing và render chính
│   └── index.css               # Thiết lập CSS hệ thống và Tailwind CSS
├── server.ts                   # Source code Backend Express & Socket.io server
├── tsconfig.json               # Cấu hình TypeScript
├── vite.config.ts              # Cấu hình Vite bundler
├── tailwind.config.js          # Cấu hình Tailwind CSS
├── package.json                # Dependencies và run scripts
├── .env.example                # File mẫu chứa danh sách biến môi trường
└── .gitignore                  # Cấu hình bỏ qua các file nhạy cảm và build files
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### Yêu Cầu Hệ Thống
* Đã cài đặt **Node.js** (Khuyến nghị phiên bản LTS mới nhất).

### Các Bước Cài Đặt

1. **Clone repository và di chuyển vào thư mục dự án:**
   ```bash
   git clone <repository_url>
   cd <repository_name>
   ```

2. **Cài đặt các gói phụ thuộc (dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường:**
   * Tạo tệp `.env.local` ở thư mục gốc của dự án (tệp này đã được cấu hình trong `.gitignore` để tránh bị đẩy lên GitHub làm lộ thông tin nhạy cảm).
   * Sao chép nội dung từ `.env.example` và điền đầy đủ các thông tin API keys của bạn:
     ```env
     # API Key của Google Gemini
     GEMINI_API_KEY="KEY_CỦA_BẠN"

     # URL ứng dụng
     APP_URL="http://localhost:5173"

     # Client ID Google OAuth để đăng nhập
     VITE_GOOGLE_CLIENT_ID="CLIENT_ID_CỦA_BẠN"

     # Kênh nhận thông báo (email, pushover, web)
     NOTIFICATION_PROVIDERS="email,web"

     # SMTP dùng gửi email thông báo (ví dụ Gmail App Password)
     SMTP_HOST="smtp.gmail.com"
     SMTP_PORT=587
     SMTP_USER="email_nhan_thong_bao@gmail.com"
     SMTP_PASS="mat_khau_app_gmail"
     ```

4. **Chạy ứng dụng ở chế độ phát triển (Development):**
   ```bash
   npm run dev
   ```
   * *Ứng dụng Frontend và API Backend sẽ được khởi chạy song song qua tiến trình `tsx watch server.ts`.*
   * Truy cập giao diện tại: `http://localhost:5173`.

5. **Build cho môi trường Production:**
   ```bash
   npm run build
   ```
   * *Lệnh này sẽ build giao diện React qua thư mục `dist` và đóng gói file server TypeScript thành một file Node.js duy nhất tại `dist/server.cjs`.*

6. **Khởi chạy phiên bản Production:**
   ```bash
   npm run start
   ```
