const { execSync } = require('child_process');

// Run npm install to generate a fresh lock file
console.log('Running npm install to generate a fresh package-lock.json...');
execSync('cd /vercel/share/v0-project && npm install --legacy-peer-deps', {
  stdio: 'inherit',
});
console.log('Done! package-lock.json has been generated.');
