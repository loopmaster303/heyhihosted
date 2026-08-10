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
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: { children: React.ReactNode; onSelect?: () => void }) => (
    <button onClick={onSelect}>{children}</button>
  ),
}));

import { ParamControls } from './ParamControls';
import { schemaFor, defaultsFor, type ParamValues } from '@/lib/playground/param-schema';

describe('ParamControls', () => {
  it('renders all visible fields for zimage', () => {
    const schema = schemaFor('zimage')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByLabelText(/Breite/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hoehe/i)).toBeInTheDocument();
  });

  it('toggles advanced group', () => {
    const schema = schemaFor('zimage')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.queryByLabelText(/Schritte/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText(/Qualitaet/i));
    expect(screen.getByLabelText(/Schritte/i)).toBeInTheDocument();
  });

  it('hides showIf fields when condition is not met', () => {
    const schema = schemaFor('p-image')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.queryByLabelText(/Breite/i)).not.toBeInTheDocument();
  });

  it('shows custom size fields when aspect_ratio is custom', () => {
    const schema = schemaFor('p-image')!;
    const vals: ParamValues = { ...defaultsFor(schema), aspect_ratio: 'custom' };
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByLabelText(/Breite/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Hoehe/i)).toBeInTheDocument();
  });

  it('emits number changes', () => {
    const schema = schemaFor('zimage')!;
    const vals = defaultsFor(schema);
    const onChange = jest.fn();
    render(<ParamControls schema={schema} values={vals} onChange={onChange} uploadCount={0} />);
    fireEvent.change(screen.getByLabelText(/Breite/i), { target: { value: '512' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ width: 512 }));
  });

  it('renders seconds slider with correct display', () => {
    const schema = schemaFor('p-video')!;
    const vals = defaultsFor(schema);
    render(<ParamControls schema={schema} values={vals} onChange={() => {}} uploadCount={0} />);
    expect(screen.getByText(/5s/i)).toBeInTheDocument();
  });

  it('emits boolean changes', () => {
    const schema = schemaFor('zimage')!;
    const vals = defaultsFor(schema);
    const onChange = jest.fn();
    render(<ParamControls schema={schema} values={vals} onChange={onChange} uploadCount={0} />);
    fireEvent.click(screen.getByText(/Qualitaet/i));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalled();
  });
});
