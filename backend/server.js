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
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

module.exports = server;
