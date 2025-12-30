/**
 * Load testing script using k6
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const eventFeedDuration = new Trend('event_feed_duration');
const eventDetailDuration = new Trend('event_detail_duration');

// Test configuration
export const options = {
  stages: [
    // Warm-up
    { duration: '1m', target: 50 },
    
    // Ramp up to normal load
    { duration: '2m', target: 100 },
    { duration: '3m', target: 100 },
    
    // Spike test - simulate traffic spike
    { duration: '1m', target: 500 },
    { duration: '2m', target: 500 },
    
    // Stress test - push to limits
    { duration: '2m', target: 1000 },
    { duration: '3m', target: 1000 },
    
    // Peak load - maximum expected concurrent users
    { duration: '2m', target: 2000 },
    { duration: '3m', target: 2000 },
    
    // Ramp down
    { duration: '2m', target: 0 },
  ],
  
  thresholds: {
    // 95% of requests should complete within 500ms
    http_req_duration: ['p(95)<500'],
    
    // 99% of requests should complete within 1s
    'http_req_duration{expected_response:true}': ['p(99)<1000'],
    
    // Error rate should be less than 1%
    errors: ['rate<0.01'],
    
    // Specific endpoint thresholds
    'event_feed_duration': ['p(95)<500'],
    'event_detail_duration': ['p(95)<300'],
  },
};

// Base URL - change to your API endpoint
const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

// Test data
const states = ['Lagos', 'Abuja', 'Kano', 'Rivers', 'Oyo'];
const eventTypes = ['wedding', 'crusade', 'burial', 'festival', 'general'];

/**
 * Setup function - runs once before test
 */
export function setup() {
  // Health check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check passed': (r) => r.status === 200,
  });
  
  return { timestamp: new Date().toISOString() };
}

/**
 * Main test function - runs for each virtual user
 */
export default function (data) {
  // Simulate user browsing behavior
  
  group('Event Discovery', () => {
    // 1. Browse event feed
    const state = states[Math.floor(Math.random() * states.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    const feedRes = http.get(
      `${BASE_URL}/api/events?state=${state}&eventType=${eventType}&page=1&limit=20`
    );
    
    const feedSuccess = check(feedRes, {
      'event feed status is 200': (r) => r.status === 200,
      'event feed has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.events);
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!feedSuccess);
    eventFeedDuration.add(feedRes.timings.duration);
    
    // 2. View event details (if feed successful)
    if (feedSuccess && feedRes.body) {
      try {
        const body = JSON.parse(feedRes.body);
        if (body.events && body.events.length > 0) {
          const randomEvent = body.events[Math.floor(Math.random() * body.events.length)];
          
          const detailRes = http.get(`${BASE_URL}/api/events/${randomEvent.id}`);
          
          const detailSuccess = check(detailRes, {
            'event detail status is 200': (r) => r.status === 200,
            'event detail has data': (r) => {
              try {
                const detailBody = JSON.parse(r.body);
                return detailBody.event && detailBody.event.id === randomEvent.id;
              } catch {
                return false;
              }
            },
          });
          
          errorRate.add(!detailSuccess);
          eventDetailDuration.add(detailRes.timings.duration);
        }
      } catch (error) {
        console.error('Error parsing event feed:', error);
      }
    }
  });
  
  // Think time - simulate user reading content
  sleep(Math.random() * 3 + 1); // 1-4 seconds
  
  // 20% of users check their tickets
  if (Math.random() < 0.2) {
    group('User Tickets', () => {
      // Note: This would require authentication
      // For load testing, we're just testing the endpoint
      const ticketsRes = http.get(`${BASE_URL}/api/tickets/my-tickets`, {
        headers: {
          'Authorization': 'Bearer test-token', // Mock token for testing
        },
      });
      
      check(ticketsRes, {
        'tickets endpoint responds': (r) => r.status === 200 || r.status === 401,
      });
    });
    
    sleep(Math.random() * 2 + 1);
  }
  
  // 10% of users check referral leaderboard
  if (Math.random() < 0.1) {
    group('Referral Leaderboard', () => {
      const leaderboardRes = http.get(`${BASE_URL}/api/referrals/leaderboard`);
      
      check(leaderboardRes, {
        'leaderboard status is 200': (r) => r.status === 200,
      });
    });
    
    sleep(Math.random() * 2 + 1);
  }
}

/**
 * Teardown function - runs once after test
 */
export function teardown(data) {
  console.log('Test completed at:', new Date().toISOString());
  console.log('Test started at:', data.timestamp);
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}Test Summary\n`;
  summary += `${indent}============\n\n`;
  
  // Metrics
  const metrics = data.metrics;
  
  if (metrics.http_req_duration) {
    summary += `${indent}HTTP Request Duration:\n`;
    summary += `${indent}  avg: ${metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  p95: ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  p99: ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;
  }
  
  if (metrics.http_reqs) {
    summary += `${indent}HTTP Requests:\n`;
    summary += `${indent}  total: ${metrics.http_reqs.values.count}\n`;
    summary += `${indent}  rate: ${metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  }
  
  if (metrics.errors) {
    const errorRate = (metrics.errors.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${errorRate}%\n\n`;
  }
  
  return summary;
}
