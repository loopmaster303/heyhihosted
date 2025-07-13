
"use client";

import React, { useRef } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { ScrollArea } from '../ui/scroll-area';

interface AdvancedImageSettingsPanelProps {
  onClose: () => void;
  children: React.ReactNode;
}

const AdvancedImageSettingsPanel: React.FC<AdvancedImageSettingsPanelProps> = ({
  onClose,
  children
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(panelRef, onClose);

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full mb-2 right-0 w-80 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border p-2 z-30 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
    >
      <ScrollArea className="h-full max-h-80">
        <div className="p-1">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AdvancedImageSettingsPanel;
