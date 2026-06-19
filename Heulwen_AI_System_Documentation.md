# TÀI LIỆU TỔNG HỢP TOÀN BỘ HỆ THỐNG TƯ VẤN TUYỂN SINH HEULWEN AI

Tài liệu này tổng hợp chi tiết cấu trúc phần mềm, kiến trúc hệ thống, cơ cấu cơ sở dữ liệu, các tính năng của từng phân hệ người dùng và các cơ chế bảo mật/chống spam của **Hệ thống tư vấn tuyển sinh tích hợp Trí tuệ nhân tạo Heulwen AI cho Trường Đại học Vinh**.

---

## I. TỔNG QUAN HỆ THỐNG
* **Tên hệ thống**: Cổng thông tin & Tư vấn tuyển sinh thông minh Heulwen AI.
* **Mục tiêu**: Tự động hóa 90% công việc tư vấn tuyển sinh thông qua trợ lý ảo AI (sử dụng Mô hình ngôn ngữ lớn LLM kết hợp cơ chế lấy dữ liệu nền tảng RAG), cung cấp các công cụ định hướng nghề nghiệp (Trắc nghiệm tính cách Holland AI) và đánh giá cơ hội trúng tuyển (Đánh giá học bạ số AI), đồng thời cung cấp cổng chat trực tiếp thời gian thực kết nối thí sinh với cán bộ tuyển sinh khi cần thiết.

---

## II. CÔNG NGHỆ & KIẾN TRÚC (TECH STACK)

### 1. Phân hệ Giao diện (Frontend)
* **Framework chính**: React.js phiên bản mới nhất (biên dịch bằng Vite để tối ưu hóa thời gian tải trang).
* **Định dạng giao diện (Styling)**: Tailwind CSS cho giao diện thích ứng (Responsive) trên cả điện thoại, máy tính bảng và máy tính cá nhân.
* **Hiệu ứng đồ họa**: Framer Motion (tạo chuyển động và chuyển trang mượt mà), Lucide Icons (bộ icon tối giản hiện đại).
* **Vẽ đồ thị chuyên dụng**: Recharts (vẽ biểu đồ Radar cho Holland RIASEC, biểu đồ Cột và biểu đồ Tròn cho Dashboard quản trị).

### 2. Phân hệ Máy chủ (Backend)
* **Ngôn ngữ phát triển**: Node.js được viết dưới dạng TypeScript nghiêm ngặt, biên dịch an toàn dữ liệu.
* **Bộ khung máy chủ (Framework)**: Express.js cung cấp các dịch vụ API RESTful.
* **Giao tiếp thời gian thực (Real-time Communication)**: WebSocket (Socket.io) phục vụ luồng chat trực tiếp giữa Thí sinh và Cán bộ hỗ trợ với độ trễ dưới 200ms.

### 3. Phân hệ Trí tuệ nhân tạo (AI & LLM)
* **Mô hình AI**: Google Gemini Pro (sử dụng SDK chính thức của Google Gen AI).
* **Cơ chế hoạt động**:
  * **Kỹ nghệ gợi ý (Prompt Engineering)**: Thiết lập cấu trúc hệ thống yêu cầu AI đóng vai là "Trợ lý tuyển sinh chính thức của Trường Đại học Vinh", chỉ trả lời các thông tin liên quan tuyển sinh và từ chối các câu hỏi ngoài lề.
  * **Cơ chế RAG (Retrieval-Augmented Generation)**: Lấy dữ liệu trực tiếp từ các file cơ sở dữ liệu nội bộ (`faqs.json`, `majors.json`, `documents.json`) làm dữ liệu nền tảng (grounding data) để đưa vào ngữ cảnh của câu lệnh gửi lên Gemini, đảm bảo AI trả lời chính xác thông tin ngành học, chỉ tiêu, điểm chuẩn và học phí của Đại học Vinh, hạn chế tối đa hiện tượng ảo giác (hallucination).

### 4. Cơ sở dữ liệu (Local Database)
Hệ thống sử dụng cơ sở dữ liệu dạng tài liệu JSON cục bộ để tối ưu hóa tốc độ đọc ghi, dễ dàng sao lưu và thích ứng nhanh với các truy vấn của AI Agent.

---

## III. CƠ CẤU CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

### 1. Bảng Tài khoản (`users.json`)
Lưu trữ thông tin người dùng được xác thực qua Google OAuth (đăng nhập bằng Google):
* `id` (string): ID duy nhất của tài khoản.
* `email` (string): Địa chỉ email.
* `name` (string): Họ và tên hiển thị.
* `avatar` (string): Đường dẫn ảnh đại diện.
* `role` (enum): Quyền hạn tài khoản (`"student"`, `"staff"`, `"admin"`).
* `status` (string): Trạng thái hoạt động (`"active"`, `"blocked"`).

### 2. Bảng Danh mục ngành học (`majors.json`)
Lưu trữ thông tin chi tiết của hơn 50 ngành đào tạo tại Trường Đại học Vinh:
* `id` (string): Mã định danh ngành học.
* `code` (string): Mã ngành đào tạo chính thức (ví dụ: `7480201`).
* `name` (string): Tên ngành đào tạo (ví dụ: `Công nghệ thông tin`).
* `faculty` (string): Khoa/Viện quản lý (ví dụ: `Viện Kỹ thuật và Công nghệ`).
* `category` (string): Nhóm ngành tuyển sinh (ví dụ: `Kỹ thuật - Công nghệ`).
* `quota` (number): Chỉ tiêu tuyển sinh của năm tuyển sinh hiện tại.
* `tuition_per_year` (number): Học phí ước tính mỗi năm (VND).
* `admission_groups` (array of strings): Tổ hợp môn xét tuyển (ví dụ: `["A00", "A01", "D01"]`).
* `score_2024` (number): Điểm chuẩn theo phương thức xét điểm thi THPT của năm gần nhất (năm 2025).
* `score_2023` (number): Điểm chuẩn theo phương thức xét học bạ của năm gần nhất (năm 2025).
* `is_active` (boolean): Trạng thái hiển thị tuyển sinh.

### 3. Bảng Câu hỏi thường gặp (`faqs.json`)
Dùng để tra cứu nhanh câu hỏi thường gặp và huấn luyện dữ liệu RAG cho AI Chatbot:
* `id` (string): ID câu hỏi.
* `question` (string): Nội dung câu hỏi của thí sinh.
* `answer` (string): Nội dung phản hồi chính thức của nhà trường.
* `is_active` (boolean): Trạng thái hoạt động.

### 4. Bảng Bài viết tin tức (`posts.json`)
Lưu trữ các bài viết cập nhật quy chế, tin tức và cẩm nang tuyển sinh:
* `id` (string): ID bài viết.
* `title` (string): Tiêu đề bài viết.
* `content` (string): Nội dung bài viết (hỗ trợ định dạng Rich Text/Markdown).
* `author` (string): Tên người viết/cán bộ đăng bài.
* `created_at` (string): Ngày giờ đăng tải bài viết.

### 5. Bảng Trò chuyện trực tuyến (`live_chats.json`)
Lưu trữ thông tin các cuộc hội thoại trực tiếp giữa thí sinh và cán bộ hỗ trợ:
* `id` (string): ID cuộc trò chuyện (thường lấy trùng với ID người dùng).
* `user_name` (string): Tên thí sinh yêu cầu hỗ trợ.
* `email` (string): Email thí sinh.
* `status` (enum): Trạng thái phiên hỗ trợ (`"open"`, `"resolved"`).
* `messages` (array of objects): Nội dung các tin nhắn trao đổi trong phiên:
  * `id` (string): ID tin nhắn.
  * `sender_id` (string): ID người gửi.
  * `sender_name` (string): Tên người gửi.
  * `content` (string): Nội dung tin nhắn.
  * `timestamp` (string): Thời điểm gửi tin.
* `created_at` (string): Thời điểm mở phiên chat.

---

## IV. CÁC PHÂN HỆ VÀ TÍNH NĂNG CHI TIẾT

### 1. Phân hệ Thí sinh vãng lai (Guest - Chưa đăng nhập)
* **Tra cứu ngành học**: Tìm kiếm, lọc ngành đào tạo theo từ khóa (Tên ngành, Mã ngành, Khoa/Viện) hoặc theo nhóm ngành. Xem chi tiết chỉ tiêu, học phí, tổ hợp xét tuyển và điểm chuẩn của 2 phương thức xét tuyển (THPT và Học bạ).
* **Xem tin tức**: Đọc các bài viết cẩm nang tuyển sinh, quy chế xét tuyển mới nhất.
* **Hỏi đáp AI Chatbot**: Chat trực tiếp với trợ lý ảo Heulwen AI ở góc màn hình để hỏi các câu hỏi chung (ví dụ: học phí ngành CNTT là bao nhiêu, ký túc xá thế nào, các mốc thời gian nộp hồ sơ).

### 2. Phân hệ Thí sinh đăng nhập (Student - Xác thực qua Google)
Bao gồm tất cả các tính năng của khách vãng lai, cộng thêm các công cụ hướng nghiệp AI chuyên sâu:
* **Trắc nghiệm tính cách Holland AI**:
  * Trả lời 18 câu hỏi trắc nghiệm hành vi/sở thích.
  * Hệ thống tự động phân tích và tính điểm cho 6 nhóm tính cách RIASEC (Kỹ thuật, Nghiên cứu, Nghệ thuật, Xã hội, Quản lý, Nghiệp vụ).
  * Hiển thị biểu đồ mạng nhện (Radar Chart) mô tả trực quan cơ cấu tính cách.
  * Gửi mã RIASEC sang Gemini AI để phân tích chuyên sâu tính cách, gợi ý các công việc phù hợp ngoài thực tế và gợi mở các ngành học cụ thể tương ứng tại Trường Đại học Vinh.
* **Đánh giá cơ hội đỗ (Học bạ số & Điểm THPT dự phóng)**:
  * Thí sinh nhập điểm trung bình xét tuyển (Học bạ) hoặc điểm thi thử/dự phóng (THPT) và tổ hợp xét môn.
  * Hệ thống tự động đối chiếu dữ liệu điểm chuẩn năm 2025 (`score_2024` và `score_2023`).
  * AI đưa ra đánh giá cơ hội đỗ/trượt theo tỷ lệ phần trăm (Rất cao, Khá cao, Trung bình, Thấp) kèm theo những lời khuyên hữu ích để tăng cơ hội trúng tuyển.
* **Trò chuyện trực tiếp với Cán bộ hỗ trợ (Live Chat)**:
  * Khi AI Chatbot không thể trả lời các câu hỏi quá chuyên biệt, thí sinh có thể gửi yêu cầu hỗ trợ trực tiếp.
  * Hệ thống kết nối thời gian thực qua WebSocket với Cán bộ tư vấn đang trực tuyến.

### 3. Phân hệ Cán bộ hỗ trợ (Staff)
* **Hàng đợi yêu cầu**: Xem danh sách các học sinh đang gửi yêu cầu trò chuyện trực tiếp (các phiên chat có trạng thái `"open"`).
* **Tư vấn trực tiếp**: Nhận phòng chat và nhắn tin thời gian thực để hỗ trợ, giải đáp cho thí sinh. Nhấn nút "Hoàn thành" để chuyển trạng thái phiên chat sang `"resolved"`.

### 4. Phân hệ Quản trị viên (Admin)
Cung cấp bảng điều khiển toàn diện để quản trị nội dung cổng thông tin:
* **Dashboard thống kê**: 
  * Xem nhanh số lượng ngành học đang hoạt động, số lượng câu hỏi FAQs, bài viết tin tức.
  * Biểu đồ Recharts 1: Biểu đồ Cột biểu diễn chỉ tiêu tuyển sinh của 10 ngành học hàng đầu (có hiệu ứng hover tooltip hiển thị đầy đủ tên ngành).
  * Biểu đồ Recharts 2: Biểu đồ Tròn biểu diễn tỷ lệ phân bổ số lượng ngành học theo các khối khoa học đào tạo.
* **Quản trị Ngành học**: CRUD (Xem, thêm, sửa, xóa) danh mục ngành đào tạo, cập nhật chỉ tiêu, học phí và điểm chuẩn qua form nhập liệu.
* **Quản trị FAQs**: CRUD danh sách câu hỏi thường gặp. Dữ liệu này tự động cập nhật ngay lập tức vào file huấn luyện RAG cho AI.
* **Quản trị Bài viết**: Đăng tải, chỉnh sửa, xóa các bài viết tin tức tuyển sinh.
* **Phân quyền người dùng**: Quản lý tài khoản, thay đổi quyền hạn (Admin/Staff/Student) và khóa/mở khóa tài khoản.

---

## V. CƠ CHẾ AN TOÀN, BẢO MẬT & CHỐNG SPAM

Để hệ thống hoạt động ổn định như một ứng dụng chính thức đã publish, các cơ chế kiểm duyệt dữ liệu đã được triển khai chặt chẽ ở cả Frontend và Backend:

### 1. Khóa tính năng nâng cao (Login Gates)
* Các tính năng phân tích dữ liệu AI nâng cao (Trắc nghiệm Holland AI và Đánh giá học bạ số) được bảo vệ bằng Cổng đăng nhập (Login Gate).
* Nếu người dùng chưa đăng nhập, giao diện sẽ bị khóa lại bằng một màn hình phủ mờ (glassmorphism) thiết kế sang trọng, hiển thị icon ổ khóa động, liệt kê các đặc quyền thành viên và nút đăng nhập qua Google để kích hoạt.

### 2. Bộ lọc Spam & Tin nhắn rác
Áp dụng cho cả AI Chatbot và Live Chat để ngăn chặn phá hoại hệ thống:
* **Giới hạn tần suất gửi tin (Rate Limit)**: Mỗi IP/tài khoản chỉ được gửi tối đa 1 tin nhắn trong vòng 1.0 giây. Nếu gửi nhanh hơn, tin nhắn sẽ bị chặn.
* **Chặn tin nhắn trùng lặp**: Hệ thống chặn hoàn toàn các tin nhắn có nội dung trùng lặp hoàn toàn được gửi liên tiếp trong vòng 10 giây.
* **Giới hạn độ dài**: Giới hạn độ dài tối đa của một tin nhắn chat là 1500 ký tự để tránh gây quá tải bộ nhớ xử lý của AI.

### 3. Kiểm duyệt nội dung nhạy cảm
Hệ thống tự động phân tích tin nhắn trước khi gửi lên AI hoặc chuyển đến Cán bộ:
* **Chặn từ ngữ nhạy cảm**: Chặn các từ ngữ tục tĩu, chửi thề, các từ nhạy cảm về chính trị, tôn giáo, các hành vi bất hợp pháp hoặc các nội dung quấy phá ngoài luồng tuyển sinh.
* **Cảnh báo trực quan**: Nếu thí sinh cố tình gửi tin nhắn vi phạm bộ lọc nhạy cảm, tin nhắn sẽ bị chặn ngay ở Backend. Giao diện Frontend sẽ lập tức hiển thị một tin nhắn cảnh báo màu đỏ với người gửi là `"Hệ thống"` để răn đe người dùng.
