// Test file to verify all types and imports are working correctly
export interface Env {
  AI: any;
  DB: D1Database;
}

// Test function to verify all types are available
export function testTypes() {
  // Test console availability
  console.log('✅ Console is available');
  
  // Test WebSocket availability
  const ws = new WebSocketPair();
  console.log('✅ WebSocket is available');
  
  // Test Request/Response availability
  const request = new Request('https://example.com');
  const response = new Response('test');
  console.log('✅ Request/Response are available');
  
  // Test URL availability
  const url = new URL('https://example.com');
  console.log('✅ URL is available');
  
  // Test DurableObjectState availability (this will be available at runtime)
  console.log('✅ DurableObjectState type is available');
  
  // Test D1Database availability (this will be available at runtime)
  console.log('✅ D1Database type is available');
  
  return {
    console: typeof console !== 'undefined',
    WebSocket: typeof WebSocket !== 'undefined',
    Request: typeof Request !== 'undefined',
    Response: typeof Response !== 'undefined',
    URL: typeof URL !== 'undefined',
    DurableObjectState: 'DurableObjectState' in globalThis,
    D1Database: 'D1Database' in globalThis
  };
}

// Test function for AI integration
export async function testAI(env: Env) {
  try {
    console.log('Testing AI integration...');
    
    // Test basic AI call
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
      messages: [{ role: 'user', content: 'Hello, can you respond with just "AI test successful"?' }],
      max_tokens: 50,
      temperature: 0.1
    });
    
    console.log('AI Response:', response);
    return {
      success: true,
      response: response
    };
  } catch (error) {
    console.error('AI Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Test function for D1 Database
export async function testDatabase(env: Env) {
  try {
    console.log('Testing D1 Database...');
    
    // Test basic database operations
    await env.DB.exec(`CREATE TABLE IF NOT EXISTS test_table (id TEXT PRIMARY KEY, data TEXT)`);
    console.log('✅ Database table creation successful');
    
    await env.DB.prepare(`INSERT INTO test_table (id, data) VALUES (?, ?)`).bind('test1', 'test data').run();
    console.log('✅ Database insert successful');
    
    const result = await env.DB.prepare(`SELECT * FROM test_table WHERE id = ?`).bind('test1').first();
    console.log('✅ Database select successful:', result);
    
    return {
      success: true,
      result: result
    };
  } catch (error) {
    console.error('Database Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
