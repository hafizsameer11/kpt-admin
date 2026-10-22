#!/bin/bash
cd /var/www/kipit-admin/.output
export PORT=3001
export HOST=127.0.0.1
export NITRO_PORT=3001
export NITRO_HOST=127.0.0.1
exec node server/index.mjs
