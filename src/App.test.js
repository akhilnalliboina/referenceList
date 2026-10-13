import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import App from './App';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

test('an invalid DOI shows guidance without calling Crossref', async () => {
  const { getByLabelText, getByRole, findByRole } = render(<App />);
  fireEvent.change(getByLabelText(/doi/i), { target: { value: 'not-a-doi' } });
  fireEvent.click(getByRole('button', { name: /search/i }));

  expect(await findByRole('alert')).toHaveTextContent(/enter a valid doi/i);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('an API error shows a recovery message', async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 404 });

  const { getByLabelText, getByRole, findByRole } = render(<App />);
  fireEvent.change(getByLabelText(/doi/i), { target: { value: '10.1038/nphys1170' } });
  fireEvent.click(getByRole('button', { name: /search/i }));

  expect(await findByRole('alert')).toHaveTextContent(/no record of this doi/i);
});

test('a network failure shows a recovery message', async () => {
  global.fetch.mockRejectedValue(new Error('network unavailable'));

  const { getByLabelText, getByRole, findByRole } = render(<App />);
  fireEvent.change(getByLabelText(/doi/i), { target: { value: '10.1038/nphys1170' } });
  fireEvent.click(getByRole('button', { name: /search/i }));

  expect(await findByRole('alert')).toHaveTextContent(/unavailable or rate limiting/i);
});

test('a DOI with no reference list shows an empty state', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ message: {} }),
  });

  const { getByLabelText, getByRole, findByText } = render(<App />);
  fireEvent.change(getByLabelText(/doi/i), { target: { value: '10.1038/nphys1170' } });
  fireEvent.click(getByRole('button', { name: /search/i }));

  expect(await findByText(/no references were found/i)).toBeInTheDocument();
});

test('searching a DOI shows the returned references', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      message: {
        reference: [
          {
            key: 'known-reference',
            'article-title': ['Example article'],
            DOI: '10.1000/example',
            year: '2020',
          },
        ],
      },
    }),
  });

  const { getByLabelText, getByRole, findByText } = render(<App />);
  fireEvent.change(getByLabelText(/doi/i), {
    target: { value: 'https://doi.org/10.1038/nphys1170' },
  });
  fireEvent.click(getByRole('button', { name: /search/i }));

  expect(await findByText('Example article')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.crossref.org/works/10.1038%2Fnphys1170'
  );
});

test('string titles, DOI prefixes and fallback fields render correctly', async () => {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      message: {
        reference: [
          { key: 'a', 'article-title': 'Quantum entanglement', DOI: '10.1000/dup' },
          { key: 'a', 'journal-title': 'Nature Physics', DOI: '10.1000/dup', year: '2008' },
          { key: 'c', author: 'Einstein', year: '1935' },
        ],
      },
    }),
  });

  const { getByLabelText, getByRole, findByText } = render(<App />);
  fireEvent.change(getByLabelText(/doi/i), { target: { value: 'doi: 10.1038/nphys1170' } });
  fireEvent.click(getByRole('button', { name: /search/i }));

  expect(await findByText('Quantum entanglement')).toBeInTheDocument();
  expect(await findByText('Nature Physics')).toBeInTheDocument();
  expect(await findByText('Einstein 1935')).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith(
    'https://api.crossref.org/works/10.1038%2Fnphys1170'
  );
});
