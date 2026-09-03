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
    expect(screen.queryByRole('button', { name: 'Nicht mehr warten' })).not.toBeInTheDocument();
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

// L-I.3 und L-K.2: beide Saetze muessen VOR dem Absenden dastehen. Ein Fehler
// danach ist genau das, was die Kriterien verbieten.
describe('Hinweise vor dem Absenden', () => {
  const basis = {
    value: 'ein prompt',
    onChange: () => {},
    onEnhance: () => {},
    enhancing: false,
    onSend: () => {},
  };

  it('zeigt die Schluesselpflicht, wenn sie besteht', () => {
    render(<PromptBar {...basis} keyRequiredHint="Braucht einen Pollen-Schlüssel." />);
    expect(screen.getByRole('note')).toHaveTextContent('Braucht einen Pollen-Schlüssel.');
  });

  it('zeigt den Abrechnungshinweis fuer Pruna', () => {
    render(<PromptBar {...basis} irreversibleHint="Nicht abbrechbar und wird abgerechnet." />);
    expect(screen.getByRole('note')).toHaveTextContent('Nicht abbrechbar und wird abgerechnet.');
  });

  // Ohne Schluessel laeuft gar nichts — die Abrechenbarkeit ist dann noch
  // nicht das Problem des Nutzers.
  it('zeigt bei beiden Hinweisen nur die Schluesselpflicht', () => {
    render(
      <PromptBar
        {...basis}
        keyRequiredHint="Braucht einen Pruna-Schlüssel."
        irreversibleHint="Nicht abbrechbar."
      />,
    );
    const notes = screen.getAllByRole('note');
    expect(notes).toHaveLength(1);
    expect(notes[0]).toHaveTextContent('Braucht einen Pruna-Schlüssel.');
  });

  it('zeigt ohne Hinweise keine Notiz', () => {
    render(<PromptBar {...basis} />);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});

// Der Sound-Modus traegt seine Tags in dieser Leiste. Grenze, Platzhalter und
// Zaehler muessen dann zu Tags passen, nicht zu einer Bildbeschreibung — sonst
// zeigt der Zaehler gruenes Licht bis kurz vor den 400er der Route.
describe('Sound-Modus: Tags in der Leiste', () => {
  const basis = {
    value: 'synthwave, 120 BPM, hazy',
    onChange: () => {},
    onEnhance: () => {},
    enhancing: false,
    onSend: () => {},
  };

  it('nimmt Grenze und Platzhalter von aussen', () => {
    render(
      <PromptBar
        {...basis}
        maxChars={512}
        placeholder="synthwave, 120 BPM, analog bass, hazy"
        statusPrefix="3 Tags · Ziel 3–7"
      />,
    );
    const feld = screen.getByLabelText('Prompt');
    expect(feld).toHaveAttribute('maxLength', '512');
    expect(feld).toHaveAttribute('placeholder', 'synthwave, 120 BPM, analog bass, hazy');
    expect(screen.getByText('24 / 512')).toBeInTheDocument();
    expect(screen.getByText('3 Tags · Ziel 3–7')).toBeInTheDocument();
  });

  it('bleibt ohne die Zusaetze bei den Bild-Vorgaben', () => {
    render(<PromptBar {...basis} />);
    const feld = screen.getByLabelText('Prompt');
    expect(feld).toHaveAttribute('maxLength', '1000');
    expect(feld).toHaveAttribute('placeholder', 'Beschreib, was du sehen willst…');
    expect(screen.getByText('24 / 1000')).toBeInTheDocument();
  });
});
