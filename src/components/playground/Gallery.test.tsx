import { render, screen } from '@testing-library/react';
import { Gallery } from './Gallery';

jest.mock('@/lib/services/database', () => {
  const rows = [
    { id: '1', remoteUrl: 'https://x/1.png', prompt: 'a', modelId: 'flux', conversationId: '__playground__', timestamp: 1, contentType: 'image/png' },
  ];
  return {
    db: {
      assets: {
        where: (col: string) => ({
          equals: (val: string) => ({
            reverse: () => ({
              sortBy: async (_field: string) => (col === 'conversationId' && val === '__playground__') ? rows : [],
            }),
          }),
        }),
      },
    },
  };
});

describe('Gallery', () => {
  it('renders items tagged with the playground sentinel', async () => {
    render(<Gallery onPick={() => {}} />);
    expect(await screen.findByText(/flux/i)).toBeInTheDocument();
  });
});
