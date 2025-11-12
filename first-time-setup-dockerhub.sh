#!/bin/bash
# First-time setup script for using Docker Hub images
# Run this once on a new lab PC (after images are on Docker Hub)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================="
echo "Apchaubot First-Time Setup (Docker Hub)"
echo "========================================="
echo ""

# ============================================
# Get Docker Hub username
# ============================================
if [ -z "$DOCKER_USERNAME" ]; then
    read -p "Enter your Docker Hub username: " DOCKER_USERNAME
    export DOCKER_USERNAME
    echo ""
fi

echo -e "${BLUE}Using Docker Hub: $DOCKER_USERNAME/apchaubot${NC}"
echo ""

# ============================================
# Check if .env exists
# ============================================
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env <<EOF
BOT_TOKEN=your_bot_token_here
MONGODB_CONNECTION_STRING=your_mongodb_uri_here
PORT=8080
EOF
    echo -e "${RED}Please edit .env file with your actual credentials!${NC}"
    echo ""
    read -p "Press Enter after you've edited .env..."
fi

# ============================================
# Create Docker volumes
# ============================================
echo "Creating Docker volumes..."

if ! docker volume ls -q | grep -q "^apchaubot-config$"; then
    docker volume create apchaubot-config
    echo -e "${GREEN}✓ Created apchaubot-config volume${NC}"
else
    echo -e "${BLUE}✓ apchaubot-config volume exists${NC}"
fi

if ! docker volume ls -q | grep -q "^apchaubot-logs$"; then
    docker volume create apchaubot-logs
    echo -e "${GREEN}✓ Created apchaubot-logs volume${NC}"
else
    echo -e "${BLUE}✓ apchaubot-logs volume exists${NC}"
fi

# ============================================
# Copy .env to volume
# ============================================
echo ""
echo "Copying .env to persistent volume..."

docker run --rm \
    -v apchaubot-config:/config \
    -v "$(pwd)/.env:/tmp/.env:ro" \
    alpine cp /tmp/.env /config/.env

echo -e "${GREEN}✓ .env copied to volume${NC}"

# ============================================
# Pull latest image
# ============================================
echo ""
echo "Pulling latest image from Docker Hub..."

if docker pull "$DOCKER_USERNAME/apchaubot:latest"; then
    echo -e "${GREEN}✓ Image pulled successfully${NC}"
else
    echo -e "${RED}✗ Failed to pull image${NC}"
    echo ""
    echo "Make sure:"
    echo "  1. You've pushed code to GitHub"
    echo "  2. GitHub Actions completed successfully"
    echo "  3. Image exists at hub.docker.com/r/$DOCKER_USERNAME/apchaubot"
    exit 1
fi

# ============================================
# Start container
# ============================================
echo ""
echo "Starting container..."

docker run -d \
    --name apchaubot \
    --restart unless-stopped \
    -p 8080:8080 \
    -v apchaubot-config:/app/config \
    -v apchaubot-logs:/app/logs \
    "$DOCKER_USERNAME/apchaubot:latest"

echo ""
sleep 2

# ============================================
# Verify
# ============================================
if docker ps --format '{{.Names}}' | grep -q "^apchaubot$"; then
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ Setup Complete!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    docker ps --filter "name=apchaubot" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "The bot is now running!"
    echo ""
    echo "View logs: docker logs -f apchaubot"
    echo "Update bot: ./update-bot.sh"
    echo ""
    echo "Remember to set DOCKER_USERNAME in your shell:"
    echo "  echo 'export DOCKER_USERNAME=$DOCKER_USERNAME' >> ~/.bashrc"
else
    echo -e "${RED}✗ Container failed to start${NC}"
    echo "Check logs: docker logs apchaubot"
    exit 1
fi

# ============================================
# Show logs
# ============================================
echo "Recent logs:"
echo "---"
docker logs apchaubot --tail 30
