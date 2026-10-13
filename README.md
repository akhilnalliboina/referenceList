# Reference List

Look up the reference list associated with a DOI. This browser app queries the public [Crossref REST API](https://api.crossref.org/).

**Live demo:** <https://akhilnalliboina.github.io/referenceList/>

## Run locally

Requires Node.js 24 (see `.nvmrc`) and npm.

```sh
npm ci
npm start
```

Open <http://localhost:3000>. Enter a DOI such as `10.1038/nphys1170`. You can also enter a DOI URL such as `https://doi.org/10.1038/nphys1170`.

## Verify changes

```sh
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

Tests use fixed Crossref responses. They do not make live API requests. A successful app lookup still depends on Crossref and the browser's network connection. Some works have no reference list in Crossref.

This repository still uses the legacy Create React App 3 / Webpack 4 toolchain. Its start/build wrapper enables Node's OpenSSL legacy provider only in the child process because Webpack 4 uses an obsolete hash. Plan a separate build-tool migration; do not copy this compatibility workaround into new projects.

## Deploy

The production build is configured for the GitHub Pages project path:

```sh
npm run build
npm run deploy
```

The `homepage` setting builds assets for the `/referenceList/` Pages path. The deploy command publishes the `build/` directory to the `gh-pages` branch. It requires write access to this repository and Git authentication configured for the current shell. Do not commit API credentials; this project uses Crossref's public API without an API key.

## Scope and limits

This app displays the reference metadata Crossref returns. It does not guarantee that every work has complete or structured references. Citation coverage depends on publisher deposits in Crossref. The app does not search forward citations.

## License

This repository does not currently declare a license. Do not assume that it is licensed for reuse until the owner adds one.
