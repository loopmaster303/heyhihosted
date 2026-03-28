import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileOptionsMenu } from './MobileOptionsMenu';

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <div />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  SelectValue: () => <span />,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/LanguageProvider', () => ({
  useLanguage: () => ({
    t: (key: string) =>
      ({
        'menu.options': 'Options',
        'menu.section.upload': 'Upload',
        'menu.section.mode': 'Mode',
        'menu.section.settings': 'Settings',
        'settings.responseStyle': 'Assistant Role',
        'settings.voice': 'Voice',
        'settings.voiceSpeed': 'Speech Speed',
        'tools.visualize': 'Visualize',
        'tools.standardChat': 'Standard Chat',
        'tools.compose': 'Compose',
        'tools.deepResearch': 'Deep Research',
        'action.uploadImage': 'Upload Image',
        'action.uploadDocument': 'Upload Document',
        'action.camera': 'Camera',
      }[key] || key),
  }),
}));

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

describe('MobileOptionsMenu', () => {
  it('renders a dedicated settings section with voice and response-style controls', async () => {
    const user = userEvent.setup();

    render(
      <MobileOptionsMenu
        isLoading={false}
        isImageMode={false}
        onImageUploadClick={jest.fn()}
        onDocUploadClick={jest.fn()}
        onCameraClick={jest.fn()}
        onToggleImageMode={jest.fn()}
        isComposeMode={false}
        onToggleComposeMode={jest.fn()}
        isCodeMode={false}
        onToggleCodeMode={jest.fn()}
        webBrowsingEnabled={false}
        onToggleWebBrowsing={jest.fn()}
        selectedVoice="alloy"
        onVoiceChange={jest.fn()}
        selectedTtsSpeed={1}
        onTtsSpeedChange={jest.fn()}
        selectedResponseStyleName="Basic"
        onStyleChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Options' }));
    await user.click(screen.getByRole('button', { name: /Settings/i }));

    expect(screen.getByText('Assistant Role')).toBeInTheDocument();
    expect(screen.getByText('Voice')).toBeInTheDocument();
    expect(screen.getByText('Speech Speed')).toBeInTheDocument();
  });
});
