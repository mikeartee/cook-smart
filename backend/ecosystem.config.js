module.exports = {
  apps: [
    {
      name: 'cook-smart-backend',
      script: './dist/server.js',
      cwd: '/home/ubuntu/cook-smart-backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '~/.pm2/logs/cook-smart-backend-error.log',
      out_file: '~/.pm2/logs/cook-smart-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
