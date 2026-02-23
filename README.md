# Clerk Agent Tasks - Playwright Test

End-to-end test demonstrating Clerk's Agent Tasks API for automated authentication.

## What This Tests

1. **Agent Task Creation** - Using `@clerk/backend` SDK
2. **URL Generation** - API generates authentication URLs
3. **Clerk Handshake** - Server-side authentication flow
4. **Session Creation** - Cookies and authentication state
5. **Redirect Flow** - User redirected to target app

## Setup

### Prerequisites

- Bun or Node.js installed
- Clerk account with secret key
- Existing user in your Clerk instance

### Installation

```bash
bun install

# Install Playwright browsers (first time only)
bun playwright install chromium
```

### Configuration

Create a `.env` file:

```bash
CLERK_SECRET_KEY=sk_test_...     # Your Clerk secret key
TEST_USER_ID=user_...            # User ID to authenticate as
TEST_APP_URL=https://...         # Your app URL
```

## Running Tests

```bash
# Run all tests
bun playwright test

# Run with visible browser
bun playwright test --headed

# Interactive mode
bun playwright test --ui

# View report
bun playwright show-report
```

## Test Flow

1. Create Agent Task via `@clerk/backend`
2. Navigate to generated URL in browser
3. Verify Clerk Handshake completes
4. Check session cookies are set
5. Confirm user is authenticated

## Example Code

```typescript
import { test, expect } from '@playwright/test';
import { createAgentTestingTask } from '@clerk/testing/playwright';

test.describe('Logged in state', () => {
  test('should display logged in message', async ({ page }) => {
    const userId = 'user_...';

    const { url } = await createAgentTestingTask({
      secretKey: process.env.CLERK_SECRET_KEY,
      onBehalfOf: { userId },
      permissions: "*",
      agentName: "test-agent",
      taskDescription: "Testing Agent Tasks",
      redirectUrl: "http://localhost:3000/",
    });

    await page.goto(url);

    const header = page.locator('header');
    await expect(header).toContainText(`User is logged in as ${userId}`);
  });
});
```

**Note**: `permissions` must be `"*"` (not `"all"`)

## agent-browser Integration

Skip manual login flows by combining Agent Tasks with [agent-browser](https://github.com/vercel-labs/agent-browser):

### Setup

```bash
# Install agent-browser globally
npm install -g agent-browser

# Set your Clerk secret key
export CLERK_SECRET_KEY=sk_test_...
```

### Usage

```bash
# Authenticate as user and open in browser
./scripts/agent-browser-clerk.sh user_123 https://your-app.com

# Or with email identifier
./scripts/agent-browser-clerk.sh user@example.com https://your-app.com

# Headed mode (visible browser)
./scripts/agent-browser-clerk.sh user_123 https://your-app.com --headed
```

The script:
1. Creates an Agent Task via Clerk API
2. Opens the pre-authenticated URL in agent-browser
3. Leaves a persistent session for interaction

After running, you can interact with the authenticated session:

```bash
# Use the session name from script output
export AGENT_BROWSER_SESSION=clerk-{timestamp}

agent-browser snapshot -i
agent-browser screenshot ~/Desktop/page.png
agent-browser click @e1
agent-browser close  # When done
```

## Project Structure

```
├── scripts/
│   └── agent-browser-clerk.sh    # agent-browser integration
├── tests/
│   ├── agent-task.spec.ts        # Full SDK test
│   └── agent-task-simple.spec.ts # Curl + Playwright test
├── playwright.config.ts
├── .env
└── package.json
```

## License

MIT
