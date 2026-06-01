import { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import HeulwenChatbot from '../chat/HeulwenChatbot';
import ChatFAB from '../chat/ChatFAB';

export default function PageLayout({ children }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onOpenChat={() => setChatOpen(true)} />
      <main className="flex-1">{children}</main>
      <Footer />
      <HeulwenChatbot isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ChatFAB onClick={() => setChatOpen(true)} isOpen={chatOpen} />
    </div>
  );
}