import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('lucide-react', () => new Proxy({}, {
  get: (_target, prop) => {
    const Icon = (iconProps: React.SVGProps<SVGSVGElement>) => <svg data-icon={String(prop)} {...iconProps} />;
    Icon.displayName = String(prop);
    return Icon;
  },
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));

jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
  ),
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange }: { value: number[]; onValueChange: (v: number[]) => void }) => (
    <input type="range" value={value[0]} onChange={(e) => onValueChange([Number(e.target.value)])} />
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    React.isValidElement(children)
      ? React.cloneElement(children as React.ReactElement<{ role?: string }>, { role: 'button' })
      : <button type="button">{children}</button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <button type="button" role="menuitem" onClick={onSelect}>{children}</button>
  ),
}));

import { ParamControls } from './ParamControls';
import { schemaFor, defaultsFor, type ParamValues } from '@/lib/playground/param-schema';

describe('ParamControls', () => {
  it('renders all visible fields for zimage', () => {
    const schema = schemaFor('zimage')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    // Keine freien Pixelmaße mehr — der Nutzer wählt ein Seitenverhältnis,
    // die Route übersetzt es pro Modell in width/height.
    expect(screen.getByText(/Seitenverhältnis/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Breite/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Höhe/i)).not.toBeInTheDocument();
  });

  it('toggles advanced group', () => {
    const schema = schemaFor('zimage')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.queryByLabelText(/Schritte/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Qualität/i));
    expect(screen.getByLabelText(/Schritte/i)).toBeInTheDocument();
  });

  it('hides showIf fields when condition is not met', () => {
    const schema = schemaFor('p-image')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.queryByLabelText(/Breite/i)).not.toBeInTheDocument();
  });

  // Freie Pixelmaße gibt es in der Oberfläche nicht mehr: der Nutzer wählt
  // ein Seitenverhältnis, die Route übersetzt es pro Modell.
  it('offers no free pixel fields for p-image', () => {
    const schema = schemaFor('p-image')!;
    render(<ParamControls schema={schema} values={defaultsFor(schema)} onChange={() => {}} uploadCount={0} />);
    expect(screen.queryByLabelText(/Breite/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Höhe/i)).not.toBeInTheDocument();
  });

  it('emits number changes', () => {
    const schema = schemaFor('zimage')!;
    const vals = defaultsFor(schema);
    const onChange = jest.fn();
    render(<ParamControls schema={schema} values={vals} onChange={onChange} uploadCount={0} />);
    fireEvent.click(screen.getByText(/Qualität/i));
    fireEvent.change(screen.getByLabelText(/Schritte/i), { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ num_inference_steps: 12 }));
  });

  it('renders seconds slider with correct display', () => {
    const schema = schemaFor('p-video')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByText(/5s/i)).toBeInTheDocument();
  });

  it('p-video-2 hides the fixed duration when Automatische Dauer is on', () => {
    const schema = schemaFor('p-video-2')!;
    const vals = defaultsFor(schema);
    const { rerender } = render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByText('Dauer')).toBeInTheDocument();
    expect(screen.getByText('Automatische Dauer')).toBeInTheDocument();

    const withAuto: ParamValues = { ...vals, duration_auto: true };
    rerender(<ParamControls schema={schema} values={withAuto} onChange={() => {}} uploadCount={0} />);
    expect(screen.queryByText('Dauer')).not.toBeInTheDocument();
    expect(screen.getByText('Automatische Dauer')).toBeInTheDocument();
  });

  it('p-video-2 hides the aspect ratio once a reference image is set', () => {
    const schema = schemaFor('p-video-2')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByText('Seitenverhältnis')).toBeInTheDocument();
  });

  it('p-video-2 hides the aspect ratio once a reference upload exists (runtime state)', () => {
    const schema = schemaFor('p-video-2')!;
    const vals = defaultsFor(schema);
    const { rerender } = render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByText('Seitenverhältnis')).toBeInTheDocument();

    // Referenzbilder liegen in state.uploads (uploadCount), nicht in params.image —
    // der params-Bag bleibt leer. Der Regler muss trotzdem weichen.
    rerender(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={1} />);
    expect(screen.queryByText('Seitenverhältnis')).not.toBeInTheDocument();

    rerender(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByText('Seitenverhältnis')).toBeInTheDocument();
  });

  it('p-video-2-pro hides and restores aspect ratio from uploadCount', () => {
    const schema = schemaFor('p-video-2-pro')!;
    const vals = defaultsFor(schema);
    const { rerender } = render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByText('Seitenverhältnis')).toBeInTheDocument();

    rerender(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={1} />);
    expect(screen.queryByText('Seitenverhältnis')).not.toBeInTheDocument();
    rerender(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={2} />);
    expect(screen.queryByText('Seitenverhältnis')).not.toBeInTheDocument();
    rerender(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByText('Seitenverhältnis')).toBeInTheDocument();
  });

  it('p-video-2-pro shows fixed audio/fps heading and independent mode controls', () => {
    const schema = schemaFor('p-video-2-pro')!;
    const vals = defaultsFor(schema);
    const onChange = jest.fn();
    render(<ParamControls schema={schema} values={vals} onChange={onChange} uploadCount={0} />);

    expect(screen.getByText('Video · 24 fps · mit Ton')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Qualität'));
    expect(screen.getByText('Generierungsmodus')).toBeInTheDocument();
    expect(screen.getByText('Prompt-Upsampler')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Speed' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Qualität' }));
    fireEvent.click(screen.getByRole('button', { name: 'Turbo' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Aus' }));
    expect(onChange).toHaveBeenNthCalledWith(1, expect.objectContaining({ mode: 'quality' }));
    expect(onChange).toHaveBeenNthCalledWith(2, expect.objectContaining({ prompt_upsampler: 'off' }));
    expect(onChange.mock.calls[1][0]).not.toHaveProperty('mode', 'quality');
  });

  it('emits boolean changes', () => {
    const schema = schemaFor('zimage')!;
    const vals = defaultsFor(schema);
    const onChange = jest.fn();
    render(<ParamControls schema={schema} values={vals} onChange={onChange} uploadCount={0} />);
    fireEvent.click(screen.getByText(/Qualität/i));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalled();
  });
});
