<?php
/**
 * TRÙNG KHỚP HỒ SƠ ĐĂNG KÝ VÀ LƯU TRỮ TRÊN LOCALHOST (XAMPP COMPATIBLE)
 * Nhận thông tin đăng ký nguyện vọng, cho phép đính kèm tệp học bạ, và lưu vào JSON DB.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Chỉ hỗ trợ phương thức POST']);
    exit;
}

$fullName = $_POST['fullName'] ?? '';
$email = $_POST['email'] ?? '';
$phone = $_POST['phone'] ?? '';
$identityCard = $_POST['identityCard'] ?? '';
$highschool = $_POST['highschool'] ?? 'THPT Chưa khai báo';
$selectedMajor = $_POST['selectedMajor'] ?? '';
$method = $_POST['method'] ?? 'academic-record';
$score = isset($_POST['score']) ? floatval($_POST['score']) : 0;

if (empty($fullName) || empty($email) || empty($phone) || empty($identityCard) || empty($selectedMajor)) {
    echo json_encode(['error' => 'Vui lòng cung cấp chính xác và đầy đủ các thông tin bắt buộc (*)']);
    exit;
}

// 1. Quản lý tải lên tệp ảnh học bạ/chứng chỉ
$uploadedFileName = "Chua đính kèm tệp";
$uploadedFileSize = "";

if (isset($_FILES['transcript']) && $_FILES['transcript']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['transcript']['tmp_name'];
    $fileName = $_FILES['transcript']['name'];
    $fileSize = $_FILES['transcript']['size'];
    
    // Tạo folder uploads nếu chưa có
    $uploadFolder = './uploads/';
    if (!is_dir($uploadFolder)) {
        mkdir($uploadFolder, 0777, true);
    }
    
    // Đổi tên file để tránh trùng lặp ký tự tiếng Việt
    $cleanFileName = time() . '_' . preg_replace("/[^a-zA-Z0-9._-]/", "", $fileName);
    $destPath = $uploadFolder . $cleanFileName;
    
    if (move_uploaded_file($fileTmpPath, $destPath)) {
        $uploadedFileName = $fileName;
        $sizeKB = round($fileSize / 1024);
        $uploadedFileSize = $sizeKB > 1024 ? round($sizeKB / 1024, 1) . ' MB' : $sizeKB . ' KB';
    }
}

// 2. Đọc cơ sở dữ liệu JSON
$dbFile = 'registrations.json';
$registrations = [];
if (file_exists($dbFile)) {
    $registrations = json_decode(file_get_contents($dbFile), true) ?: [];
}

$id = 'TS26-' . (count($registrations) + 2001);

// Xử lý nạp dữ liệu hồ sơ mới
$newStudent = [
    'id' => $id,
    'fullName' => $fullName,
    'email' => $email,
    'phone' => $phone,
    'identityCard' => $identityCard,
    'highschool' => $highschool,
    'selectedMajor' => $selectedMajor,
    'method' => $method,
    'score' => $score,
    'status' => 'pending',
    'registeredAt' => date('Y-m-d H:i:s'),
    'documents' => []
];

if ($uploadedFileName !== "Chua đính kèm tệp") {
    $newStudent['documents'][] = [
        'name' => $uploadedFileName,
        'type' => 'transcript',
        'uploadedAt' => date('Y-m-d H:i:s'),
        'size' => $uploadedFileSize
    ];
}

// Thêm vào danh sách và lưu lại file JSON
$registrations[] = $newStudent;
file_put_contents($dbFile, json_encode($registrations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// 3. Tích hợp tính năng gửi Email báo hiệu tự động
// (Sử dụng hàm mail() của PHP, giả lập gửi thật hoặc ghi log hòm thư tự động)
$emailSubject = "[XAC NHAN] Dang ky Nguven Vong Truc Tuyen Vinh Uni - Ma so " . $id;
$emailBody = "Chào em " . $fullName . ",\n\n" .
             "Hội đồng Tuyển sinh Đại học Vinh đã tiếp nhận đơn đăng ký trực tuyến của em:\n" .
             "- Mã hồ sơ tra cứu: " . $id . "\n" .
             "- Ngành học đăng ký: " . $selectedMajor . "\n" .
             "- Phương thức xét: " . ($method === 'academic-record' ? 'Xét Học Bạ Lớp 12' : 'Điểm thi THPT Quốc Gia') . "\n" .
             "- Điểm đăng ký quy đổi: " . $score . "đ\n" .
             "- Tệp đính kèm: " . $uploadedFileName . "\n\n" .
             "Trạng thái hồ sơ của em hiện tại: [ĐANG CHỜ HỘI ĐỒNG PHÊ DUYỆT].\n" .
             "Em có thể tra cứu tiến trình cập nhật hồ sơ bất cứ khi nào bằng cách nhập tên hoặc CCCD của mình tại cổng Tra cứu trên trang web tuyển sinh.\n\n" .
             "Trân trọng cảm ơn em và chúc em may mắn!\n" .
             "Hội Đồng Tuyển Sinh Trường Đại Học Vinh.";

$headers = "From: tuyensinh@vinhuni.edu.vn\r\n" .
           "Reply-To: tuyensinh@vinhuni.edu.vn\r\n" .
           "X-Mailer: PHP/" . phpversion();

// Gửi mail bằng bộ cấu hình PHP mail()
@mail($email, $emailSubject, $emailBody, $headers);

echo json_encode([
    'success' => true,
    'message' => 'Nộp nguyện vọng học tập thành công và ghi cơ sở dữ liệu XAMPP!',
    'registration' => $newStudent,
    'email_simulated_dispatch' => true
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
