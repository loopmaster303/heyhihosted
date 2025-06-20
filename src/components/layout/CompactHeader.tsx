
"use client";
import type React from 'react';

interface CompactHeaderProps {
  onNavigateToTiles: () => void;
}

const CompactHeader: React.FC<CompactHeaderProps> = ({ onNavigateToTiles }) => {
  return (
    <div 
      className="flex justify-start items-center p-3 cursor-pointer group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:p-2"
      onClick={onNavigateToTiles}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateToTiles(); }}
      aria-label="Go to main page"
    >
      <span className="font-code text-xl text-sidebar-foreground group-hover/sidebar-wrapper:text-sidebar-accent-foreground transition-colors duration-200 group-data-[state=collapsed]:text-2xl">
        &lt;/hey.hi&gt;
      </span>
    </div>
  );
};
export default CompactHeader;
