import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

import { PromptBar } from './PromptBar';

const base = {
  value: '',
  onChange: jest.fn(),
  onEnhance: jest.fn(),
  enhancing: false,
  onSend: jest.fn(),
};

describe('PromptBar', () => {
  beforeEach(() => jest.clearAllMocks());

  it('disables Senden while the prompt is empty', () => {
    render(<PromptBar {...base} />);
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
  });

  it('enables Senden once there is a prompt', () => {
    render(<PromptBar {...base} value="ein fuchs" />);
    expect(screen.getByRole('button', { name: 'Senden' })).toBeEnabled();
  });

  it('keeps Senden available while other runs are in flight', () => {
    const onSend = jest.fn();
    render(<PromptBar {...base} value="ein fuchs" onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Senden' }));
    expect(onSend).toHaveBeenCalledTimes(1);
    // Der Abbruch haengt jetzt an der Lade-Karte, nicht mehr an der Leiste.
    expect(screen.queryByRole('button', { name: 'Abbrechen' })).not.toBeInTheDocument();
  });

  it('blocks Senden at the concurrency limit and names the reason', () => {
    render(
      <PromptBar {...base} value="ein fuchs" canQueue={false} queueFullHint="3 Generierungen laufen bereits" />,
    );
    expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
    expect(screen.getByText('3 Generierungen laufen bereits')).toBeInTheDocument();
  });

  it('reports typing through onChange', () => {
    const onChange = jest.fn();
    render(<PromptBar {...base} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Prompt'), { target: { value: 'hallo' } });
    expect(onChange).toHaveBeenCalledWith('hallo');
  });

  it('counts characters against the limit', () => {
    render(<PromptBar {...base} value="abcde" />);
    expect(screen.getByText('5 / 1000')).toBeInTheDocument();
  });

  it('shows model and provider in the status line', () => {
    render(<PromptBar {...base} modelName="Flux" providerName="Pollinations" />);
    expect(screen.getByText('Flux')).toBeInTheDocument();
    expect(screen.getByText('Pollinations')).toBeInTheDocument();
  });
});
