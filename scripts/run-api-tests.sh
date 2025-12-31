#!/bin/bash

###############################################################################
# Quick API Test Runner
# Convenience script to run API tests with common configurations
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Show usage
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  cat << EOF
${BLUE}API Testing Quick Runner${NC}

Usage: $0 [command] [options]

Commands:
  quick         Run tests without auth (fastest)
  auth          Run tests with authentication
  shell         Run basic shell script
  advanced      Run advanced shell script
  all           Run all three methods
  help          Show this help message

Options (after command):
  --url <url>      Base URL (default: http://localhost:3400)
  --email <email>  Email for login
  --password <pwd> Password for login
  --output <file>  Output file

Examples:
  $0 quick
  $0 auth --email admin@bitcorp.com --password admin123
  $0 shell --output my-report.md
  $0 all

${YELLOW}Default credentials:${NC}
  Email: admin@bitcorp.com
  Password: admin123

EOF
  exit 0
fi

# Default values
COMMAND="${1:-quick}"
BASE_URL="http://localhost:3400"
EMAIL="admin@bitcorp.com"
PASSWORD="admin123"
OUTPUT_FILE=""

# Parse additional arguments
shift || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --url)
      BASE_URL="$2"
      shift 2
      ;;
    --email)
      EMAIL="$2"
      shift 2
      ;;
    --password)
      PASSWORD="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Function to check if server is running
check_server() {
  echo -n "Checking if server is running at $BASE_URL... "
  if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    return 0
  else
    echo -e "${RED}✗${NC}"
    return 1
  fi
}

# Function to run Node.js tests
run_node_tests() {
  local auth_args=""
  
  if [[ "$1" == "auth" ]]; then
    auth_args="--email $EMAIL --password $PASSWORD"
    echo -e "${BLUE}Running Node.js tests with authentication...${NC}"
  else
    echo -e "${BLUE}Running Node.js tests (no authentication)...${NC}"
  fi
  
  if [[ -n "$OUTPUT_FILE" ]]; then
    auth_args="$auth_args --output $OUTPUT_FILE"
  fi
  
  node "$SCRIPT_DIR/test-api.js" --url "$BASE_URL" $auth_args
}

# Function to run shell tests
run_shell_tests() {
  local script_type="$1"
  
  if [[ "$script_type" == "basic" ]]; then
    echo -e "${BLUE}Running basic shell script...${NC}"
    BASE_URL="$BASE_URL" bash "$SCRIPT_DIR/test-api-endpoints.sh"
  else
    echo -e "${BLUE}Running advanced shell script...${NC}"
    BASE_URL="$BASE_URL" bash "$SCRIPT_DIR/test-api-advanced.sh"
  fi
}

# Main execution
echo -e "${BLUE}════════════════════════════════════${NC}"
echo -e "${BLUE}API Testing Quick Runner${NC}"
echo -e "${BLUE}════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Base URL:${NC} $BASE_URL"
echo ""

# Check server
if ! check_server; then
  echo ""
  echo -e "${RED}Error: Server is not running at $BASE_URL${NC}"
  echo ""
  echo -e "${YELLOW}To start the server, run:${NC}"
  echo "  docker-compose -f docker-compose.dev.yml up backend"
  echo ""
  exit 1
fi

echo ""

# Execute based on command
case $COMMAND in
  quick)
    run_node_tests "noauth"
    ;;
  auth)
    run_node_tests "auth"
    ;;
  shell)
    run_shell_tests "basic"
    ;;
  advanced)
    run_shell_tests "advanced"
    ;;
  all)
    echo -e "${BLUE}Running all test methods...${NC}"
    echo ""
    echo -e "${YELLOW}1. Node.js (no auth)${NC}"
    run_node_tests "noauth"
    echo ""
    echo -e "${YELLOW}2. Node.js (with auth)${NC}"
    run_node_tests "auth"
    echo ""
    echo -e "${YELLOW}3. Shell (basic)${NC}"
    run_shell_tests "basic"
    echo ""
    echo -e "${YELLOW}4. Shell (advanced)${NC}"
    run_shell_tests "advanced"
    ;;
  *)
    echo -e "${RED}Unknown command: $COMMAND${NC}"
    echo "Use '$0 --help' for usage information"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✓ Tests completed!${NC}"
echo ""
