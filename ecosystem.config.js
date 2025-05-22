module.exports = {
  apps: [
    {
      name: "satkar-backend",
      script: "./build/app.js",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        TS_NODE_PROJECT: "./tsconfig.json",
      },
      env_development: {
        NODE_ENV: "development",
        TS_NODE_PROJECT: "./tsconfig.json",
      },
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
    },
  ],
};
