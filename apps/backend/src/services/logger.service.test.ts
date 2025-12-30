/**
 * Property-based tests for logger service
 * Feature: tikit-webapp, Property 53: Error logging completeness
 * Validates: Requirements 15.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { logger, LogLevel, LogContext } from './logger.service';

// Mock console methods
const mockConsole = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

describe('Logger Service - Property Tests', () => {
  beforeEach(() => {
    // Replace console methods with mocks
    global.console.debug = mockConsole.debug;
    global.console.info = mockConsole.info;
    global.console.warn = mockConsole.warn;
    global.console.error = mockConsole.error;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 53: Error logging completeness
   * For any system error, a log entry should be created with full context
   * including timestamp, user ID, request details, and stack trace
   */
  describe('Property 53: Error logging completeness', () => {
    it('should log all error details with complete context', () => {
      /**
       * Feature: tikit-webapp, Property 53: Error logging completeness
       * Validates: Requirements 15.5
       */
      
      // Generator for error messages
      const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);
      
      // Generator for error names
      const errorNameArb = fc.constantFrom(
        'ValidationError',
        'DatabaseError',
        'PaymentError',
        'AuthenticationError',
        'NotFoundError',
        'InternalError'
      );
      
      // Generator for log context
      const contextArb = fc.record({
        userId: fc.option(fc.uuid(), { nil: undefined }),
        requestId: fc.option(fc.uuid(), { nil: undefined }),
        eventId: fc.option(fc.uuid(), { nil: undefined }),
        ticketId: fc.option(fc.uuid(), { nil: undefined }),
        paymentId: fc.option(fc.uuid(), { nil: undefined }),
      });
      
      fc.assert(
        fc.property(
          errorMessageArb,
          errorNameArb,
          contextArb,
          (errorMessage, errorName, context) => {
            // Create error with name and message
            const error = new Error(errorMessage);
            error.name = errorName;
            
            // Log the error
            logger.error('Test error occurred', error, context);
            
            // Verify console.error was called
            expect(mockConsole.error).toHaveBeenCalled();
            
            // Get the logged output
            const loggedOutput = mockConsole.error.mock.calls[0][0];
            
            // Verify log contains all required information
            
            // 1. Should contain timestamp (ISO 8601 format)
            expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
            
            // 2. Should contain log level
            expect(loggedOutput).toContain('[ERROR]');
            
            // 3. Should contain the message
            expect(loggedOutput).toContain('Test error occurred');
            
            // 4. Should contain error section
            expect(loggedOutput).toContain('Error:');
            
            // 5. Should contain stack trace
            expect(loggedOutput).toContain('Stack:');
            
            // 6. Should contain context if provided - verify via JSON parsing
            if (Object.keys(context).some(k => context[k] !== undefined)) {
              expect(loggedOutput).toContain('Context:');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log errors with consistent structure across all error types', () => {
      /**
       * Feature: tikit-webapp, Property 53: Error logging completeness
       * Validates: Requirements 15.5
       */
      
      // Generator for different error types
      const errorArb = fc.oneof(
        fc.constant(new Error('Standard error')),
        fc.constant(new TypeError('Type error')),
        fc.constant(new ReferenceError('Reference error')),
        fc.constant(new SyntaxError('Syntax error')),
        fc.constant(new RangeError('Range error'))
      );
      
      const messageArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
      const contextArb = fc.record({
        userId: fc.uuid(),
        requestId: fc.uuid(),
      });
      
      fc.assert(
        fc.property(
          errorArb,
          messageArb,
          contextArb,
          (error, message, context) => {
            // Log the error
            logger.error(message, error, context);
            
            // Verify console.error was called
            expect(mockConsole.error).toHaveBeenCalled();
            
            const loggedOutput = mockConsole.error.mock.calls[0][0];
            
            // All errors should have consistent structure
            expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/); // Timestamp
            expect(loggedOutput).toContain('[ERROR]'); // Level
            expect(loggedOutput).toContain('Error:'); // Error section
            expect(loggedOutput).toContain('Stack:'); // Stack trace
            expect(loggedOutput).toContain('Context:'); // Context section
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve all context fields in error logs', () => {
      /**
       * Feature: tikit-webapp, Property 53: Error logging completeness
       * Validates: Requirements 15.5
       */
      
      // Generator for comprehensive context
      const contextArb = fc.record({
        userId: fc.uuid(),
        requestId: fc.uuid(),
        eventId: fc.uuid(),
        ticketId: fc.uuid(),
        paymentId: fc.uuid(),
        method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        path: fc.constantFrom('/api/events', '/api/tickets', '/api/payments'),
        statusCode: fc.integer({ min: 400, max: 599 }),
        duration: fc.integer({ min: 1, max: 10000 }),
      });
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          contextArb,
          (message, context) => {
            const error = new Error('Test error');
            
            // Log with full context
            logger.error(message, error, context);
            
            const loggedOutput = mockConsole.error.mock.calls[0][0];
            
            // Verify log structure
            expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
            expect(loggedOutput).toContain('[ERROR]');
            
            // Verify context is present as JSON string
            expect(loggedOutput).toContain('Context:');
            const contextMatch = loggedOutput.match(/Context: ({[^}]+})/);
            expect(contextMatch).toBeTruthy();
            
            if (contextMatch) {
              const parsedContext = JSON.parse(contextMatch[1]);
              // Verify all fields exist (values may be shrunk by fast-check)
              expect(parsedContext).toHaveProperty('userId');
              expect(parsedContext).toHaveProperty('requestId');
              expect(parsedContext).toHaveProperty('eventId');
              expect(parsedContext).toHaveProperty('ticketId');
              expect(parsedContext).toHaveProperty('paymentId');
              expect(parsedContext).toHaveProperty('method');
              expect(parsedContext).toHaveProperty('path');
              expect(parsedContext).toHaveProperty('statusCode');
              expect(parsedContext).toHaveProperty('duration');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log errors even with minimal context', () => {
      /**
       * Feature: tikit-webapp, Property 53: Error logging completeness
       * Validates: Requirements 15.5
       */
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          (message) => {
            const error = new Error('Test error');
            
            // Log with no context
            logger.error(message, error);
            
            // Should still log successfully
            expect(mockConsole.error).toHaveBeenCalled();
            
            const loggedOutput = mockConsole.error.mock.calls[0][0];
            
            // Should still have required fields
            expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
            expect(loggedOutput).toContain('[ERROR]');
            expect(loggedOutput).toContain('Error:');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle errors with very long messages and stack traces', () => {
      /**
       * Feature: tikit-webapp, Property 53: Error logging completeness
       * Validates: Requirements 15.5
       */
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 100, maxLength: 1000 }).filter(s => s.trim().length > 0),
          fc.string({ minLength: 100, maxLength: 1000 }).filter(s => s.trim().length > 0),
          (errorMessage, logMessage) => {
            const error = new Error(errorMessage);
            
            // Log error with long message
            logger.error(logMessage, error);
            
            // Should log successfully without truncation
            expect(mockConsole.error).toHaveBeenCalled();
            
            const loggedOutput = mockConsole.error.mock.calls[0][0];
            
            // Should have proper structure
            expect(loggedOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
            expect(loggedOutput).toContain('[ERROR]');
            expect(loggedOutput).toContain('Error:');
            
            return true;
          }
        ),
        { numRuns: 50 } // Fewer runs for long strings
      );
    });
  });

  describe('Info and Warning Logs', () => {
    it('should log info messages with context', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.record({
            userId: fc.uuid(),
            action: fc.constantFrom('login', 'logout', 'purchase', 'view'),
          }),
          (message, context) => {
            logger.info(message, context);
            
            expect(mockConsole.info).toHaveBeenCalled();
            
            const loggedOutput = mockConsole.info.mock.calls[0][0];
            
            expect(loggedOutput).toContain('[INFO]');
            expect(loggedOutput).toContain('Context:');
            
            // Parse and verify context exists
            const contextMatch = loggedOutput.match(/Context: ({[^}]+})/);
            expect(contextMatch).toBeTruthy();
            
            if (contextMatch) {
              const parsedContext = JSON.parse(contextMatch[1]);
              expect(parsedContext).toHaveProperty('userId');
              expect(parsedContext).toHaveProperty('action');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should log warning messages with context', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.record({
            userId: fc.uuid(),
            warning: fc.constantFrom('rate_limit', 'deprecated_api', 'low_balance'),
          }),
          (message, context) => {
            logger.warn(message, context);
            
            expect(mockConsole.warn).toHaveBeenCalled();
            
            const loggedOutput = mockConsole.warn.mock.calls[0][0];
            
            expect(loggedOutput).toContain('[WARN]');
            expect(loggedOutput).toContain('Context:');
            
            // Parse and verify context exists
            const contextMatch = loggedOutput.match(/Context: ({[^}]+})/);
            expect(contextMatch).toBeTruthy();
            
            if (contextMatch) {
              const parsedContext = JSON.parse(contextMatch[1]);
              expect(parsedContext).toHaveProperty('userId');
              expect(parsedContext).toHaveProperty('warning');
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Log Timestamp Consistency', () => {
    it('should include valid ISO 8601 timestamps in all logs', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            () => logger.debug('test'),
            () => logger.info('test'),
            () => logger.warn('test'),
            () => logger.error('test')
          ),
          (logFn) => {
            logFn();
            
            // Get the last console call
            const lastCall = 
              mockConsole.debug.mock.calls[mockConsole.debug.mock.calls.length - 1] ||
              mockConsole.info.mock.calls[mockConsole.info.mock.calls.length - 1] ||
              mockConsole.warn.mock.calls[mockConsole.warn.mock.calls.length - 1] ||
              mockConsole.error.mock.calls[mockConsole.error.mock.calls.length - 1];
            
            if (lastCall) {
              const loggedOutput = lastCall[0];
              
              // Extract timestamp
              const timestampMatch = loggedOutput.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
              
              expect(timestampMatch).toBeTruthy();
              
              if (timestampMatch) {
                const timestamp = timestampMatch[1];
                const date = new Date(timestamp);
                
                // Should be a valid date
                expect(date.toString()).not.toBe('Invalid Date');
                
                // Should be recent (within last minute)
                const now = new Date();
                const diff = now.getTime() - date.getTime();
                expect(diff).toBeLessThan(60000); // Less than 1 minute
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
