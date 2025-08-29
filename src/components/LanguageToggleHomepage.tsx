'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from './LanguageProvider';
import { Language } from '@/config/translations';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const LanguageToggleHomepage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 relative hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
        aria-label="Toggle language"
      >
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-white">--</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </div>
      </Button>
    );
  }

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'de', name: 'Deutsch', flag: 'DE' },
    { code: 'en', name: 'English', flag: 'EN' },
  ];

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 relative",
            "hover:bg-accent hover:text-accent-foreground",
            "transition-colors duration-200"
          )}
          aria-label="Toggle language"
        >
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-white">{currentLanguage?.flag}</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-40"
        side="bottom"
        sideOffset={8}
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              language === lang.code && "bg-accent text-accent-foreground"
            )}
          >
            <span className="text-xs font-bold text-white">{lang.flag}</span>
            <span className="font-medium">{lang.name}</span>
            {language === lang.code && (
              <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggleHomepage;
