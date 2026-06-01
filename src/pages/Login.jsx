import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { GraduationCap, Sparkles, ShieldCheck, User, Mail, Lock, Eye, EyeOff, UserPlus, Info } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState('');

  // Credentials States
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from || '/';

  const handleGoogleToken = async (accessToken, endpoint) => {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) throw new Error('Không lấy được thông tin từ Google');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: accessToken }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Đăng nhập thất bại');
    }

    const data = await res.json();
    localStorage.setItem('heulwen_token', data.access_token);
    localStorage.setItem('heulwen_user', JSON.stringify(data.user));
    return data;
  };

  const handleMockLogin = async (roleType) => {
    setLoading(true);
    setError('');
    try {
      const token = roleType === 'admin' ? 'mock_admin_token' : roleType === 'staff' ? 'mock_staff_token' : 'mock_student_token';
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: token }),
      });
      if (!res.ok) throw new Error('Không thể kết nối API xác thực.');
      const data = await res.json();
      localStorage.setItem('heulwen_token', data.access_token);
      localStorage.setItem('heulwen_user', JSON.stringify(data.user));
      
      // Redirect
      if (data.user.role === 'admin' || data.user.role === 'staff') {
        window.location.href = '/admin';
      } else {
        window.location.href = from;
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister 
        ? { email, password, name, role }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || (isRegister ? 'Đăng ký thất bại' : 'Đăng nhập thất bại'));
      }

      const data = await res.json();
      localStorage.setItem('heulwen_token', data.access_token);
      localStorage.setItem('heulwen_user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'admin' || data.user.role === 'staff') {
        window.location.href = '/admin';
      } else {
        window.location.href = from;
      }
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi xác thực tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        await handleGoogleToken(tokenResponse.access_token, '/api/auth/google');
        window.location.href = from;
      } catch (err) {
        setError(err.message || 'Đã có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Đăng nhập Google thất bại. Vui lòng thử lại.'),
    flow: 'implicit',
  });

  const adminLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAdminLoading(true);
      setError('');
      try {
        await handleGoogleToken(tokenResponse.access_token, '/api/auth/admin-login');
        window.location.href = '/admin';
      } catch (err) {
        setError(err.message || 'Đã có lỗi xảy ra');
      } finally {
        setAdminLoading(false);
      }
    },
    onError: () => setError('Đăng nhập Google thất bại. Vui lòng thử lại.'),
    flow: 'implicit',
  });

  const isGoogleConfigured = !!import.meta.env.VITE_GOOGLE_CLIENT_ID && !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes('dummy');

  const handleGoogleLoginClick = () => {
    if (!isGoogleConfigured) {
      handleMockLogin('student');
    } else {
      googleLogin();
    }
  };

  const handleAdminLoginClick = () => {
    if (!isGoogleConfigured) {
      handleMockLogin('staff');
    } else {
      adminLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1931] to-[#1A3A6B] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#C8A951] flex items-center justify-center mx-auto mb-3 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-playfair text-3xl font-bold text-white mb-1">Heulwen Vinh Uni</h1>
          <p className="font-inter text-white/70 text-xs uppercase tracking-widest font-mono">Hệ thống tuyển sinh Đại học Vinh</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-playfair text-2xl font-bold text-[#0A1931]">
              {isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập hệ thống'}
            </h2>
            <p className="font-inter text-xs text-gray-500">
              {isRegister ? 'Tạo tài khoản mới để gửi hồ sơ và tra cứu tuyển sinh' : 'Đăng nhập nhanh bằng Google hoặc tài khoản mật khẩu'}
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl font-inter text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Primary Action: Google Login Buttons */}
          <div className="space-y-2.5">
            <button
              onClick={handleGoogleLoginClick}
              disabled={loading || adminLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 border border-gray-200 rounded-2xl font-inter font-semibold text-xs text-[#0A1931] hover:border-[#C8A951] hover:bg-[#C8A951]/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Đăng nhập bằng Google
            </button>

            <button
              onClick={handleAdminLoginClick}
              disabled={loading || adminLoading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-oxford text-oxford hover:bg-oxford hover:text-white rounded-2xl font-inter font-bold text-xs transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Đăng nhập Cán bộ tuyển sinh
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-150"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 font-mono text-[9px] tracking-wider">Hoặc sử dụng tài khoản</span>
            </div>
          </div>

          {/* Seeded credentials tip for login */}
          {!isRegister && (
            <div className="bg-[#1A3A6B]/5 border border-[#1A3A6B]/10 rounded-2xl p-4 font-inter text-xs text-gray-600 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-[#1A3A6B]">
                <Info className="w-4 h-4 text-[#C8A951] shrink-0" />
                <span>Tài khoản mẫu có sẵn trên hệ thống:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-[9px]">
                <div className="bg-white p-2 rounded-xl border border-gray-150">
                  <span className="block font-bold text-purple-700">1. Admin:</span>
                  <span className="block">Email: admin@vinhuni.edu.vn</span>
                  <span className="block">Mật khẩu: admin123</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-150">
                  <span className="block font-bold text-blue-700">2. Cán bộ:</span>
                  <span className="block">Email: canbo@vinhuni.edu.vn</span>
                  <span className="block">Mật khẩu: canbo123</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-150">
                  <span className="block font-bold text-amber-700">3. Thí sinh:</span>
                  <span className="block">Email: student@gmail.com</span>
                  <span className="block">Mật khẩu: student123</span>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCredentialSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 font-inter">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl font-inter text-sm focus:border-[#C8A951] focus:ring-1 focus:ring-[#C8A951] outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 font-inter">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl font-inter text-sm focus:border-[#C8A951] focus:ring-1 focus:ring-[#C8A951] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-600 font-inter">Mật khẩu</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl font-inter text-sm focus:border-[#C8A951] focus:ring-1 focus:ring-[#C8A951] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 font-inter">Vai trò trong hệ thống</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl font-inter text-sm bg-white focus:border-[#C8A951] focus:ring-1 focus:ring-[#C8A951] outline-none"
                >
                  <option value="user">Thí sinh (User)</option>
                  <option value="staff">Cán bộ Tuyển sinh (Staff)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1A3A6B] hover:bg-[#0A1931] text-white font-inter font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRegister ? <UserPlus className="w-4 h-4" /> : null}
              {loading ? (isRegister ? 'Đang tạo tài khoản...' : 'Đang xác thực...') : (isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập')}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="text-center font-inter text-xs text-gray-500 border-b border-gray-100 pb-5">
            {isRegister ? (
              <p>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); }}
                  className="text-[#C8A951] hover:underline font-bold cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </p>
            ) : (
              <p>
                Chưa có tài khoản tuyển sinh?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); }}
                  className="text-[#C8A951] hover:underline font-bold cursor-pointer"
                >
                  Đăng ký tài khoản mới
                </button>
              </p>
            )}
          </div>

          {/* Quick Mock Bypass */}
          <div className="pt-2 space-y-3">
            <span className="block text-[10px] font-bold text-gray-400 font-mono tracking-wider uppercase text-center">Đăng nhập nhanh 1-Click (Bỏ qua mật khẩu)</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleMockLogin('admin')}
                className="py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold font-inter text-[10px] rounded-xl transition-all cursor-pointer text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleMockLogin('staff')}
                className="py-2 bg-blue-50 hover:bg-blue-100 text-[#1A3A6B] font-bold font-inter text-[10px] rounded-xl transition-all cursor-pointer text-center"
              >
                Cán bộ
              </button>
              <button
                type="button"
                onClick={() => handleMockLogin('student')}
                className="py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold font-inter text-[10px] rounded-xl transition-all cursor-pointer text-center"
              >
                Thí sinh
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-[#1A3A6B]/5 p-3 rounded-2xl border border-[#1A3A6B]/10">
            <Sparkles className="w-4 h-4 text-[#C8A951] shrink-0 mt-0.5" />
            <p className="font-inter text-[10px] text-gray-500 leading-normal">
              Hệ thống tích hợp Google Single Sign-On (SSO). Nếu chạy local không cấu hình Google Client ID, khi nhấn nút Google hệ thống sẽ tự động chuyển đổi sang tài khoản mẫu để bạn thuận tiện kiểm tra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
