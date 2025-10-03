import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  text?: string;
  className?: string;
}

export const PageLoader = ({ text = 'Lade...', className = '' }: PageLoaderProps) => (
  <div className={`flex flex-col h-screen items-center justify-center bg-background ${className}`}>
    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);

export default PageLoader;

