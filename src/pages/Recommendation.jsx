import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { localDB } from '@/lib/localDB';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeulwenChatbot from '../components/chat/HeulwenChatbot';
import ChatFAB from '../components/chat/ChatFAB';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Lock, ShieldCheck } from 'lucide-react';
import { 
  Calculator, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  Printer, 
  Download, 
  BookOpen, 
  Compass, 
  User, 
  GraduationCap, 
  CheckCircle, 
  AlertCircle, 
  Flame,
  Award,
  DollarSign,
  Clock,
  ExternalLink,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer
} from 'recharts';
import ReactMarkdown from 'react-markdown';

// Holland test questions grouped by category
const HOLLAND_GROUPS = [
  {
    key: 'R',
    title: 'Nhóm Thực tế (Realistic)',
    description: 'Thích làm việc với máy móc, công cụ, bản vẽ kỹ thuật, thích các hoạt động ngoài trời và vận động cơ thể.',
    questions: [
      { id: 1, text: 'Tôi thích tự mình sửa chữa đồ điện gia dụng hoặc các thiết bị máy móc nhỏ.' },
      { id: 2, text: 'Tôi thích các hoạt động làm việc ngoài trời, thể thao hoặc công việc đòi hỏi sức bền thể chất.' },
      { id: 3, text: 'Tôi quan tâm đến cách vận hành, lắp ráp thiết bị công nghệ hoặc máy tính.' }
    ]
  },
  {
    key: 'I',
    title: 'Nhóm Nghiên cứu (Investigative)',
    description: 'Thích tìm tòi, quan sát, phân tích, giải quyết vấn đề bằng suy luận logic và nghiên cứu khoa học.',
    questions: [
      { id: 4, text: 'Tôi thích tìm hiểu nguyên lý hoạt động của các thiết bị công nghệ và tự nhiên.' },
      { id: 5, text: 'Tôi thích giải quyết các bài toán logic hóc búa, viết code hoặc chơi các trò chơi trí tuệ.' },
      { id: 6, text: 'Tôi quan tâm đến các công trình nghiên cứu khoa học và phân tích số liệu.' }
    ]
  },
  {
    key: 'A',
    title: 'Nhóm Nghệ thuật (Artistic)',
    description: 'Có tính sáng tạo cao, giàu trí tưởng tượng, thích thể hiện bản thân qua hội họa, âm nhạc, văn học hoặc thiết kế.',
    questions: [
      { id: 7, text: 'Tôi thích vẽ tranh, chụp ảnh, viết văn, làm thơ hoặc chơi một nhạc cụ.' },
      { id: 8, text: 'Tôi muốn làm việc trong môi trường tự do sáng tạo, không gò bó theo quy tắc cứng nhắc.' },
      { id: 9, text: 'Tôi thích truyền tải thông điệp và ý tưởng thông qua thiết kế đồ họa hoặc nghệ thuật thị giác.' }
    ]
  },
  {
    key: 'S',
    title: 'Nhóm Xã hội (Social)',
    description: 'Thích giúp đỡ, hỗ trợ, giảng dạy, tư vấn, chăm sóc người khác và hoạt động cộng đồng.',
    questions: [
      { id: 10, text: 'Tôi thích lắng nghe và tư vấn, giúp đỡ bạn bè giải quyết các vấn đề cá nhân.' },
      { id: 11, text: 'Tôi cảm thấy vui và hứng thú khi giảng dạy hoặc truyền thụ kiến thức cho người khác.' },
      { id: 12, text: 'Tôi thích tham gia làm việc nhóm, tổ chức sự kiện và các hoạt động tình nguyện.' }
    ]
  },
  {
    key: 'E',
    title: 'Nhóm Kinh doanh / Quản lý (Enterprising)',
    description: 'Năng động, tự tin, thích dẫn dắt, thuyết phục người khác, đam mê kinh doanh và lãnh đạo tập thể.',
    questions: [
      { id: 13, text: 'Tôi thích thuyết phục người khác đồng ý hoặc tin theo ý kiến, dự án của mình.' },
      { id: 14, text: 'Tôi tự tin đứng ra làm trưởng nhóm, người dẫn dắt hoặc điều hành cuộc họp.' },
      { id: 15, text: 'Tôi hứng thú với việc kinh doanh, bán hàng, khởi nghiệp hoặc quản trị nhân sự.' }
    ]
  },
  {
    key: 'C',
    title: 'Nhóm Nghiệp vụ / Hành chính (Conventional)',
    description: 'Chi tiết, cẩn thận, thích làm việc với các con số, hệ thống thông tin, quy trình rõ ràng và lưu trữ hồ sơ.',
    questions: [
      { id: 16, text: 'Tôi thích làm việc có kế hoạch chi tiết, ghi chép sổ sách hoặc thống kê con số chính xác.' },
      { id: 17, text: 'Tôi cảm thấy thoải mái khi sắp xếp hồ sơ, tài liệu khoa học và làm việc theo quy trình chuẩn.' },
      { id: 18, text: 'Tôi thích sự chính xác, tỉ mỉ trong các công việc liên quan đến kiểm toán hoặc luật pháp.' }
    ]
  }
];

const ADMISSION_GROUPS = [
  'A00 (Toán, Lý, Hóa)',
  'A01 (Toán, Lý, Anh)',
  'B00 (Toán, Hóa, Sinh)',
  'C00 (Văn, Sử, Địa)',
  'D01 (Toán, Văn, Anh)',
  'D07 (Toán, Hóa, Anh)',
  'D15 (Văn, Địa, Anh)',
  'D96 (Toán, KHXH, Anh)'
];

const INSPIRATIONAL_QUOTES = [
  "Lựa chọn nghề nghiệp phù hợp là nền móng vững chắc cho tương lai thành công của bạn...",
  "Đại học Vinh luôn đồng hành cùng ước mơ và khát vọng của thế hệ trẻ...",
  "Đang kết nối hệ thống AI Heulwen để phân tích sâu kết quả tính cách của bạn...",
  "Sở thích và năng lực khi kết hợp đúng chỗ sẽ tạo nên những đột phá phi thường..."
];

function LoginGate({ tabName, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-md mx-auto my-8 p-8 bg-[#0A1931]/95 border border-[#C8A951]/30 rounded-3xl shadow-2xl relative overflow-hidden text-center text-white"
    >
      {/* Decorative glowing gradient sphere behind */}
      <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-[#C8A951]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#C8A951] via-[#967C34] to-[#C8A951]" />

      <div className="relative z-10 space-y-6">
        {/* Animated Icons Lock & Shield */}
        <div className="flex justify-center items-center gap-3">
          <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-[#C8A951] animate-pulse" />
          </div>
          {Icon && (
            <div className="w-12 h-12 bg-[#C8A951]/10 border border-[#C8A951]/20 rounded-full flex items-center justify-center shadow-md">
              <Icon className="w-6 h-6 text-[#C8A951]" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-playfair text-xl font-bold tracking-wide">
            Tính năng yêu cầu đăng nhập
          </h3>
          <p className="font-inter text-xs text-white/60 leading-relaxed max-w-sm mx-auto">
            Vui lòng đăng nhập tài khoản để sử dụng hệ thống AI phân tích chuyên sâu cho mục <span className="font-semibold text-[#C8A951]">"{tabName}"</span>.
          </p>
        </div>

        {/* Benefits Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-3 shadow-inner">
          <h4 className="text-[10px] font-bold text-[#C8A951] uppercase tracking-wider font-mono">
            Quyền lợi khi đăng nhập:
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-white/80 font-inter text-[11px]">Làm trắc nghiệm tính cách Holland kết hợp Heulwen AI</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-white/80 font-inter text-[11px]">Đánh giá học bạ số & Điểm học thuật thông minh qua AI</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-white/80 font-inter text-[11px]">Nhận báo cáo nghề nghiệp gợi ý PDF & lưu trữ lịch sử</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-white/80 font-inter text-[11px]">Tư vấn trực tiếp với cán bộ tuyển sinh Vinh Uni</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="pt-2">
          <Link
            to="/login?redirect=/recommendation"
            className="block w-full py-3 bg-gradient-to-r from-[#C8A951] to-[#967C34] hover:from-[#e5c267] hover:to-[#b79946] text-white text-xs font-bold font-inter rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg shadow-[#C8A951]/20 cursor-pointer"
          >
            Đăng nhập tài khoản
          </Link>
          <p className="text-[10px] text-white/45 mt-3 font-inter">
            Hỗ trợ đăng nhập nhanh qua Google hoặc tài khoản Email.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Recommendation() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('score'); // 'score' | 'holland' | 'profile'
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialMsg, setChatInitialMsg] = useState('');

  // 1. Score-based matching state
  const [projectedScore, setProjectedScore] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('A00 (Toán, Lý, Hóa)');
  const [scoreError, setScoreError] = useState('');
  const [hasCalculated, setHasCalculated] = useState(false);

  // 2. Holland test state
  const [currentStep, setCurrentStep] = useState(0); // 0 to 5 (6 groups of questions)
  const [answers, setAnswers] = useState(() => {
    const initial = {};
    for (let i = 1; i <= 18; i++) {
      initial[i] = 3; // Default neutral value (1-5 Likert scale)
    }
    return initial;
  });
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // 3. AI Profile Analysis state
  const [gpa10, setGpa10] = useState('');
  const [gpa11, setGpa11] = useState('');
  const [gpa12, setGpa12] = useState('');
  const [subject1, setSubject1] = useState('');
  const [subject2, setSubject2] = useState('');
  const [subject3, setSubject3] = useState('');
  const [ieltsCert, setIeltsCert] = useState('none');
  const [acadAwards, setAcadAwards] = useState('none');
  const [schoolType, setSchoolType] = useState('normal');
  const [profileError, setProfileError] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [hasProfileEvaluated, setHasProfileEvaluated] = useState(false);
  const [profileAnalysis, setProfileAnalysis] = useState('');
  const [profileScores, setProfileScores] = useState({
    academicRecord: 0,
    nationalExam: 0,
    specialAdmission: 0
  });
  const [profileQuoteIndex, setProfileQuoteIndex] = useState(0);

  const PROFILE_QUOTES = [
    "Đang phân tích điểm trung bình học bạ 3 năm THPT...",
    "Đang đánh giá điểm cộng chứng chỉ ngoại ngữ IELTS/VSTEP...",
    "Đang tính toán mức độ cạnh tranh của các phương thức tuyển sinh...",
    "Đang chuẩn bị lộ trình đăng ký nguyện vọng tối ưu cho bạn..."
  ];

  useEffect(() => {
    if (!isProfileLoading) return;
    const interval = setInterval(() => {
      setProfileQuoteIndex((prev) => (prev + 1) % PROFILE_QUOTES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isProfileLoading]);

  // Fetch majors data
  const { data: majors = [], isLoading: isMajorsLoading } = useQuery({
    queryKey: ['majors'],
    queryFn: () => localDB.Major.filter({ is_active: true }),
  });





  // Cycle quote message for loading skeleton
  useEffect(() => {
    if (!isAiLoading) return;
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % INSPIRATIONAL_QUOTES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAiLoading]);

  // Load results from localStorage if exists
  useEffect(() => {
    const savedHollandResult = localStorage.getItem('holland_result');
    if (savedHollandResult) {
      try {
        const parsed = JSON.parse(savedHollandResult);
        setAnswers(parsed.answers);
        setAiAnalysis(parsed.analysis);
        setIsQuizCompleted(true);
      } catch (e) {
        console.error("Lỗi đọc kết quả trắc nghiệm:", e);
      }
    }

    const savedProfileResult = localStorage.getItem('profile_analysis_result');
    if (savedProfileResult) {
      try {
        const parsed = JSON.parse(savedProfileResult);
        setGpa10(parsed.gpa10 || '');
        setGpa11(parsed.gpa11 || '');
        setGpa12(parsed.gpa12 || '');
        setSubject1(parsed.subject1 || '');
        setSubject2(parsed.subject2 || '');
        setSubject3(parsed.subject3 || '');
        setIeltsCert(parsed.ieltsCert || 'none');
        setAcadAwards(parsed.acadAwards || 'none');
        setSchoolType(parsed.schoolType || 'normal');
        setProfileScores(parsed.scores || { academicRecord: 0, nationalExam: 0, specialAdmission: 0 });
        setProfileAnalysis(parsed.analysis || '');
        setHasProfileEvaluated(true);
      } catch (e) {
        console.error("Lỗi đọc kết quả đánh giá hồ sơ:", e);
      }
    }
  }, []);

  const handleProfileEvaluate = async (e) => {
    e.preventDefault();
    const g10 = parseFloat(gpa10);
    const g11 = parseFloat(gpa11);
    const g12 = parseFloat(gpa12);
    const s1 = parseFloat(subject1);
    const s2 = parseFloat(subject2);
    const s3 = parseFloat(subject3);

    // Validations
    if (isNaN(g10) || g10 < 0 || g10 > 10 ||
        isNaN(g11) || g11 < 0 || g11 > 10 ||
        isNaN(g12) || g12 < 0 || g12 > 10) {
      setProfileError('Điểm trung bình GPA 3 năm phải là số từ 0.0 đến 10.0');
      return;
    }

    if (subject1 && (isNaN(s1) || s1 < 0 || s1 > 10)) {
      setProfileError('Điểm thi thử Môn 1 phải từ 0.0 đến 10.0');
      return;
    }
    if (subject2 && (isNaN(s2) || s2 < 0 || s2 > 10)) {
      setProfileError('Điểm thi thử Môn 2 phải từ 0.0 đến 10.0');
      return;
    }
    if (subject3 && (isNaN(s3) || s3 < 0 || s3 > 10)) {
      setProfileError('Điểm thi thử Môn 3 phải từ 0.0 đến 10.0');
      return;
    }

    setProfileError('');
    setIsProfileLoading(true);
    setProfileAnalysis('');

    try {
      const response = await fetch('/api/recommendations/profile-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gpa10: g10,
          gpa11: g11,
          gpa12: g12,
          examScores: {
            subject1: s1 || 0,
            subject2: s2 || 0,
            subject3: s3 || 0
          },
          ielts: ieltsCert,
          awards: acadAwards,
          schoolType
        })
      });

      if (!response.ok) {
        throw new Error("Lỗi kết nối với máy chủ AI.");
      }

      const data = await response.json();
      setProfileScores(data.scores || { academicRecord: 50, nationalExam: 50, specialAdmission: 50 });
      setProfileAnalysis(data.analysis || 'Không có phản hồi từ trợ lý AI.');
      setHasProfileEvaluated(true);
      
      // Save result in localStorage
      localStorage.setItem('profile_analysis_result', JSON.stringify({
        gpa10, gpa11, gpa12,
        subject1, subject2, subject3,
        ieltsCert, acadAwards, schoolType,
        scores: data.scores,
        analysis: data.analysis
      }));
    } catch (err) {
      console.error(err);
      setProfileAnalysis('### Rất tiếc, đã xảy ra lỗi!\n\nKhông thể kết nối hoặc gặp lỗi timeout khi yêu cầu AI phân tích học bạ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      setProfileScores({ academicRecord: 0, nationalExam: 0, specialAdmission: 0 });
      setHasProfileEvaluated(true);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleResetProfile = () => {
    localStorage.removeItem('profile_analysis_result');
    setGpa10('');
    setGpa11('');
    setGpa12('');
    setSubject1('');
    setSubject2('');
    setSubject3('');
    setIeltsCert('none');
    setAcadAwards('none');
    setSchoolType('normal');
    setProfileScores({ academicRecord: 0, nationalExam: 0, specialAdmission: 0 });
    setProfileAnalysis('');
    setHasProfileEvaluated(false);
  };

  const openChatAbout = (majorName) => {
    setChatInitialMsg(`Hãy tư vấn chi tiết cho tôi về ngành học "${majorName}". Học phí, cơ hội việc làm và chương trình đào tạo như thế nào?`);
    setChatOpen(true);
  };

  // 1. Score matching logic
  const handleScoreMatch = (e) => {
    e.preventDefault();
    const parsed = parseFloat(projectedScore);
    if (isNaN(parsed) || parsed < 0 || parsed > 30) {
      setScoreError('Điểm dự kiến phải là số hợp lệ từ 0 đến 30.');
      setHasCalculated(false);
      return;
    }
    setScoreError('');
    setHasCalculated(true);
  };

  const cleanGroup = selectedGroup.split(' ')[0]; // extracts 'A00' from 'A00 (Toán, Lý, Hóa)'

  // Filter and match majors
  const matchedMajors = majors.filter(m => {
    if (!m.admission_groups) return false;
    const groups = m.admission_groups.split(',').map(g => g.trim());
    return groups.includes(cleanGroup);
  });

  const floatScore = parseFloat(projectedScore) || 0;

  // Safe Zone: score_2024 <= floatScore - 1.5
  const safeZoneMajors = matchedMajors.filter(m => (m.score_2024 || 0) <= floatScore - 1.5)
    .sort((a, b) => (b.score_2024 || 0) - (a.score_2024 || 0));

  // Consideration Zone: floatScore - 1.5 < score_2024 <= floatScore + 1.0
  const considerationZoneMajors = matchedMajors.filter(m => {
    const score = m.score_2024 || 0;
    return score > floatScore - 1.5 && score <= floatScore + 1.0;
  }).sort((a, b) => (b.score_2024 || 0) - (a.score_2024 || 0));

  // Challenge Zone: score_2024 > floatScore + 1.0
  const challengeZoneMajors = matchedMajors.filter(m => (m.score_2024 || 0) > floatScore + 1.0)
    .sort((a, b) => (a.score_2024 || 0) - (b.score_2024 || 0));

  // 2. Holland quiz logic
  const handleAnswerSelect = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Calculate scores for RIASEC
  const calculateRiasecScores = () => {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    
    // Q1, Q2, Q3 -> Realistic
    scores.R = answers[1] + answers[2] + answers[3];
    // Q4, Q5, Q6 -> Investigative
    scores.I = answers[4] + answers[5] + answers[6];
    // Q7, Q8, Q9 -> Artistic
    scores.A = answers[7] + answers[8] + answers[9];
    // Q10, Q11, Q12 -> Social
    scores.S = answers[10] + answers[11] + answers[12];
    // Q13, Q14, Q15 -> Enterprising
    scores.E = answers[13] + answers[14] + answers[15];
    // Q16, Q17, Q18 -> Conventional
    scores.C = answers[16] + answers[17] + answers[18];

    return scores;
  };

  const handleHollandSubmit = async () => {
    const riasec = calculateRiasecScores();
    setIsAiLoading(true);
    setAiAnalysis('');
    
    try {
      const response = await fetch('/api/recommendations/holland', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: riasec,
          userInfo: user ? {
            name: user.full_name || user.email,
            email: user.email
          } : null
        })
      });
      
      if (!response.ok) {
        throw new Error("Lỗi khi kết nối với AI tư vấn.");
      }
      
      const data = await response.json();
      setAiAnalysis(data.analysis);
      setIsQuizCompleted(true);
      
      // Save result in localStorage
      localStorage.setItem('holland_result', JSON.stringify({
        answers,
        analysis: data.analysis
      }));
    } catch (error) {
      console.error(error);
      setAiAnalysis('### Rất tiếc, đã có lỗi xảy ra!\n\nHệ thống AI Heulwen không thể kết nối hoặc gặp lỗi timeout. Vui lòng kiểm tra lại kết nối mạng và nhấn nút **Thử lại**.');
      setIsQuizCompleted(true);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResetQuiz = () => {
    localStorage.removeItem('holland_result');
    const initial = {};
    for (let i = 1; i <= 18; i++) {
      initial[i] = 3;
    }
    setAnswers(initial);
    setIsQuizCompleted(false);
    setAiAnalysis('');
    setCurrentStep(0);
  };

  const riasecScores = calculateRiasecScores();

  // Prepare chart data
  const radarData = [
    { subject: 'Realistic (Kỹ thuật)', score: riasecScores.R, fullMark: 15 },
    { subject: 'Investigative (Nghiên cứu)', score: riasecScores.I, fullMark: 15 },
    { subject: 'Artistic (Nghệ thuật)', score: riasecScores.A, fullMark: 15 },
    { subject: 'Social (Xã hội)', score: riasecScores.S, fullMark: 15 },
    { subject: 'Enterprising (Kinh doanh)', score: riasecScores.E, fullMark: 15 },
    { subject: 'Conventional (Nghiệp vụ)', score: riasecScores.C, fullMark: 15 },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFD]">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      {/* Hero Section */}
      <div className="print:hidden bg-gradient-to-r from-[#0A1931] to-[#153462] pt-28 pb-16 px-6 lg:px-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(200,169,81,0.08),transparent_40%)]" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <p className="font-inter text-sm font-semibold tracking-wider text-[#C8A951] uppercase flex items-center gap-2">
              <Compass className="w-4 h-4 animate-spin-slow" /> Hỗ trợ chọn ngành thông minh
            </p>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold tracking-tight">
              Hệ thống Gợi ý Ngành học
            </h1>
            <p className="font-inter text-white/70 text-base md:text-lg max-w-2xl leading-relaxed">
              Bạn băn khoăn chưa biết lựa chọn ngành học nào? Hãy tra cứu khả năng đỗ theo điểm chuẩn các năm trước, hoặc làm bài trắc nghiệm tính cách Holland để được AI hỗ trợ phân tích hướng nghiệp.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 self-start md:self-center">
            <button
              onClick={() => setActiveTab('score')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-inter text-sm font-semibold transition-all duration-300 ${
                activeTab === 'score' 
                  ? 'bg-[#C8A951] text-white shadow-lg shadow-[#C8A951]/25' 
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
            >
              <Calculator className="w-4 h-4" /> Tư vấn điểm chuẩn
            </button>
            <button
              onClick={() => setActiveTab('holland')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-inter text-sm font-semibold transition-all duration-300 ${
                activeTab === 'holland' 
                  ? 'bg-[#C8A951] text-white shadow-lg shadow-[#C8A951]/25' 
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Trắc nghiệm Holland AI
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-inter text-sm font-semibold transition-all duration-300 ${
                activeTab === 'profile' 
                  ? 'bg-[#C8A951] text-white shadow-lg shadow-[#C8A951]/25' 
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Đánh giá hồ sơ AI
            </button>

          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-10 py-10">
        
        {/* TABS CONTENT */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: SCORE MATCHING */}
          {activeTab === 'score' && (
            <motion.div
              key="score-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="print:hidden space-y-10"
            >
              {/* Form Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 md:p-8 max-w-3xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C8A951]" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#C8A951]/10 flex items-center justify-center text-[#C8A951]">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-playfair text-xl md:text-2xl font-bold text-[#0A1931]">Tính toán khả năng đỗ ngành</h2>
                    <p className="font-inter text-xs md:text-sm text-gray-500">Nhập điểm dự kiến và tổ hợp môn thi để AI tính toán vùng an toàn tuyển sinh.</p>
                  </div>
                </div>

                <form onSubmit={handleScoreMatch} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="projected-score" className="font-inter text-sm font-medium text-gray-700">Điểm thi dự kiến (0 - 30)</label>
                    <input
                      id="projected-score"
                      type="number"
                      step="0.01"
                      placeholder="Ví dụ: 24.50"
                      value={projectedScore}
                      onChange={e => setProjectedScore(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border font-inter text-sm outline-none focus:border-[#C8A951] transition-all ${
                        scoreError ? 'border-red-500 bg-red-50/10' : 'border-gray-200'
                      }`}
                    />
                    {scoreError && <p className="font-inter text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {scoreError}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="exam-group" className="font-inter text-sm font-medium text-gray-700">Tổ hợp môn xét tuyển</label>
                    <select
                      id="exam-group"
                      value={selectedGroup}
                      onChange={e => setSelectedGroup(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] cursor-pointer bg-white"
                    >
                      {ADMISSION_GROUPS.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="sm:col-span-2 w-full mt-2 py-3.5 bg-[#0A1931] hover:bg-[#153462] text-white font-inter text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#0A1931]/10 cursor-pointer"
                  >
                    Xem gợi ý ngành phù hợp <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Matching Results */}
              {hasCalculated && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center space-y-2">
                    <h3 className="font-playfair text-2xl font-bold text-[#0A1931]">Danh sách ngành học gợi ý cho bạn</h3>
                    <p className="font-inter text-sm text-gray-500">
                      Điểm nhập vào: <span className="font-semibold text-[#C8A951]">{projectedScore}</span> · Tổ hợp: <span className="font-semibold text-[#0A1931]">{cleanGroup}</span> · Tìm thấy {matchedMajors.length} ngành tuyển sinh
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* ZONE 1: SAFE ZONE */}
                    <div className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-inter text-sm font-bold text-emerald-800">Vùng An Toàn</h4>
                          <p className="font-inter text-[11px] text-emerald-600">Khả năng đỗ &gt; 90% (Điểm chuẩn &le; {floatScore - 1.5})</p>
                        </div>
                        <span className="ml-auto bg-emerald-500 text-white font-inter text-xs font-bold px-2 py-0.5 rounded-full">{safeZoneMajors.length}</span>
                      </div>

                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {safeZoneMajors.length === 0 ? (
                          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 font-inter text-sm">
                            Không có ngành nào ở vùng này.
                          </div>
                        ) : (
                          safeZoneMajors.map(m => <MajorMatchCard key={m.id} major={m} openChat={openChatAbout} badgeColor="bg-emerald-100 text-emerald-700" />)
                        )}
                      </div>
                    </div>

                    {/* ZONE 2: CONSIDERATION ZONE */}
                    <div className="space-y-4">
                      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-inter text-sm font-bold text-amber-800">Vùng Cân Nhắc</h4>
                          <p className="font-inter text-[11px] text-amber-600">Cơ hội đỗ 50-80% ({floatScore - 1.5} &lt; Điểm chuẩn &le; {floatScore + 1.0})</p>
                        </div>
                        <span className="ml-auto bg-amber-500 text-white font-inter text-xs font-bold px-2 py-0.5 rounded-full">{considerationZoneMajors.length}</span>
                      </div>

                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {considerationZoneMajors.length === 0 ? (
                          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 font-inter text-sm">
                            Không có ngành nào ở vùng này.
                          </div>
                        ) : (
                          considerationZoneMajors.map(m => <MajorMatchCard key={m.id} major={m} openChat={openChatAbout} badgeColor="bg-amber-100 text-amber-700" />)
                        )}
                      </div>
                    </div>

                    {/* ZONE 3: CHALLENGE ZONE */}
                    <div className="space-y-4">
                      <div className="bg-[#0A1931]/5 border border-[#0A1931]/10 rounded-xl px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0A1931]/15 text-[#0A1931] flex items-center justify-center">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-inter text-sm font-bold text-[#0A1931]">Vùng Thử Thách</h4>
                          <p className="font-inter text-[11px] text-gray-500">Khả năng cạnh tranh cao (Điểm chuẩn &gt; {floatScore + 1.0})</p>
                        </div>
                        <span className="ml-auto bg-[#0A1931] text-white font-inter text-xs font-bold px-2 py-0.5 rounded-full">{challengeZoneMajors.length}</span>
                      </div>

                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                        {challengeZoneMajors.length === 0 ? (
                          <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 font-inter text-sm">
                            Không có ngành nào ở vùng này.
                          </div>
                        ) : (
                          challengeZoneMajors.map(m => <MajorMatchCard key={m.id} major={m} openChat={openChatAbout} badgeColor="bg-blue-100 text-blue-800" />)
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: HOLLAND QUIZ & AI RECOMMENDATION */}
          {activeTab === 'holland' && (
            !isAuthenticated ? (
              <LoginGate tabName="Trắc nghiệm Holland" icon={Compass} />
            ) : (
              <motion.div
                key="holland-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-10"
              >
              {!isQuizCompleted ? (
                /* QUIZ CONTAINER */
                <div className="print:hidden bg-white rounded-2xl border border-gray-100 shadow-xl max-w-3xl mx-auto overflow-hidden">
                  {/* Step Header */}
                  <div className="bg-[#0A1931] text-white p-6 md:p-8 relative">
                    <div className="absolute bottom-0 left-0 h-1 bg-[#C8A951] transition-all duration-300" style={{ width: `${((currentStep + 1) / 6) * 100}%` }} />
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-inter text-xs font-semibold tracking-wider text-[#C8A951] uppercase">Bước {currentStep + 1} / 6</span>
                      <span className="font-inter text-xs text-white/50">{HOLLAND_GROUPS[currentStep].key} - RIASEC</span>
                    </div>
                    <h3 className="font-playfair text-xl md:text-2xl font-bold">{HOLLAND_GROUPS[currentStep].title}</h3>
                    <p className="font-inter text-sm text-white/70 mt-2 leading-relaxed">{HOLLAND_GROUPS[currentStep].description}</p>
                  </div>

                  {/* Questions List */}
                  <div className="p-6 md:p-8 space-y-8">
                    {HOLLAND_GROUPS[currentStep].questions.map(q => (
                      <div key={q.id} className="space-y-4">
                        <div className="flex gap-3">
                          <span className="font-inter font-bold text-[#C8A951] mt-0.5">{q.id}.</span>
                          <p className="font-inter text-sm md:text-base font-semibold text-[#0A1931] leading-relaxed">{q.text}</p>
                        </div>

                        {/* Likert Scale */}
                        <div className="grid grid-cols-5 gap-2 max-w-xl mx-auto pt-2">
                          {[1, 2, 3, 4, 5].map(val => {
                            const labels = ['Hoàn toàn không', 'Ít quan tâm', 'Bình thường', 'Thực sự thích', 'Rất đam mê'];
                            const colors = [
                              'hover:border-red-400 hover:bg-red-50/20 active-val-1',
                              'hover:border-orange-400 hover:bg-orange-50/20 active-val-2',
                              'hover:border-yellow-400 hover:bg-yellow-50/20 active-val-3',
                              'hover:border-lime-400 hover:bg-lime-50/20 active-val-4',
                              'hover:border-emerald-400 hover:bg-emerald-50/20 active-val-5'
                            ];
                            const isSelected = answers[q.id] === val;

                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleAnswerSelect(q.id, val)}
                                className={`flex flex-col items-center justify-center p-2 border rounded-xl transition-all cursor-pointer ${
                                  isSelected 
                                    ? 'border-[#C8A951] bg-[#C8A951]/10 text-[#0A1931] font-bold shadow-md shadow-[#C8A951]/10' 
                                    : 'border-gray-200 bg-white text-gray-500 ' + colors[val-1]
                                }`}
                              >
                                <span className="font-inter text-sm md:text-base">{val}</span>
                                <span className="font-inter text-[9px] text-center hidden md:block leading-none mt-1 opacity-70">{labels[val-1]}</span>
                              </button>
                            );
                          })}
                        </div>
                        
                        {/* Mobile helper description */}
                        <p className="text-center font-inter text-xs text-gray-500 mt-2 block md:hidden">
                          Mức độ: <span className="font-bold text-[#C8A951]">
                            {answers[q.id] === 1 && "1 - Hoàn toàn không"}
                            {answers[q.id] === 2 && "2 - Ít quan tâm"}
                            {answers[q.id] === 3 && "3 - Bình thường"}
                            {answers[q.id] === 4 && "4 - Thực sự thích"}
                            {answers[q.id] === 5 && "5 - Rất đam mê"}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Control Buttons */}
                  <div className="bg-gray-50 px-6 py-5 flex items-center justify-between border-t border-gray-100">
                    <button
                      type="button"
                      disabled={currentStep === 0}
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold font-inter text-gray-600 hover:text-oxford disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Quay lại
                    </button>

                    {currentStep < 5 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0A1931] hover:bg-[#153462] text-white text-sm font-semibold font-inter rounded-xl transition-all cursor-pointer"
                      >
                        Tiếp theo <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleHollandSubmit}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#C8A951] hover:bg-[#967C34] text-white text-sm font-semibold font-inter rounded-xl transition-all shadow-md shadow-[#C8A951]/20 cursor-pointer"
                      >
                        Nộp bài trắc nghiệm <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* RESULT DASHBOARD - EXTREMELY PREMIUM */
                <div className="space-y-10">
                  <div className="print:hidden text-center max-w-2xl mx-auto space-y-4">
                    <h3 className="font-playfair text-3xl font-bold text-[#0A1931]">Kết quả trắc nghiệm hướng nghiệp Holland</h3>
                    <p className="font-inter text-sm text-gray-500">
                      Báo cáo phân tích tính cách và gợi ý các ngành đào tạo phù hợp nhất của Đại học Vinh dựa trên kết quả khảo sát của bạn.
                    </p>
                    <div className="flex justify-center gap-4 pt-2">
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-[#0A1931] text-gray-600 hover:text-[#0A1931] font-inter text-xs font-semibold rounded-xl bg-white shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Lưu báo cáo (PDF)
                      </button>
                      <button
                        onClick={handleResetQuiz}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-red-500 text-gray-600 hover:text-red-500 font-inter text-xs font-semibold rounded-xl bg-white shadow-sm transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Làm lại bài trắc nghiệm
                      </button>
                    </div>
                  </div>

                  {/* Printable Voc Report Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start relative print:block print:space-y-8">
                    
                    {/* CHART & SCORE STATS PANEL */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xl p-6 relative overflow-hidden print:border-none print:shadow-none print:p-0">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#C8A951] print:hidden" />
                      <h4 className="font-playfair text-lg font-bold text-[#0A1931] mb-6 border-b pb-3 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-[#C8A951]" /> Phân bố tính cách RIASEC
                      </h4>

                      {/* Radar Chart */}
                      <div className="h-64 sm:h-72 w-full mx-auto flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'Inter' }} />
                            <PolarRadiusAxis angle={30} domain={[0, 15]} tick={{ fontSize: 9 }} />
                            <Radar
                              name="Tính cách của bạn"
                              dataKey="score"
                              stroke="#C8A951"
                              fill="#C8A951"
                              fillOpacity={0.3}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Detailed scores */}
                      <div className="mt-6 space-y-3 print:grid print:grid-cols-2 print:gap-4 print:mt-10">
                        {radarData.map(d => (
                          <div key={d.subject} className="flex justify-between items-center border-b border-gray-50 pb-2 text-sm font-inter">
                            <span className="text-gray-600 font-medium">{d.subject}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden print:hidden">
                                <div className="h-full bg-[#C8A951]" style={{ width: `${(d.score / 15) * 100}%` }} />
                              </div>
                              <span className="font-bold text-[#0A1931]">{d.score} / 15</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI DETAILED INTERPRETATION PANEL */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-xl p-6 md:p-8 relative print:border-none print:shadow-none print:p-0">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#0A1931] print:hidden" />
                      <h4 className="font-playfair text-xl font-bold text-[#0A1931] mb-6 border-b pb-3 flex items-center gap-2 print:text-2xl print:border-b-2 print:border-black">
                        <Sparkles className="w-5 h-5 text-[#C8A951] print:hidden" /> Đánh giá nghề nghiệp & Gợi ý từ AI Heulwen
                      </h4>

                      {/* AI Report Content */}
                      <div className="prose prose-sm prose-slate max-w-none font-inter text-sm text-[#0A1931] leading-relaxed space-y-4 print:text-black print:prose-black">
                        <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h1 className="font-playfair text-2xl font-bold text-[#0A1931] mt-6 mb-3 print:text-black print:text-xl" {...props} />,
                            h2: ({node, ...props}) => <h2 className="font-playfair text-lg font-bold text-[#0A1931] mt-5 mb-2 border-l-4 border-[#C8A951] pl-2 print:text-black print:text-base print:border-black" {...props} />,
                            h3: ({node, ...props}) => <h3 className="font-inter font-bold text-[#0A1931] mt-4 mb-2 print:text-black" {...props} />,
                            p: ({node, ...props}) => <p className="font-inter text-sm text-gray-700 leading-relaxed mb-3 print:text-black" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 print:text-black" {...props} />,
                            li: ({node, ...props}) => <li className="font-inter text-sm text-gray-600 print:text-black" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-[#0A1931] print:text-black" {...props} />
                          }}
                        >
                          {aiAnalysis}
                        </ReactMarkdown>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
            )
          )}

          {/* TAB 3: AI PROFILE EVALUATION */}
          {activeTab === 'profile' && (
            !isAuthenticated ? (
              <LoginGate tabName="Đánh giá hồ sơ AI" icon={BookOpen} />
            ) : (
              <motion.div
                key="profile-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-10"
              >
              {/* Profile input Form Card */}
              <div className="print:hidden bg-white rounded-2xl border border-gray-100 shadow-xl p-6 md:p-8 max-w-4xl mx-auto relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C8A951]" />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#C8A951]/10 flex items-center justify-center text-[#C8A951]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-playfair text-xl md:text-2xl font-bold text-[#0A1931]">Đánh giá học bạ & Hồ sơ năng lực (AI)</h2>
                    <p className="font-inter text-xs md:text-sm text-gray-500">Nhập thông tin học tập và chứng chỉ để AI đánh giá cơ hội và đề xuất phương án tuyển sinh tối ưu.</p>
                  </div>
                </div>

                <form onSubmit={handleProfileEvaluate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cột trái: Điểm số */}
                    <div className="space-y-5">
                      <h3 className="font-inter text-sm font-bold text-[#0A1931] border-b pb-2">1. Kết quả học tập & Điểm thi</h3>
                      
                      {/* GPAs */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="font-inter text-xs font-medium text-gray-600">GPA Lớp 10</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ví dụ: 8.2"
                            value={gpa10}
                            onChange={e => setGpa10(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-inter text-xs font-medium text-gray-600">GPA Lớp 11</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ví dụ: 8.5"
                            value={gpa11}
                            onChange={e => setGpa11(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-inter text-xs font-medium text-gray-600">GPA Lớp 12</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ví dụ: 8.8"
                            value={gpa12}
                            onChange={e => setGpa12(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] bg-white"
                            required
                          />
                        </div>
                      </div>

                      {/* Exam Scores */}
                      <div className="space-y-3">
                        <label className="font-inter text-xs font-semibold text-gray-600 block">Điểm thi thử tốt nghiệp THPT (3 môn tổ hợp)</label>
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Môn 1"
                            value={subject1}
                            onChange={e => setSubject1(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] bg-white"
                            required
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Môn 2"
                            value={subject2}
                            onChange={e => setSubject2(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] bg-white"
                            required
                          />
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Môn 3"
                            value={subject3}
                            onChange={e => setSubject3(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] bg-white"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cột phải: Chứng chỉ */}
                    <div className="space-y-5">
                      <h3 className="font-inter text-sm font-bold text-[#0A1931] border-b pb-2">2. Chứng chỉ & Thành tích ưu tiên</h3>
                      
                      <div className="space-y-4">
                        {/* School Type */}
                        <div className="space-y-1.5">
                          <label className="font-inter text-xs font-medium text-gray-600 block">Loại hình trường THPT</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 font-inter text-sm text-gray-700 cursor-pointer">
                              <input
                                type="radio"
                                name="school-type-ai"
                                checked={schoolType === 'normal'}
                                onChange={() => setSchoolType('normal')}
                                className="accent-[#C8A951]"
                              />
                              Trường THPT thường
                            </label>
                            <label className="flex items-center gap-2 font-inter text-sm text-gray-700 cursor-pointer">
                              <input
                                type="radio"
                                name="school-type-ai"
                                checked={schoolType === 'specialized'}
                                onChange={() => setSchoolType('specialized')}
                                className="accent-[#C8A951]"
                              />
                              Trường THPT Chuyên
                            </label>
                          </div>
                        </div>

                        {/* IELTS Cert */}
                        <div className="space-y-1.5">
                          <label className="font-inter text-xs font-medium text-gray-600 block">Chứng chỉ tiếng Anh (nếu có)</label>
                          <select
                            value={ieltsCert}
                            onChange={e => setIeltsCert(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] bg-white cursor-pointer"
                          >
                            <option value="none">Không có chứng chỉ tiếng Anh</option>
                            <option value="5.5">IELTS 5.5 / VSTEP B2</option>
                            <option value="6.0">IELTS 6.0</option>
                            <option value="6.5+">IELTS 6.5+ / VSTEP C1</option>
                          </select>
                        </div>

                        {/* Academic Awards */}
                        <div className="space-y-1.5">
                          <label className="font-inter text-xs font-medium text-gray-600 block">Giải thưởng học thuật (nếu có)</label>
                          <select
                            value={acadAwards}
                            onChange={e => setAcadAwards(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 font-inter text-sm outline-none focus:border-[#C8A951] bg-white cursor-pointer"
                          >
                            <option value="none">Không có giải thưởng</option>
                            <option value="provincial_hsg">Giải Học sinh giỏi cấp Tỉnh</option>
                            <option value="national_hsg">Giải Học sinh giỏi cấp Quốc gia</option>
                            <option value="khkt">Giải Cuộc thi Khoa học Kỹ thuật (Tỉnh/QG)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {profileError && (
                    <p className="font-inter text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {profileError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0A1931] hover:bg-[#153462] text-white font-inter text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#0A1931]/10 cursor-pointer"
                  >
                    Bắt đầu phân tích hồ sơ AI <Sparkles className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Profile Results Display */}
              {hasProfileEvaluated && (
                <div className="space-y-8 animate-fade-in">
                  <div className="print:hidden text-center max-w-2xl mx-auto space-y-4">
                    <h3 className="font-playfair text-3xl font-bold text-[#0A1931]">Kết quả phân tích hồ sơ năng lực</h3>
                    <p className="font-inter text-sm text-gray-500">
                      Bản đánh giá mức độ tương thích và cơ hội trúng tuyển dựa trên học bạ, điểm thi và thành tích ưu tiên của bạn.
                    </p>
                    <div className="flex justify-center gap-4 pt-2">
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-[#0A1931] text-gray-600 hover:text-[#0A1931] font-inter text-xs font-semibold rounded-xl bg-white shadow-sm transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Lưu báo cáo (PDF)
                      </button>
                      <button
                        onClick={handleResetProfile}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:border-red-500 text-gray-600 hover:text-red-500 font-inter text-xs font-semibold rounded-xl bg-white shadow-sm transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Điền lại thông tin hồ sơ
                      </button>
                    </div>
                  </div>

                  {/* Printable Voc Report Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start relative print:block print:space-y-8">
                    
                    {/* LEFT PANEL: STRENGTH BARS */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xl p-6 relative overflow-hidden print:border-none print:shadow-none print:p-0">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#C8A951] print:hidden" />
                      <h4 className="font-playfair text-lg font-bold text-[#0A1931] mb-6 border-b pb-3 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-[#C8A951]" /> Đánh giá thế mạnh các phương thức
                      </h4>

                      <div className="space-y-6 mt-4 print:mt-10">
                        {/* 1. Academic Record */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-inter">
                            <span className="text-gray-700 font-medium">Xét tuyển Học bạ THPT (PT2)</span>
                            <span className="font-bold text-emerald-600">{profileScores.academicRecord}%</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${profileScores.academicRecord}%` }} />
                          </div>
                          <p className="font-inter text-[11px] text-gray-500">
                            Dựa vào điểm GPA học bạ lớp 10, 11 và lớp 12.
                          </p>
                        </div>

                        {/* 2. National Exam */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-inter">
                            <span className="text-gray-700 font-medium">Xét tuyển Điểm thi THPT (PT1)</span>
                            <span className="font-bold text-blue-600">{profileScores.nationalExam}%</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${profileScores.nationalExam}%` }} />
                          </div>
                          <p className="font-inter text-[11px] text-gray-500">
                            Dựa vào điểm thi tốt nghiệp THPT dự kiến/thi thử của 3 môn.
                          </p>
                        </div>

                        {/* 3. Special Admission */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-inter">
                            <span className="text-gray-700 font-medium">Tuyển thẳng & Ưu tiên xét tuyển (PT4)</span>
                            <span className="font-bold text-amber-600">{profileScores.specialAdmission}%</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${profileScores.specialAdmission}%` }} />
                          </div>
                          <p className="font-inter text-[11px] text-gray-500">
                            Đặc quyền xét tuyển thẳng khi có giải HSG, học trường chuyên hoặc có chứng chỉ IELTS/VSTEP kết hợp.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANEL: AI WRITTEN REPORT */}
                    <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-xl p-6 md:p-8 relative print:border-none print:shadow-none print:p-0">
                      <div className="absolute top-0 left-0 w-full h-1 bg-[#0A1931] print:hidden" />
                      <h4 className="font-playfair text-xl font-bold text-[#0A1931] mb-6 border-b pb-3 flex items-center gap-2 print:text-2xl print:border-b-2 print:border-black">
                        <Sparkles className="w-5 h-5 text-[#C8A951] print:hidden" /> Báo cáo tư vấn & Định hướng từ AI
                      </h4>

                      <div className="prose prose-sm prose-slate max-w-none font-inter text-sm text-[#0A1931] leading-relaxed space-y-4 print:text-black print:prose-black">
                        <ReactMarkdown 
                          components={{
                            h1: ({node, ...props}) => <h1 className="font-playfair text-2xl font-bold text-[#0A1931] mt-6 mb-3 print:text-black print:text-xl" {...props} />,
                            h2: ({node, ...props}) => <h2 className="font-playfair text-lg font-bold text-[#0A1931] mt-5 mb-2 border-l-4 border-[#C8A951] pl-2 print:text-black print:text-base print:border-black" {...props} />,
                            h3: ({node, ...props}) => <h3 className="font-inter font-bold text-[#0A1931] mt-4 mb-2 print:text-black" {...props} />,
                            p: ({node, ...props}) => <p className="font-inter text-sm text-gray-700 leading-relaxed mb-3 print:text-black" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-2 mb-4 print:text-black" {...props} />,
                            li: ({node, ...props}) => <li className="font-inter text-sm text-gray-600 print:text-black" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-semibold text-[#0A1931] print:text-black" {...props} />
                          }}
                        >
                          {profileAnalysis}
                        </ReactMarkdown>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
            )
          )}
        </AnimatePresence>

        {/* PROFILE LOADING SCREEN SKELETON */}
        <AnimatePresence>
          {isProfileLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0A1931]/40 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C8A951]" />
                
                {/* Loader animation */}
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#C8A951] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-2 bg-[#0A1931] rounded-full flex items-center justify-center text-white">
                    <BookOpen className="w-8 h-8 text-[#C8A951] animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-playfair text-lg font-bold text-[#0A1931]">Đang phân tích học bạ...</h4>
                  <p className="font-inter text-xs text-gray-500">Heulwen AI đang xử lý hồ sơ học lực của bạn</p>
                </div>

                {/* Inspirational Quote Cycler */}
                <div className="bg-[#0A1931]/5 rounded-xl p-4 border border-[#0A1931]/5 min-h-[70px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={profileQuoteIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="font-inter text-xs font-medium text-gray-600 italic leading-relaxed"
                    >
                      "{PROFILE_QUOTES[profileQuoteIndex]}"
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* LOADING SCREEN SKELETON */}
        <AnimatePresence>
          {isAiLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#0A1931]/40 backdrop-blur-md flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100 text-center space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-[#C8A951]" />
                
                {/* Loader animation */}
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-[#C8A951] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-2 bg-[#0A1931] rounded-full flex items-center justify-center text-white">
                    <Sparkles className="w-8 h-8 text-[#C8A951] animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-playfair text-lg font-bold text-[#0A1931]">Đang phân tích dữ liệu...</h4>
                  <p className="font-inter text-xs text-gray-500">Heulwen AI đang xử lý bảng câu hỏi trắc nghiệm</p>
                </div>

                {/* Inspirational Quote Cycler */}
                <div className="bg-[#0A1931]/5 rounded-xl p-4 border border-[#0A1931]/5 min-h-[70px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={quoteIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="font-inter text-xs font-medium text-gray-600 italic leading-relaxed"
                    >
                      "{INSPIRATIONAL_QUOTES[quoteIndex]}"
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} initialMessage={chatInitialMsg} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />



      {/* PRINT-ONLY CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, footer, .print\\:hidden, #chatbox-widget, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:grid {
            display: grid !important;
          }
          .print\\:border-none {
            border: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:mt-10 {
            margin-top: 2.5rem !important;
          }
        }
        
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Interactive scale focus effects */
        .active-val-1:active { transform: scale(0.95); }
        .active-val-2:active { transform: scale(0.95); }
        .active-val-3:active { transform: scale(0.95); }
        .active-val-4:active { transform: scale(0.95); }
        .active-val-5:active { transform: scale(0.95); }
      `}</style>
    </div>
  );
}

// Subcomponent: Match Major Card
function MajorMatchCard({ major, openChat, badgeColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between min-h-[210px]">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <span className={`font-inter text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>
            Điểm thi THPT: {major.score_2024}đ (2025)
          </span>
          <span className="font-inter text-[11px] text-gray-400 font-medium">#{major.code}</span>
        </div>
        <h5 className="font-playfair text-base font-bold text-[#0A1931] line-clamp-1">{major.name}</h5>
        <div className="flex items-center gap-2 text-[10px] font-inter text-gray-500 bg-gray-50 px-2 py-1 rounded-md w-fit">
          <span className="font-medium text-gray-400">Điểm chuẩn 2025:</span>
          <span>Thi THPT: <strong className="text-gray-700">{major.score_2024}</strong></span>
          {major.score_2023 && (
            <>
              <span className="text-gray-300">|</span>
              <span>Học bạ: <strong className="text-gray-700">{major.score_2023}</strong></span>
            </>
          )}
        </div>
        <p className="font-inter text-xs text-gray-500 line-clamp-2 leading-relaxed">{major.description}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-inter">
            <DollarSign className="w-3.5 h-3.5 text-gray-400" />
            <span>{major.tuition_per_year > 0 ? `${major.tuition_per_year}M/năm` : 'Miễn phí'}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 font-inter">
            <Award className="w-3.5 h-3.5 text-gray-400" />
            <span>{major.quota} chỉ tiêu</span>
          </div>
        </div>

        <button
          onClick={() => openChat(major.name)}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#C8A951]/10 hover:bg-[#C8A951] text-[#967C34] hover:text-white font-inter text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer"
        >
          Hỏi AI <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
