import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { VINH_UNI_MAJORS, VINH_UNI_SCHOLARSHIPS, GENERAL_ENROLL_GUIDELINES } from "./src/data/vinhUniData";

// Make sure that file system imports can resolve correctly.
// Note: When compiling with esbuild as bundle, imports are resolved locally.
const PORT = 3000;
const REGISTRATIONS_FILE = path.join(process.cwd(), "registrations.json");

// Define TypeScript interfaces matching registrations.json
interface EmailLog {
  type: string;
  subject: string;
  sentAt: string;
  status: string;
  bodyPreview?: string;
}

interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  identityCard: string;
  highschool: string;
  selectedMajor: string;
  method: string;
  score: number;
  status: string; // "pending" | "accepted" | "approved" | "action_required"
  registeredAt: string;
  emailLogs: EmailLog[];
  documents?: Array<{
    name: string;
    type: string;
    uploadedAt: string;
    size: string;
  }>;
}

// Lazy Initialize Gemini API Client to prevent crash when key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Database Read/Write Utilities
function readRegistrations(): Registration[] {
  try {
    if (!fs.existsSync(REGISTRATIONS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(REGISTRATIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading registrations catalog:", error);
    return [];
  }
}

function writeRegistrations(data: Registration[]): boolean {
  try {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing registrations catalog:", error);
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Get List of Majors
  app.get("/api/majors", (req: Request, res: Response) => {
    res.json(VINH_UNI_MAJORS);
  });

  // 2. Get List of Scholarships
  app.get("/api/scholarships", (req: Request, res: Response) => {
    res.json(VINH_UNI_SCHOLARSHIPS);
  });

  // 3. Get Guidelines
  app.get("/api/guidelines", (req: Request, res: Response) => {
    res.json(GENERAL_ENROLL_GUIDELINES);
  });

  // 4. Seach Admission Registry Card (Tra cứu kết quả xét tuyển)
  app.post("/api/registrations/search", (req: Request, res: Response) => {
    const { keyword } = req.body;
    if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
       res.status(400).json({ error: "Vui lòng nhập họ tên hoặc số CCCD/CMND để tra cứu." });
       return;
    }

    const term = keyword.trim().toLowerCase();
    const students = readRegistrations();
    
    // Find exact or partial matches
    const matches = students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        s.identityCard.includes(term) ||
        s.phone.includes(term) ||
        s.id.toLowerCase() === term
    );

    res.json({ results: matches });
  });

  // 5. Submit Online Wish / Major application Form (Đăng ký nguyện vọng trực tuyến)
  app.post("/api/registrations/register", (req: Request, res: Response) => {
    try {
      const { fullName, email, phone, identityCard, highschool, selectedMajor, method, score } = req.body;

      // Validate inputs
      if (!fullName || !email || !phone || !identityCard || !selectedMajor || !method || score === undefined) {
         res.status(400).json({ error: "Vui lòng điền đầy đủ tất cả thông tin đăng ký bắt buộc." });
         return;
      }

      const major = VINH_UNI_MAJORS.find((m) => m.code === selectedMajor);
      if (!major) {
         res.status(400).json({ error: "Ngành học lựa chọn không tồn tại hệ thống tuyển sinh." });
         return;
      }

      const students = readRegistrations();

      // Check if duplicate identity card exists
      const duplicate = students.find((s) => s.identityCard === identityCard && s.selectedMajor === selectedMajor);
      if (duplicate) {
         res.status(400).json({ 
          error: `Học sinh này đã đăng ký nguyện vọng ngành ${major.name} trên hệ thống trước đó.` 
        });
         return;
      }

      // Generate TS identifier
      const lastId = students.length > 0 ? students[students.length - 1].id : "TS26-0000";
      const numberPart = parseInt(lastId.split("-")[1]) + 1;
      const newId = `TS26-${numberPart.toString().padStart(4, "0")}`;

      const registeredDate = new Date().toISOString();

      // Calculate initial admission status based on scores and standard average limits
      // For general simulation criteria
      let initialStatus = "pending";
      const targetScore = method === "academic-record" ? major.transcriptScore2025 : major.exemptScore2025;
      
      if (score >= targetScore + 1.0) {
        initialStatus = "approved"; // Đủ điều kiện đỗ
      } else if (score >= targetScore - 1.0) {
        initialStatus = "accepted"; // Đã tiếp nhận & xét duyệt vòng phỏng vấn
      } else {
        initialStatus = "action_required"; // Cần bổ sung tài liệu học bạ để xem xét thêm
      }

      // Prepare simulated email confirmation bodies
      const methodText = 
          method === "thpt" ? "Xét điểm thi THPT 2026" :
          method === "academic-record" ? "Xét học bạ THPT" :
          method === "national-exam" ? "Xét tuyển Đánh giá năng lực" : "Tuyển thẳng";

      const confirmationEmailBody = `
        <h3>CHÀO BẠN ${fullName.toUpperCase()},</h3>
        <p>Hội đồng Tuyển sinh Trường Đại học Vinh đã nhận được hồ sơ Nguyện vọng Trực tuyến của bạn với mã hồ sơ: <strong>${newId}</strong>.</p>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; border-color: #e2e8f0;">
          <tr style="background-color: #f8fafc;"><td><strong>Họ và tên thí sinh:</strong></td><td>${fullName}</td></tr>
          <tr><td><strong>Số CCCD:</strong></td><td>${identityCard}</td></tr>
          <tr style="background-color: #f8fafc;"><td><strong>Số điện thoại:</strong></td><td>${phone}</td></tr>
          <tr><td><strong>Ngành đăng ký:</strong></td><td>${major.name} (${major.code})</td></tr>
          <tr style="background-color: #f8fafc;"><td><strong>Phương thức tuyển:</strong></td><td>${methodText}</td></tr>
          <tr><td><strong>Điểm quy đổi:</strong></td><td>${score} điểm</td></tr>
        </table>
        <p>Hồ sơ đã được lưu trữ thành công trên Hệ thống Quản trị tuyển sinh. Chuyên viên đang thẩm định và sẽ phản hồi trong 2-3 ngày làm việc.</p>
        <small>Đây là email thông báo tự động. Vui lòng liên hệ Hotline 0238 3855 452 nếu cần sửa đổi thông tin.</small>
      `;

      const resultEmailBody = `
        <h3>KẾT QUẢ XÉT TUYỂN CHÍNH THỨC - ĐẠI HỌC VINH</h3>
        <p>Chào bạn ${fullName}, Hội đồng Tuyển sinh trân trọng thông báo trạng thái hồ sơ tuyển sinh mã <strong>${newId}</strong>:</p>
        <div style="padding: 15px; background-color: #f0fdf4; border-left: 5px solid #22c55e; margin: 15px 0;">
          <p style="margin: 0; font-size: 16px; color: #15803d; font-weight: bold;">
            ${initialStatus === "approved" ? "🎉 ĐỦ ĐIỀU KIỆN TRÚNG TUYỂN" : 
              initialStatus === "accepted" ? "✔️ TIẾP NHẬN HỒ SƠ THÀNH CÔNG" : "⚠️ CẦN BỔ SUNG MINH CHỨNG HỌC BẠ"}
          </p>
        </div>
        <p><strong>Chi tiết khuyến nghị của ban tuyển sinh:</strong></p>
        <ul>
          ${initialStatus === "approved" ? `
            <li>Chào mừng bạn đến với mái nhà chung Đại học Vinh ngành <strong>${major.name}</strong>.</li>
            <li>Vui lòng chuẩn bị hồ sơ giấy bao gồm: Giấy chứng nhận tốt nghiệp tạm thời, Bản sao học bạ công chứng và gửi chuyển phát nhanh về Trường Đại học Vinh trước ngày 30/08/2026.</li>
          ` : initialStatus === "accepted" ? `
            <li>Hồ sơ của bạn đã vượt qua vòng sơ loại ban đầu.</li>
            <li>Hội đồng đang kiểm định điểm thi thực tế. Vui lòng đăng nhập trang thông tin để tải về giấy hẹn nộp hồ sơ trực tiếp.</li>
          ` : `
            <li>Điểm số đăng ký của bạn đang nằm sát ngưỡng điểm chuẩn của ngành <strong>${major.name}</strong>.</li>
            <li>Để tăng cơ hội đỗ, vui lòng gửi kèm ảnh chứng minh học bạ cả năm lớp 12 bổ sung qua link tuyển sinh trực tuyến càng sớm càng tốt.</li>
          `}
        </ul>
        <p>Mọi thắc mắc xin vui lòng gửi về hòm thư điện tử <strong>tuyensinh@vinhuni.edu.vn</strong>.</p>
      `;

      // Set up automated email logs
      const emailLogs: EmailLog[] = [
        {
          type: "CONFIRMATION",
          subject: "Xác nhận tiếp nhận hồ sơ đăng ký nguyện vọng trực tuyến - Vinh Uni",
          sentAt: registeredDate,
          status: "success",
          bodyPreview: confirmationEmailBody
        }
      ];

      // Add actual result notice if approved or action is required
      if (initialStatus === "approved" || initialStatus === "action_required") {
        emailLogs.push({
          type: "RESULT",
          subject: "Thông báo kết quả xét tuyển nguyện vọng trực tuyến - Đại Học Vinh",
          sentAt: new Date(new Date().getTime() + 10000).toISOString(), // simulated very fast automate send
          status: "success",
          bodyPreview: resultEmailBody
        });
      }

      const newStudent: Registration = {
        id: newId,
        fullName,
        email,
        phone,
        identityCard,
        highschool: highschool || "Trường THPT Đợt xét tuyển tự do",
        selectedMajor,
        method,
        score: Number(score),
        status: initialStatus,
        registeredAt: registeredDate,
        emailLogs
      };

      students.push(newStudent);
      writeRegistrations(students);

      res.status(201).json({
        success: true,
        message: "Đăng ký đăng nguyện vọng trực tuyến thành công!",
        registration: newStudent
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Có lỗi xảy ra khi gửi hồ sơ nguyện vọng: " + e.message });
    }
  });

  // 5.1. Upload documents for an existing registration (Tải thêm giấy tờ lên hồ sơ)
  app.post("/api/registrations/:id/upload-document", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, type, size } = req.body;

      if (!name || !type) {
        res.status(400).json({ error: "Thiếu thông tin giấy tờ tệp tin tải lên." });
        return;
      }

      const students = readRegistrations();
      const studentIdx = students.findIndex((s) => s.id === id);

      if (studentIdx === -1) {
        res.status(404).json({ error: "Không tìm thấy hồ sơ tuyển sinh tương ứng." });
        return;
      }

      const student = students[studentIdx];
      if (!student.documents) {
        student.documents = [];
      }

      // Check if duplicate document already uploaded
      const exists = student.documents.some((d) => d.name === name);
      if (exists) {
        res.status(400).json({ error: "Tệp tin này đã được tải lên trước đó." });
        return;
      }

      const docTypeLabel =
        type === "transcript" ? "Học bạ THPT (Số hóa)" :
        type === "diploma" ? "Bằng tốt nghiệp tạm thời" :
        type === "award" ? "Giấy chứng nhận giải thưởng" : "Giấy tờ tùy thân khác";

      const newDoc = {
        name,
        type,
        uploadedAt: new Date().toISOString(),
        size: size || "450 KB"
      };

      student.documents.push(newDoc);

      const docEmailBody = `
        <h3>HỘI ĐỒNG TUYỂN SINH VINH UNI - XÁC NHẬN NHẬN GIẤY TỜ</h3>
        <p>Chào bạn ${student.fullName},</p>
        <p>Hệ thống tự động đã ghi nhận tệp tài liệu số hóa vừa được bạn tải lên thành công để bổ sung vào hồ sơ tuyển sinh mã số: <strong>${student.id}</strong>.</p>
        <div style="padding: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Tên file:</strong> ${name}</p>
          <p style="margin: 0;"><strong>Loại tài liệu:</strong> ${docTypeLabel}</p>
          <p style="margin: 0;"><strong>Dung lượng:</strong> ${size}</p>
          <p style="margin: 0;"><strong>Thời gian ghi nhận:</strong> ${new Date().toLocaleString("vi-VN")}</p>
        </div>
        <p>Ban giám khảo ban tuyển sinh sẽ tiến hành đối chiếu tệp số hóa này trực tiếp cùng thông tin điểm thi bạn đã đăng ký để phê duyệt học bạ nhanh chóng nhất.</p>
        <p>Xin trân trọng thông báo!</p>
      `;

      student.emailLogs.unshift({
        type: "CONFIRMATION",
        subject: `[XÁC NHẬN] Đã tiếp nhận tệp minh chứng: ${name} từ Thí sinh - Vinh Uni`,
        sentAt: new Date().toISOString(),
        status: "success",
        bodyPreview: docEmailBody
      });

      // Update status to processing automatically once a document is uploaded!
      if (student.status === "action_required" || student.status === "pending") {
        student.status = "processing";
      }

      writeRegistrations(students);

      res.json({
        success: true,
        message: "Tải lên giấy tờ minh chứng thành công!",
        registration: student
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Gặp sự cố khi nộp thêm giấy tờ: " + e.message });
    }
  });

  // 5.2. Admin update status AND auto dispatch customized notification email
  app.post("/api/registrations/update-status", (req: Request, res: Response) => {
    try {
      const { registrationId, newStatus } = req.body;

      if (!registrationId || !newStatus) {
        res.status(400).json({ error: "Thông tin mã hồ sơ hoặc trạng thái mới bị thiếu." });
        return;
      }

      const students = readRegistrations();
      const studentIdx = students.findIndex((s) => s.id === registrationId);

      if (studentIdx === -1) {
        res.status(404).json({ error: "Không tìm thấy hồ sơ thí sinh cần cập nhật tuyển thuật." });
        return;
      }

      const student = students[studentIdx];
      student.status = newStatus;

      let statusLabel = "";
      let statusColor = "";
      let statusDetailAdvice = "";

      if (newStatus === "approved") {
        statusLabel = "ĐỦ ĐIỀU KIỆN TRÚNG TUYỂN CHÍNH THỨC";
        statusColor = "#15803d font-weight: bold;";
        statusDetailAdvice = `
          <li>Hồ sơ học bạ số của em đã vượt qua kiểm duyệt tuyệt đối và chính thức <strong>ĐỦ ĐIỀU KIỆN TRÚNG TUYỂN</strong> vào Trường Đại học Vinh.</li>
          <li>Chúc mừng tân sinh viên! Em hãy chuẩn bị Học bạ gốc THPT bản gốc, Bản sao bằng tốt nghiệp công chứng gửi chuyển phát nhanh về Trường Đại học Vinh trước ngày 30/08/2026 để nhận giấy báo nhập học bản cứng có dấu đỏ.</li>
        `;
      } else if (newStatus === "processing") {
        statusLabel = "ĐANG TRONG TIẾN TRÌNH XỬ LÝ KIỂM TRA HỒ SƠ";
        statusColor = "#1d4ed8 font-weight: bold;";
        statusDetailAdvice = `
          <li>Hồ sơ của em đã hoàn thành tích hợp bổ sung và hội đồng hiện đã chuyển trạng thái sang <strong>ĐANG XỬ LÝ THẨM ĐỊNH CHI TIẾT</strong>.</li>
          <li>Ban khảo thí đang tiến hành so khớp điểm trung bình học thuật của em đối với cơ sở dữ liệu điểm trung học phổ thông quốc gia. Vui lòng giữ liên lạc điện thoại phòng khi cần phỏng vấn xác minh.</li>
        `;
      } else if (newStatus === "action_required") {
        statusLabel = "CẦN BỔ SUNG MINH CHỨNG HỌC BẠ / GIẤY TỜ THI THPT";
        statusColor = "#b91c1c font-weight: bold;";
        statusDetailAdvice = `
          <li>Hồ sơ đăng ký của em có điểm hoặc thông tin chưa rõ ràng hoặc thiếu tệp tin học bạ đính kèm.</li>
          <li><strong>Hành động bắt buộc:</strong> Vui lòng truy cập cổng "Tra cứu hồ sơ" trên trang tuyển sinh của Đại Học Vinh, nhấn vào mục quản lý tài liệu và tiến hành tải lên ảnh chụp hai mặt học bạ lớp 12 hoặc ảnh chụp điểm thi THPT chính thức để hội đồng tiếp tục xếp duyệt.</li>
        `;
      } else if (newStatus === "accepted") {
        statusLabel = "TIẾP NHẬN HỒ SƠ THÀNH CÔNG VÀ LƯU TRỮ HỢP LỆ";
        statusColor = "#2563eb font-weight: bold;";
        statusDetailAdvice = `
          <li>Hồ sơ của em đã được ghi nhận trạng thái <strong>TIẾP NHẬN LƯU TRỮ HỢP LỆ</strong> trên cơ sở dữ liệu Đại học Vinh.</li>
          <li>Thông tin điểm số và nguyện vọng của em đang nằm ở danh mục an toàn để chờ thẩm định theo thứ tự nộp sớm.</li>
        `;
      } else {
        statusLabel = "CHỜ PHÊ DUYỆT TỪ KHỐI PHÒNG KHẢO THÍ";
        statusColor = "#d97706 font-weight: bold;";
        statusDetailAdvice = `
          <li>Trạng thái hồ sơ được xếp lớp vào danh sách <strong>ĐANG CHỜ HỘI ĐỒNG VÀ PHÒNG KHẢO THÍ DUYỆT TẬP TRUNG</strong>.</li>
          <li>Thông tin bổ sung sẽ cập nhật sớm ngay tại trang tra cứu.</li>
        `;
      }

      const updateEmailBody = `
        <h3>[THÔNG BÁO] TRẠNG THÁI HỒ SƠ TUYỂN SINH ĐÃ ĐƯỢC CẬP NHẬT</h3>
        <p>Chào bạn ${student.fullName},</p>
        <p>Hội đồng Tuyển sinh Trường Đại học Vinh xin thông báo kết quả thẩm định mới nhất của hồ sơ mang mã số: <strong>${student.id}</strong>.</p>
         
        <div style="padding: 15px; background-color: #f8fafc; border-left: 5px solid ${newStatus === 'approved' ? '#22c55e' : newStatus === 'action_required' ? '#ef4444' : '#3b82f6'}; margin: 15px 0;">
          <p style="margin: 0; font-size: 14px; color: ${statusColor}">
            Trạng thái mới: <strong>${statusLabel}</strong>
          </p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b;">
            Cập nhật ngày: ${new Date().toLocaleString("vi-VN")}
          </p>
        </div>

        <p><strong>Khuyến nghị cụ thể từ ban tuyển sinh:</strong></p>
        <ul style="line-height: 1.6; font-size: 12px; color: #334155;">
          ${statusDetailAdvice}
        </ul>

        <p>Mọi thắc mắc vui lòng truy vấn trực tiếp qua trợ lý AI ở góc phải màn hình của website tuyển sinh hoặc gọi trực tiếp Hotline 0238.3855.452.</p>
        <p>Trân trọng chúc em gặt hái kết quả xuất sắc!</p>
        <small style="color: #94a3b8; font-size: 10px;">Vinh University Admissions Department 2026</small>
      `;

      student.emailLogs.unshift({
        type: "STATUS_UPDATE",
        subject: `[CẬP NHẬT] Sự thay đổi trạng thái Hồ sơ mã số ${student.id} - Đại Học Vinh`,
        sentAt: new Date().toISOString(),
        status: "success",
        bodyPreview: updateEmailBody
      });

      writeRegistrations(students);

      res.json({
        success: true,
        message: "Cập nhật kết quả tuyển sinh và gửi email báo tin tự động thành công!",
        registration: student
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật hồ sơ: " + e.message });
    }
  });

  // 6. Realtime Reports Analytics (Công cụ báo cáo tự động theo thời gian thực)
  app.get("/api/analytics", (req: Request, res: Response) => {
    const students = readRegistrations();

    // 1. Status count
    const statusCounts = {
      pending: 0,
      processing: 0,
      accepted: 0,
      approved: 0,
      action_required: 0
    };
    
    // 2. Count by Method

    const methodCounts: Record<string, number> = {
      "thpt": 0,
      "academic-record": 0,
      "national-exam": 0,
      "direct": 0
    };

    // 3. Count by Major
    const majorRegistrationCounts: Record<string, { count: number; name: string; code: string; seats: number }> = {};
    VINH_UNI_MAJORS.forEach((m) => {
      majorRegistrationCounts[m.code] = {
        count: 0,
        name: m.name,
        code: m.code,
        seats: m.slots
      };
    });

    // Calc overall average scores
    let scoreSum = 0;
    let scoreTotalNum = 0;

    students.forEach((s) => {
      // status
      const st = s.status as keyof typeof statusCounts;
      if (statusCounts[st] !== undefined) statusCounts[st]++;
      
      // method
      if (methodCounts[s.method] !== undefined) methodCounts[s.method]++;

      // Major registry
      if (majorRegistrationCounts[s.selectedMajor]) {
        majorRegistrationCounts[s.selectedMajor].count++;
      }

      // Add scores (handling different scales: if score > 150, assume ĐGNL scale 0-1200, scale it down for average)
      if (s.score > 0) {
        const normalizedScore = s.score > 150 ? (s.score / 1200) * 30 : s.score;
        scoreSum += normalizedScore;
        scoreTotalNum++;
      }
    });

    const averageNormalizedScore = scoreTotalNum > 0 ? Number((scoreSum / scoreTotalNum).toFixed(2)) : 0;

    // Build lists for Recharts
    const statusChartData = [
      { name: "Đã duyệt/Trúng tuyển", value: statusCounts.approved, color: "#10b981" },
      { name: "Đã tiếp nhận hồ sơ", value: statusCounts.accepted, color: "#3b82f6" },
      { name: "Đóng chờ phê duyệt", value: statusCounts.pending, color: "#f59e0b" },
      { name: "Cần bổ sung thông tin", value: statusCounts.action_required, color: "#ef4444" }
    ];

    const methodChartData = [
      { name: "Xét điểm THPT", value: methodCounts.thpt || 0, fill: "#8884d8" },
      { name: "Xét tuyển Học bạ", value: methodCounts["academic-record"] || 0, fill: "#82ca9d" },
      { name: "Đánh giá năng lực", value: methodCounts["national-exam"] || 0, fill: "#ffc658" },
      { name: "Tuyển thẳng tuyển ưu tiên", value: methodCounts.direct || 0, fill: "#ff8042" }
    ];

    const majorChartData = Object.values(majorRegistrationCounts)
      .map((item) => ({
        name: item.name,
        code: item.code,
        "Số hồ sơ": item.count,
        "Chỉ tiêu": item.seats
      }))
      .sort((a, b) => b["Số hồ sơ"] - a["Số hồ sơ"]);

    res.json({
      summary: {
        totalRegistrations: students.length,
        approvedTotal: statusCounts.approved,
        actionRequiredTotal: statusCounts.action_required,
        pendingTotal: statusCounts.pending,
        averageScores: averageNormalizedScore
      },
      charts: {
        statusDistribution: statusChartData,
        methodDistribution: methodChartData,
        majorDistribution: majorChartData
      }
    });
  });

  // 7. Interactive 24/7 AI Enrollment Chatbot (Tịch hợp Chatbot tư vấn tuyển sinh đại học Vinh)
  app.post("/api/chatbot", async (req: Request, res: Response) => {
    try {
      const { message, chatHistory } = req.body;

      if (!message || typeof message !== "string" || message.trim() === "") {
         res.status(400).json({ error: "Nội dung câu hỏi của thí sinh trống." });
         return;
      }

      // Read registrations database to answer actual status if student provides their name/ID
      const currentRegistrations = readRegistrations();

      // Lazy construct client
      const ai = getGeminiClient();

      // System prompt instruction injects COMPLETE details about Vinh University, majors, scores, and registries
      const systemInstruction = `
        Bạn là "Trợ lý Tuyển sinh AI Vinh Uni" - nhân viên văn phòng tư vấn tuyển sinh tự động 24/7 của Trường Đại học Vinh.
        Nhiệm vụ của bạn là hỗ trợ tư vấn học sinh, phụ huynh giải đáp các thắc mắc về tuyển sinh năm 2026 một cách chuyên nghiệp, nhiệt tình, lịch sự, thân thiện và chính xác nhất.

        THÔNG TIN CHÍNH THỨC VỀ TRƯỜNG ĐẠI HỌC VINH (VINH UNIVERSITY):
        - Địa chỉ: 182 đường Lê Duẩn, thành phố Vinh, tỉnh Nghệ An.
        - Hotline: 0238 3855 452 | Email: tuyensinh@vinhuni.edu.vn | Website: https://vinhuni.edu.vn
        
        DANH SÁCH CÁC NGÀNH ĐÀO TẠO & ĐIỂM CHUẨN NỔI BẬT:
        ${JSON.stringify(VINH_UNI_MAJORS, null, 2)}

        DANH SÁCH CHI TIẾT HỌC BỔNG VÀ ĐIỀU KIỆN:
        ${JSON.stringify(VINH_UNI_SCHOLARSHIPS, null, 2)}

        QUY TRÌNH HƯỚNG DẪN ĐĂNG KÝ NGUYỆN VỌNG TRỰC TUYẾN TRÊN WEBSITE:
        1. Click vào tab "Đăng ký tuyển sinh" ngay trên trang web này.
        2. Nhập thông tin chi tiết: Họ tên, Email, CCCD, Trường THPT địa phương, Số điện thoại.
        3. Chọn ngành học mong muốn và nhập tổ hợp môn/điểm thi quy đổi hoặc điểm học bạ tương ứng.
        4. Gửi hồ sơ. Hệ thống sẽ ngay lập tức gửi Email tự động xác nhận hồ sơ và thông báo kết quả xét tuyển sơ bộ về hòm thư của học sinh trong vòng vài giây.

        TRA CỨU HỒ SƠ & TRẠNG THÁI TẤM VÉ TRÚNG TUYỂN:
        Nếu học sinh hỏi về kết quả đăng ký của họ, hãy bảo họ sử dụng chức năng "Tra cứu kết quả" trong tab "Tra cứu hồ sơ" ở góc trên hoặc thanh menu để tìm kiếm nhanh bằng CCCD hoặc Tên. Bạn cũng có thể cung cấp thông tin ngắn nếu thấy kết quả trùng khớp trong danh sách học sinh đã tuyển này:
        Học sinh đã đăng ký trên hệ thống hiện tại:
        ${JSON.stringify(
          currentRegistrations.map((s) => ({
            id: s.id,
            fullName: s.fullName,
            identityCard: s.identityCard,
            selectedMajor: s.selectedMajor,
            status: s.status,
            registeredAt: s.registeredAt
          })),
          null,
          2
        )}

        HƯỚNG DẪN TRẢ LỜI:
        1. Luôn chào hỏi thân thiện, văn phong lịch sự, ấm áp miền Trung pha trộn với quốc tế. Xưng hô là "Vinh Uni" hoặc "Trợ lý Tuyển sinh Đại học Vinh" và gọi người học là "bạn", "em" hoặc "quý phụ huynh".
        2. Nếu thí sinh hỏi điểm chuẩn ngành, hãy so sánh điểm 2024 và 2025 để đưa ra dự báo tin cậy và khuyên họ học tập chăm chỉ.
        3. Khuyến khích học sinh đăng ký trực tuyển bằng cách hướng dẫn họ điền form ngay trên trang web này.
        4. Đối với các ngành Sư phạm, nhấn mạnh chính sách miễn học phí và hỗ trợ sinh hoạt phí theo Nghị định 116.
        5. Trả lời luôn bằng định dạng MARKDOWN dễ đọc, tạo gạch đầu dòng rõ ràng, bảng biểu nếu cần. Tránh câu cú dông dài và dùng từ ngữ dễ thương để tạo thiện cảm cực tốt với học sinh thế hệ Gen Z!
      `;

      // Build chat context structure
      const contents = [];
      if (chatHistory && Array.isArray(chatHistory)) {
        chatHistory.slice(-10).forEach((ch: any) => {
          contents.push({
            role: ch.role === "user" ? "user" : "model",
            parts: [{ text: ch.text }]
          });
        });
      }
      
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      const botReply = response.text || "Vinh Uni đã tiếp nhận câu hỏi của em. Thầy/Cô đang kết nối hệ thống dữ liệu để tư vấn kỹ hơn, vui lòng hỏi lại câu khác nhé!";
      res.json({ reply: botReply });
    } catch (error: any) {
      console.error("Gemini server error:", error);
      res.status(500).json({ 
        error: "Lỗi kết nối Trợ lý Tuyển sinh AI: " + error.message,
        reply: "Chào em! Hiện tại hệ thống kết cấu AI của văn phòng tuyển sinh đang bận xử lý dữ liệu điểm thi học kì 1. Em có thể đăng ký trực tiếp nguyện vọng của mình trong tab đăng ký, hoặc liên hệ trực tiếp hotline *0238.3855.452* nhé!" 
      });
    }
  });

  // Serve static UI assets in production or connect Vite dev server
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode, hooking up Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static build folder...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vinh University Admission Hub is running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server bootstrap failed:", err);
});
