import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReplicateImageTool from '../tools/ReplicateImageTool';
import { modelConfigs } from '@/config/replicate-models';

jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('lucide-react', () => ({
  Loader2: () => <svg />,
  AlertCircle: () => <svg />,
  Info: () => <svg />,
  ImageIcon: () => <svg />,
  X: () => <svg />,
  MoreHorizontal: () => <svg />,
  ChevronDown: () => <svg />,
  FileImage: () => <svg />,
  Plus: () => <svg />,
}));

describe('ReplicateImageTool Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('shows image preview when a file is uploaded', async () => {
    localStorage.setItem('replicateImageToolSettings', JSON.stringify({ selectedModelKey: 'flux-kontext-pro' }));
    const { container } = render(<ReplicateImageTool />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hi'], 'pic.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(fileInput.value).toBe('');
    await waitFor(() => expect(screen.getByAltText('Reference preview')).toBeInTheDocument());
  });

  it('submits a prompt and calls fetch', async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ output: 'http://image' }) });
    localStorage.setItem('replicateImageToolSettings', JSON.stringify({ selectedModelKey: Object.keys(modelConfigs)[0] }));
    render(<ReplicateImageTool password="pw" />);
    const textarea = await screen.findByLabelText('Main prompt input with dynamic height');
    fireEvent.change(textarea, { target: { value: 'test prompt' } });
    const executeBtn = screen.getByRole('button', { name: /Execute/i });
    fireEvent.click(executeBtn);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
