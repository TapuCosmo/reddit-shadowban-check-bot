"use strict";

module.exports = {
  apps: [{
    name: "reddit-shadowban-check-bot",
    script: "src/index.js",
    watch: false,
    exec_mode: "cluster",
    instances: 1,
    listen_timeout: 60000,
    kill_timeout: 10000,
    exp_backoff_restart_delay: 500
  }]
};
