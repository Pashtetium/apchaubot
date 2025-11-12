#!/bin/bash
# Update script - pulls latest Docker image and restarts the bot
# Config and logs persist in Docker volumes!

set -e

CONTAINER_NAME="apchaubot"
VOLUME_CONFIG="apchaubot-config"
VOLUME_LOGS="apchaubot-logs"

# Set your Docker Hub username here
DOCKER_USERNAME="${DOCKER_USERNAME:-your_dockerhub_username}"
IMAGE_NAME="${DOCKER_USERNAME}/apchaubot:latest"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Apchaubot Update Script"
echo "========================================="
echo ""

# ============================================
# Check Docker
# ============================================
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# ============================================
# Pull latest image
# ============================================
echo -e "${BLUE}Pulling latest image: $IMAGE_NAME${NC}"
if docker pull "$IMAGE_NAME"; then
    echo -e "${GREEN}✓ Image pulled successfully${NC}"
else
    echo -e "${RED}✗ Failed to pull image${NC}"
    echo ""
    echo "Make sure:"
    echo "  1. Docker Hub username is set correctly"
    echo "  2. Image has been pushed to Docker Hub"
    echo "  3. You have internet connection"
    exit 1
fi

# ============================================
# Stop and remove old container
# ============================================
echo ""
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping old container..."
    docker stop "$CONTAINER_NAME" || true
    echo "Removing old container..."
    docker rm "$CONTAINER_NAME" || true
    echo -e "${GREEN}✓ Old container removed${NC}"
else
    echo -e "${YELLOW}No existing container found${NC}"
fi

# ============================================
# Start new container with same volumes
# ============================================
echo ""
echo "Starting new container with updated image..."

docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p 8080:8080 \
    -v "${VOLUME_CONFIG}:/app/config" \
    -v "${VOLUME_LOGS}:/app/logs" \
    "$IMAGE_NAME"

# ============================================
# Verify it's running
# ============================================
echo ""
sleep 2

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ Update Successful!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "View logs: docker logs -f $CONTAINER_NAME"
else
    echo -e "${RED}✗ Container failed to start${NC}"
    echo "Check logs: docker logs $CONTAINER_NAME"
    exit 1
fi

# ============================================
# Show recent logs
# ============================================
echo ""
echo "Recent logs:"
echo "---"
docker logs "$CONTAINER_NAME" --tail 20
