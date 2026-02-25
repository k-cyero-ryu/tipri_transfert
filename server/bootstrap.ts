import { spawn } from 'child_process';

const isProduction = process.env.NODE_ENV === 'production';

const start = async () => {
  if (!isProduction) {
    // Start Express server
    console.log('Starting Express server...');
    spawn('node', ['express/index.js'], {
      stdio: 'inherit',
      shell: true,
      detached: false
    });

    // Wait for Express to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Start Vite dev server
    console.log('Starting Vite dev server...');
    spawn('npx', ['vite', '--port', '5173'], {
      stdio: 'inherit',
      shell: true,
      detached: false
    });
  } else {
    // Production mode - start Express server (already includes API + static files)
    console.log('Starting production server...');
    
    // The express/index.js now includes static file serving
    spawn('node', ['express/index.js'], {
      stdio: 'inherit',
      shell: true,
      detached: false,
      env: { ...process.env }
    });
  }
};

start();
