#!/bin/bash
# Startup script for apchaubot using Docker named volumes
# Docker volumes persist in /var/lib/docker/volumes/ even when home directory is wiped!

set -e

CONTAINER_NAME="apchaubot"
VOLUME_CONFIG="apchaubot-config"
VOLUME_LOGS="apchaubot-logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Apchaubot Docker Volume Setup"
echo "========================================="
echo ""

# ============================================
# Check Docker
# ============================================
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    exit 1
fi

# ============================================
# Check if .env exists locally
# ============================================
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found in current directory!${NC}"
    echo ""
    echo "Please create .env file with:"
    echo "  BOT_TOKEN=your_telegram_bot_token"
    echo "  MONGODB_CONNECTION_STRING=your_mongodb_uri"
    echo "  PORT=8080"
    echo ""
    exit 1
fi

# ============================================
# Check if container is already running
# ============================================
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${GREEN}✓ Container is already running!${NC}"
    echo ""
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "Useful commands:"
    echo "  docker logs -f $CONTAINER_NAME       # View logs"
    echo "  docker restart $CONTAINER_NAME       # Restart bot"
    echo "  docker volume ls                     # List volumes"
    exit 0
fi

# ============================================
# Create volumes if they don't exist
# ============================================
echo "Checking Docker volumes..."

if ! docker volume ls -q | grep -q "^${VOLUME_CONFIG}$"; then
    echo "Creating config volume: $VOLUME_CONFIG"
    docker volume create "$VOLUME_CONFIG"
else
    echo -e "${BLUE}✓ Config volume exists${NC}"
fi

if ! docker volume ls -q | grep -q "^${VOLUME_LOGS}$"; then
    echo "Creating logs volume: $VOLUME_LOGS"
    docker volume create "$VOLUME_LOGS"
else
    echo -e "${BLUE}✓ Logs volume exists${NC}"
fi

# ============================================
# Copy .env to volume (if not exists or update)
# ============================================
echo ""
echo "Checking .env in volume..."

# Use a temporary alpine container to check/copy .env file
ENV_EXISTS=$(docker run --rm \
    -v "${VOLUME_CONFIG}:/config" \
    alpine:latest \
    sh -c "test -f /config/.env && echo 'yes' || echo 'no'")

if [ "$ENV_EXISTS" = "no" ]; then
    echo -e "${YELLOW}Copying .env to Docker volume...${NC}"
    docker run --rm \
        -v "${VOLUME_CONFIG}:/config" \
        -v "$(pwd)/.env:/tmp/.env:ro" \
        alpine:latest \
        cp /tmp/.env /config/.env
    echo -e "${GREEN}✓ .env copied to volume${NC}"
else
    echo -e "${BLUE}✓ .env already exists in volume${NC}"
    read -p "Update .env in volume with local copy? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker run --rm \
            -v "${VOLUME_CONFIG}:/config" \
            -v "$(pwd)/.env:/tmp/.env:ro" \
            alpine:latest \
            cp /tmp/.env /config/.env
        echo -e "${GREEN}✓ .env updated${NC}"
    fi
fi

# ============================================
# Check if container exists but is stopped
# ============================================
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo ""
    echo -e "${YELLOW}Container exists but is stopped. Starting...${NC}"
    docker start "$CONTAINER_NAME"
    echo -e "${GREEN}✓ Container started!${NC}"
    echo ""
    docker ps --filter "name=${CONTAINER_NAME}"
    exit 0
fi

# ============================================
# Build and start container
# ============================================
echo ""
echo "Building Docker image..."
docker build -t apchaubot .

echo ""
echo "Starting container with persistent volumes..."

docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p 8080:8080 \
    -v "${VOLUME_CONFIG}:/app/config" \
    -v "${VOLUME_LOGS}:/app/logs" \
    apchaubot

# The container will load .env from /app/config/.env via docker-entrypoint.sh

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ Bot Started Successfully!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "The bot is now running with:"
echo "  • Auto-restart on failure"
echo "  • Survives system reboot"
echo "  • Keeps running after logout"
echo "  • Persistent config & logs in Docker volumes"
echo ""
echo "Docker volumes location: /var/lib/docker/volumes/"
echo "  - ${VOLUME_CONFIG}"
echo "  - ${VOLUME_LOGS}"
echo ""
echo "Useful commands:"
echo "  docker ps                        # Check status"
echo "  docker logs -f $CONTAINER_NAME   # View logs (live)"
echo "  docker restart $CONTAINER_NAME   # Restart bot"
echo "  docker stop $CONTAINER_NAME      # Stop bot"
echo "  docker volume ls                 # List volumes"
echo "  docker volume inspect $VOLUME_CONFIG  # Inspect config volume"
echo ""
