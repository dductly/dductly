#!/usr/bin/env node

/**
 * Simple test script to verify the authentication setup
 * Run this after setting up environment variables
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001/api';

async function testHealthCheck() {
  try {
    console.log('Testing health check...');
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('Health check passed:', data);
      return true;
    } else {
      console.log('Health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('Health check error:', error.message);
    return false;
  }
}

async function testSignUp() {
  try {
    console.log('Testing sign up...');
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'testpassword123',
      firstName: 'Test',
      lastName: 'User'
    };

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Sign up test passed');
      return { success: true, user: testUser };
    } else {
      console.log('Sign up test failed:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log('Sign up error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSignIn(user) {
  try {
    console.log('🔍 Testing sign in...');
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Sign in test passed');
      return { success: true, token: data.session?.access_token };
    } else {
      console.log('Sign in test failed:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log('Sign in error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testGetUser(token) {
  try {
    console.log('🔍 Testing get current user...');
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Get user test passed');
      return { success: true, user: data.user };
    } else {
      console.log('Get user test failed:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.log('Get user error:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('Starting authentication tests...\n');

  // Test 1: Health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\nBackend server is not running. Please start it with: cd backend && npm run dev');
    process.exit(1);
  }

  console.log('');

  // Test 2: Sign up
  const signUpResult = await testSignUp();
  if (!signUpResult.success) {
    console.log('\nSign up test failed. Check your Supabase configuration.');
    process.exit(1);
  }

  console.log('');

  // Test 3: Sign in
  const signInResult = await testSignIn(signUpResult.user);
  if (!signInResult.success) {
    console.log('\nSign in test failed.');
    process.exit(1);
  }

  console.log('');

  // Test 4: Get user
  const getUserResult = await testGetUser(signInResult.token);
  if (!getUserResult.success) {
    console.log('\nGet user test failed.');
    process.exit(1);
  }

  console.log('\nAll tests passed! Your authentication setup is working correctly.');
  console.log('\nNext steps:');
  console.log('1. Start the frontend: cd frontend && npm run dev');
  console.log('2. Open http://localhost:5173 in your browser');
  console.log('3. Try signing up and signing in through the UI');
}

// Check if node-fetch is available
try {
  require('node-fetch');
} catch (error) {
  console.log('❌ node-fetch is required for this test script.');
  console.log('Install it with: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);





