#!/bin/bash
# Clerk + agent-browser integration
# Quick auth via Agent Tasks API for interactive debugging

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required env var
if [ -z "$CLERK_SECRET_KEY" ]; then
  echo -e "${RED}Error: CLERK_SECRET_KEY environment variable not set${NC}"
  echo "Set it in your shell: export CLERK_SECRET_KEY=sk_..."
  exit 1
fi

# Parse arguments
if [ $# -lt 2 ]; then
  echo "Usage: $0 <user_id_or_email> <redirect_url> [agent-browser-flags]"
  echo ""
  echo "Examples:"
  echo "  $0 user_123 https://app.example.com/dashboard"
  echo "  $0 user@example.com https://app.example.com --headed"
  echo "  $0 user_123 https://app.example.com --session myapp --headed"
  exit 1
fi

USER_IDENTIFIER="$1"
REDIRECT_URL="$2"
shift 2
BROWSER_FLAGS="$@"

# Determine if user_id or identifier
if [[ "$USER_IDENTIFIER" == user_* ]]; then
  ON_BEHALF_OF="{\"user_id\": \"$USER_IDENTIFIER\"}"
else
  ON_BEHALF_OF="{\"identifier\": \"$USER_IDENTIFIER\"}"
fi

echo -e "${YELLOW}Creating Agent Task...${NC}"

# Create Agent Task via API
RESPONSE=$(curl -s -X POST 'https://api.clerk.com/v1/agents/tasks' \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  -H 'Content-Type: application/json' \
  -d "{
    \"on_behalf_of\": $ON_BEHALF_OF,
    \"permissions\": \"*\",
    \"agent_name\": \"agent-browser\",
    \"task_description\": \"Interactive debugging session\",
    \"redirect_url\": \"$REDIRECT_URL\"
  }")

# Check for errors
if echo "$RESPONSE" | grep -q '"errors"'; then
  echo -e "${RED}Failed to create Agent Task:${NC}"
  echo "$RESPONSE" | jq -r '.errors[0].long_message // .errors[0].message'
  exit 1
fi

# Extract URL
TASK_URL=$(echo "$RESPONSE" | jq -r '.url')

if [ -z "$TASK_URL" ] || [ "$TASK_URL" = "null" ]; then
  echo -e "${RED}Failed to extract task URL from response${NC}"
  echo "$RESPONSE"
  exit 1
fi

echo -e "${GREEN}Agent Task created!${NC}"
echo "User: $USER_IDENTIFIER"
echo "URL: $REDIRECT_URL"
echo ""
echo -e "${YELLOW}Opening in agent-browser...${NC}"

# Generate session name (clerk-{timestamp})
SESSION_NAME="clerk-$(date +%s)"

# Open with agent-browser using named session
echo "Session: $SESSION_NAME"
agent-browser --session "$SESSION_NAME" $BROWSER_FLAGS open "$TASK_URL"

# Wait for handshake to complete
sleep 3

# Verify authentication succeeded
CURRENT_URL=$(agent-browser --session "$SESSION_NAME" get url 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$CURRENT_URL" ]; then
  echo ""
  echo -e "${GREEN}✓ Authenticated! Browser ready for interaction.${NC}"
  echo ""
  echo -e "Session name: ${YELLOW}$SESSION_NAME${NC}"
  echo "Current URL: $CURRENT_URL"
  echo ""
  echo "Common commands (use --session flag):"
  echo "  agent-browser --session $SESSION_NAME snapshot -i"
  echo "  agent-browser --session $SESSION_NAME screenshot"
  echo "  agent-browser --session $SESSION_NAME get url"
  echo "  agent-browser --session $SESSION_NAME close"
  echo ""
  echo "Or set environment variable:"
  echo "  export AGENT_BROWSER_SESSION=$SESSION_NAME"
  echo "  agent-browser snapshot -i"
else
  echo ""
  echo -e "${RED}✗ Browser session failed. Try again or use --headed to debug.${NC}"
  agent-browser --session "$SESSION_NAME" close 2>/dev/null
  exit 1
fi
