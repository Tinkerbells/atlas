const { execSync } = require('child_process');
const path = require('path');

console.log('Ensuring Electron binary is downloaded...');

const electronPath = path.join(__dirname, '..', 'node_modules', 'electron');

try {
  const installScript = path.join(electronPath, 'install.js');
  
  if (require('fs').existsSync(installScript)) {
    execSync(`node "${installScript}"`, { stdio: 'inherit' });
    console.log('Electron binary downloaded successfully');
  } else {
    console.log('Electron install script not found, skipping...');
  }
} catch (error) {
  console.error('Error downloading Electron binary:', error.message);
  throw error;
}