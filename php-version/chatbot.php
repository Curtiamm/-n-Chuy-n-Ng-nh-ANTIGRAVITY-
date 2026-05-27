<?php
/**
 * TRÌNH GỌI CHATBOT AI BẰNG PHP THUẦN (XAMMP COMPATIBLE)
 * Sử dụng cURL để gọi API Gemini 3.5 Flash hoặc Gemini 2.5 thế hệ mới
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Chỉ chấp nhận phương thức gửi POST']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$userMessage = $input['message'] ?? '';

if (empty(trim($userMessage))) {
    echo json_encode(['error' => 'Nội dung câu hỏi của em bị trống. Hãy đặt câu hỏi bất kì nhé!']);
    exit;
}

// ==========================================
// ĐIỀN KHÓA GEMINI API CHÍNH THỨC CỦA EM Ở ĐÂY
// ==========================================
$apiKey = getenv('GEMINI_API_KEY') ?: "YOUR_GEMINI_API_KEY_HERE"; 

if ($apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    // Thử lấy từ tham số cấu hình hoặc biến toàn cục
    $apiKey = "AIzaSy" . "..." . "YOUR_REAL_KEY"; // Nhập API Key chính thức của bạn khi sử dụng
}

// Sử dụng model gemini-2.5-flash để đảm bảo tương thích & phản hồi cực nhanh
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey;

// Chỉ thị huấn luyện chi tiết cho chatbot về Đại học Vinh
$systemInstruction = "Bạn là Trợ lý Tuyển sinh AI Vinh Uni cực kì đáng tin cậy của Trường Đại học Vinh.\n" .
                     "Thông tin cơ bản về trường:\n" .
                     "- Địa chỉ: 182 Lê Duẩn, Thành Phố Vinh, tỉnh Nghệ An.\n" .
                     "- Hotline liên hệ: 0238.3855.452. Email: tuyensinh@vinhuni.edu.vn.\n" .
                     "- Quy mô: Khối trường đào tạo đa ngành hàng đầu miền Trung Việt Nam.\n\n" .
                     "Thông tin các nhóm đào tạo trọng điểm năm 2026:\n" .
                     "1. Nhóm ngành Công nghệ (CNTT, Kỹ thuật số, Vi điều khiển, Kỹ thuật Robot)\n" .
                     "   - Điểm chuẩn Học bạ 2025: 22.0 điểm. Tổ hợp: A00, A01, D01.\n" .
                     "   - Chỉ tiêu tuyển sinh: 250 sinh viên.\n" .
                     "2. Nhóm ngành Sư phạm (Sư phạm Toán, Sư phạm Lý, Sư phạm Ngữ Văn, Tiểu học)\n" .
                     "   - Điểm chuẩn Học bạ 2025: Từ 24.5 đến 27.5 điểm.\n" .
                     "   - Điểm cộng vượt trội: Được nhận hỗ trợ tiền ăn, tiền sinh hoạt theo Nghị định 116 (miễn 100% học phí).\n" .
                     "3. Nhóm ngành Kinh tế & Luật (Luật Kinh Tế, Quản Trị Kinh Doanh, Tài Chính Ngân Hàng)\n" .
                     "   - Điểm chuẩn Học bạ 2025: 20.5 điểm.\n" .
                     "4. Khối Ngoại ngữ (Ngôn ngữ Anh, Ngôn ngữ Trung Quốc)\n" .
                     "   - Điểm học bạ: 21.0 điểm.\n\n" .
                     "Các chương trình Học bổng nổi bật tại Vinh Uni:\n" .
                     "- Học bổng Thủ khoa xét tuyển: Miễn 100% học phí cho toàn khóa học 4 năm đối với học sinh đỗ điểm cao nhất các khối.\n" .
                     "- Học bổng Ưu đãi tài năng miền Trung: Tặng 10.000.000đ học kì đầu tiên cho học sinh đại học đạt IELTS >= 6.5.\n" .
                     "- Khuyến khích học thuật: Trao học bổng kì tới dựa trên điểm GPA xuất sắc của sinh viên hàng năm.\n\n" .
                     "Nguyên tắc trả lời:\n" .
                     "1. Luôn chào học sinh thân mật bằng danh xưng: 'Em', 'Sĩ tử', 'Tân sinh viên', xưng hô mình là 'Chị Trợ lý AI'.\n" .
                     "2. Trả lời súc tích, trình bày rõ ràng có gạch đầu dòng.\n" .
                     "3. Khuyến khích học bạ nộp hồ sơ bằng cách bổ sung tệp học bạ ngay trên khung web tuyển sinh trực tuyến.\n" .
                     "4. Khi thông tin không chắc chắn, hướng dẫn học sinh gọi Hotline 0238.3855.452.";

$payload = [
    "contents" => [
        [
            "role" => "user",
            "parts" => [
                ["text" => "Chỉ thị bổ trợ: " . $systemInstruction],
                ["text" => "Câu hỏi từ sĩ tử: " . $userMessage]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.5,
        "maxOutputTokens" => 800
    ]
];

// Khởi tạo cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Bỏ qua xác thực SSL để chạy mượt mà trên môi trường Windows localhost

$response = curl_exec($ch);

if (curl_errno($ch)) {
    $errorMsg = curl_error($ch);
    echo json_encode([
        'reply' => "Chào sĩ tử! Chị AI rất tiếc vì máy chủ XAMPP chưa gọi được API Google: {$errorMsg}. Hãy đảm bảo máy tính của em đã bật mạng Internet đầy đủ nha!"
    ]);
    curl_close($ch);
    exit;
}

curl_close($ch);

$responseData = json_decode($response, true);

// Parse response JSON từ server Google
if (isset($responseData['candidates'][0]['content']['parts'][0]['text'])) {
    $botReply = $responseData['candidates'][0]['content']['parts'][0]['text'];
    echo json_encode(['reply' => $botReply]);
} else if (isset($responseData['error']['message'])) {
    $errorDetail = $responseData['error']['message'];
    echo json_encode([
        'reply' => "Chào em, kết nối API thất bại do báo lỗi từ Google: '{$errorDetail}'. Hãy cấu hình khóa Api dán vào file chatbot.php dòng 18 nha!"
    ]);
} else {
    echo json_encode([
        'reply' => "Chào em! Chị đã nhận được thông điệp, tuy nhiên em cần cấu hình lại Khóa API cá nhân dán vào dòng 18 file chatbot.php trong thư mục XAMPP htdocs thì chị mới có thể truy cập hệ cơ sở tri thức của Google để tư vấn em tự động 24/7 được nha."
    ]);
}
?>
