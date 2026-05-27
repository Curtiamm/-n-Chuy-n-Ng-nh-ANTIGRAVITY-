import { MajorInfo, Scholarship } from "./data/vinhUniData";

export interface DocumentInfo {
  name: string;
  type: string; // "transcript" | "diploma" | "award" | "other"
  uploadedAt: string;
  size: string;
}

export interface StudentRegistration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  identityCard: string;
  highschool: string;
  selectedMajor: string;
  method: string;
  score: number;
  status: "pending" | "accepted" | "approved" | "action_required" | "processing";
  registeredAt: string;
  emailLogs: Array<{
    type: string;
    subject: string;
    sentAt: string;
    status: string;
    bodyPreview?: string;
  }>;
  documents?: DocumentInfo[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: Date;
}

export interface AnalyticsSummary {
  totalRegistrations: number;
  approvedTotal: number;
  actionRequiredTotal: number;
  pendingTotal: number;
  averageScores: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  charts: {
    statusDistribution: Array<{ name: string; value: number; color: string }>;
    methodDistribution: Array<{ name: string; value: number; fill: string }>;
    majorDistribution: Array<{ name: string; code: string; "Số hồ sơ": number; "Chỉ tiêu": number }>;
  };
}
