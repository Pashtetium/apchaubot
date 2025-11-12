#!/bin/sh
# Docker entrypoint script that loads .env from volume before starting the bot

# Load environment variables from config volume if exists
if [ -f "/app/config/.env" ]; then
    echo "Loading environment variables from /app/config/.env"
    export $(grep -v '^#' /app/config/.env | xargs)
else
    echo "Warning: No .env file found in /app/config/"
    echo "Make sure to initialize the config volume with your .env file"
fi

# Start the Node.js application
exec node server.js
