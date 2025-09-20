"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

const ImageGenSelector: React.FC = () => {
  const router = useRouter();
  const { t } = useLanguage();

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [router]);

  // Click outside handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      router.push('/');
    }
  };

  const handleLiteClick = () => {
    router.push('/image-gen/no-cost');
  };

  const handleRawClick = () => {
    router.push('/image-gen/raw');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Two Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-4">
        {/* Lite Card */}
        <div 
          onClick={handleLiteClick}
          className="group cursor-pointer relative bg-card border border-border rounded-lg p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-transparent bg-gradient-to-r from-green-400 to-green-600 bg-clip-text">LITE</h3>
          </div>
          
          <div className="space-y-2 text-muted-foreground">
            <p className="font-semibold text-sm text-transparent bg-gradient-to-r from-green-400 to-green-600 bg-clip-text">Beginner</p>
            <p className="text-sm">
              {t('tool.imageLite.hoverDescription')}
            </p>
          </div>
        </div>

        {/* Raw Card */}
        <div 
          onClick={handleRawClick}
          className="group cursor-pointer relative bg-card border border-border rounded-lg p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text">RAW</h3>
          </div>
          
          <div className="space-y-2 text-muted-foreground">
            <p className="font-semibold text-sm text-transparent bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text">Expert</p>
            <p className="text-sm">
              {t('tool.imageRaw.hoverDescription')} Videos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenSelector;
