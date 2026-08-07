import { render, screen, fireEvent } from '@testing-library/react';
import { ModelSelect } from './ModelSelect';

const entries = [
  { id: 'flux', name: 'Flux', provider: 'pollinations', kind: 'image', supportsReference: false, requiresReference: false, maxImages: 0, unmapped: false } as any,
  { id: 'wan-t2v', name: 'Wan T2V', provider: 'pollinations', kind: 'video', supportsReference: false, requiresReference: false, maxImages: 0, unmapped: false } as any,
];

describe('ModelSelect', () => {
  it('filters to the given mode', () => {
    render(<ModelSelect entries={entries} mode="t2i" value={null} onChange={() => {}} loading={false} fallbackActive={false} />);
    fireEvent.click(screen.getByRole('button', { name: /choose model/i }));
    expect(screen.getByText('Flux')).toBeInTheDocument();
    expect(screen.queryByText('Wan T2V')).not.toBeInTheDocument();
  });
  it('shows a fallback warning when fallbackActive', () => {
    render(<ModelSelect entries={entries} mode="t2i" value={null} onChange={() => {}} loading={false} fallbackActive={true} />);
    expect(screen.getByText(/offline list/i)).toBeInTheDocument();
  });
});
