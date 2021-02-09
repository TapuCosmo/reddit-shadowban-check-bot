"use strict";

module.exports = {
  apps: [{
    name: "reddit-shadowban-check-bot",
    script: "src/index.js",
    watch: false,
    exec_mode: "fork",
    instances: 1,
    kill_timeout: 10000,
    exp_backoff_restart_delay: 500
  }]
};
