import { render, screen, fireEvent } from '@testing-library/react';
import { SoundPanel } from './SoundPanel';
import type { SoundState } from '@/hooks/usePlaygroundState';

const BASE: SoundState = {
  tags: '',
  lyrics: '',
  duration: 30,
  batch: 4,
  instrumental: true,
};

describe('SoundPanel', () => {
  // Die Tags stehen seit 2026-09-03 in der Sendeleiste, nicht mehr hier. Vorher
  // gab es das Feld zweimal, mit widersprechenden Grenzen (512 gegen 1000).
  it('traegt kein Tag-Feld mehr — das lebt in der Sendeleiste', () => {
    render(<SoundPanel value={{ ...BASE, tags: 'synthwave, 120 BPM, hazy' }} onChange={() => {}} />);
    expect(screen.queryByLabelText('Sound-Tags')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Sound-Lyrics')).toBeInTheDocument();
  });

  it('switches instrumental off when lyrics are entered and back on when cleared', () => {
    const onChange = jest.fn();
    render(<SoundPanel value={BASE} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Sound-Lyrics'), {
      target: { value: '[verse]\nHallo Welt' },
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ lyrics: '[verse]\nHallo Welt', instrumental: false }),
    );
  });

  it('selects the batch size and marks it pressed', () => {
    const onChange = jest.fn();
    render(<SoundPanel value={BASE} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    expect(onChange).toHaveBeenCalledWith({ batch: 8 });
  });

  it('changes the duration via the slider', () => {
    const onChange = jest.fn();
    render(<SoundPanel value={BASE} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Dauer in Sekunden'), { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith({ duration: 60 });
  });
});
