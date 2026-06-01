import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/home/HeroSection';
import FeaturedSection from '../components/home/FeaturedSection';
import HeulwenChatbot from '../components/chat/HeulwenChatbot';
import ChatFAB from '../components/chat/ChatFAB';
import { usePublishedPosts } from '@/hooks/usePosts';
import { GraduationCap, Award, Globe, Star, Newspaper, Calendar, User, ArrowRight, X, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

const highlights = [
  { icon: GraduationCap, title: 'Chất lượng đào tạo', desc: 'Được công nhận đạt chuẩn kiểm định chất lượng quốc gia và quốc tế', num: 'Top 10' },
  { icon: Award, title: 'Học bổng', desc: 'Nhiều suất học bổng từ 25% đến 100% học phí cho tân sinh viên', num: '500+' },
  { icon: Globe, title: 'Hợp tác quốc tế', desc: 'Liên kết đào tạo và trao đổi sinh viên với các trường ĐH nước ngoài', num: '30+' },
  { icon: Star, title: 'Tỷ lệ việc làm', desc: 'Sinh viên tốt nghiệp có việc làm đúng ngành trong năm đầu', num: '92%' },
];

const categoryColors = {
  'Thông báo': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Tin tức': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Hướng dẫn': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Tuyển sinh': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Sự kiện': 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  'Học bổng': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
};

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: posts = [] } = usePublishedPosts();

  const POSTS_PER_PAGE = 3;
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const paginatedPosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChat={() => setChatOpen(true)} />

      <main className="flex-1">
        <HeroSection onOpenChat={() => setChatOpen(true)} />
        <FeaturedSection onOpenChat={() => setChatOpen(true)} />

        {/* Why Vinh University */}
        <section className="section-padding bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <p className="font-inter text-sm font-medium tracking-widest uppercase text-[#C8A951] mb-3">
                  Tại sao chọn Đại học Vinh?
                </p>
                <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[#0A1931] mb-5 leading-tight">
                  Nơi ươm mầm<br />
                  <span className="italic text-[#1A3A6B]">tài năng Việt</span>
                </h2>
                <div className="w-16 h-px bg-[#C8A951] mb-6" />
                <p className="font-inter text-gray-600 leading-relaxed text-lg">
                  Đại học Vinh — một trong những trung tâm đào tạo lớn nhất khu vực Bắc Trung Bộ với hơn 60 năm kinh nghiệm. Môi trường học tập tiên tiến, đội ngũ giảng viên chất lượng cao và cơ hội việc làm vượt trội.
                </p>
                <Link
                  to="/majors"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 border-2 border-[#1A3A6B] text-[#1A3A6B] font-inter font-semibold text-sm rounded-full hover:bg-[#1A3A6B] hover:text-white transition-all duration-300"
                >
                  Khám phá ngành học
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {highlights.map((h) => (
                  <div key={h.title} className="stagger-item p-5 bg-[#FCFCFD] rounded-2xl border border-gray-100 hover:border-[#C8A951]/40 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="w-10 h-10 rounded-xl bg-[#1A3A6B] flex items-center justify-center mb-3">
                      <h.icon className="w-5 h-5 text-[#C8A951]" />
                    </div>
                    <div className="font-playfair text-3xl font-bold text-[#1A3A6B] mb-1">{h.num}</div>
                    <div className="font-inter text-sm font-semibold text-[#0A1931] mb-1">{h.title}</div>
                    <p className="font-inter text-xs text-gray-500 leading-relaxed">{h.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Campus Image Banner */}
        <div className="relative h-64 md:h-96 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80"
            alt="Sinh viên Đại học Vinh học tập"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1931]/60 to-transparent flex items-end">
            <div className="px-10 pb-10">
              <p className="font-playfair text-white text-2xl md:text-3xl italic font-medium">
                "Nơi học thuật gặp gỡ tương lai"
              </p>
            </div>
          </div>
        </div>

        {/* News & Announcements Section */}
        {posts.length > 0 && (
          <section className="section-padding bg-[#FCFCFD]">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#1A3A6B]/5 rounded-full mb-4">
                  <Newspaper className="w-4 h-4 text-[#C8A951]" />
                  <span className="font-inter text-xs font-semibold text-[#1A3A6B] uppercase tracking-widest">Tin tức & Thông báo</span>
                </div>
                <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[#0A1931] mb-3">
                  Thông tin tuyển sinh <span className="italic text-[#1A3A6B]">mới nhất</span>
                </h2>
                <p className="font-inter text-gray-500 max-w-xl mx-auto">
                  Cập nhật các thông báo, hướng dẫn và tin tức tuyển sinh chính thức từ Trường Đại học Vinh.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post, idx) => (
                  <article
                    key={post.id}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-[#C8A951]/30 transition-all duration-500 cursor-pointer flex flex-col"
                    onClick={() => setSelectedPost(post)}
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {post.coverImage && (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm ${categoryColors[post.category] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'}`}>
                            <Tag className="w-3 h-3" />
                            {post.category}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-inter text-base font-bold text-[#0A1931] mb-2 line-clamp-2 group-hover:text-[#1A3A6B] transition-colors">
                        {post.title}
                      </h3>
                      <p className="font-inter text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-inter">
                          {post.author && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> {post.author}
                            </span>
                          )}
                          {post.publishedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                        <span className="text-[#C8A951] group-hover:translate-x-1 transition-transform">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#C8A951] hover:text-[#C8A951] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-400"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-inter text-sm font-semibold transition-all ${
                        currentPage === page
                          ? 'bg-[#1A3A6B] text-white shadow-lg shadow-[#1A3A6B]/20'
                          : 'border border-gray-200 text-gray-500 hover:border-[#C8A951] hover:text-[#C8A951]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#C8A951] hover:text-[#C8A951] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-400"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Full Article Modal */}
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)}>
            <div
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedPost.coverImage && (
                <div className="relative h-56 shrink-0">
                  <img src={selectedPost.coverImage} alt={selectedPost.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-6 right-6">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm mb-2 ${categoryColors[selectedPost.category] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'}`}>
                      {selectedPost.category}
                    </span>
                    <h2 className="font-playfair text-xl md:text-2xl font-bold text-white leading-tight">{selectedPost.title}</h2>
                  </div>
                </div>
              )}
              {!selectedPost.coverImage && (
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border mb-2 ${categoryColors[selectedPost.category] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'}`}>
                      {selectedPost.category}
                    </span>
                    <h2 className="font-playfair text-xl font-bold text-[#0A1931]">{selectedPost.title}</h2>
                  </div>
                  <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              )}
              <div className="px-6 pt-4 flex items-center gap-4 text-xs text-gray-400 font-inter">
                {selectedPost.author && (
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {selectedPost.author}</span>
                )}
                {selectedPost.publishedAt && (
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(selectedPost.publishedAt).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                )}
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="font-inter text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {selectedPost.content}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
    </div>
  );
}