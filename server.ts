import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { VINH_UNI_MAJORS, VINH_UNI_SCHOLARSHIPS, GENERAL_ENROLL_GUIDELINES } from "./src/data/vinhUniData";

const PORT = 3000;
const REGISTRATIONS_FILE = path.join(process.cwd(), "registrations.json");
const MAJORS_FILE = path.join(process.cwd(), "majors.json");
const FAQS_FILE = path.join(process.cwd(), "faqs.json");
const USERS_FILE = path.join(process.cwd(), "users.json");
const POSTS_FILE = path.join(process.cwd(), "posts.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `img_${uniqueSuffix}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file ảnh: JPG, PNG, GIF, WebP, SVG"));
    }
  },
});

// Define TypeScript interfaces
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
  status: string; // "pending" | "accepted" | "approved" | "action_required" | "processing"
  registeredAt: string;
  emailLogs: EmailLog[];
  documents?: Array<{
    name: string;
    type: string;
    uploadedAt: string;
    size: string;
  }>;
}

interface Major {
  id: number;
  name: string;
  faculty: string;
  code: string;
  category: string;
  admission_groups: string;
  score_2023: number;
  score_2024: number;
  quota: number;
  tuition_per_year: number;
  duration_years: number;
  description: string;
  career_prospects: string;
  is_active: boolean;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  order: number;
  is_active: boolean;
}

interface User {
  id: string;
  google_id?: string;
  email: string;
  password?: string;
  name: string;
  picture: string | null;
  role: string; // "user" | "staff" | "admin"
  is_active: boolean;
  created_at: string;
}

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: string; // "draft" | "published"
  coverImage: string;
  author: string;
  publishedAt: string | null;
}

// Lazy Initialize Gemini API Client
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

// Database Helpers
function readRegistrations(): Registration[] {
  try {
    if (!fs.existsSync(REGISTRATIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(REGISTRATIONS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading registrations:", error);
    return [];
  }
}

function writeRegistrations(data: Registration[]): boolean {
  try {
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing registrations:", error);
    return false;
  }
}

function readMajors(): Major[] {
  try {
    if (!fs.existsSync(MAJORS_FILE)) {
      const seeded: Major[] = VINH_UNI_MAJORS.map((m, idx) => ({
        id: idx + 1,
        name: m.name,
        faculty: m.group,
        code: m.code,
        category: m.group === "Công nghệ & Kỹ thuật" ? "Kỹ thuật - Công nghệ" : m.group === "Sư phạm & Giáo dục" ? "Sư phạm" : m.group === "Kinh tế & Quản lý" ? "Kinh tế" : "Khoa học xã hội",
        admission_groups: m.subjectGroups.join(", "),
        score_2023: m.exemptScore2024,
        score_2024: m.exemptScore2025,
        quota: m.slots,
        tuition_per_year: parseFloat(m.tuition) || 0,
        duration_years: parseInt(m.duration) || 4,
        description: m.description,
        career_prospects: m.jobOpportunities.join(", "),
        is_active: true
      }));
      fs.writeFileSync(MAJORS_FILE, JSON.stringify(seeded, null, 2), "utf-8");
      return seeded;
    }
    return JSON.parse(fs.readFileSync(MAJORS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading majors:", error);
    return [];
  }
}

function writeMajors(data: Major[]): boolean {
  try {
    fs.writeFileSync(MAJORS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing majors:", error);
    return false;
  }
}

function readFAQs(): FAQ[] {
  try {
    if (!fs.existsSync(FAQS_FILE)) {
      const seeded: FAQ[] = [
        { id: 1, question: "Ký túc xá có bao nhiêu chỗ?", answer: "Ký túc xá Đại học Vinh hiện có tổng cộng khoảng 3.500 chỗ ở cho sinh viên.", category: "Ký túc xá", order: 1, is_active: true },
        { id: 2, question: "Học phí ngành Sư phạm có được miễn không?", answer: "Có, toàn bộ sinh viên trúng tuyển ngành Sư phạm sẽ được Nhà nước miễn 100% học phí theo Nghị định 116/2020/NĐ-CP.", category: "Học phí", order: 2, is_active: true },
        { id: 3, question: "Hồ sơ xét tuyển trực tuyến cần những gì?", answer: "Hồ sơ xét tuyển trực tuyến bao gồm: Thông tin cá nhân, CCCD, Số điện thoại, Điểm thi tốt nghiệp THPT hoặc Điểm học bạ, và các ảnh chụp minh chứng kèm theo.", category: "Hồ sơ đăng ký", order: 3, is_active: true },
        { id: 4, question: "Ngành học Công nghệ thông tin đào tạo mấy năm?", answer: "Chương trình đào tạo Kỹ sư Công nghệ thông tin kéo dài trong 4 năm, trang bị đầy đủ kiến thức về phần mềm, AI, mạng máy tính và an toàn thông tin.", category: "Ngành học", order: 4, is_active: true }
      ];
      fs.writeFileSync(FAQS_FILE, JSON.stringify(seeded, null, 2), "utf-8");
      return seeded;
    }
    return JSON.parse(fs.readFileSync(FAQS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading FAQs:", error);
    return [];
  }
}

function writeFAQs(data: FAQ[]): boolean {
  try {
    fs.writeFileSync(FAQS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing FAQs:", error);
    return false;
  }
}

function readUsers(): User[] {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const seeded: User[] = [
        {
          id: "admin_123",
          google_id: "google_admin_123",
          email: "admin@vinhuni.edu.vn",
          password: "admin123",
          name: "Quản trị viên Vinh Uni",
          picture: null,
          role: "admin",
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: "staff_456",
          google_id: "google_staff_456",
          email: "canbo@vinhuni.edu.vn",
          password: "canbo123",
          name: "Cán bộ Tuyển sinh",
          picture: null,
          role: "staff",
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: "student_123",
          google_id: "google_student_789",
          email: "student@gmail.com",
          password: "student123",
          name: "Thí sinh tự do",
          picture: null,
          role: "user",
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      fs.writeFileSync(USERS_FILE, JSON.stringify(seeded, null, 2), "utf-8");
      return seeded;
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading users:", error);
    return [];
  }
}

function writeUsers(data: User[]): boolean {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing users:", error);
    return false;
  }
}

function readPosts(): Post[] {
  try {
    if (!fs.existsSync(POSTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading posts:", error);
    return [];
  }
}

function writePosts(data: Post[]): boolean {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing posts:", error);
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Serve uploaded images statically
  app.use("/uploads", express.static(UPLOADS_DIR));

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ----------------------------------------
  // MAJORS API
  // ----------------------------------------
  app.get("/api/majors", (req: Request, res: Response) => {
    let majors = readMajors();
    if (req.query.is_active !== undefined) {
      const isActiveFilter = req.query.is_active === "true";
      majors = majors.filter((m) => m.is_active === isActiveFilter);
    }
    res.json(majors);
  });

  app.post("/api/majors", (req: Request, res: Response) => {
    const majors = readMajors();
    const newMajor = {
      id: majors.length > 0 ? Math.max(...majors.map(m => m.id)) + 1 : 1,
      ...req.body,
      is_active: true
    };
    majors.push(newMajor);
    writeMajors(majors);
    res.status(201).json(newMajor);
  });

  app.put("/api/majors/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const majors = readMajors();
    const idx = majors.findIndex(m => m.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Major not found" });
      return;
    }
    majors[idx] = { ...majors[idx], ...req.body };
    writeMajors(majors);
    res.json(majors[idx]);
  });

  app.delete("/api/majors/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const majors = readMajors();
    const idx = majors.findIndex(m => m.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Major not found" });
      return;
    }
    majors[idx].is_active = false;
    writeMajors(majors);
    res.json({ success: true });
  });

  // ----------------------------------------
  // FAQS API
  // ----------------------------------------
  app.get("/api/faqs", (req: Request, res: Response) => {
    let faqs = readFAQs();
    if (req.query.is_active !== undefined) {
      const isActiveFilter = req.query.is_active === "true";
      faqs = faqs.filter((f) => f.is_active === isActiveFilter);
    }
    res.json(faqs);
  });

  app.post("/api/faqs", (req: Request, res: Response) => {
    const faqs = readFAQs();
    const newFaq = {
      id: faqs.length > 0 ? Math.max(...faqs.map(f => f.id)) + 1 : 1,
      ...req.body,
      is_active: true
    };
    faqs.push(newFaq);
    writeFAQs(faqs);
    res.status(201).json(newFaq);
  });

  app.put("/api/faqs/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const faqs = readFAQs();
    const idx = faqs.findIndex(f => f.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "FAQ not found" });
      return;
    }
    faqs[idx] = { ...faqs[idx], ...req.body };
    writeFAQs(faqs);
    res.json(faqs[idx]);
  });

  app.delete("/api/faqs/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const faqs = readFAQs();
    const idx = faqs.findIndex(f => f.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "FAQ not found" });
      return;
    }
    faqs[idx].is_active = false;
    writeFAQs(faqs);
    res.json({ success: true });
  });

  // ----------------------------------------
  // ADMISSION REGISTRATIONS API
  // ----------------------------------------
  app.get("/api/admission", (req: Request, res: Response) => {
    // Return all student registrations (mapped for general UI queries)
    const students = readRegistrations();
    res.json(students);
  });

  app.get("/api/scholarships", (req: Request, res: Response) => {
    res.json(VINH_UNI_SCHOLARSHIPS);
  });

  app.get("/api/guidelines", (req: Request, res: Response) => {
    res.json(GENERAL_ENROLL_GUIDELINES);
  });

  // Search registrations
  app.post("/api/registrations/search", (req: Request, res: Response) => {
    const { keyword } = req.body;
    if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
      res.status(400).json({ error: "Vui lòng nhập họ tên hoặc số CCCD/CMND để tra cứu." });
      return;
    }

    const term = keyword.trim().toLowerCase();
    const students = readRegistrations();
    
    const matches = students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        s.identityCard.includes(term) ||
        s.phone.includes(term) ||
        s.id.toLowerCase() === term
    );

    res.json({ results: matches });
  });

  // Submit candidate registration
  app.post("/api/registrations/register", (req: Request, res: Response) => {
    try {
      const { fullName, email, phone, identityCard, highschool, selectedMajor, method, score } = req.body;

      if (!fullName || !email || !phone || !identityCard || !selectedMajor || !method || score === undefined) {
        res.status(400).json({ error: "Vui lòng điền đầy đủ tất cả thông tin đăng ký bắt buộc." });
        return;
      }

      const majors = readMajors();
      const major = majors.find((m) => m.code === selectedMajor);
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

      // Calculate initial admission status
      let initialStatus = "pending";
      // Let's check target score
      const targetScore = major.score_2024 || 22.0;
      
      if (score >= targetScore + 1.0) {
        initialStatus = "approved"; 
      } else if (score >= targetScore - 1.0) {
        initialStatus = "accepted";
      } else {
        initialStatus = "action_required";
      }

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

      const emailLogs: EmailLog[] = [
        {
          type: "CONFIRMATION",
          subject: "Xác nhận tiếp nhận hồ sơ đăng ký nguyện vọng trực tuyến - Vinh Uni",
          sentAt: registeredDate,
          status: "success",
          bodyPreview: confirmationEmailBody
        }
      ];

      if (initialStatus === "approved" || initialStatus === "action_required") {
        emailLogs.push({
          type: "RESULT",
          subject: "Thông báo kết quả xét tuyển nguyện vọng trực tuyến - Đại Học Vinh",
          sentAt: new Date(new Date().getTime() + 10000).toISOString(),
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
        message: "Đăng ký nguyện vọng trực tuyến thành công!",
        registration: newStudent
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Có lỗi xảy ra khi gửi hồ sơ nguyện vọng: " + e.message });
    }
  });

  // Upload document
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

  // Admin update status endpoint
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
        message: "Cập nhật kết quả tuyển sinh thành công!",
        registration: student
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật hồ sơ: " + e.message });
    }
  });

  // Admin CRUD for admissions
  app.put("/api/admission/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const students = readRegistrations();
    const idx = students.findIndex(s => s.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Registration not found" });
      return;
    }
    students[idx] = { ...students[idx], ...req.body };
    writeRegistrations(students);
    res.json(students[idx]);
  });

  app.delete("/api/admission/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const students = readRegistrations();
    const filtered = students.filter(s => s.id !== id);
    writeRegistrations(filtered);
    res.json({ success: true });
  });

  // ----------------------------------------
  // REALTIME REPORTS ANALYTICS API
  // ----------------------------------------
  app.get("/api/analytics", (req: Request, res: Response) => {
    const students = readRegistrations();
    const majors = readMajors();

    const statusCounts = {
      pending: 0,
      processing: 0,
      accepted: 0,
      approved: 0,
      action_required: 0
    };
    
    const methodCounts: Record<string, number> = {
      "thpt": 0,
      "academic-record": 0,
      "national-exam": 0,
      "direct": 0
    };

    const majorRegistrationCounts: Record<string, { count: number; name: string; code: string; seats: number }> = {};
    majors.forEach((m) => {
      majorRegistrationCounts[m.code] = {
        count: 0,
        name: m.name,
        code: m.code,
        seats: m.quota
      };
    });

    let scoreSum = 0;
    let scoreTotalNum = 0;

    students.forEach((s) => {
      const st = s.status as keyof typeof statusCounts;
      if (statusCounts[st] !== undefined) statusCounts[st]++;
      if (methodCounts[s.method] !== undefined) methodCounts[s.method]++;
      if (majorRegistrationCounts[s.selectedMajor]) {
        majorRegistrationCounts[s.selectedMajor].count++;
      }
      if (s.score > 0) {
        const normalizedScore = s.score > 150 ? (s.score / 1200) * 30 : s.score;
        scoreSum += normalizedScore;
        scoreTotalNum++;
      }
    });

    const averageNormalizedScore = scoreTotalNum > 0 ? Number((scoreSum / scoreTotalNum).toFixed(2)) : 0;

    const statusChartData = [
      { name: "Đã duyệt/Trúng tuyển", value: statusCounts.approved, color: "#10b981" },
      { name: "Đang thẩm định", value: statusCounts.processing, color: "#3b82f6" },
      { name: "Đã tiếp nhận", value: statusCounts.accepted, color: "#6366f1" },
      { name: "Chờ phê duyệt", value: statusCounts.pending, color: "#f59e0b" },
      { name: "Cần bổ sung thông tin", value: statusCounts.action_required, color: "#ef4444" }
    ];

    const methodChartData = [
      { name: "Xét điểm THPT", value: methodCounts.thpt || 0, fill: "#8884d8" },
      { name: "Xét tuyển Học bạ", value: methodCounts["academic-record"] || 0, fill: "#82ca9d" },
      { name: "Đánh giá năng lực", value: methodCounts["national-exam"] || 0, fill: "#ffc658" },
      { name: "Tuyển thẳng", value: methodCounts.direct || 0, fill: "#ff8042" }
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

  // ----------------------------------------
  // FILE UPLOAD API
  // ----------------------------------------
  app.post("/api/upload", upload.single("image"), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Không tìm thấy file ảnh. Vui lòng chọn file và thử lại." });
        return;
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl, filename: req.file.filename, size: req.file.size });
    } catch (e: any) {
      console.error("Upload error:", e);
      res.status(500).json({ error: "Lỗi tải ảnh lên: " + e.message });
    }
  });

  // ----------------------------------------
  // POSTS (News Articles) API
  // ----------------------------------------
  app.get("/api/posts", (req: Request, res: Response) => {
    let posts = readPosts();
    if (req.query.status) {
      posts = posts.filter((p) => p.status === req.query.status);
    }
    // Sort by publishedAt descending (newest first)
    posts.sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA;
    });
    res.json(posts);
  });

  app.post("/api/posts", (req: Request, res: Response) => {
    const posts = readPosts();
    const newPost: Post = {
      id: "post_" + Date.now(),
      title: req.body.title || "",
      excerpt: req.body.excerpt || "",
      content: req.body.content || "",
      category: req.body.category || "Thông báo",
      status: req.body.status || "draft",
      coverImage: req.body.coverImage || "",
      author: req.body.author || "Ban Tuyển sinh",
      publishedAt: req.body.status === "published" ? (req.body.publishedAt || new Date().toISOString()) : null
    };
    posts.push(newPost);
    writePosts(posts);
    res.status(201).json(newPost);
  });

  app.put("/api/posts/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const posts = readPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    posts[idx] = { ...posts[idx], ...req.body };
    // Auto-set publishedAt if switching to published
    if (req.body.status === "published" && !posts[idx].publishedAt) {
      posts[idx].publishedAt = new Date().toISOString();
    }
    writePosts(posts);
    res.json(posts[idx]);
  });

  app.delete("/api/posts/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const posts = readPosts();
    const filtered = posts.filter(p => p.id !== id);
    if (filtered.length === posts.length) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    writePosts(filtered);
    res.json({ success: true });
  });

  // ----------------------------------------
  // GOOGLE AUTHENTICATION & LOGIN API
  // ----------------------------------------
  interface GoogleUserProfile {
    sub: string;
    email: string;
    name: string;
    picture?: string;
  }

  async function verifyGoogleToken(accessToken: string): Promise<GoogleUserProfile | null> {
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) return null;
      return await response.json() as GoogleUserProfile;
    } catch (error) {
      console.error("Google token verification failed:", error);
      return null;
    }
  }

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { id_token } = req.body;
      
      // We check if it is a mock token from frontend fast login
      if (id_token === "mock_admin_token" || id_token?.includes("admin")) {
        res.json({
          access_token: "mock_admin_token",
          user: {
            id: "admin_123",
            email: "admin@vinhuni.edu.vn",
            full_name: "Quản trị viên Vinh Uni",
            role: "admin",
            picture: null
          }
        });
        return;
      }

      if (id_token === "mock_staff_token" || id_token?.includes("staff")) {
        res.json({
          access_token: "mock_staff_token",
          user: {
            id: "staff_456",
            email: "canbo@vinhuni.edu.vn",
            full_name: "Cán bộ Tuyển sinh",
            role: "staff",
            picture: null
          }
        });
        return;
      }

      if (id_token === "mock_student_token" || id_token?.includes("student")) {
        res.json({
          access_token: "mock_student_token",
          user: {
            id: "student_123",
            email: "student@gmail.com",
            full_name: "Thí sinh tự do",
            role: "user",
            picture: null
          }
        });
        return;
      }

      // Real Google verification
      const profile = await verifyGoogleToken(id_token);
      if (!profile) {
        res.status(401).json({ error: "Xác thực tài khoản Google thất bại hoặc hết hạn." });
        return;
      }

      const users = readUsers();
      let user = users.find(u => u.google_id === profile.sub || u.email.toLowerCase() === profile.email.toLowerCase());

      if (!user) {
        user = {
          id: "user_" + Date.now(),
          google_id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture || null,
          role: "user",
          is_active: true,
          created_at: new Date().toISOString()
        };
        users.push(user);
        writeUsers(users);
      } else {
        let updated = false;
        if (!user.google_id) {
          user.google_id = profile.sub;
          updated = true;
        }
        if (profile.picture && !user.picture) {
          user.picture = profile.picture;
          updated = true;
        }
        if (updated) {
          writeUsers(users);
        }
      }

      res.json({
        access_token: `user_token_${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.name,
          role: user.role,
          picture: user.picture
        }
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Lỗi đăng nhập Google: " + err.message });
    }
  });

  app.post("/api/auth/admin-login", async (req: Request, res: Response) => {
    try {
      const { id_token } = req.body;

      if (id_token === "mock_admin_token" || id_token?.includes("admin")) {
        res.json({
          access_token: "mock_admin_token",
          user: {
            id: "admin_123",
            email: "admin@vinhuni.edu.vn",
            full_name: "Quản trị viên Vinh Uni",
            role: "admin",
            picture: null
          }
        });
        return;
      }

      if (id_token === "mock_staff_token" || id_token?.includes("staff")) {
        res.json({
          access_token: "mock_staff_token",
          user: {
            id: "staff_456",
            email: "canbo@vinhuni.edu.vn",
            full_name: "Cán bộ Tuyển sinh",
            role: "staff",
            picture: null
          }
        });
        return;
      }

      // Real Google verification
      const profile = await verifyGoogleToken(id_token);
      if (!profile) {
        res.status(401).json({ error: "Xác thực tài khoản Google thất bại hoặc hết hạn." });
        return;
      }

      const users = readUsers();
      let user = users.find(u => u.google_id === profile.sub || u.email.toLowerCase() === profile.email.toLowerCase());

      if (!user) {
        user = {
          id: "user_" + Date.now(),
          google_id: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture || null,
          role: profile.email.includes("admin") ? "admin" : "staff",
          is_active: true,
          created_at: new Date().toISOString()
        };
        users.push(user);
        writeUsers(users);
      } else {
        let updated = false;
        if (!user.google_id) {
          user.google_id = profile.sub;
          updated = true;
        }
        if (user.role === "user") {
          user.role = "staff"; // Upgrade to staff if logging in through admin portal
          updated = true;
        }
        if (updated) {
          writeUsers(users);
        }
      }

      res.json({
        access_token: `user_token_${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.name,
          role: user.role,
          picture: user.picture
        }
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Lỗi đăng nhập Google Admin: " + err.message });
    }
  });

  app.post("/api/auth/register", (req: Request, res: Response) => {
    try {
      const { email, password, name, role } = req.body;
      if (!email || !password || !name) {
        res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin: Email, Mật khẩu và Họ tên" });
        return;
      }
      
      const users = readUsers();
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        res.status(400).json({ error: "Email này đã được đăng ký sử dụng trong hệ thống." });
        return;
      }

      const newUser: User = {
        id: "user_" + Date.now(),
        email,
        password,
        name,
        picture: null,
        role: role || "user",
        is_active: true,
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      writeUsers(users);

      res.status(201).json({
        access_token: `user_token_${newUser.id}`,
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.name,
          role: newUser.role
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: "Đăng ký thất bại: " + e.message });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Vui lòng nhập Email và Mật khẩu" });
        return;
      }

      const users = readUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!user) {
        res.status(401).json({ error: "Email hoặc mật khẩu không chính xác." });
        return;
      }

      res.json({
        access_token: `user_token_${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.name,
          role: user.role
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: "Đăng nhập thất bại: " + e.message });
    }
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const token = authHeader.split(" ")[1];
    if (token === "mock_admin_token") {
      res.json({
        id: "admin_123",
        email: "admin@vinhuni.edu.vn",
        full_name: "Quản trị viên Vinh Uni",
        role: "admin"
      });
    } else if (token === "mock_staff_token") {
      res.json({
        id: "staff_456",
        email: "canbo@vinhuni.edu.vn",
        full_name: "Cán bộ Tuyển sinh",
        role: "staff"
      });
    } else if (token.startsWith("user_token_")) {
      const userId = token.replace("user_token_", "");
      const users = readUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
        res.json({
          id: user.id,
          email: user.email,
          full_name: user.name,
          role: user.role
        });
      } else {
        res.status(401).json({ error: "User session not found" });
      }
    } else {
      res.json({
        id: "student_123",
        email: "student@gmail.com",
        full_name: "Thí sinh",
        role: "user"
      });
    }
  });

  // ----------------------------------------
  // USERS MANAGEMENT API
  // ----------------------------------------
  app.get("/api/users", (req: Request, res: Response) => {
    const users = readUsers();
    res.json(users);
  });

  app.put("/api/users/:id/role", (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    users[idx].role = role;
    writeUsers(users);
    res.json(users[idx]);
  });

  // ----------------------------------------
  // GEMINI CHATBOT API (/api/chats)
  // ----------------------------------------
  app.post("/api/chats", async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Danh sách tin nhắn trống." });
        return;
      }

      const currentRegistrations = readRegistrations();
      const majors = readMajors();
      const publishedPosts = readPosts().filter(p => p.status === "published");
      const ai = getGeminiClient();

      // Build published articles context for grounding
      const articlesContext = publishedPosts.length > 0
        ? `\n\nBÀI VIẾT TIN TỨC & THÔNG BÁO ĐÃ XUẤT BẢN TRÊN CỔNG TUYỂN SINH:\n${publishedPosts.map(p => `- [${p.category}] ${p.title} (${p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('vi-VN') : 'N/A'}):\n  ${p.content}`).join('\n\n')}`
        : '';

      const systemInstruction = `
        Bạn là "Trợ lý Tuyển sinh AI Vinh Uni" - nhân viên văn phòng tư vấn tuyển sinh tự động 24/7 của Trường Đại học Vinh.
        Nhiệm vụ của bạn là hỗ trợ tư vấn học sinh, phụ huynh giải đáp các thắc mắc về tuyển sinh năm 2026 một cách chuyên nghiệp, nhiệt tình, lịch sự, thân thiện và chính xác nhất.

        THÔNG TIN CHÍNH THỨC VỀ TRƯỜNG ĐẠI HỌC VINH (VINH UNIVERSITY):
        - Địa chỉ: 182 đường Lê Duẩn, thành phố Vinh, tỉnh Nghệ An.
        - Hotline: 0238 3855 452 | Email: tuyensinh@vinhuni.edu.vn | Website: https://vinhuni.edu.vn
        
        DANH SÁCH CÁC NGÀNH ĐÀO TẠO & ĐIỂM CHUẨN NỔI BẬT:
        ${JSON.stringify(majors, null, 2)}

        DANH SÁCH CHI TIẾT HỌC BỔNG VÀ ĐIỀU KIỆN:
        ${JSON.stringify(VINH_UNI_SCHOLARSHIPS, null, 2)}
        ${articlesContext}

        QUY TRÌNH HƯỚNG DẪN ĐĂNG KÝ NGUYỆN VỌNG TRỰC TUYẾN TRÊN WEBSITE:
        1. Truy cập trang "Thông tin tuyển sinh" và chọn tab "Đăng ký nguyện vọng".
        2. Điền đầy đủ thông tin: Họ tên, Email, CCCD, Số điện thoại, trường THPT, chọn ngành đăng ký, phương thức xét tuyển và nhập điểm quy đổi.
        3. Gửi hồ sơ. Hệ thống sẽ ngay lập tức gửi Email tự động xác nhận hồ sơ và kết quả xét tuyển sơ bộ về hòm thư của học sinh trong vòng vài giây.

        TRA CỨU HỒ SƠ & TRẠNG THÁI:
        Mỗi khi học sinh hỏi về trạng thái hồ sơ của họ, hãy hướng dẫn họ vào trang "Thông tin tuyển sinh" -> tab "Tra cứu kết quả" để tìm kiếm nhanh bằng CCCD hoặc Tên. Bạn cũng có thể cung cấp thông tin ngắn nếu thấy kết quả trùng khớp trong danh sách học sinh đã tuyển này:
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
        2. Nếu thí sinh hỏi điểm chuẩn ngành, hãy so sánh điểm 2023 và 2024 để đưa ra dự báo tin cậy và khuyên họ học tập chăm chỉ.
        3. Khuyến khích học sinh đăng ký trực tuyến bằng cách hướng dẫn họ điền form ngay trên trang web này.
        4. Đối với các ngành Sư phạm, nhấn mạnh chính sách miễn học phí và hỗ trợ sinh hoạt phí theo Nghị định 116.
        5. Trả lời luôn bằng định dạng MARKDOWN dễ đọc, tạo gạch đầu dòng rõ ràng, bảng biểu nếu cần. Tránh câu cú dông dài và dùng từ ngữ dễ thương để tạo thiện cảm cực tốt với học sinh thế hệ Gen Z!
        6. Nếu câu hỏi của người dùng liên quan đến thông tin thời sự, tin tức tuyển sinh bên ngoài, hoặc các dữ liệu bạn không có sẵn trong ngữ cảnh trên, hãy sử dụng công cụ Google Search để tra cứu và trả lời dựa trên kết quả tìm kiếm thực tế.
      `;

      // Build chat context structure
      const contents: any[] = [];
      // Take last 10 messages to avoid context overflow
      messages.slice(-10).forEach((ch: any) => {
        contents.push({
          role: ch.role === "user" ? "user" : "model",
          parts: [{ text: ch.content }]
        });
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          tools: [{ googleSearch: {} }]
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
