import { uploadFileToPruna } from './pruna';

describe('uploadFileToPruna', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('prunaApiKey', 'user_pruna_1234567890');
  });

  it('sends raw media and the internal Pruna key header', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ url: 'https://api.pruna.ai/v1/files/ref' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));
    const file = new File(['image'], 'reference.png', { type: 'image/png' });

    await expect(uploadFileToPruna(file)).resolves.toBe('https://api.pruna.ai/v1/files/ref');
    expect(fetchMock).toHaveBeenCalledWith('/api/pruna/upload?filename=reference.png', expect.objectContaining({
      method: 'POST', body: file,
      headers: expect.objectContaining({ 'Content-Type': 'image/png', 'X-Pruna-Key': 'user_pruna_1234567890' }),
    }));
    fetchMock.mockRestore();
  });
});
