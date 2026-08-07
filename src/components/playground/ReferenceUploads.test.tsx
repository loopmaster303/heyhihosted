import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReferenceUploads, uploadPlaygroundReference } from './ReferenceUploads';

const model: any = {
  id: 'wan-i2v',
  name: 'Wan I2V',
  provider: 'pruna',
  kind: 'video',
  supportsReference: true,
  requiresReference: true,
  maxImages: 2,
  referenceMode: 'start-end-frame',
  unmapped: false,
};

describe('ReferenceUploads', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders start/end labels for start-end-frame models', () => {
    render(<ReferenceUploads model={model} uploads={[]} onChange={() => {}} />);
    expect(screen.getByText(/start/i)).toBeInTheDocument();
    expect(screen.getByText(/end/i)).toBeInTheDocument();
  });

  it('renders nothing when the model does not support references', () => {
    const noref: any = { ...model, supportsReference: false, maxImages: 0 };
    const { container } = render(<ReferenceUploads model={noref} uploads={[]} onChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Source label for single image reference models', () => {
    const singleRef: any = { ...model, maxImages: 1, referenceMode: undefined };
    render(<ReferenceUploads model={singleRef} uploads={[]} onChange={() => {}} />);
    expect(screen.getByText(/source/i)).toBeInTheDocument();
  });

  it('renders uploaded image preview when url is provided in uploads array', () => {
    render(<ReferenceUploads model={model} uploads={['https://example.com/start.png']} onChange={() => {}} />);
    const img = screen.getByAltText('reference');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/start.png');
  });

  it('uploads file using correct endpoint based on provider and calls onChange', async () => {
    const onChange = jest.fn();
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://example.com/uploaded.png' }),
    });
    global.fetch = mockFetch;

    const { container } = render(<ReferenceUploads model={model} uploads={[]} onChange={onChange} />);
    const inputs = container.querySelectorAll('input[type="file"]');
    expect(inputs).toHaveLength(2);

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/pruna/upload', expect.objectContaining({
        method: 'POST',
      }));
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(['https://example.com/uploaded.png']);
    });
  });
});

describe('uploadPlaygroundReference helper', () => {
  it('posts file to /api/pruna/upload when provider is pruna', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://pruna.api/uploaded.jpg' }),
    });
    global.fetch = mockFetch;

    const file = new File(['test'], 'img.jpg', { type: 'image/jpeg' });
    const url = await uploadPlaygroundReference(file, 'pruna');

    expect(mockFetch).toHaveBeenCalledWith('/api/pruna/upload', expect.objectContaining({
      method: 'POST',
    }));
    expect(url).toBe('https://pruna.api/uploaded.jpg');
  });

  it('posts file to /api/media/upload when provider is pollinations', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://pollinations.api/uploaded.jpg' }),
    });
    global.fetch = mockFetch;

    const file = new File(['test'], 'img.jpg', { type: 'image/jpeg' });
    const url = await uploadPlaygroundReference(file, 'pollinations');

    expect(mockFetch).toHaveBeenCalledWith('/api/media/upload', expect.objectContaining({
      method: 'POST',
    }));
    expect(url).toBe('https://pollinations.api/uploaded.jpg');
  });
});
