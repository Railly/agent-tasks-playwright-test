import { test, expect } from '@playwright/test';

/**
 * Simplified Agent Tasks Test
 *
 * This test demonstrates the Agent Tasks authentication flow by testing
 * against a pre-generated URL. The full test with `@clerk/backend` can be found
 * in agent-task.spec.ts (currently has API parameter validation issues).
 *
 * What this proves:
 * 1. ✅ Agent Task URLs work correctly
 * 2. ✅ Clerk Handshake completes successfully
 * 3. ✅ User is authenticated after redirect
 * 4. ✅ Session cookies are properly set
 */

const TEST_APP_URL = process.env.TEST_APP_URL || 'https://clerk-plapi-3.crafter.run';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY!;
const TEST_USER_ID = process.env.TEST_USER_ID!;

test.describe('Agent Tasks - Handshake Flow', () => {
  test('should authenticate user via Agent Task URL and complete handshake', async ({ page, context }) => {
    console.log('\n🧪 Testing Agent Tasks Handshake Flow...\n');

    // Step 1: Generate a fresh Agent Task URL using curl
    console.log('📝 Step 1: Generating Agent Task URL via curl...');

    const { execSync } = await import('child_process');
    const createTaskCommand = `curl -X POST 'https://api.clerk.com/v1/agents/tasks' \\
      -H 'Authorization: Bearer ${CLERK_SECRET_KEY}' \\
      -H 'Content-Type: application/json' \\
      -d '{
        "on_behalf_of": {"user_id": "${TEST_USER_ID}"},
        "permissions": "*",
        "agent_name": "playwright-handshake-test",
        "task_description": "Testing Handshake flow with Playwright",
        "redirect_url": "${TEST_APP_URL}",
        "session_max_duration_in_seconds": 3600
      }' 2>/dev/null`;

    const response = execSync(createTaskCommand, { encoding: 'utf-8' });
    console.log('Raw response:', response);

    const taskData = JSON.parse(response);

    console.log('✅ Agent Task created!');
    console.log('   Agent ID:', taskData.agent_id);
    console.log('   Task ID:', taskData.task_id);
    console.log('   URL:', taskData.url);

    expect(taskData.url).toBeTruthy();
    expect(taskData.url).toContain('/v1/agents/tasks');

    // Step 2: Navigate to the generated URL
    console.log('\n🌐 Step 2: Navigating to Agent Task URL...');
    await page.goto(taskData.url);

    // Wait for Clerk Handshake to complete and redirect
    console.log('⏳ Waiting for Clerk Handshake to complete...');
    await page.waitForURL(`${TEST_APP_URL}/**`, { timeout: 15000 });

    console.log('✅ Redirected to app successfully!');
    console.log('   Current URL:', page.url());

    // Step 3: Verify user is authenticated
    console.log('\n🔐 Step 3: Verifying authentication...');

    // Wait for page to stabilize
    await page.waitForTimeout(2000);

    // Check for Clerk session cookies
    const cookies = await context.cookies();
    const clerkCookies = cookies.filter(c =>
      c.name.includes('__session') ||
      c.name.includes('__client_uat')
    );

    console.log('🍪 Clerk cookies found:', clerkCookies.length);
    clerkCookies.forEach(c => {
      console.log(`   - ${c.name}: ${c.value.substring(0, 20)}...`);
    });

    // Verify we have session cookies
    expect(clerkCookies.length).toBeGreaterThan(0);

    // Check page content for authentication state
    const pageContent = await page.content();

    // Most Clerk apps will have these indicators when authenticated
    const hasClerkScript = pageContent.includes('clerk');
    const hasSessionData = clerkCookies.some(c => c.name.includes('__session'));

    console.log('✅ Authentication indicators:');
    console.log('   - Clerk scripts present:', hasClerkScript);
    console.log('   - Session cookie set:', hasSessionData);

    expect(hasSessionData).toBe(true);

    // Step 4: Test Summary
    console.log('\n✨ Test Summary:');
    console.log('   ✅ Agent Task URL generated via API');
    console.log('   ✅ Clerk Handshake flow completed');
    console.log('   ✅ User redirected to target app');
    console.log('   ✅ Session cookies properly set');
    console.log('   ✅ Authentication successful\n');

    // Take screenshot for proof
    await page.screenshot({ path: 'test-results/authenticated-handshake.png', fullPage: true });
    console.log('📸 Screenshot saved!\n');
  });
});
