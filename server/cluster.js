const cluster = require('cluster');
const os = require('os');
const path = require('path');

// Number of CPU cores to use (use all cores for maximum performance)
const numWorkers = process.env.WORKERS || os.cpus().length;

if (cluster.isMaster) {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`📊 Starting ${numWorkers} worker processes...`);

  // Fork workers
  for (let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork();
    console.log(`✅ Worker ${worker.process.pid} started`);
  }

  // Handle worker exit
  cluster.on('exit', (worker, code, signal) => {
    console.error(`❌ Worker ${worker.process.pid} died (code: ${code}, signal: ${signal})`);
    console.log('🔄 Starting a new worker...');
    cluster.fork();
  });

  // Log when workers come online
  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Master received SIGTERM, shutting down workers...');
    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }
  });

} else {
  // Worker process - start the server
  require('./server.js');
}

