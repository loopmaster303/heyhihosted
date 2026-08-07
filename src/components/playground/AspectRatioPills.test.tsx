import { render, screen, fireEvent } from '@testing-library/react';
import { AspectRatioPills } from './AspectRatioPills';

describe('AspectRatioPills', () => {
  it('renders aspect ratio buttons for a model and marks selected value', () => {
    render(<AspectRatioPills modelId="flux" value="16:9" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '16:9' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1:1' })).toBeInTheDocument();
  });

  it('triggers onChange when a ratio button is clicked', () => {
    const onChange = jest.fn();
    render(<AspectRatioPills modelId="flux" value="1:1" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: '16:9' }));
    expect(onChange).toHaveBeenCalledWith('16:9');
  });
});
