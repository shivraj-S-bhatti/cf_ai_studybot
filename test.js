/**
 * Comprehensive Test Suite for Study Buddy Agent
 * 
 * This test suite validates all major functionality of the Study Buddy Agent:
 * - Basic chat functionality
 * - AI-powered topic summarization
 * - Quiz generation
 * - Progress tracking
 * - Error handling
 * - API endpoints
 */

const testAgent = async (baseUrl) => {
  console.log('🧪 Testing Study Buddy Agent...');
  console.log(`🔗 Testing against: ${baseUrl}`);
  
  const tests = [];
  let passed = 0;
  let failed = 0;
  
  // Test helper function
  const runTest = async (name, testFn) => {
    try {
      console.log(`\n📝 Testing ${name}...`);
      await testFn();
      console.log(`✅ ${name} test passed`);
      tests.push({ name, status: 'PASSED' });
      passed++;
    } catch (error) {
      console.error(`❌ ${name} test failed:`, error.message);
      tests.push({ name, status: 'FAILED', error: error.message });
      failed++;
    }
  };
  
  // Test 1: Basic chat functionality
  await runTest('Basic Chat', async () => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, can you help me study?',
        userId: 'test-user'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.response || typeof data.response !== 'string') {
      throw new Error('Invalid response format');
    }
  });
  
  // Test 2: Topic summarization
  await runTest('Topic Summarization', async () => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'summarize machine learning',
        userId: 'test-user'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.response || !data.response.includes('machine learning')) {
      throw new Error('Summarization not working properly');
    }
  });
  
  // Test 3: Quiz generation
  await runTest('Quiz Generation', async () => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'quiz me on calculus',
        userId: 'test-user'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.response || !data.response.includes('Question')) {
      throw new Error('Quiz generation not working properly');
    }
  });
  
  // Test 4: Progress tracking
  await runTest('Progress Tracking', async () => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'show my progress',
        userId: 'test-user'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.response || !data.response.includes('Streak')) {
      throw new Error('Progress tracking not working properly');
    }
  });
  
  // Test 5: General questions
  await runTest('General Questions', async () => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'who are you?',
        userId: 'test-user'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data.response || typeof data.response !== 'string') {
      throw new Error('General questions not working properly');
    }
  });
  
  // Test 6: Test endpoints
  await runTest('Test Endpoints', async () => {
    const endpoints = [
      '/api/test/types',
      '/api/test/ai',
      '/api/test/database'
    ];
    
    for (const endpoint of endpoints) {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`Test endpoint ${endpoint} failed: ${response.status}`);
      }
    }
  });
  
  // Test 7: Error handling
  await runTest('Error Handling', async () => {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        userId: 'test-user'
      })
    });
    
    // Should handle empty messages gracefully
    if (!response.ok && response.status !== 400) {
      throw new Error('Error handling not working properly');
    }
  });
  
  // Test 8: WebSocket endpoint (basic check)
  await runTest('WebSocket Endpoint', async () => {
    // For now, just check that the main endpoint is accessible
    // WebSocket testing requires a more complex setup
    const response = await fetch(`${baseUrl}/`);
    
    if (!response.ok) {
      throw new Error('Main endpoint not accessible');
    }
    
    // Check if it returns HTML (indicating the frontend is served)
    const text = await response.text();
    if (!text.includes('Study Buddy Agent')) {
      throw new Error('Frontend not properly served');
    }
  });
  
  // Print test summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  tests.forEach(test => {
    const status = test.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  console.log(`\n🎯 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Study Buddy Agent is working correctly.');
  }
};

// Get URL from command line argument or use default
const baseUrl = process.argv[2] || 'http://localhost:8787';

// Run tests
testAgent(baseUrl).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
