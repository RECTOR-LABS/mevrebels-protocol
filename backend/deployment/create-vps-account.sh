#!/bin/bash
#
# Create new VPS account for MEVrebels backend deployment
# Run this script on the VPS from an account with sudo privileges
#

set -e

echo "🚀 Creating MEVrebels backend VPS account..."

# Account name
ACCOUNT_NAME="mevrebels"

# Check if account already exists
if id "$ACCOUNT_NAME" &>/dev/null; then
    echo "❌ Account $ACCOUNT_NAME already exists"
    exit 1
fi

# Create user with home directory
echo "Creating user: $ACCOUNT_NAME"
sudo useradd -m -s /bin/bash "$ACCOUNT_NAME"

# Set up SSH directory
echo "Setting up SSH configuration..."
sudo mkdir -p /home/$ACCOUNT_NAME/.ssh
sudo chmod 700 /home/$ACCOUNT_NAME/.ssh

# Copy your public key (you'll need to provide this)
echo "Please add your SSH public key to /home/$ACCOUNT_NAME/.ssh/authorized_keys"
echo "Run on your local machine:"
echo "  cat ~/.ssh/id_ed25519.pub"
echo ""
echo "Then run on VPS:"
echo "  sudo nano /home/$ACCOUNT_NAME/.ssh/authorized_keys"
echo "  # Paste your public key"
echo "  sudo chmod 600 /home/$ACCOUNT_NAME/.ssh/authorized_keys"
echo "  sudo chown -R $ACCOUNT_NAME:$ACCOUNT_NAME /home/$ACCOUNT_NAME/.ssh"

# Create project directory
echo "Creating project directories..."
sudo mkdir -p /home/$ACCOUNT_NAME/mevrebels-backend
sudo chown -R $ACCOUNT_NAME:$ACCOUNT_NAME /home/$ACCOUNT_NAME

# Optional: Add user to docker group (if Docker will be used)
if command -v docker &> /dev/null; then
    echo "Adding $ACCOUNT_NAME to docker group..."
    sudo usermod -aG docker "$ACCOUNT_NAME"
fi

echo ""
echo "✅ Account created successfully!"
echo ""
echo "Next steps:"
echo "1. Set up SSH key authentication (see instructions above)"
echo "2. Test SSH connection: ssh $ACCOUNT_NAME@\$(hostname)"
echo "3. Add to ~/.ssh/config on local machine:"
echo ""
echo "Host mevrebels"
echo "  HostName \$(hostname -I | awk '{print \$1}')"
echo "  User $ACCOUNT_NAME"
echo ""
