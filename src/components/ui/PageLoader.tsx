import { AsciiSpinner } from '@/components/ascii';

interface PageLoaderProps {
  text?: string;
  className?: string;
}

export const PageLoader = ({ text = 'Lade...', className = '' }: PageLoaderProps) => (
  <div className={`flex flex-col h-screen items-center justify-center bg-background ${className}`}>
    <AsciiSpinner className="mb-2 text-2xl text-primary" />
    <span className="text-sm text-muted-foreground">{text}</span>
  </div>
);

export default PageLoader;

