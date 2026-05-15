import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import App from './App';

jest.mock('axios');

test('renders Analyze My CV header', async () => {
  axios.get.mockResolvedValue({ data: { ai_ready: true } });
  render(<App />);
  const header = await screen.findByText(/Analyze My CV/i);
  expect(header).toBeInTheDocument();
});
