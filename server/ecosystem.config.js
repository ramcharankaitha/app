module.exports = {
  apps: [{
    name: 'anitha-stores-backend',
    script: './server.js',
    instances: 1, // Use 1 for VPS (single instance), or 'max' for multi-core servers
    exec_mode: 'fork', // Use 'fork' for single instance, 'cluster' for multiple
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    // Restart on file changes (only in development)
    // watch: true,
    // Restart delay
    restart_delay: 4000,
    // Max restarts
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

