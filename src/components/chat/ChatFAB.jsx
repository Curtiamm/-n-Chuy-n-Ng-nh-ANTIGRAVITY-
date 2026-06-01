import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChatFAB({ onClick, isOpen }) {
  if (isOpen) return null;
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 300 }}
      onClick={onClick}
      className="fixed bottom-8 right-8 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-[#C8A951] to-[#967C34] text-white shadow-2xl flex items-center justify-center animate-pulse-gold hover:scale-110 transition-transform duration-300"
      title="Hỏi AI Heulwen"
    >
      <Sparkles className="w-7 h-7" />
    </motion.button>
  );
}