import app from './app';
import { config, initFirebaseAdmin } from './config';

const port = config.port;

// Initialize Firebase Admin SDK on startup
try {
  initFirebaseAdmin();
} catch (e: any) {
  console.warn('Firebase Admin startup notice:', e.message);
}

// Bind to 0.0.0.0 to ensure Render and external container routing works properly
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Somi Go Production API listening on port ${port}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log(`🔥 Firebase Project: ${config.firebase.projectId}`);
  console.log(`❤️  Health check available at: http://0.0.0.0:${port}/api/v1/health`);
  console.log(`====================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
