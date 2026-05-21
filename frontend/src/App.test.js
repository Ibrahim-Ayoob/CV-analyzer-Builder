<<<<<<< feature/frontend-updated
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock axios so tests don't make real API calls
jest.mock('axios', () => ({
  get:  jest.fn(() => Promise.resolve({ data: { ai_ready: true, status: 'ok' } })),
  post: jest.fn(() => Promise.resolve({ data: {
    score: 80, grade: 'A', summary: 'Great CV',
    breakdown: {
      content_quality:      { score: 25, max: 30, comment: 'good' },
      structure_formatting: { score: 20, max: 25, comment: 'good' },
      skills_relevance:     { score: 16, max: 20, comment: 'good' },
      experience_strength:  { score: 20, max: 25, comment: 'good' },
    },
    sections_found: ['Skills', 'Experience'],
    missing_sections: ['Projects'],
    strengths:  ['Good skills'],
    weaknesses: ['No projects'],
    tips: ['Add projects'],
    ats_score: 75,
    ats_notes: 'Good ATS score',
    industry_fit: ['Tech'],
    structure_info: { word_count: 400, line_count: 50, bullet_count: 10, length_note: 'Good length' }
  }})),
}));

// ── Home page tests ────────────────────────────────────────────────────────
test('shows the app logo', () => {
  render(<App />);
  expect(screen.getByText(/CVAnalyzer/i)).toBeInTheDocument();
});

test('shows Analyze My CV card', () => {
  render(<App />);
  expect(screen.getByText(/Analyze My CV/i)).toBeInTheDocument();
});

test('shows Build My CV card', () => {
  render(<App />);
  expect(screen.getByText(/Build My CV/i)).toBeInTheDocument();
});

test('shows upload area', () => {
  render(<App />);
  expect(screen.getByText(/Drop your CV here/i)).toBeInTheDocument();
});

test('analyze button is disabled with no file', () => {
  render(<App />);
  expect(screen.getByText(/Select a file to start/i)).toBeDisabled();
});

// ── CV Builder tests ───────────────────────────────────────────────────────
test('clicking Build My CV opens the builder', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Start Building/i));
  expect(screen.getByText(/CVBuilder/i)).toBeInTheDocument();
});

test('builder shows Back button', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Start Building/i));
  expect(screen.getByText(/← Back/i)).toBeInTheDocument();
});

test('clicking Back returns to home', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Start Building/i));
  fireEvent.click(screen.getByText(/← Back/i));
  expect(screen.getByText(/Analyze My CV/i)).toBeInTheDocument();
=======
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
>>>>>>> feature/backend-api
});
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Mock axios so tests don't make real API calls
jest.mock('axios', () => ({
  get: jest.fn(() =>
    Promise.resolve({
      data: { ai_ready: true, status: 'ok' },
    })
  ),

  post: jest.fn(() =>
    Promise.resolve({
      data: {
        score: 80,
        grade: 'A',
        summary: 'Great CV',

        breakdown: {
          content_quality: {
            score: 25,
            max: 30,
            comment: 'good',
          },

          structure_formatting: {
            score: 20,
            max: 25,
            comment: 'good',
          },

          skills_relevance: {
            score: 16,
            max: 20,
            comment: 'good',
          },

          experience_strength: {
            score: 20,
            max: 25,
            comment: 'good',
          },
        },

        sections_found: ['Skills', 'Experience'],
        missing_sections: ['Projects'],
        strengths: ['Good skills'],
        weaknesses: ['No projects'],
        tips: ['Add projects'],
        ats_score: 75,
        ats_notes: 'Good ATS score',
        industry_fit: ['Tech'],

        structure_info: {
          word_count: 400,
          line_count: 50,
          bullet_count: 10,
          length_note: 'Good length',
        },
      },
    })
  ),
}));

// ── Home page tests ─────────────────────────────────────

test('shows the app logo', () => {
  render(<App />);
  expect(screen.getByText(/CVAnalyzer/i)).toBeInTheDocument();
});

test('shows Analyze My CV card', () => {
  render(<App />);
  expect(screen.getByText(/Analyze My CV/i)).toBeInTheDocument();
});

test('shows Build My CV card', () => {
  render(<App />);
  expect(screen.getByText(/Build My CV/i)).toBeInTheDocument();
});

test('shows upload area', () => {
  render(<App />);
  expect(screen.getByText(/Drop your CV here/i)).toBeInTheDocument();
});

test('analyze button is disabled with no file', () => {
  render(<App />);
  expect(screen.getByText(/Select a file to start/i)).toBeDisabled();
});

// ── CV Builder tests ─────────────────────────────────────

test('clicking Build My CV opens the builder', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Start Building/i));
  expect(screen.getByText(/CVBuilder/i)).toBeInTheDocument();
});

test('builder shows Back button', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Start Building/i));
  expect(screen.getByText(/← Back/i)).toBeInTheDocument();
});

test('clicking Back returns to home', () => {
  render(<App />);
  fireEvent.click(screen.getByText(/Start Building/i));
  fireEvent.click(screen.getByText(/← Back/i));
  expect(screen.getByText(/Analyze My CV/i)).toBeInTheDocument();
});