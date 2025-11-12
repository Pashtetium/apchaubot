#!/bin/bash
# Start script for apchaubot that loads .env and runs the bot

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from .env file
if [ -f "$SCRIPT_DIR/.env" ]; then
    echo "Loading environment variables from .env..."
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
else
    echo "Warning: .env file not found at $SCRIPT_DIR/.env"
    echo "Please create it with BOT_TOKEN and MONGODB_CONNECTION_STRING"
    exit 1
fi

# Check required environment variables
if [ -z "$BOT_TOKEN" ]; then
    echo "Error: BOT_TOKEN is not set"
    exit 1
fi

if [ -z "$MONGODB_CONNECTION_STRING" ]; then
    echo "Error: MONGODB_CONNECTION_STRING is not set"
    exit 1
fi

# Build the TypeScript files
echo "Building TypeScript files..."
npm run build

# Start the bot
echo "Starting apchaubot..."
exec node server.js
