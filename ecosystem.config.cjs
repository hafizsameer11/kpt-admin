/** PM2 process file for Kipit admin (Nitro). */
module.exports = {
  apps: [
    {
      name: "kipit-admin",
      cwd: __dirname,
      script: "scripts/start.sh",
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      max_memory_restart: "512M",
    },
  ],
};
