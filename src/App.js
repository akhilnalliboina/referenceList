import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const normalizeDoi = (value) => {
  let input = value.trim();
  try {
    input = decodeURIComponent(input);
  } catch (decodeError) {
    // keep the raw input; validation below rejects it if malformed
  }
  const doi = input
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .replace(/\/+$/, '');
  return /^10\.\d{4,9}\/\S+$/i.test(doi) ? doi : null;
};

const firstText = (value) => (Array.isArray(value) ? value[0] : value);

const referenceTitle = (reference) =>
  reference.unstructured ||
  firstText(reference['article-title']) ||
  firstText(reference['volume-title']) ||
  firstText(reference['journal-title']) ||
  [reference.author, reference.year].filter(Boolean).join(' ') ||
  'Reference details unavailable';

function App() {
  const [doiInput, setDoiInput] = useState('');
  const [references, setReferences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const latestSearch = useRef(0);

  useEffect(
    () => () => {
      latestSearch.current = -1;
    },
    []
  );

  const searchReferences = async (event) => {
    event.preventDefault();
    const doi = normalizeDoi(doiInput);
    const searchId = Math.max(latestSearch.current, 0) + 1;
    latestSearch.current = searchId;
    setReferences([]);
    setError('');
    setHasSearched(true);

    if (!doi) {
      setIsLoading(false);
      setError('Enter a valid DOI, such as 10.1038/nphys1170.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.crossref.org/works/${encodeURIComponent(doi)}`
      );
      if (!response.ok) {
        const httpError = new Error(`Crossref returned HTTP ${response.status}`);
        httpError.status = response.status;
        throw httpError;
      }

      const payload = await response.json();
      const result = payload && payload.message && payload.message.reference;
      const nextReferences = Array.isArray(result) ? result : [];
      if (latestSearch.current === searchId) {
        setReferences(nextReferences);
      }
    } catch (requestError) {
      if (latestSearch.current === searchId) {
        const status = requestError.status;
        setError(
          status === 404
            ? 'Could not load references. Crossref has no record of this DOI; check it and try again.'
            : 'Could not load references. Crossref is unavailable or rate limiting requests; try again shortly.'
        );
      }
    } finally {
      if (latestSearch.current === searchId) {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="app-shell">
      <h1>Find a paper&apos;s references</h1>
      <p className="intro">
        Enter a DOI to find the references listed for that work by Crossref.
      </p>

      <form className="search-form" onSubmit={searchReferences}>
        <label htmlFor="doi-input">DOI</label>
        <div className="search-controls">
          <input
            id="doi-input"
            name="doi"
            type="text"
            placeholder="10.1038/nphys1170"
            value={doiInput}
            onChange={(event) => setDoiInput(event.target.value)}
            autoComplete="off"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {isLoading && <p role="status">Loading references…</p>}
      {error && <p className="message error" role="alert">{error}</p>}
      {hasSearched && !isLoading && !error && references.length === 0 && (
        <p className="message" role="status">No references were found for this DOI.</p>
      )}

      {references.length > 0 && (
        <div className="table-wrap">
          <table className="table table-striped table-bordered">
            <caption>References reported for this DOI</caption>
            <thead>
              <tr>
                <th scope="col">Title or citation</th>
                <th scope="col">DOI</th>
                <th scope="col">Year</th>
              </tr>
            </thead>
            <tbody>
              {references.map((reference, index) => (
                <tr key={`${reference.key || reference.DOI || 'ref'}-${index}`}>
                  <td>{referenceTitle(reference)}</td>
                  <td>{reference.DOI || '—'}</td>
                  <td>{reference.year || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default App;
