module.exports = {
  apps: [
    {
      name: 'davichat-front',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 80
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 80
      }
    }
  ]
};
