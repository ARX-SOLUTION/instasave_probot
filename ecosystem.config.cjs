module.exports = {
  apps: [
    {
      name: 'instasave-api',
      cwd: '.',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 15,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 10000,
      max_memory_restart: '700M',
      node_args: '--enable-source-maps',
      out_file: './logs/api.out.log',
      error_file: './logs/api.err.log',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
    },
    {
      name: 'instasave-worker',
      cwd: '.',
      script: 'dist/worker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 15,
      min_uptime: '10s',
      restart_delay: 5000,
      kill_timeout: 10000,
      max_memory_restart: '700M',
      node_args: '--enable-source-maps',
      out_file: './logs/worker.out.log',
      error_file: './logs/worker.err.log',
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    },
  ],
};
