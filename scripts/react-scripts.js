const { spawnSync } = require('child_process');

const command = process.argv[2];
if (!['start', 'build'].includes(command)) {
  console.error('Usage: node scripts/react-scripts.js <start|build> [options]');
  process.exit(2);
}

const script = require.resolve(`react-scripts/scripts/${command}`);
const nodeOptions = process.env.NODE_OPTIONS || '';
// Webpack 4 (react-scripts 3) needs the legacy OpenSSL provider on Node 17+;
// older Node versions reject the flag.
const needsLegacyProvider = Number(process.versions.node.split('.')[0]) >= 17;
const env = {
  ...process.env,
  NODE_OPTIONS:
    !needsLegacyProvider || nodeOptions.includes('--openssl-legacy-provider')
      ? nodeOptions
      : `${nodeOptions} --openssl-legacy-provider`.trim(),
};
const result = spawnSync(process.execPath, [script, ...process.argv.slice(3)], {
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
