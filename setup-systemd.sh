#!/bin/bash
# Setup script for installing apchaubot as a systemd user service

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="$SCRIPT_DIR/apchaubot.service"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"

echo "========================================="
echo "Apchaubot Systemd Service Setup"
echo "========================================="
echo ""

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo "Warning: .env file not found!"
    echo "Please create $SCRIPT_DIR/.env with your configuration."
    echo ""
    echo "Required variables:"
    echo "  BOT_TOKEN=your_telegram_bot_token"
    echo "  MONGODB_CONNECTION_STRING=your_mongodb_uri"
    echo "  PORT=8080"
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Make start-bot.sh executable
echo "Making start-bot.sh executable..."
chmod +x "$SCRIPT_DIR/start-bot.sh"

# Create systemd user directory if it doesn't exist
echo "Creating systemd user directory..."
mkdir -p "$SYSTEMD_USER_DIR"

# Copy service file
echo "Installing service file..."
cp "$SERVICE_FILE" "$SYSTEMD_USER_DIR/apchaubot.service"

# Reload systemd daemon
echo "Reloading systemd daemon..."
systemctl --user daemon-reload

# Enable linger (allows service to run after logout)
echo ""
echo "========================================="
echo "IMPORTANT: Enable User Linger"
echo "========================================="
echo "To keep the service running after logout, you need to enable linger."
echo ""
echo "Try running (might work without sudo):"
echo "  loginctl enable-linger $USER"
echo ""
echo "If that doesn't work, ask an admin to run:"
echo "  sudo loginctl enable-linger $USER"
echo ""
read -p "Press Enter to continue..."

# Enable and start the service
echo ""
echo "Enabling and starting the service..."
systemctl --user enable apchaubot.service
systemctl --user start apchaubot.service

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Service status:"
systemctl --user status apchaubot.service --no-pager
echo ""
echo "Useful commands:"
echo "  systemctl --user status apchaubot   # Check status"
echo "  systemctl --user stop apchaubot     # Stop service"
echo "  systemctl --user start apchaubot    # Start service"
echo "  systemctl --user restart apchaubot  # Restart service"
echo "  journalctl --user -u apchaubot -f   # View logs (follow)"
echo "  journalctl --user -u apchaubot -n 50  # View last 50 log lines"
echo ""
