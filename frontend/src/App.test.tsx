import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders product list title', () => {
  render(<App />);
  const titleElement = screen.getByText(/product list/i);
  expect(titleElement).toBeInTheDocument();
});

