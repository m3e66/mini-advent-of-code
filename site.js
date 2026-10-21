// Legacy entry point; use the same static server as npm start.
process.env.PORT ||= '3000';
require('./dev-server.cjs');
