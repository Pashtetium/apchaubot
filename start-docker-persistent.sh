#!/bin/bash
# Startup script for apchaubot with persistent Docker volumes
# This script can be run after login/reboot to ensure the bot is running

set -e

# ============================================
# CONFIGURATION - UPDATE THIS PATH!
# ============================================
# Set this to the persistent directory path on your lab PC
# Example: /mnt/persistent/mydata or /var/tmp/username
PERSISTENT_DIR="${PERSISTENT_DIR:-/persistent/apchaubot}"

# Container name
CONTAINER_NAME="apchaubot"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "Apchaubot Docker Persistent Setup"
echo "========================================="
echo ""

# ============================================
# Check if Docker is available
# ============================================
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

# ============================================
# Create persistent directories
# ============================================
echo "Setting up persistent storage at: $PERSISTENT_DIR"

# Create persistent directory structure
mkdir -p "$PERSISTENT_DIR/persistent/logs"

# ============================================
# Setup .env file in persistent location
# ============================================
ENV_FILE="$PERSISTENT_DIR/persistent/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Warning: .env file not found at $ENV_FILE${NC}"

    # Check if .env exists in current directory
    if [ -f ".env" ]; then
        echo "Copying .env to persistent location..."
        cp .env "$ENV_FILE"
        echo -e "${GREEN}.env copied successfully${NC}"
    else
        echo -e "${RED}Error: No .env file found!${NC}"
        echo ""
        echo "Please create $ENV_FILE with the following content:"
        echo "  BOT_TOKEN=your_telegram_bot_token"
        echo "  MONGODB_CONNECTION_STRING=your_mongodb_uri"
        echo "  PORT=8080"
        echo ""
        exit 1
    fi
fi

# ============================================
# Check if container is already running
# ============================================
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${GREEN}Container '$CONTAINER_NAME' is already running!${NC}"
    echo ""
    echo "Container status:"
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "View logs with: docker logs -f $CONTAINER_NAME"
    exit 0
fi

# ============================================
# Check if container exists but is stopped
# ============================================
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${YELLOW}Container exists but is stopped. Starting...${NC}"
    docker start "$CONTAINER_NAME"
    echo -e "${GREEN}Container started successfully!${NC}"
    echo ""
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 0
fi

# ============================================
# Build and start the container
# ============================================
echo "Building Docker image..."
docker build -t apchaubot .

echo ""
echo "Starting container with persistent volumes..."

# Run container with persistent volumes
docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p 8080:8080 \
    --env-file "$ENV_FILE" \
    -v "$PERSISTENT_DIR/persistent/logs:/app/logs" \
    apchaubot

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Container started successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Container will automatically:"
echo "  - Restart on failure"
echo "  - Start on system reboot"
echo "  - Keep running after you logout"
echo ""
echo "Useful commands:"
echo "  docker ps                    # Check if running"
echo "  docker logs -f $CONTAINER_NAME  # View logs (follow)"
echo "  docker logs $CONTAINER_NAME -n 50  # Last 50 log lines"
echo "  docker stop $CONTAINER_NAME     # Stop container"
echo "  docker start $CONTAINER_NAME    # Start container"
echo "  docker restart $CONTAINER_NAME  # Restart container"
echo ""
echo "Persistent data location: $PERSISTENT_DIR/persistent/"
echo ""
