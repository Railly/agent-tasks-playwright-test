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
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

const agentTask = await clerkClient.agentTasks.create({
  onBehalfOf: { userId: 'user_...' },
  permissions: '*',
  agentName: 'test-agent',
  taskDescription: 'Testing Agent Tasks',
  redirectUrl: 'https://your-app.com',
});

// Navigate to agentTask.url with Playwright
```

**Note**: `permissions` must be `"*"` (not `"all"`)

## Project Structure

```
├── tests/
│   ├── agent-task.spec.ts        # Full SDK test
│   └── agent-task-simple.spec.ts # Curl + Playwright test
├── playwright.config.ts
├── .env
└── package.json
```

## License

MIT
