
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import HomePage from '@/app/page';

export default function AppContent() {
  const router = useRouter();
  
  // This component is now effectively deprecated and just renders the home page.
  // The actual routing is handled by Next.js file system router.
  // All other logic has been moved to the respective page components.
  return <HomePage />;
}

    