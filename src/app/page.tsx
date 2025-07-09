
"use client";

import { ChatProvider } from '@/components/ChatProvider';
import AppContent from '@/components/page/AppContent';

export default function Home() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
