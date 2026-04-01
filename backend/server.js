const { env } = require('./src/config/env');
const app = require('./src/app');

const PORT = env.PORT;
const NODE_ENV = env.NODE_ENV;

const server = app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`Placement Tracker Backend Server`);
  console.log(`========================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Database: configured`);
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`========================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\n🚨 CRITICAL: Unhandled Promise Rejection Detected!');
  console.error('This means an async function threw an error without a try/catch block. Check your async code flows.');
  console.error('Error Details:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('\n🚨 CRITICAL: Uncaught Exception Detected!');
  console.error('The Node process encountered a fatal error and is being forced to shut down.');
  console.error('Error Details:', err);
  server.close(() => process.exit(1));
});

module.exports = server;
