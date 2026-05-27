export interface MajorInfo {
  code: string; // Mã ngành
  name: string; // Tên ngành
  group: string; // Nhóm ngành
  slots: number; // Chỉ tiêu tuyển sinh 2026
  exemptScore2024: number; // Điểm chuẩn THPT 2024
  exemptScore2025: number; // Điểm chuẩn THPT 2025
  transcriptScore2025: number; // Điểm chuẩn Học bạ 2025
  tuition: string; // Học phí ước tính (triệu VNĐ/năm)
  duration: string; // Thời gian đào tạo (năm)
  degree: string; // Văn bằng tốt nghiệp (Cử nhân, Kỹ sư...)
  description: string; // Mô tả ngắn
  jobOpportunities: string[]; // Cơ hội nghề nghiệp tiêu biểu
  subjectGroups: string[]; // Khối xét tuyển (A00, A01...)
}

export interface Scholarship {
  id: string;
  name: string;
  value: string;
  slots: string;
  criteria: string;
  description: string;
  category: "talented" | "needs-based" | "partner" | "incentive";
}

export const VINH_UNI_MAJORS: MajorInfo[] = [
  {
    code: "7480201",
    name: "Công nghệ thông tin",
    group: "Công nghệ & Kỹ thuật",
    slots: 220,
    exemptScore2024: 22.5,
    exemptScore2025: 23.8,
    transcriptScore2025: 26.5,
    tuition: "18.5",
    duration: "4",
    degree: "Kỹ sư / Cử nhân",
    description: "Đào tạo kỹ sư CNTT phát triển phần mềm, quản trị mạng, an toàn thông tin và trí tuệ nhân tạo.",
    jobOpportunities: [
      "Kỹ sư phát triển phần mềm (Frontend, Backend, Fullstack)",
      "Chuyên viên bảo mật & quản trị hệ thống mạng",
      "Kỹ sư dữ liệu và AI",
      "Quản lý dự án công nghệ thông tin (PM/Scrum Master)"
    ],
    subjectGroups: ["A00", "A01", "D01", "D07"]
  },
  {
    code: "7480101",
    name: "Khoa học máy tính",
    group: "Công nghệ & Kỹ thuật",
    slots: 100,
    exemptScore2024: 21.0,
    exemptScore2025: 22.5,
    transcriptScore2025: 25.0,
    tuition: "18.5",
    duration: "4",
    degree: "Cử nhân",
    description: "Nghiên cứu sâu về thuật toán, cấu trúc dữ liệu, học máy và tối ưu hóa hệ thống máy tính phức tạp.",
    jobOpportunities: [
      "Nhà nghiên cứu về Khoa học dữ liệu (Data Scientist)",
      "Kỹ sư AI/Machine Learning",
      "Chuyên viên phát triển thuật toán và lõi hệ thống phần mềm"
    ],
    subjectGroups: ["A00", "A01", "D01"]
  },
  {
    code: "7140201",
    name: "Sư phạm Toán học",
    group: "Sư phạm & Giáo dục",
    slots: 120,
    exemptScore2024: 26.5,
    exemptScore2025: 27.2,
    transcriptScore2025: 28.9,
    tuition: "0 (Hỗ trợ sinh hoạt phí theo NĐ 116)",
    duration: "4",
    degree: "Cử nhân Sư phạm",
    description: "Đào tạo giáo viên dạy Toán chất lượng cao cho các trường THPT, THCS và giảng viên Cao đẳng, Đại học.",
    jobOpportunities: [
      "Giáo viên môn Toán tại các trường công lập, tư thục, quốc tế",
      "Giảng viên Toán học tại các cơ sở đào tạo",
      "Chuyên viên nghiên cứu toán lý thuyết và ứng dụng giáo dục"
    ],
    subjectGroups: ["A00", "A01", "D07"]
  },
  {
    code: "7140217",
    name: "Sư phạm Ngữ văn",
    group: "Sư phạm & Giáo dục",
    slots: 110,
    exemptScore2024: 26.0,
    exemptScore2025: 26.8,
    transcriptScore2025: 28.5,
    tuition: "0 (Hỗ trợ sinh hoạt phí theo NĐ 116)",
    duration: "4",
    degree: "Cử nhân Sư phạm",
    description: "Nuôi dưỡng tinh thần yêu văn học, rèn luyện kỹ năng truyền thụ tri thức môn Ngữ văn và tư duy ngôn ngữ xuất sắc.",
    jobOpportunities: [
      "Giáo viên dạy Văn cấp 2, cấp 3",
      "Biên tập viên báo chí, đài truyền hình, nhà xuất bản",
      "Chuyên viên truyền thông, PR, sáng tạo nội dung (Content Creator)"
    ],
    subjectGroups: ["C00", "D01", "D15"]
  },
  {
    code: "7140231",
    name: "Sư phạm Tiếng Anh",
    group: "Sư phạm & Giáo dục",
    slots: 140,
    exemptScore2024: 25.8,
    exemptScore2025: 26.5,
    transcriptScore2025: 28.2,
    tuition: "0 (Hỗ trợ sinh hoạt phí theo NĐ 116)",
    duration: "4",
    degree: "Cử nhân Sư phạm",
    description: "Trang bị năng lực giảng dạy tiếng Anh vượt trội, am hiểu phương pháp giảng dạy hiện đại và văn hóa Anh-Mỹ.",
    jobOpportunities: [
      "Giáo viên Tiếng Anh tại các trường phổ thông và trung tâm Ngoại ngữ lớn",
      "Chuyên viên hợp tác quốc tế trong cơ quan giáo dục",
      "Người dịch thuật biên-phiên dịch chuyên nghiệp"
    ],
    subjectGroups: ["D01", "D15", "D96"]
  },
  {
    code: "7340101",
    name: "Quản trị kinh doanh",
    group: "Kinh tế & Quản lý",
    slots: 180,
    exemptScore2024: 20.5,
    exemptScore2025: 21.8,
    transcriptScore2025: 24.5,
    tuition: "16.0",
    duration: "4",
    degree: "Cử nhân",
    description: "Đào tạo nhà quản trị năng động toàn diện: Lập chiến lược, tiếp thị, quản trị nhân sự, chuỗi cung ứng và đổi mới sáng tạo.",
    jobOpportunities: [
      "Chuyên viên Marketing, Sale, chăm sóc khách hàng",
      "Trưởng nhóm phòng Nhân sự, Kế hoạch, Quản trị sản xuất",
      "Người khởi nghiệp sáng lập doanh nghiệp hoặc tư vấn chiến lược kinh doanh"
    ],
    subjectGroups: ["A00", "A01", "D01", "D07"]
  },
  {
    code: "7340201",
    name: "Tài chính - Ngân hàng",
    group: "Kinh tế & Quản lý",
    slots: 130,
    exemptScore2024: 20.0,
    exemptScore2025: 21.2,
    transcriptScore2025: 23.8,
    tuition: "16.0",
    duration: "4",
    degree: "Cử nhân",
    description: "Quản trị dòng tiền doanh nghiệp, tín dụng ngân hàng, đầu tư chứng khoán, bảo hiểm và phân tích tài chính.",
    jobOpportunities: [
      "Chuyên viên tín dụng, dịch vụ khách hàng tại các ngân hàng thương mại",
      "Chuyên viên phân tích đầu tư, phân tích rủi ro tài chính",
      "Kế toán viên, chuyên viên phòng tài chính tại tập đoàn thương mại"
    ],
    subjectGroups: ["A00", "A01", "D01", "D07"]
  },
  {
    code: "7380101",
    name: "Luật học",
    group: "Xã hội & Nhân văn",
    slots: 160,
    exemptScore2024: 19.5,
    exemptScore2025: 21.0,
    transcriptScore2025: 23.5,
    tuition: "15.5",
    duration: "4",
    degree: "Cử nhân Luật",
    description: "Đào tạo kiến thức luật pháp cơ bản và chuyên sâu: Luật dân sự, hình sự, hành chính, thương mại và pháp lý quốc tế.",
    jobOpportunities: [
      "Chuyên viên pháp chế tại các tập đoàn và công ty tư nhân",
      "Thư ký tòa án, kiểm sát viên, luật sư tư vấn",
      "Cán bộ tư pháp tại các cơ quan quản lý nhà nước"
    ],
    subjectGroups: ["A00", "C00", "D01"]
  },
  {
    code: "7520114",
    name: "Kỹ thuật Điện, Điện tử",
    group: "Công nghệ & Kỹ thuật",
    slots: 100,
    exemptScore2024: 17.0,
    exemptScore2025: 18.5,
    transcriptScore2025: 22.0,
    tuition: "17.5",
    duration: "4",
    degree: "Kỹ sư",
    description: "Thiết kế, chế tạo, vận hành hệ thống điện truyền tải, điện dân dụng, công nghiệp và vi mạch thông minh.",
    jobOpportunities: [
      "Kỹ sư vận hành hệ thống lưới điện, nhà máy điện (EVN)",
      "Kỹ sư R&D thiết kế vi mạch điện tử, hệ thống tự động hóa nhà máy",
      "Chuyên viên bảo trì kỹ thuật cho tòa nhà, khu chế xuất lớn"
    ],
    subjectGroups: ["A00", "A01", "D07"]
  },
  {
    code: "7220201",
    name: "Ngôn ngữ Anh",
    group: "Xã hội & Nhân văn",
    slots: 150,
    exemptScore2024: 21.5,
    exemptScore2025: 22.8,
    transcriptScore2025: 24.8,
    tuition: "16.0",
    duration: "4",
    degree: "Cử nhân",
    description: "Làm chủ 4 kỹ năng tiếng Anh chuyên sâu, am hiểu giao tiếp kinh doanh quốc tế, văn hóa và phục vụ dịch thuật dịch vụ.",
    jobOpportunities: [
      "Biên dịch viên hội nghị, tài liệu kỹ thuật tại tập đoàn nước ngoài",
      "Điều phối viên dự án phi chính phủ, phòng Quan hệ Quốc tế",
      "Hướng dẫn viên du lịch quốc tế, quản trị khách sạn có kết nối toàn cầu"
    ],
    subjectGroups: ["D01", "D15", "D96"]
  }
];

export const VINH_UNI_SCHOLARSHIPS: Scholarship[] = [
  {
    id: "sc-talented",
    name: "Học bổng Thủ khoa Đầu vào",
    value: "Miễn 100% học phí trọn khóa học",
    slots: "5 suất/năm",
    criteria: "Học sinh đỗ thủ khoa trường hoặc đạt từ 28.5 điểm thi THPT trở lên đăng ký NV1.",
    description: "Nhằm tri ân tài năng trẻ xuất sắc, cam kết đồng hành cùng các ngôi sao sáng tạo nên giá trị mới.",
    category: "talented"
  },
  {
    id: "sc-top10",
    name: "Học bổng Danh dự Vinh Uni",
    value: "Miễn 100% học phí năm học đầu tiên",
    slots: "20 suất/năm",
    criteria: "Học sinh đạt giải Nhất, Nhì quốc gia THPT hoặc tuyển thẳng trực tiếp theo quy định phổ thông.",
    description: "Dành riêng cho những hạt nhân học thuật đỉnh cao, đại diện cho tinh thần học hiệu quả của Trường Vinh.",
    category: "talented"
  },
  {
    id: "sc-overcoming",
    name: "Học bổng Tiếp sức đến trường",
    value: "5.000.000 VNĐ - 10.000.000 VNĐ",
    slots: "50 suất/năm",
    criteria: "Gia đình hoàn cảnh khó khăn (hộ nghèo/cận nghèo), học lực THPT đạt loại Khá trở lên.",
    description: "Hỗ trợ thiết thực để chắp cánh ước mơ giảng đường của các bạn học sinh có hoàn cảnh đặc biệt.",
    category: "needs-based"
  },
  {
    id: "sc-partner",
    name: "Học bổng Hợp tác Doanh nghiệp",
    value: "Hỗ trợ 50% học phí hoặc cấp Sinh hoạt phí hàng tháng",
    slots: "30 suất/năm",
    criteria: "Đặc thù khối Công nghệ (CNTT, Điện tử, Khoa học máy tính) có kết quả học tập vượt trội.",
    description: "Học bổng từ các tập đoàn đối tác (FPT, Viettel, BIDV) kèm cam kết tuyển dụng sau tốt nghiệp.",
    category: "partner"
  },
  {
    id: "sc-excellent",
    name: "Học bổng Khuyến khích Học tập",
    value: "Tương ứng mức học phí từ 50% đến 150%",
    slots: "Không giới hạn",
    criteria: "Xét theo học kỳ căn cứ vào điểm GPA từ 3.2/4.0 trở lên và điểm Rèn luyện đạt loại Tốt.",
    description: "Dành cho sinh viên đang theo học có nỗ lực vươn lên xuất sắc trong từng khóa học.",
    category: "incentive"
  }
];

export const GENERAL_ENROLL_GUIDELINES = {
  schoolName: "Trường Đại học Vinh",
  address: "Số 182, đường Lê Duẩn, thành phố Vinh, tỉnh Nghệ An",
  contact: {
    phone: "0238.3855.452",
    fax: "0238.3855.269",
    email: "tuyensinh@vinhuni.edu.vn",
    facebook: "https://facebook.com/DaiHocVinh"
  },
  methods: [
    {
      id: "thpt",
      name: "Xét tuyển theo kết quả Kỳ thi tốt nghiệp THPT",
      details: "Sử dụng tổng điểm 3 môn thi thuộc tổ hợp xét tuyển cộng điểm ưu tiên khu vực/đối tượng."
    },
    {
      id: "academic-record",
      name: "Xét học bạ THPT (Kết quả học tập bậc phổ thông)",
      details: "Sử dụng tổng điểm trung bình cả năm lớp 11 và học kỳ 1 lớp 12 (hoặc cả năm lớp 12) của các môn thuộc tổ hợp."
    },
    {
      id: "national-exam",
      name: "Xét điểm kì thi Đánh giá năng lực / Tư duy",
      details: "Sử dụng kết quả thi ĐGNL của Đại học Quốc gia Hà Nội, ĐHQG TP.HCM hoặc Kỳ thi đánh giá tư duy của ĐH Bách Khoa HN."
    },
    {
      id: "direct",
      name: "Tuyển thẳng & Ưu tiên xét tuyển",
      details: "Theo quy định của Bộ GD&ĐT và Quy chế tuyển sinh của Trường Đại học Vinh (đối với học sinh giỏi Quốc gia, trường chuyên...)"
    }
  ]
};
