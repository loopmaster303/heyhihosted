import { render, screen, fireEvent } from '@testing-library/react';
import { PromptPanel } from './PromptPanel';

describe('PromptPanel', () => {
  it('emits onChange when typing', () => {
    const onChange = jest.fn();
    render(<PromptPanel value="" onChange={onChange} onEnhance={() => {}} enhancing={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hi' } });
    expect(onChange).toHaveBeenCalledWith('hi');
  });
  it('disables Enhance when empty or enhancing', () => {
    const { rerender } = render(<PromptPanel value="" onChange={() => {}} onEnhance={() => {}} enhancing={false} />);
    expect(screen.getByRole('button', { name: /enhance/i })).toBeDisabled();
    rerender(<PromptPanel value="x" onChange={() => {}} onEnhance={() => {}} enhancing={true} />);
    expect(screen.getByRole('button', { name: /enhance/i })).toBeDisabled();
  });
});
