import { render, screen, fireEvent } from '@testing-library/react';
import { ModeSwitch } from './ModeSwitch';

describe('ModeSwitch', () => {
  it('renders 4 tabs and marks active', () => {
    render(<ModeSwitch value="t2v" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 't2v', selected: true })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });
  it('emits onChange when a tab is clicked', () => {
    const onChange = jest.fn();
    render(<ModeSwitch value="t2i" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'i2v' }));
    expect(onChange).toHaveBeenCalledWith('i2v');
  });
});
