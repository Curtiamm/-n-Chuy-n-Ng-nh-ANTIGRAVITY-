import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminSidebar({ tabs, activeTab, onSelect, badges = {}, isOpen, onClose }) {
  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      <nav className="space-y-1">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              onSelect(t.id);
              if (onClose) onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-inter text-sm transition-all ${
              activeTab === t.id ? 'bg-[#C8A951] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-3">
              <t.icon className="w-4 h-4" /> {t.label}
            </span>
            {badges[t.id] > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === t.id ? 'bg-white text-[#0A1931]' : 'bg-amber-500 text-black animate-pulse'
              }`}>
                {badges[t.id]}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on md screens and up) */}
      <div className="hidden md:block w-56 shrink-0 min-h-[calc(100vh-73px)] border-r border-white/10 p-4 bg-white/5">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Drawer (slide-out modal) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
            />
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#0A1931] border-r border-white/10 p-4 z-50 md:hidden flex flex-col gap-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
                <span className="font-playfair font-bold text-white text-md">Menu Quản Trị</span>
                <button type="button" onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {sidebarContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
