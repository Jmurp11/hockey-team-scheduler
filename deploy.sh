#!/bin/bash
set -e

DROPLET_IP=$1
SSH_USER=${2:-root}
DEPLOY_DIR="/opt/hockey-team-scheduler"
SSH_KEY="$HOME/.ssh/id_digitalocean"

if [ -z "$DROPLET_IP" ]; then
  echo "Usage: ./deploy.sh <droplet-ip> [ssh-user]"
  exit 1
fi

echo "🚀 Deploying to $SSH_USER@$DROPLET_IP"

ssh -i "$SSH_KEY" "$SSH_USER@$DROPLET_IP" <<EOF
  set -e
  cd $DEPLOY_DIR

  echo "📥 Pulling latest images..."
  docker-compose pull

  echo "🔁 Restarting services..."
  docker-compose down
  docker-compose up -d

  echo "✅ Deployment complete"
  docker-compose ps
EOF