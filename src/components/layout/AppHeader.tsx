
import type React from 'react';
import { useRouter } from 'next/navigation'; // Corrected import for App Router

interface AppHeaderProps {
  onNavigateToTiles?: () => void; // Optional: if navigation is handled by parent
}

const AppHeader: React.FC<AppHeaderProps> = ({ onNavigateToTiles }) => {
  const router = useRouter();

  const handleClick = () => {
    if (onNavigateToTiles) {
      onNavigateToTiles();
    } else {
      router.push('/'); // Fallback if no specific handler, assuming '/' is tiles view
    }
  };

  return (
    <header 
      className="flex justify-start items-center py-6 px-4 md:px-8 bg-transparent sticky top-0 z-10 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      aria-label="Go to main page"
    >
      <span className="font-code text-3xl md:text-4xl text-foreground hover:text-primary transition-colors duration-200">
        &lt;/hey.hi&gt;
      </span>
    </header>
  );
};

export default AppHeader;
