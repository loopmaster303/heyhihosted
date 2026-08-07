import { render, screen, fireEvent } from '@testing-library/react';
import { MobileBar } from './MobileBar';

describe('MobileBar', () => {
  it('emits prompt changes and calls generate/settings handlers', () => {
    const onPrompt = jest.fn();
    const onGenerate = jest.fn();
    const onOpenParams = jest.fn();
    render(<MobileBar prompt="" onPrompt={onPrompt} onGenerate={onGenerate} onOpenParams={onOpenParams} />);

    fireEvent.change(screen.getByPlaceholderText(/quick prompt/i), { target: { value: 'hi' } });
    expect(onPrompt).toHaveBeenCalledWith('hi');

    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    expect(onGenerate).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    expect(onOpenParams).toHaveBeenCalled();
  });
});
