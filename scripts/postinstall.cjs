const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Ensuring Electron binary is downloaded...');

const electronBasePath = path.join(__dirname, '..', 'node_modules');

try {
  const installScript = path.join(electronBasePath, '.pnpm', 'electron@39.2.5', 'node_modules', 'electron', 'install.js');
  
  if (fs.existsSync(installScript)) {
    execSync(`node "${installScript}"`, { stdio: 'inherit' });
    console.log('Electron binary downloaded successfully');
  } else {
    console.log('Electron install script not found, skipping...');
  }
} catch (error) {
  console.error('Error downloading Electron binary:', error.message);
  throw error;
}
