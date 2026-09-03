import { render, screen, fireEvent } from '@testing-library/react';
import { ModeTabs } from './ModeTabs';

describe('ModeTabs', () => {
  it('renders all five tabs', () => {
    render(<ModeTabs value="t2i" onChange={() => {}} />);
    expect(screen.getAllByRole('tab')).toHaveLength(5);
    ['t2i', 'i2i', 't2v', 'i2v', 'sound'].forEach((mode) => {
      expect(screen.getByRole('tab', { name: mode })).toBeInTheDocument();
    });
  });

  it('calls onChange with the clicked mode id', () => {
    const onChange = jest.fn();
    render(<ModeTabs value="t2i" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: 'i2v' }));
    expect(onChange).toHaveBeenCalledWith('i2v');
  });

  it('sets aria-selected true for the value tab and false for the others', () => {
    render(<ModeTabs value="t2v" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 't2v' })).toHaveAttribute('aria-selected', 'true');
    ['t2i', 'i2i', 'i2v', 'sound'].forEach((mode) => {
      expect(screen.getByRole('tab', { name: mode })).toHaveAttribute('aria-selected', 'false');
    });
  });
});
