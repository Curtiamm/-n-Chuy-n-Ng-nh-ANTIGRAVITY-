# Hướng dẫn triển khai Website Tuyển sinh & Chatbot AI bằng PHP trên localhost (XAMPP)

Thư mục này chứa toàn bộ mã nguồn PHP để chạy hệ thống tuyển sinh trường Đại học Vinh offline trên máy tính của bạn bằng **XAMPP (Apache + PHP & Mock JSON Database)**.

## 📋 Các file bao gồm:
1. **`index.php`**: Giao diện tuyển sinh responsive cực kì đẹp mắt, tích hợp thông tin ngành đào tạo, form đăng ký và ô chat tư vấn 24/7.
2. **`chatbot.php`**: Server xử lý Chatbot AI bằng PHP. Thực hiện kết nối trực tiếp đến API Gemini bằng thư viện PHP cURL cực kì nhẹ và mượt mà.
3. **`register.php`**: Xử lý nhận đăng ký nguyện vọng trực tuyến và tải lên minh chứng Học bạ từ học sinh, tự động ghi vào cơ sở dữ liệu `registrations.json` và kích hoạt hàm gửi mail thông báo.
4. **`registrations.json`**: Cơ sở dữ liệu lưu trữ danh sách thí sinh đăng ký dạng JSON gọn nhẹ, tốc độ cao.

---

## 🚀 Hướng dẫn 5 bước cài đặt nhanh:

### Bước 1: Tải và cài đặt phần mềm XAMPP
Nếu chưa cài đặt, em hãy tải XAMPP tại trang chủ chính thức: `https://www.apachefriends.org/download.html`. Chọn phiên bản chạy PHP mới nhất.

### Bước 2: Tạo thư mục chứa và copy code
1. Khởi chạy XAMPP và truy cập vào thư mục lưu trữ web cục bộ:
   - Trên Windows: `C:\xampp\htdocs\`
   - Trên macOS: `/Applications/XAMPP/htdocs/`
2. Tạo một thư mục mới đặt tên là `vinhuni-ts`.
3. Copy toàn bộ các tệp tin trong mục này (`index.php`, `chatbot.php`, `register.php`, `registrations.json`) dán trực tiếp vào thư mục `vinhuni-ts` vừa tạo.

### Bước 3: Cấu hình Khóa API Gemini
1. Mở file `chatbot.php` bằng phần mềm soạn thảo văn bản (Notepad, VS Code, v.v.).
2. Tìm dòng số 18 và thay thế giá trị API Key của em:
   ```php
   $apiKey = "YOUR_GEMINI_API_KEY_HERE";
   ```
3. Nhấn lưu (Ctrl+S) lại file.

### Bước 4: Khởi động Server XAMPP
1. Mở ứng dụng **XAMPP Control Panel** lên.
2. Nhấn nút **Start** tại dòng **Apache** (Cổng mặc định là 80 hoặc 8080).

### Bước 5: Kiểm nghiệm trên trình duyệt
1. Mở thiết bị trình duyệt yêu thích của em (Chrome, Edge, Firefox).
2. Gõ đường dẫn: `http://localhost/vinhuni-ts/index.php`.
Giao diện tráng lệ của Website tuyển sinh Đại học Vinh cùng khung chatbot AI sẽ hiển thị lập tức! Em đã sẵn sàng để chat, đăng ký tuyển sinh offline ngay trên máy tính của mình.
