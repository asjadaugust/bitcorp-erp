#!/bin/bash

# Check if colima is installed
if ! command -v colima &> /dev/null; then
    echo "❌ colima is not installed. Please install it first."
    exit 1
fi

# Check if colima is running
if ! colima status &> /dev/null; then
    echo "🚀 Starting colima..."
    colima start --cpu 4 --memory 8
else
    echo "✅ colima is already running"
fi

# Set DOCKER_HOST
export DOCKER_HOST="unix://${HOME}/.colima/default/docker.sock"

# Verify docker connection
if docker info &> /dev/null; then
    echo "✅ Docker is reachable via colima"
    echo ""
    echo "To configure your current shell, run:"
    echo "  export DOCKER_HOST=\"$DOCKER_HOST\""
    echo ""
else
    echo "❌ Docker is NOT reachable. Check colima status."
    exit 1
fi
