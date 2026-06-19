import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { VINH_UNI_MAJORS, VINH_UNI_SCHOLARSHIPS, GENERAL_ENROLL_GUIDELINES } from "./src/data/vinhUniData";
import dotenv from "dotenv";
import { createRequire } from "module";
import nodemailer from "nodemailer";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

// Load environment variables
dotenv.config();
if (fs.existsSync(path.join(process.cwd(), ".env.local"))) {
  dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });
}

const PORT = 3000;
const REGISTRATIONS_FILE = path.join(process.cwd(), "registrations.json");
const MAJORS_FILE = path.join(process.cwd(), "majors.json");
const FAQS_FILE = path.join(process.cwd(), "faqs.json");
const USERS_FILE = path.join(process.cwd(), "users.json");
const POSTS_FILE = path.join(process.cwd(), "posts.json");
const DOCUMENTS_FILE = path.join(process.cwd(), "documents.json");
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

interface DocumentChunk {
  text: string;
  embedding: number[];
}

interface AIDocument {
  id: string;
  original_name: string;
  file_name?: string;
  full_text?: string;
  created_at: string;
  issued_at: string;
  is_outdated: boolean;
  chunk_count: number;
  chunks: DocumentChunk[];
}

// Anti-spam and sensitive topic validation helper
const SENSITIVE_KEYWORDS = [
  // Vulgar words (Vietnamese)
  "đm", "đéo", "clm", "vcl", "cứt", "chịch", "loz", "lồn", "buồi", "cặc", "vờ lờ", "mẹ mày", "đĩ", "chó đẻ",
  // Off-topic / Illegal / Toxic
  "cờ bạc", "cá độ", "lô đề", "đánh bài", "ma túy", "thuốc lắc", "bóng cười", "đâm chém", "giết người", "tự tử", "hack tài khoản", "bẻ khóa", "kẹo mút", "phim sex", "hiếp dâm",
  // Politics
  "phản động", "biểu tình", "lật đổ", "chính quyền", "nhà nước", "chính trị", "đảng cộng sản"
];

// In-memory rate limiting dictionary
const ipRateLimit: Record<string, {
  lastMessageTime: number;
  messageCount: number;
  blockUntil: number;
  duplicateCount: number;
  lastContent: string;
}> = {};

function checkSpamAndSensitive(ip: string, content: string): { isViolating: boolean; reason: string } {
  const now = Date.now();
  const lowerContent = content.trim().toLowerCase();
  
  if (ipRateLimit[ip] && ipRateLimit[ip].blockUntil > now) {
    const secondsLeft = Math.ceil((ipRateLimit[ip].blockUntil - now) / 1000);
    return { 
      isViolating: true, 
      reason: `Bạn đang bị tạm khóa do spam. Vui lòng thử lại sau ${secondsLeft} giây.` 
    };
  }

  if (!ipRateLimit[ip]) {
    ipRateLimit[ip] = {
      lastMessageTime: 0,
      messageCount: 0,
      blockUntil: 0,
      duplicateCount: 0,
      lastContent: ""
    };
  }

  const record = ipRateLimit[ip];

  if (content.length > 1500) {
    return {
      isViolating: true,
      reason: "Tin nhắn quá dài (tối đa 1500 ký tự). Vui lòng rút ngắn nội dung."
    };
  }

  if (lowerContent === record.lastContent && (now - record.lastMessageTime) < 10000) {
    record.duplicateCount++;
    if (record.duplicateCount >= 2) {
      record.blockUntil = now + 30000; // block for 30 seconds
      record.duplicateCount = 0;
      return {
        isViolating: true,
        reason: "Bạn đang gửi các tin nhắn trùng lặp. Tài khoản của bạn bị tạm khóa 30 giây."
      };
    }
  } else {
    record.duplicateCount = 0;
  }

  if (record.lastMessageTime > 0 && (now - record.lastMessageTime) < 1000) {
    record.blockUntil = now + 15000; // block for 15 seconds
    return {
      isViolating: true,
      reason: "Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi và thử lại sau."
    };
  }

  for (const keyword of SENSITIVE_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      return {
        isViolating: true,
        reason: "Tin nhắn của bạn chứa từ ngữ nhạy cảm hoặc không phù hợp."
      };
    }
  }

  record.lastMessageTime = now;
  record.lastContent = lowerContent;
  return { isViolating: false, reason: "" };
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
        timeout: 30000, // Max 30 seconds timeout per model call
        retryOptions: {
          attempts: 1, // Disable automatic SDK retries to fail fast and fall back
        },
      },
    });
  }
  return aiClient;
}

let searchAiClient: GoogleGenAI | null = null;
function getSearchGeminiClient(): GoogleGenAI {
  if (!searchAiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    searchAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
        timeout: 30000, // Max 30 seconds timeout per model call
        retryOptions: {
          attempts: 1, // Fail fast
        },
      },
    });
  }
  return searchAiClient;
}

// Database Helpers
const LIVE_CHATS_FILE = path.join(process.cwd(), "live_chats.json");

interface LiveChatMessage {
  sender: "user" | "staff";
  senderName: string;
  content: string;
  timestamp: string;
}

interface LiveChatSession {
  id: string;
  user_name: string;
  user_email: string;
  status: "waiting" | "active" | "resolved";
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  created_at: string;
  updated_at: string;
  messages: LiveChatMessage[];
}

function readLiveChats(): LiveChatSession[] {
  try {
    if (!fs.existsSync(LIVE_CHATS_FILE)) return [];
    return JSON.parse(fs.readFileSync(LIVE_CHATS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading live chats:", error);
    return [];
  }
}

function writeLiveChats(data: LiveChatSession[]): boolean {
  try {
    fs.writeFileSync(LIVE_CHATS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing live chats:", error);
    return false;
  }
}

async function sendNotificationToStaff(subject: string, message: string, chatUrl: string) {
  const providers = (process.env.NOTIFICATION_PROVIDERS || "web").split(",").map(p => p.trim().toLowerCase());
  
  console.log(`[Notification] Dispatching notification via: ${providers.join(", ")}`);
  
  // 1. Email notification
  if (providers.includes("email")) {
    try {
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || "587");
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      
      if (smtpHost && smtpUser && smtpPass) {
        let staffEmails: string[] = [];
        try {
          if (fs.existsSync(USERS_FILE)) {
            const users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
            staffEmails = users
              .filter((u: any) => u.is_active && (u.role === "admin" || u.role === "staff"))
              .map((u: any) => u.email);
          }
        } catch (err) {
          console.error("Error reading staff emails for notification:", err);
        }
        
        if (staffEmails.length > 0) {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass
            }
          });
          
          const mailOptions = {
            from: `"Vinh Uni Live Chat Alert" <${smtpUser}>`,
            to: staffEmails.join(", "),
            subject: subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #1A3A6B; color: white; padding: 20px; text-align: center;">
                  <h2 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; color: #C8A951;">Vinh Uni Admissions</h2>
                  <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">Hệ thống thông báo tuyển sinh hỗ trợ trực tuyến</p>
                </div>
                <div style="padding: 24px; color: #0A1931; line-height: 1.6;">
                  <h3 style="margin-top: 0; color: #1A3A6B;">🔔 Thí sinh đang đợi hỗ trợ trực tuyến</h3>
                  <p>${message}</p>
                  <p style="margin-bottom: 25px;">Vui lòng nhấp vào nút bên dưới để tiếp nhận và phản hồi trực tiếp cho thí sinh từ trang quản trị:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${chatUrl}" target="_blank" style="background-color: #C8A951; color: #0A1931; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s;">
                      Tiếp Nhận Chat Trực Tuyến
                    </a>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
                  <p style="color: #64748b; font-size: 11px; text-align: center; margin: 0;">
                    Đây là email thông báo tự động từ cổng hỗ trợ live chat Trường Đại học Vinh.
                  </p>
                </div>
              </div>
            `
          };
          
          await transporter.sendMail(mailOptions);
          console.log(`[Notification] Email sent successfully to ${staffEmails.length} staff members.`);
        } else {
          console.warn("[Notification] No active staff/admin email accounts found to send email alerts.");
        }
      } else {
        console.warn("[Notification] Email credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not fully configured in .env.local.");
      }
    } catch (err) {
      console.error("[Notification] Failed to send email alert:", err);
    }
  }
  
  // 2. Pushover notification
  if (providers.includes("pushover")) {
    try {
      const userKey = process.env.PUSHOVER_USER_KEY;
      const appToken = process.env.PUSHOVER_APP_TOKEN;
      
      if (userKey && appToken) {
        const response = await fetch("https://api.pushover.net/1/messages.json", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: appToken,
            user: userKey,
            message: `${message}\nLink: ${chatUrl}`,
            title: subject,
            url: chatUrl,
            url_title: "Tiếp Nhận Chat"
          })
        });
        
        if (response.ok) {
          console.log("[Notification] Pushover notification sent successfully.");
        } else {
          const errText = await response.text();
          console.error(`[Notification] Pushover failed: ${response.status} - ${errText}`);
        }
      } else {
        console.warn("[Notification] Pushover credentials (PUSHOVER_USER_KEY, PUSHOVER_APP_TOKEN) not configured in .env.local.");
      }
    } catch (err) {
      console.error("[Notification] Failed to send Pushover alert:", err);
    }
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

function readDocuments(): AIDocument[] {
  try {
    if (!fs.existsSync(DOCUMENTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(DOCUMENTS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading documents:", error);
    return [];
  }
}

function writeDocuments(data: AIDocument[]): boolean {
  try {
    fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing documents:", error);
    return false;
  }
}

async function updateMajorsFromDocumentText(text: string): Promise<void> {
  const majors = readMajors();
  if (majors.length === 0) return;

  const ai = getGeminiClient();
  const prompt = `
    Bạn là hệ thống phân tích dữ liệu tuyển sinh tự động của Đại học Vinh.
    Dưới đây là nội dung văn bản tuyển sinh mới nhất vừa được ban hành:
    \"\"\"
    ${text}
    \"\"\"

    Dưới đây là danh sách các ngành đào tạo hiện tại trong hệ thống (gồm mã ngành và tên ngành):
    ${JSON.stringify(majors.map(m => ({ code: m.code, name: m.name })), null, 2)}

    Nhiệm vụ của bạn là đọc kỹ văn bản tuyển sinh và trích xuất ra các thông tin cập nhật mới nhất cho năm học 2026.
    Chỉ trích xuất các thông tin sau nếu văn bản có đề cập rõ ràng:
    1. Chỉ tiêu tuyển sinh (quota) -> trích xuất số nguyên.
    2. Học phí mỗi năm (tuition_per_year) -> số nguyên (VNĐ).
    3. Điểm xét tuyển THPT / Học bạ năm gần nhất (ví dụ: chuyển đổi thành score_2024 hoặc score_2023).
    4. Tổ hợp môn xét tuyển (admission_groups) -> ví dụ: "A00, A01, D01".

    Trả về kết quả dưới dạng một mảng JSON các đối tượng cập nhật. Mỗi đối tượng bắt buộc phải có trường "code" (mã ngành) khớp với danh sách trên để hệ thống cập nhật chính xác.
    Định dạng JSON yêu cầu:
    [
      {
        "code": "mã_ngành_chính_xác",
        "quota": số_chỉ_tiêu_mới (optional),
        "tuition_per_year": học_phí_mới (optional),
        "admission_groups": "tổ_hợp_mới" (optional)
      }
    ]

    Lưu ý quan trọng: Chỉ trả về JSON nguyên bản, không viết thêm bất kỳ từ ngữ nào khác ngoài khối JSON. Nếu văn bản không có thông tin cập nhật nào, trả về mảng rỗng [].
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text || "[]";
    const updates = JSON.parse(jsonText.trim());
    if (Array.isArray(updates) && updates.length > 0) {
      let updatedCount = 0;
      updates.forEach(up => {
        if (!up.code) return;
        const idx = majors.findIndex(m => m.code === up.code);
        if (idx !== -1) {
          if (up.quota !== undefined) {
            majors[idx].quota = up.quota;
            updatedCount++;
          }
          if (up.tuition_per_year !== undefined) {
            majors[idx].tuition_per_year = up.tuition_per_year;
            updatedCount++;
          }
          if (up.admission_groups !== undefined) {
            majors[idx].admission_groups = up.admission_groups;
            updatedCount++;
          }
        }
      });
      if (updatedCount > 0) {
        writeMajors(majors);
        console.log(`[Database Update] Automatically updated ${updatedCount} fields in majors.json based on the newly uploaded document!`);
      }
    }
  } catch (err) {
    console.error("[Database Update] Failed to update structured majors database:", err);
  }
}

// Document Upload & Processing Helpers
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e6);
    const ext = path.extname(file.originalname) || ".txt";
    cb(null, `doc_${uniqueSuffix}${ext}`);
  },
});
const uploadDocument = multer({
  storage: docStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|docx|txt)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file dạng: PDF, DOCX, TXT"));
    }
  },
});

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text || "";
  } catch (e: any) {
    console.error("Error parsing PDF:", e);
    throw new Error("Không thể đọc tệp PDF: " + e.message);
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (e: any) {
    console.error("Error parsing DOCX:", e);
    throw new Error("Không thể đọc tệp DOCX: " + e.message);
  }
}

async function extractTextFromTxt(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

async function extractDateFromText(text: string): Promise<string> {
  const sampleText = text.length > 6000 
    ? text.substring(0, 3000) + "\n...\n" + text.substring(text.length - 3000)
    : text;
  
  try {
    const ai = getGeminiClient();
    const prompt = `Đọc văn bản tuyển sinh sau đây và trích xuất ngày ký hoặc ngày ban hành chính thức của văn bản này.
Trả về một chuỗi JSON duy nhất chứa thuộc tính "issuedDate" định dạng YYYY-MM-DD (Ví dụ: { "issuedDate": "2026-06-07" }).
Nếu không thể xác định hoặc không tìm thấy ngày cụ thể trong văn bản, hãy trả về { "issuedDate": null }.
Văn bản:
${sampleText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const reply = response.text || "{}";
    const result = JSON.parse(reply.trim());
    
    if (result.issuedDate && /^\d{4}-\d{2}-\d{2}$/.test(result.issuedDate)) {
      return result.issuedDate;
    }
  } catch (e) {
    console.error("Error extracting date via Gemini:", e);
  }
  
  return new Date().toISOString().split("T")[0];
}

function chunkText(text: string, size = 700, overlap = 150): string[] {
  if (!text) return [];
  const chunks: string[] = [];
  let index = 0;
  
  while (index < text.length) {
    let chunk = text.substring(index, index + size);
    
    if (index + size < text.length) {
      const lastPeriod = chunk.lastIndexOf(".");
      const lastNewline = chunk.lastIndexOf("\n");
      const endBoundary = Math.max(lastPeriod, lastNewline);
      if (endBoundary > size / 2) {
        chunk = chunk.substring(0, endBoundary + 1);
      }
    }
    
    const cleaned = chunk.trim();
    if (cleaned.length > 10) {
      chunks.push(cleaned);
    }
    
    index += chunk.length - overlap;
    if (chunk.length <= overlap) {
      break;
    }
  }
  
  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.embedContent({
      model: "models/gemini-embedding-2",
      contents: text
    });
    
    if (response.embeddings && response.embeddings[0] && response.embeddings[0].values) {
      return response.embeddings[0].values;
    }
    throw new Error("No embedding values returned");
  } catch (e: any) {
    console.error("Error generating embedding:", e);
    throw new Error("Lỗi tạo vector embedding: " + e.message);
  }
}

async function generateEmbeddingsForChunks(chunks: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  const BATCH_SIZE = 5; // Safe batch size
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const promises = batch.map(chunk => generateEmbedding(chunk));
    const batchResults = await Promise.all(promises);
    embeddings.push(...batchResults);
  }
  return embeddings;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}



interface CachedLink {
  query: string;
  url: string;
  title: string;
  crawledAt: string;
}

const CACHED_LINKS_FILE = path.join(process.cwd(), "crawled_links.json");

function readCachedLinks(): CachedLink[] {
  try {
    if (!fs.existsSync(CACHED_LINKS_FILE)) {
      console.log(`[Cache] Cache file ${CACHED_LINKS_FILE} does not exist yet.`);
      return [];
    }
    const data = JSON.parse(fs.readFileSync(CACHED_LINKS_FILE, "utf-8"));
    console.log(`[Cache] Read ${data.length} cached links.`);
    return data;
  } catch (error) {
    console.error("[Cache] Error reading cached links:", error);
    return [];
  }
}

function writeCachedLinks(data: CachedLink[]): boolean {
  try {
    fs.writeFileSync(CACHED_LINKS_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[Cache] Successfully wrote ${data.length} links to ${CACHED_LINKS_FILE}`);
    return true;
  } catch (error) {
    console.error("[Cache] Error writing cached links:", error);
    return false;
  }
}

function saveGroundingMetadata(queries: string[], chunks: any[]) {
  console.log(`[Grounding] saveGroundingMetadata called with ${queries?.length || 0} queries and ${chunks?.length || 0} chunks.`);
  if (!chunks || chunks.length === 0) {
    console.log("[Grounding] No chunks to save.");
    return;
  }
  const cache = readCachedLinks();
  const queryStr = queries ? queries.join(", ") : "";

  let addedCount = 0;
  chunks.forEach((chunk) => {
    if (chunk.web && chunk.web.uri) {
      const url = chunk.web.uri;
      const title = chunk.web.title || "";

      // Check if already exists in cache
      const exists = cache.some((item) => item.url === url);
      if (!exists) {
        cache.push({
          query: queryStr,
          url: url,
          title: title,
          crawledAt: new Date().toISOString()
        });
        addedCount++;
        console.log(`[Grounding] Added link to cache: ${url} (Title: ${title})`);
      } else {
        console.log(`[Grounding] Link already exists in cache, skipping: ${url}`);
      }
    }
  });

  if (addedCount > 0) {
    writeCachedLinks(cache);
  } else {
    console.log("[Grounding] No new links added to cache.");
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
  // RECOMMENDATION SYSTEM API
  // ----------------------------------------
  app.post("/api/recommendations/holland", async (req: Request, res: Response) => {
    try {
      const { scores, userInfo } = req.body;
      if (!scores) {
        res.status(400).json({ error: "Missing scores in request body" });
        return;
      }

      const majors = readMajors().filter(m => m.is_active);
      const majorsDataStr = majors.map(m => `- ${m.name} (${m.code}, Khoa: ${m.faculty}, Lĩnh vực: ${m.category}): ${m.description} | Cơ hội việc làm: ${m.career_prospects}`).join("\n");

      const prompt = `Bạn là một chuyên gia tư vấn hướng nghiệp xuất sắc của Trường Đại học Vinh.
Dưới đây là điểm số trắc nghiệm tính cách Holland (RIASEC) của thí sinh tuyển sinh (thang điểm từ 3 đến 15 cho mỗi nhóm, trong đó điểm càng cao nghĩa là mức độ tương thích với nhóm đó càng lớn):
- Realistic (Thực tế - R): ${scores.R || 0}/15
- Investigative (Nghiên cứu - I): ${scores.I || 0}/15
- Artistic (Nghệ thuật - A): ${scores.A || 0}/15
- Social (Xã hội - S): ${scores.S || 0}/15
- Enterprising (Kinh doanh/Quản lý - E): ${scores.E || 0}/15
- Conventional (Nghiệp vụ/Hành chính - C): ${scores.C || 0}/15

Thông tin thí sinh: ${userInfo ? JSON.stringify(userInfo) : "Thí sinh tự do"}

Danh sách các ngành đào tạo thực tế hiện có của trường Đại học Vinh:
${majorsDataStr}

Hãy viết một báo cáo phân tích hướng nghiệp chi tiết, chất lượng cao, định dạng bằng Markdown đẹp mắt (sử dụng các tiêu đề, danh sách, in đậm, emoji bắt mắt) gồm các phần sau:
1. **Phân tích nhóm tính cách nổi trội (Holland Code)**: Xác định mã Holland của thí sinh (ví dụ: SEC, IAS...), giải thích ý nghĩa tính cách, ưu điểm vượt trội và xu hướng nghề nghiệp chung của nhóm này.
2. **Gợi ý ngành học tại Đại học Vinh**: Đề xuất cụ thể 2-3 ngành học trong danh sách trên của Đại học Vinh phù hợp nhất với kết quả này. Với mỗi ngành học gợi ý, cần làm nổi bật:
   - Tên ngành & Mã ngành.
   - Lý do chi tiết tại sao ngành này cực kỳ phù hợp với điểm số trắc nghiệm và nhóm tính cách của bạn (kết hợp phân tích năng lực và sở thích).
   - Cơ hội nghề nghiệp tiêu biểu sau khi tốt nghiệp.
3. **Lời khuyên & Lộ trình rèn luyện**: Lời khuyên định hướng học tập, phát triển kỹ năng mềm cần thiết để phát huy tối đa điểm mạnh tính cách này.

Lưu ý:
- Phải phản hồi hoàn toàn bằng tiếng Việt tự nhiên, truyền cảm hứng, chuyên nghiệp và lịch sự.
- Các ngành học được khuyên dùng BẮT BUỘC phải nằm trong danh sách ngành học thực tế của Đại học Vinh đã được cung cấp ở trên. Không tự ý gợi ý ngành học mà trường không đào tạo.
- Sử dụng cách xưng hô thân thiện: "Bạn"/"Em" và "Chuyên gia tư vấn"/"Heulwen AI".`;

      const ai = getGeminiClient();
      let response;
      let lastError;
      const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

      for (const modelName of modelsToTry) {
        try {
          console.log(`[Holland AI] Querying model ${modelName}...`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.7
            }
          });
          if (response) {
            console.log(`[Holland AI] Successfully generated report using model ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.warn(`[Holland AI] Model ${modelName} failed:`, err.message || err);
          lastError = err;
        }
      }

      if (!response) {
        throw lastError || new Error("All Gemini models failed to analyze Holland test.");
      }

      const analysis = response.text || "Không thể phân tích dữ liệu trắc nghiệm lúc này. Vui lòng thử lại.";
      res.json({ analysis });
    } catch (error: any) {
      console.error("Error in Holland recommendation API:", error);
      res.status(500).json({ error: "Internal server error: " + error.message });
    }
  });

  // ----------------------------------------
  // AI PROFILE ANALYSIS API
  // ----------------------------------------
  app.post("/api/recommendations/profile-analysis", async (req: Request, res: Response) => {
    try {
      const { gpa10, gpa11, gpa12, examScores, ielts, awards, schoolType } = req.body;

      const prompt = `Bạn là một chuyên gia tư vấn tuyển sinh cao cấp của Trường Đại học Vinh.
Hãy phân tích hồ sơ học tập THPT của thí sinh dưới đây và đánh giá độ mạnh/thế mạnh (%) của hồ sơ này đối với 3 nhóm phương thức tuyển sinh chính:
1. **Xét học bạ (academicRecord)**: Dựa vào GPA lớp 10, 11, 12.
2. **Xét điểm thi tốt nghiệp THPT (nationalExam)**: Dựa vào điểm thi tốt nghiệp THPT dự kiến/thi thử của 3 môn.
3. **Xét tuyển thẳng & Kết hợp chứng chỉ (specialAdmission)**: Dựa vào trường chuyên/thường, chứng chỉ tiếng Anh (IELTS/VSTEP), và giải thưởng HSG/KHKT.

Dữ liệu hồ sơ của thí sinh:
- Điểm trung bình GPA lớp 10: ${gpa10}/10
- Điểm trung bình GPA lớp 11: ${gpa11}/10
- Điểm trung bình GPA lớp 12: ${gpa12}/10
- Điểm thi tốt nghiệp THPT dự kiến/thi thử 3 môn:
  * Môn 1: ${examScores?.subject1 || 0}/10
  * Môn 2: ${examScores?.subject2 || 0}/10
  * Môn 3: ${examScores?.subject3 || 0}/10
  * Tổng điểm 3 môn: ${(parseFloat(examScores?.subject1) || 0) + (parseFloat(examScores?.subject2) || 0) + (parseFloat(examScores?.subject3) || 0)}/30
- Chứng chỉ tiếng Anh: ${ielts === "none" ? "Không có" : ielts}
- Giải thưởng học thuật: ${awards === "none" ? "Không có" : awards === "national_hsg" ? "Giải HSG Quốc gia" : awards === "provincial_hsg" ? "Giải HSG cấp Tỉnh" : "Giải Cuộc thi Khoa học Kỹ thuật"}
- Loại hình trường THPT: ${schoolType === "specialized" ? "Trường THPT Chuyên" : "Trường THPT Thường"}

Hãy tính toán điểm số thế mạnh (%) từ 0 đến 100 cho 3 nhóm phương thức này.
Yêu cầu trả về định dạng JSON chuẩn với các khóa:
{
  "scores": {
    "academicRecord": số_nguyên_từ_0_đến_100,
    "nationalExam": số_nguyên_từ_0_đến_100,
    "specialAdmission": số_nguyên_từ_0_đến_100
  },
  "analysis": "Báo cáo tư vấn chi tiết viết bằng định dạng Markdown bằng tiếng Việt tự nhiên, gồm các phần: Đánh giá tổng quan hồ sơ (đặc biệt nhấn mạnh điểm cộng nếu học trường chuyên, có chứng chỉ IELTS/VSTEP, đạt giải HSG), phân tích cụ thể cơ hội của từng phương thức xét tuyển, chiến thuật phân bổ nguyện vọng khuyên dùng, và khuyến cáo tuyển sinh."
}

Lưu ý: Chỉ trả về JSON nguyên bản, không thêm các ký tự bao bọc hay văn bản mô tả nào khác ngoài khối JSON.`;

      const ai = getGeminiClient();
      let response;
      let lastError;
      const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

      for (const modelName of modelsToTry) {
        try {
          console.log(`[Profile Analysis AI] Querying model ${modelName}...`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.7
            }
          });
          if (response) {
            console.log(`[Profile Analysis AI] Successfully generated report using model ${modelName}`);
            break;
          }
        } catch (err: any) {
          console.warn(`[Profile Analysis AI] Model ${modelName} failed:`, err.message || err);
          lastError = err;
        }
      }

      if (!response) {
        throw lastError || new Error("All Gemini models failed to analyze profile.");
      }

      const jsonText = response.text || "{}";
      const resultData = JSON.parse(jsonText.trim());
      res.json(resultData);
    } catch (error: any) {
      console.error("Error in Profile Analysis API:", error);
      res.status(500).json({ error: "Internal server error: " + error.message });
    }
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


  app.get("/api/scholarships", (req: Request, res: Response) => {
    res.json(VINH_UNI_SCHOLARSHIPS);
  });

  app.get("/api/guidelines", (req: Request, res: Response) => {
    res.json(GENERAL_ENROLL_GUIDELINES);
  });



  // ----------------------------------------
  // REALTIME REPORTS ANALYTICS API
  // ----------------------------------------
  app.get("/api/analytics", (req: Request, res: Response) => {
    try {
      const majors = readMajors();
      const faqs = readFAQs();
      const posts = readPosts();
      const users = readUsers();

      const activeMajors = majors.filter(m => m.is_active);
      const sortedByQuota = [...activeMajors]
        .sort((a, b) => b.quota - a.quota)
        .slice(0, 10);
      const majorChartData = sortedByQuota.map(m => ({
        name: m.name,
        code: m.code,
        "Chỉ tiêu": m.quota
      }));

      const categoryCounts: Record<string, number> = {};
      activeMajors.forEach(m => {
        categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
      });
      const colors = ["#C8A951", "#1A3A6B", "#10b981", "#6366f1", "#f59e0b", "#ef4444"];
      const categoryChartData = Object.keys(categoryCounts).map((cat, idx) => ({
        name: cat,
        value: categoryCounts[cat],
        fill: colors[idx % colors.length]
      }));

      res.json({
        summary: {
          totalRegistrations: activeMajors.length, // Display in center of pie chart
          approvedTotal: faqs.filter(f => f.is_active).length,
          actionRequiredTotal: posts.length,
          pendingTotal: users.length,
          averageScores: 0
        },
        charts: {
          statusDistribution: [],
          methodDistribution: categoryChartData,
          majorDistribution: majorChartData
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
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
        if (profile.picture && profile.picture !== user.picture) {
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
    res.json({ success: true, user: users[idx] });
  });
 
  // ----------------------------------------
  // DOCUMENTS MANAGEMENT API
  // ----------------------------------------
  app.get("/api/documents", (req: Request, res: Response) => {
    const docs = readDocuments();
    // Omit embedding values for lightweight JSON response
    const safeDocs = docs.map(d => ({
      id: d.id,
      original_name: d.original_name,
      file_name: d.file_name,
      created_at: d.created_at,
      issued_at: d.issued_at,
      is_outdated: d.is_outdated,
      chunk_count: d.chunk_count
    }));
    res.json(safeDocs);
  });

  app.get("/api/documents/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const docs = readDocuments();
    const doc = docs.find(d => d.id === id);
    if (!doc) {
      res.status(404).json({ error: "Không tìm thấy tài liệu" });
      return;
    }
    const textToShow = doc.full_text || doc.chunks.map(c => c.text).join("\n\n");
    res.json({
      id: doc.id,
      original_name: doc.original_name,
      file_name: doc.file_name,
      created_at: doc.created_at,
      issued_at: doc.issued_at,
      is_outdated: doc.is_outdated,
      chunk_count: doc.chunk_count,
      full_text: textToShow
    });
  });

  app.post("/api/documents", uploadDocument.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Không tìm thấy tệp tải lên. Vui lòng chọn tệp và thử lại." });
        return;
      }

      // Decode filename to UTF-8 to handle Vietnamese characters properly
      const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");

      console.log(`[Upload] Processing document upload: ${originalName} (${req.file.mimetype})`);
      const fileBuffer = fs.readFileSync(req.file.path);
      const ext = path.extname(originalName).toLowerCase();
      let fullText = "";

      if (ext === ".pdf") {
        fullText = await extractTextFromPdf(fileBuffer);
      } else if (ext === ".docx") {
        fullText = await extractTextFromDocx(fileBuffer);
      } else if (ext === ".txt") {
        fullText = await extractTextFromTxt(fileBuffer);
      } else {
        res.status(400).json({ error: "Chỉ hỗ trợ các định dạng tệp .pdf, .docx, .txt" });
        return;
      }

      if (!fullText || fullText.trim().length === 0) {
        res.status(400).json({ error: "Tài liệu trống hoặc không thể trích xuất văn bản." });
        return;
      }

      // Auto extract date from document text
      const extractedDate = await extractDateFromText(fullText);
      console.log(`[Upload] Extracted date for document: ${extractedDate}`);

      const chunks = chunkText(fullText);
      console.log(`[Upload] Chunked document into ${chunks.length} segments.`);

      if (chunks.length === 0) {
        res.status(400).json({ error: "Tài liệu quá ngắn để phân mảnh và vector hóa." });
        return;
      }

      // Generate embeddings
      const embeddings = await generateEmbeddingsForChunks(chunks);
      console.log(`[Upload] Generated ${embeddings.length} embeddings.`);

      const docChunks = chunks.map((text, idx) => ({
        text,
        embedding: embeddings[idx]
      }));

      const newDoc: AIDocument = {
        id: "doc_" + Date.now(),
        original_name: originalName,
        file_name: req.file.filename,
        full_text: fullText,
        created_at: new Date().toISOString(),
        issued_at: extractedDate,
        is_outdated: false,
        chunk_count: chunks.length,
        chunks: docChunks
      };

      const allDocs = readDocuments();
      allDocs.push(newDoc);

      // Re-evaluate outdated flags for all docs based on newest issued_at date
      const maxDate = allDocs.reduce((max, d) => d.issued_at > max ? d.issued_at : max, "0000-00-00");
      allDocs.forEach(d => {
        d.is_outdated = d.issued_at < maxDate;
      });

      // Update newDoc outdated status in memory for response
      const updatedNewDoc = allDocs.find(d => d.id === newDoc.id);
      if (updatedNewDoc) {
        newDoc.is_outdated = updatedNewDoc.is_outdated;
      }

      writeDocuments(allDocs);
      console.log(`[Upload] Successfully saved document: ${newDoc.original_name}. Outdated status: ${newDoc.is_outdated}`);

      // If the document is the newest one (not outdated), trigger automatic database sync for majors!
      if (!newDoc.is_outdated) {
        console.log(`[Upload] Document is the newest. Triggering automatic database sync for majors...`);
        updateMajorsFromDocumentText(fullText).catch(err => {
          console.error("Error syncing database from upload:", err);
        });
      }

      res.status(201).json({
        id: newDoc.id,
        original_name: newDoc.original_name,
        created_at: newDoc.created_at,
        issued_at: newDoc.issued_at,
        is_outdated: newDoc.is_outdated,
        chunk_count: newDoc.chunk_count
      });
    } catch (e: any) {
      console.error("[Upload] Document upload failed:", e);
      res.status(500).json({ error: "Lỗi xử lý tài liệu: " + e.message });
    }
  });

  app.delete("/api/documents/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    let docs = readDocuments();
    const filtered = docs.filter(d => d.id !== id);

    if (filtered.length > 0) {
      const maxDate = filtered.reduce((max, d) => d.issued_at > max ? d.issued_at : max, "0000-00-00");
      filtered.forEach(d => {
        d.is_outdated = d.issued_at < maxDate;
      });
    }

    writeDocuments(filtered);
    console.log(`[Delete] Deleted document ID: ${id}`);
    res.json({ success: true });
  });

  // Helper for offline keyword-matching fallback when API is rate-limited
  function generateOfflineFallbackReply(userMessage: string, majors: any[], scholarships: any[]): string | null {
    const msg = userMessage.toLowerCase();
    
    // 1. Identify matched major
    let matchedMajor: any = null;
    for (const major of majors) {
      const nameLower = major.name.toLowerCase();
      // Match by full name, code, or common abbreviations
      const isIT = nameLower.includes("công nghệ thông tin") && (msg.includes("cntt") || msg.includes("it") || msg.includes("tin học"));
      const isTeacher = nameLower.includes("sư phạm") && msg.includes("sư phạm");
      
      if (msg.includes(major.code) || msg.includes(nameLower) || isIT) {
        matchedMajor = major;
        break;
      }
    }

    // 2. Intent-based offline replies
    if (msg.includes("chỉ tiêu") || msg.includes("chi tieu")) {
      if (matchedMajor) {
        return `Chào em! Theo thông tin mới nhất từ Ban Tuyển sinh Trường Đại học Vinh, chỉ tiêu tuyển sinh năm 2026 của ngành **${matchedMajor.name}** (Mã ngành: **${matchedMajor.code}**) là **${matchedMajor.quota}** chỉ tiêu.\n\nTổ hợp môn xét tuyển gồm: ${matchedMajor.admission_groups}. Em có thể đăng ký trực tuyến xét tuyển ngay trên website này nhé!`;
      }
    }

    if (msg.includes("học phí") || msg.includes("hoc phi") || msg.includes("tiền học") || msg.includes("nộp tiền")) {
      if (matchedMajor) {
        const formattedTuition = matchedMajor.tuition_per_year > 0 
          ? `${matchedMajor.tuition_per_year.toLocaleString('vi-VN')} VNĐ/năm` 
          : "Đang cập nhật (Miễn học phí theo Nghị định 116 đối với ngành Sư phạm)";
        return `Chào em! Học phí dự kiến năm học 2026 của ngành **${matchedMajor.name}** tại Trường Đại học Vinh là khoảng **${formattedTuition}**. Thời gian đào tạo của ngành này là ${matchedMajor.duration_years} năm.`;
      }
    }

    if (msg.includes("điểm chuẩn") || msg.includes("diem chuan") || msg.includes("điểm tuyển sinh") || msg.includes("lấy bao nhiêu")) {
      if (matchedMajor) {
        return `Chào em! Điểm trúng tuyển ngành **${matchedMajor.name}** (Mã ngành: **${matchedMajor.code}**) năm gần nhất (2025) theo các phương thức như sau:\n- **Xét theo Học bạ THPT (2025)**: ${matchedMajor.score_2023} điểm\n- **Xét theo Điểm thi THPT (2025)**: ${matchedMajor.score_2024} điểm\n\nTổ hợp xét tuyển của ngành này là: ${matchedMajor.admission_groups}. Em hãy ôn tập thật tốt để đạt kết quả cao nhé!`;
      }
    }

    if (msg.includes("học bổng") || msg.includes("hoc bong") || msg.includes("chính sách")) {
      return `Chào em! Trường Đại học Vinh luôn có nhiều chính sách học bổng hấp dẫn dành cho tân sinh viên năm 2026:\n- **Học bổng tài năng**: Miễn 100% học phí học kỳ 1 cho thí sinh đạt điểm cao môn xét tuyển.\n- **Ngành Sư phạm**: Miễn 100% học phí và hỗ trợ sinh hoạt phí 3.63 triệu đồng/tháng theo Nghị định 116.\n- **Học bổng khuyến khích**: Xét duyệt dựa trên kết quả học tập xuất sắc mỗi kỳ.\n\nEm có thể vào trang chủ -> Chọn mục "Học bổng" để xem chi tiết điều kiện nhé!`;
    }

    if (msg.includes("đăng ký") || msg.includes("dang ky") || msg.includes("nộp hồ sơ") || msg.includes("nop ho so")) {
      return `Chào em! Để đăng ký xét tuyển vào Trường Đại học Vinh năm 2026, em thực hiện theo các chỉ dẫn sau:\n1. Xem chi tiết Lịch trình và Hồ sơ cần chuẩn bị tại mục **"Tuyển sinh"** trên trang web này.\n2. Đăng ký nguyện vọng chính thức trực tuyến trên Cổng thông tin của Bộ Giáo dục & Đào tạo.\n3. Chuẩn bị và nộp minh chứng học bạ/chứng chỉ số đối với các phương thức xét tuyển sớm theo đúng thời hạn quy chế.`;
    }

    // General major info fallback
    if (matchedMajor) {
      const formattedTuition = matchedMajor.tuition_per_year > 0 
        ? `${matchedMajor.tuition_per_year.toLocaleString('vi-VN')} VNĐ/năm` 
        : "Đang cập nhật (Miễn học phí theo Nghị định 116 đối với ngành Sư phạm)";
      return `Chào em! Dưới đây là thông tin tuyển sinh tóm tắt của ngành **${matchedMajor.name}** (Mã ngành: **${matchedMajor.code}**) tại Trường Đại học Vinh:\n- **Chỉ tiêu tuyển sinh**: ${matchedMajor.quota} chỉ tiêu\n- **Tổ hợp xét tuyển**: ${matchedMajor.admission_groups}\n- **Điểm chuẩn thi THPT 2025**: ${matchedMajor.score_2024} điểm\n- **Điểm chuẩn học bạ 2025**: ${matchedMajor.score_2023} điểm\n- **Học phí dự kiến**: ${formattedTuition}\n- **Thời gian đào tạo**: ${matchedMajor.duration_years} năm\n\nEm có thể hỏi chi tiết hơn để được Heulwen AI tư vấn chuyên sâu nhé!`;
    }

    return null;
  }

  // ----------------------------------------
  // LIVE CHAT API ENDPOINTS
  // ----------------------------------------
  
  // 1. Initialize live chat session (User)
  app.post("/api/live-chats", async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        res.status(400).json({ error: "Vui lòng nhập tên và email để bắt đầu." });
        return;
      }
      
      const chats = readLiveChats();
      
      // Check if there is an active session for this user/email already
      let activeSession = chats.find(c => c.user_email === email && c.status !== "resolved");
      
      if (!activeSession) {
        activeSession = {
          id: `chat_${Date.now()}`,
          user_name: name,
          user_email: email,
          status: "waiting",
          assigned_staff_id: null,
          assigned_staff_name: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [
            {
              sender: "user",
              senderName: name,
              content: "Thí sinh đã kết nối với hàng chờ live chat. Xin chào cán bộ tuyển sinh!",
              timestamp: new Date().toISOString()
            }
          ]
        };
        chats.push(activeSession);
        writeLiveChats(chats);
        
        // Notify staff (Email/Pushover)
        let appUrl = process.env.APP_URL || "";
        if (!appUrl || appUrl.includes("localhost")) {
          const host = req.get("host") || "localhost:3000";
          const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
          appUrl = `${protocol}://${host}`;
        }
        const chatUrl = `${appUrl}/admin`;
        
        sendNotificationToStaff(
          `[Live Chat Vinh Uni] Thí sinh ${name} đang chờ hỗ trợ`,
          `Thí sinh <strong>${name}</strong> (${email}) đã tham gia hàng đợi hỗ trợ trực tuyến tuyển sinh Vinh Uni.`,
          chatUrl
        );
      }
      
      res.json({ session: activeSession });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Get active and waiting sessions (Admin/Staff)
  app.get("/api/live-chats/active", (req: Request, res: Response) => {
    try {
      const chats = readLiveChats();
      const activeChats = chats.filter(c => c.status !== "resolved");
      res.json(activeChats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Get detailed messages of a session (User & Staff polling)
  app.get("/api/live-chats/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const chats = readLiveChats();
      const session = chats.find(c => c.id === id);
      
      if (!session) {
        res.status(404).json({ error: "Phiên chat không tồn tại hoặc đã bị đóng." });
        return;
      }
      
      res.json({ session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Send message to a session (User & Staff)
  app.post("/api/live-chats/:id/messages", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { sender, senderName, content } = req.body;
      
      if (!sender || !senderName || !content) {
        res.status(400).json({ error: "Thiếu thông tin gửi tin nhắn." });
        return;
      }
      
      if (sender === "user") {
        const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
        const validation = checkSpamAndSensitive(Array.isArray(ip) ? ip[0] : ip, content);
        if (validation.isViolating) {
          res.status(400).json({ error: validation.reason });
          return;
        }
      }
      
      const chats = readLiveChats();
      const sessionIndex = chats.findIndex(c => c.id === id);
      
      if (sessionIndex === -1) {
        res.status(404).json({ error: "Phiên chat không tồn tại." });
        return;
      }
      
      const session = chats[sessionIndex];
      const newMsg: LiveChatMessage = {
        sender,
        senderName,
        content,
        timestamp: new Date().toISOString()
      };
      
      session.messages.push(newMsg);
      session.updated_at = new Date().toISOString();
      
      writeLiveChats(chats);
      res.json({ success: true, message: newMsg, session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Claim/Accept a session (Staff concurrency lock check)
  app.post("/api/live-chats/:id/claim", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { staffId, staffName } = req.body;
      
      if (!staffId || !staffName) {
        res.status(400).json({ error: "Thiếu thông tin cán bộ tiếp nhận." });
        return;
      }
      
      const chats = readLiveChats();
      const sessionIndex = chats.findIndex(c => c.id === id);
      
      if (sessionIndex === -1) {
        res.status(404).json({ error: "Phiên chat không tồn tại." });
        return;
      }
      
      const session = chats[sessionIndex];
      
      // Concurrency check
      if (session.assigned_staff_id && session.assigned_staff_id !== staffId) {
        res.status(409).json({ 
          error: `Cán bộ ${session.assigned_staff_name} đã tiếp nhận hỗ trợ cuộc trò chuyện này trước đó!` 
        });
        return;
      }
      
      // Claim the session
      session.assigned_staff_id = staffId;
      session.assigned_staff_name = staffName;
      session.status = "active";
      session.updated_at = new Date().toISOString();
      
      // System message
      session.messages.push({
        sender: "staff",
        senderName: "Hệ thống",
        content: `Cán bộ tuyển sinh ${staffName} đã tham gia hỗ trợ cuộc trò chuyện này.`,
        timestamp: new Date().toISOString()
      });
      
      writeLiveChats(chats);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Complete/Resolve session (Staff)
  app.post("/api/live-chats/:id/resolve", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const chats = readLiveChats();
      const sessionIndex = chats.findIndex(c => c.id === id);
      
      if (sessionIndex === -1) {
        res.status(404).json({ error: "Phiên chat không tồn tại." });
        return;
      }
      
      const session = chats[sessionIndex];
      session.status = "resolved";
      session.updated_at = new Date().toISOString();
      
      session.messages.push({
        sender: "staff",
        senderName: "Hệ thống",
        content: `Cuộc trò chuyện đã được kết thúc bởi cán bộ hỗ trợ.`,
        timestamp: new Date().toISOString()
      });
      
      writeLiveChats(chats);
      res.json({ success: true, session });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });



  // ----------------------------------------
  // GEMINI CHATBOT API (/api/chats)
  // ----------------------------------------
  app.post("/api/chats", async (req: Request, res: Response) => {
    let userMessage = "";
    try {
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Danh sách tin nhắn trống." });
        return;
      }

      userMessage = messages[messages.length - 1]?.content || "";
      const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
      const validation = checkSpamAndSensitive(Array.isArray(ip) ? ip[0] : ip, userMessage);
      if (validation.isViolating) {
        res.json({ reply: `⚠️ [Cảnh báo Hệ thống]: ${validation.reason}` });
        return;
      }

      const majors = readMajors();
      const publishedPosts = readPosts().filter(p => p.status === "published");
      const ai = getGeminiClient();

      // Build dynamic context based on user message keywords to keep prompt size optimized
      const userMessageLower = userMessage.toLowerCase();
      let dynamicContext = "";

      // 1. Majors context
      const needsMajors = userMessageLower.includes("ngành") || 
                           userMessageLower.includes("học gì") || 
                           userMessageLower.includes("khoa") || 
                           userMessageLower.includes("điểm chuẩn") || 
                           userMessageLower.includes("xét tuyển") || 
                           userMessageLower.includes("tổ hợp");
      if (needsMajors) {
        dynamicContext += `\n\nDANH SÁCH CÁC NGÀNH ĐÀO TẠO & ĐIỂM CHUẨN NỔI BẬT:\n${JSON.stringify(majors, null, 2)}`;
      } else {
        dynamicContext += `\n\nTrường đào tạo nhiều ngành học thuộc các lĩnh vực: Sư phạm, Công nghệ thông tin, Kinh tế, Kỹ thuật, Ngoại ngữ, Luật, Y dược,... (Nếu thí sinh hỏi cụ thể ngành học nào hoặc điểm chuẩn ngành đó, bạn hãy hướng dẫn chi tiết).`;
      }

      // 2. Scholarships context
      const needsScholarships = userMessageLower.includes("học bổng") || 
                                 userMessageLower.includes("miễn phí") || 
                                 userMessageLower.includes("hỗ trợ") || 
                                 userMessageLower.includes("nghị định 116") || 
                                 userMessageLower.includes("tiền");
      if (needsScholarships) {
        dynamicContext += `\n\nDANH SÁCH CHI TIẾT HỌC BỔNG VÀ ĐIỀU KIỆN:\n${JSON.stringify(VINH_UNI_SCHOLARSHIPS, null, 2)}`;
      }

      // 4. Articles / News context
      const needsArticles = userMessageLower.includes("tin tức") || 
                             userMessageLower.includes("thông báo") || 
                             userMessageLower.includes("bài viết") || 
                             userMessageLower.includes("sự kiện") || 
                             userMessageLower.includes("hoạt động") || 
                             userMessageLower.includes("mới nhất");
      if (needsArticles && publishedPosts.length > 0) {
        dynamicContext += `\n\nBÀI VIẾT TIN TỨC & THÔNG BÁO ĐÃ XUẤT BẢN TRÊN CỔNG TUYỂN SINH:\n${publishedPosts.map(p => `- [${p.category}] ${p.title} (${p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('vi-VN') : 'N/A'}):\n  ${p.content}`).join('\n\n')}`;
      }
 
      // 5. Document Semantic Context (RAG)
      const allDocs = readDocuments();
      let docContext = "";
      let hasRagContext = false;
      if (allDocs.length > 0) {
        try {
          const queryEmbedding = await generateEmbedding(userMessage).catch(() => null);
          if (queryEmbedding) {
            interface ScoredChunk {
              text: string;
              docId: string;
              docName: string;
              issuedAt: string;
              isOutdated: boolean;
              score: number;
              similarity: number;
            }
            const scoredChunks: ScoredChunk[] = [];

            allDocs.forEach(doc => {
              doc.chunks.forEach(chunk => {
                const sim = cosineSimilarity(queryEmbedding, chunk.embedding);
                // Combined score: 75% similarity + 25% recency bonus (not outdated)
                const score = sim * 0.75 + (doc.is_outdated ? 0 : 0.25);
                scoredChunks.push({
                  text: chunk.text,
                  docId: doc.id,
                  docName: doc.original_name,
                  issuedAt: doc.issued_at,
                  isOutdated: doc.is_outdated,
                  score,
                  similarity: sim
                });
              });
            });

            // Sort by combined score descending
            scoredChunks.sort((a, b) => b.score - a.score);

            // Take top 5 relevant chunks (similarity threshold > 0.35)
            const relevantChunks = scoredChunks.filter(c => c.similarity > 0.35).slice(0, 5);

            if (relevantChunks.length > 0) {
              hasRagContext = true;
              console.log(`[RAG] Found ${relevantChunks.length} relevant chunks from documents.`);
              docContext = "\n\nTÀI LIỆU TUYỂN SINH THAM KHẢO THÊM (Được tìm kiếm theo ngữ nghĩa):\n" + 
                relevantChunks.map(c => {
                  const statusLabel = c.isOutdated 
                    ? `[TÀI LIỆU CŨ - Ban hành ngày ${c.issuedAt}]` 
                    : `[TÀI LIỆU MỚI NHẤT - Ban hành ngày ${c.issuedAt}]`;
                  return `${statusLabel} (Nguồn: [${c.docName}](/document/${c.docId})):\n${c.text}`;
                }).join("\n\n");
              
              dynamicContext += docContext;
            }
          }
        } catch (ragError) {
          console.error("[RAG] Semantic search failed:", ragError);
        }
      }

      const systemInstruction = `
        Bạn là "Trợ lý Tuyển sinh AI Vinh Uni" - nhân viên văn phòng tư vấn tuyển sinh tự động 24/7 của Trường Đại học Vinh.
        Nhiệm vụ của bạn là hỗ trợ tư vấn học sinh, phụ huynh giải đáp các thắc mắc về tuyển sinh năm 2026 một cách chuyên nghiệp, nhiệt tình, lịch sự, thân thiện và chính xác nhất.

        THÔNG TIN CHÍNH THỨC VỀ TRƯỜNG ĐẠI HỌC VINH (VINH UNIVERSITY):
        - Địa chỉ: 182 đường Lê Duẩn, thành phố Vinh, tỉnh Nghệ An.
        - Hotline: 0238 3855 452 | Email: tuyensinh@vinhuni.edu.vn | Website: https://vinhuni.edu.vn
        
        QUY TRÌNH HƯỚNG DẪN ĐĂNG KÝ NGUYỆN VỌNG TRỰC TUYẾN TRÊN WEBSITE:
        1. Truy cập trang "Thông tin tuyển sinh" và chọn tab "Đăng ký nguyện vọng".
        2. Điền đầy đủ thông tin: Họ tên, Email, CCCD, Số điện thoại, trường THPT, chọn ngành đăng ký, phương thức xét tuyển và nhập điểm quy đổi.
        3. Gửi hồ sơ. Hệ thống sẽ ngay lập tức gửi Email tự động xác nhận hồ sơ và kết quả xét tuyển sơ bộ về hòm thư của học sinh trong vòng vài giây.

        TRA CỨU HỒ SƠ & TRẠNG THÁI:
        Mỗi khi học sinh hỏi về trạng thái hồ sơ của họ, hãy hướng dẫn họ vào trang "Thông tin tuyển sinh" -> tab "Tra cứu kết quả" để tìm kiếm nhanh bằng CCCD hoặc Tên.
        ${dynamicContext}

        HƯỚNG DẪN TRẢ LỜI:
        1. Luôn chào hỏi trang trọng, văn phong chuẩn mực, lịch sự và chuyên nghiệp. Xưng hô là "Trường Đại học Vinh" hoặc "Ban Tuyển sinh Trường Đại học Vinh" và gọi người học là "Quý phụ huynh", "Thí sinh" hoặc "Em".
        2. Nếu thí sinh hỏi điểm chuẩn ngành, hãy so sánh điểm 2023 và 2024 để đưa ra dự báo tin cậy và khuyên họ học tập chăm chỉ.
        3. Khuyến khích học sinh đăng ký trực tuyến bằng cách hướng dẫn họ điền form ngay trên trang web này.
        4. Đối với các ngành Sư phạm, nhấn mạnh chính sách miễn học phí và hỗ trợ sinh hoạt phí theo Nghị định 116.
        5. Trả lời bằng định dạng MARKDOWN rõ ràng, mạch lạc, có cấu trúc gạch đầu dòng hoặc bảng biểu nếu cần thiết. Khi trích dẫn thông tin lấy từ nguồn tài liệu tham khảo, bạn BẮT BUỘC phải đính kèm nguyên văn link Markdown của tài liệu đó (ví dụ: [Chỉ tiêu tuyển sinh.docx](/document/doc_xxx)) đúng như định dạng đường link được cung cấp ở phần Nguồn trong ngữ cảnh để người dùng có thể nhấp vào xem trực tiếp. Tuyệt đối giữ thái độ nghiêm túc, chuẩn mực của một cơ quan giáo dục, tránh dùng các từ ngữ quá bình dân, tiếng lóng hay biểu cảm (emoji) quá đà.
        6. Nếu câu hỏi của người dùng liên quan đến thông tin thời sự, tin tức tuyển sinh bên ngoài Bộ GD&ĐT năm 2026, hoặc các sự kiện/con số tuyển sinh mới mà không có trong dữ liệu văn bản trên (ví dụ: quy chế thi THPT 2026, thời tiết, các tin tức thời sự,...), BẠN BẮT BUỘC phải sử dụng công cụ Google Search để tra cứu và trả lời dựa trên kết quả tìm kiếm thực tế. Không được tự bịa ra thông tin hoặc nói không biết nếu chưa tìm kiếm qua công cụ Search.
        7. ĐỐI VỚI CÁC CÂU HỎI NGOÀI LỀ, KHÔNG LIÊN QUAN: Hãy lịch sự từ chối trả lời, nêu rõ vai trò là Trợ lý Tuyển sinh hỗ trợ thông tin tuyển sinh của Trường Đại học Vinh, và hướng dẫn người học đặt các câu hỏi liên quan đến tuyển sinh, ngành đào tạo hoặc học bổng của nhà trường.
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

      let response;
      let lastError: any = null;

      // Extract user query caching retrieval
      const cachedLinks = readCachedLinks();

      // Check if user message matches any cached query or URL/Title keyword
      const matchedCache = cachedLinks.find(link => {
        if (!link.query) return false;
        const subQueries = link.query.toLowerCase().split(",").map(q => q.trim()).filter(Boolean);
        const normalizedMsg = userMessage.toLowerCase();
        
        return subQueries.some(q => {
          const qWords = q.split(/\s+/).filter(w => w.length > 2);
          const msgWords = normalizedMsg.split(/\s+/).filter(w => w.length > 2);
          if (qWords.length === 0 || msgWords.length === 0) return false;
          
          const qMatched = qWords.filter(w => normalizedMsg.includes(w)).length;
          const msgMatched = msgWords.filter(w => q.includes(w)).length;
          
          return (qMatched / qWords.length) >= 0.75 || (msgMatched / msgWords.length) >= 0.75;
        });
      });

      let dynamicSystemInstruction = systemInstruction;

      // If matched, inject cache content to context
      if (matchedCache) {
        console.log(`[Cache Hit] Found matched query link: "${userMessage}" -> ${matchedCache.url}`);
        dynamicSystemInstruction = `${systemInstruction}\n\nTHÔNG TIN ĐÃ TRA CỨU TỪ NGUỒN NGOÀI (Được tìm thấy trước đó tại ${matchedCache.url}):\nTiêu đề: ${matchedCache.title}\nĐường dẫn nguồn: ${matchedCache.url}\nEm có thể tham khảo đường dẫn nguồn này khi tư vấn cho thí sinh.`;
      }

      // 1. Try Google Search Grounding with gemini-2.5-flash-lite (single attempt, saves quota)
      // Skip Search Grounding if cache is matched or if we already have local RAG documents to answer the question!
      if (!matchedCache && !hasRagContext) {
        const searchAi = getSearchGeminiClient();
        const searchModelName = "gemini-2.5-flash-lite";
        
        try {
          console.log(`Trying model with Google Search Grounding: ${searchModelName}...`);
          const searchPromise = searchAi.models.generateContent({
            model: searchModelName,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              tools: [{ googleSearch: {} }]
            }
          });

          const timeoutPromise = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error("Search Grounding client timeout")), 8000)
          );

          const searchResponse = await Promise.race([searchPromise, timeoutPromise]);

          if (searchResponse) {
            response = searchResponse;
            console.log(`Successfully generated content using model: ${searchModelName} with Search Grounding`);
            
            // Debug: dump response keys to identify correct metadata path
            console.log(`[Debug] searchResponse keys:`, Object.keys(searchResponse));
            console.log(`[Debug] searchResponse.candidates exists:`, !!searchResponse.candidates);
            if (searchResponse.candidates && searchResponse.candidates.length > 0) {
              const candidate = searchResponse.candidates[0];
              console.log(`[Debug] candidate keys:`, Object.keys(candidate));
              console.log(`[Debug] candidate.groundingMetadata exists:`, !!candidate.groundingMetadata);
              if (candidate.groundingMetadata) {
                console.log(`[Debug] groundingMetadata keys:`, Object.keys(candidate.groundingMetadata));
                console.log(`[Debug] webSearchQueries:`, JSON.stringify(candidate.groundingMetadata.webSearchQueries));
                console.log(`[Debug] groundingChunks count:`, candidate.groundingMetadata.groundingChunks?.length || 0);
              }
            }

            // Save metadata to cache
            const metadata = searchResponse.candidates?.[0]?.groundingMetadata;
            if (metadata) {
              const queries = metadata.webSearchQueries || [];
              const chunks = metadata.groundingChunks || [];
              saveGroundingMetadata(queries, chunks);
            } else {
              console.log(`[Debug] No groundingMetadata found on candidate. Trying alternate paths...`);
              const altMetadata = (searchResponse as any).groundingMetadata;
              console.log(`[Debug] searchResponse.groundingMetadata:`, !!altMetadata);
              if (altMetadata) {
                const queries = altMetadata.webSearchQueries || [];
                const chunks = altMetadata.groundingChunks || [];
                saveGroundingMetadata(queries, chunks);
              }
            }
          }
        } catch (searchError: any) {
          console.warn(`Search Grounding model ${searchModelName} failed/timed out:`, searchError.message || searchError);
          lastError = searchError;
        }
      }

      // 2. Standard generation fallback 1 (gemini-2.5-flash, standard model)
      if (!response) {
        const fallbackModel1 = "gemini-2.5-flash";
        try {
          console.log(`Trying standard fallback model 1: ${fallbackModel1}...`);
          response = await ai.models.generateContent({
            model: fallbackModel1,
            contents,
            config: {
              systemInstruction: dynamicSystemInstruction,
              temperature: 0.7
            }
          });
          console.log(`Successfully generated standard content using model: ${fallbackModel1}`);
        } catch (modelError: any) {
          console.warn(`Standard fallback model 1 ${fallbackModel1} failed:`, modelError.message || modelError);
          lastError = modelError;
        }
      }

      // 3. Standard generation fallback 2 (gemini-2.5-flash-lite, standard lite model without search grounding)
      if (!response) {
        const fallbackModel2 = "gemini-2.5-flash-lite";
        try {
          console.log(`Trying standard fallback model 2: ${fallbackModel2}...`);
          response = await ai.models.generateContent({
            model: fallbackModel2,
            contents,
            config: {
              systemInstruction: dynamicSystemInstruction,
              temperature: 0.7
            }
          });
          console.log(`Successfully generated standard content using model: ${fallbackModel2}`);
        } catch (modelError: any) {
          console.warn(`Standard fallback model 2 ${fallbackModel2} failed:`, modelError.message || modelError);
          lastError = modelError;
        }
      }

      if (!response) {
        throw lastError || new Error("All Gemini models failed to generate content.");
      }

      const botReply = response.text || "Vinh Uni đã tiếp nhận câu hỏi của em. Thầy/Cô đang kết nối hệ thống dữ liệu để tư vấn kỹ hơn, vui lòng hỏi lại câu khác nhé!";
      res.json({ reply: botReply });
    } catch (error: any) {
      console.error("Gemini server error:", error);
      
      // Try local offline rule-based fallback first to avoid rate limits for common questions
      try {
        const currentMajors = readMajors();
        const offlineReply = generateOfflineFallbackReply(userMessage, currentMajors, VINH_UNI_SCHOLARSHIPS);
        if (offlineReply) {
          console.log(`[Offline Fallback] Successfully served offline answer for: "${userMessage}"`);
          res.json({ reply: offlineReply });
          return;
        }
      } catch (fallbackErr) {
        console.error("Offline fallback failed:", fallbackErr);
      }

      res.json({ 
        error: "Lỗi kết nối Trợ lý Tuyển sinh AI: " + error.message,
        reply: "Chào em! Hệ thống Trợ lý Tuyển sinh AI Vinh Uni hiện tại đang nhận được rất nhiều câu hỏi cùng lúc từ các thí sinh. Em vui lòng đợi khoảng 1 phút rồi tải lại trang và hỏi lại, hoặc có thể liên hệ trực tiếp hotline *0238.3855.452* để được hỗ trợ ngay nhé!" 
      });
    }
  });

  // Serve static UI assets in production or connect Vite dev server
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode, hooking up Vite middleware...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          ignored: ["**/*.json"]
        }
      },
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
