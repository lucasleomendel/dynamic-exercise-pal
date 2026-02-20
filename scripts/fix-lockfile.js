const { execSync } = require('child_process');
const { unlinkSync, existsSync } = require('fs');

const lockPath = '/vercel/share/v0-project/package-lock.json';

// Remove the stale package-lock.json so npm can regenerate it
if (existsSync(lockPath)) {
  unlinkSync(lockPath);
  console.log('Deleted stale package-lock.json');
} else {
  console.log('No package-lock.json found');
}

// Run npm install to regenerate the lock file
console.log('Running npm install to regenerate lock file...');
execSync('cd /vercel/share/v0-project && npm install --legacy-peer-deps', {
  stdio: 'inherit',
});
console.log('Done! package-lock.json has been regenerated.');
