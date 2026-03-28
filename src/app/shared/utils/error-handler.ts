/**
 * Utility for parsing Convex error messages and returning user-friendly messages.
 *
 * Convex errors often include stack traces and internal details that aren't
 * helpful for end users. This utility extracts the meaningful message.
 */

/** Common error patterns and their user-friendly messages */
const ERROR_PATTERNS: ReadonlyArray<{ pattern: RegExp; message: string }> = [
  // Convex Auth specific errors (exact matches from @convex-dev/auth library)
  { pattern: /^InvalidSecret$/i, message: 'Invalid email or password' },
  { pattern: /^InvalidAccountId$/i, message: 'No account found with this email' },
  { pattern: /^TooManyFailedAttempts$/i, message: 'Too many failed attempts. Please try again later' },
  { pattern: /^Invalid credentials$/i, message: 'Invalid email or password' },
  { pattern: /^Invalid password$/i, message: 'Invalid password' },
  { pattern: /^Invalid code$/i, message: 'Invalid verification code' },
  { pattern: /^Invalid verifier$/i, message: 'Invalid verification. Please try again' },
  { pattern: /^Invalid state$/i, message: 'Authentication session expired. Please try again' },
  { pattern: /^Could not verify code$/i, message: 'Invalid or expired verification code' },
  { pattern: /^Account .+ already exists$/i, message: 'An account with this email already exists' },
  { pattern: /^Missing `password` param/i, message: 'Password is required' },
  { pattern: /^Missing `email` param/i, message: 'Email is required' },
  { pattern: /^Missing `flow` param/i, message: 'Invalid authentication request' },
  { pattern: /^Password reset is not enabled/i, message: 'Password reset is not available' },
  { pattern: /^Email verification is not enabled/i, message: 'Email verification is not available' },
  { pattern: /^Client is not authenticated/i, message: 'Please sign in to continue' },
  { pattern: /^Cannot sign in/i, message: 'Unable to sign in. Please try again' },

  // Project-specific Convex function errors (from convex/todos.ts, convex/users.ts)
  { pattern: /^Not authenticated$/i, message: 'Please sign in to continue' },
  { pattern: /^Todo not found$/i, message: 'This task no longer exists' },
  { pattern: /^Unauthorized$/i, message: 'You do not have permission to perform this action' },
  { pattern: /^User not found$/i, message: 'User account not found' },

  // General authentication errors
  { pattern: /invalid.*password/i, message: 'Invalid email or password' },
  { pattern: /incorrect.*password/i, message: 'Invalid email or password' },
  { pattern: /wrong.*password/i, message: 'Invalid email or password' },
  { pattern: /user.*not.*found/i, message: 'No account found with this email' },
  { pattern: /account.*not.*found/i, message: 'No account found with this email' },
  { pattern: /email.*already.*exists/i, message: 'An account with this email already exists' },
  { pattern: /email.*already.*registered/i, message: 'An account with this email already exists' },
  { pattern: /email.*in.*use/i, message: 'An account with this email already exists' },
  { pattern: /not.*authenticated/i, message: 'Please sign in to continue' },
  { pattern: /authentication.*required/i, message: 'Please sign in to continue' },
  { pattern: /session.*expired/i, message: 'Your session has expired. Please sign in again' },
  { pattern: /token.*expired/i, message: 'Your session has expired. Please sign in again' },
  { pattern: /invalid.*token/i, message: 'Your session is invalid. Please sign in again' },
  { pattern: /^unauthorized$/i, message: 'You do not have permission to perform this action' },
  { pattern: /forbidden/i, message: 'You do not have permission to perform this action' },
  { pattern: /access.*denied/i, message: 'You do not have permission to perform this action' },

  // Validation errors
  { pattern: /invalid.*email/i, message: 'Please enter a valid email address' },
  { pattern: /password.*too.*short/i, message: 'Password must be at least 6 characters' },
  { pattern: /password.*too.*weak/i, message: 'Please choose a stronger password' },
  { pattern: /required.*field/i, message: 'Please fill in all required fields' },
  { pattern: /missing.*required/i, message: 'Please fill in all required fields' },

  // Resource errors (more specific patterns first)
  { pattern: /todo.*not.*found/i, message: 'This task no longer exists' },
  { pattern: /item.*not.*found/i, message: 'This item no longer exists' },
  { pattern: /record.*not.*found/i, message: 'This record no longer exists' },
  { pattern: /not.*found/i, message: 'The requested item could not be found' },
  { pattern: /does.*not.*exist/i, message: 'The requested item could not be found' },
  { pattern: /already.*exists/i, message: 'This item already exists' },
  { pattern: /duplicate/i, message: 'This item already exists' },

  // Rate limiting
  { pattern: /too.*many.*requests/i, message: 'Too many attempts. Please try again later' },
  { pattern: /rate.*limit/i, message: 'Too many attempts. Please try again later' },

  // Network/Server errors
  { pattern: /network.*error/i, message: 'Network error. Please check your connection' },
  { pattern: /connection.*failed/i, message: 'Unable to connect. Please check your connection' },
  { pattern: /timeout/i, message: 'Request timed out. Please try again' },
  { pattern: /server.*error/i, message: 'Something went wrong. Please try again later' },
  { pattern: /internal.*error/i, message: 'Something went wrong. Please try again later' },
];

/** Default message when no pattern matches */
const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again';

/**
 * Extracts the core error message from a Convex error.
 *
 * Convex errors can have various formats:
 * - "[CONVEX A(auth:signIn)] [Request ID: xxx] Server Error\nUncaught Error: InvalidSecret"
 * - "Uncaught Error: Your actual message\n    at handler (convex/file.ts:123:45)"
 * - "Error: Your actual message"
 *
 * This function extracts just the meaningful error (e.g., "InvalidSecret").
 */
function extractCoreMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return '';
  }

  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && 'message' in error) {
    message = String((error as { message: unknown }).message);
  } else {
    message = String(error);
  }

  // Remove Convex log prefix: [CONVEX A(function:name)] [Request ID: xxx] Server Error
  message = message.replace(/^\[CONVEX [^\]]+\]\s*(\[Request ID:[^\]]+\])?\s*(Server Error\s*)?/i, '');

  // Remove "Uncaught Error: " prefix if present (can appear after newline too)
  message = message.replace(/^[\s\n]*Uncaught Error:\s*/i, '');
  message = message.replace(/\nUncaught Error:\s*/gi, '\n');

  // Remove "Error: " prefix if present
  message = message.replace(/^Error:\s*/i, '');

  // Remove stack trace (everything after first newline that looks like a stack)
  const stackStart = message.search(/\n\s*(at\s+|in\s+|@)/);
  if (stackStart !== -1) {
    message = message.substring(0, stackStart);
  }

  // Remove Convex function path info
  // e.g., "in handler for mutation todos:create"
  message = message.replace(/\s*in\s+handler\s+for\s+(query|mutation|action)\s+\S+/gi, '');

  // Remove file references like "(convex/todos.ts:25:10)"
  message = message.replace(/\s*\([^)]*\.ts:\d+:\d+\)/g, '');

  // If message contains newlines, take only the last meaningful line
  // (the actual error is often at the end after "Uncaught Error:")
  const lines = message.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 1) {
    // Find the most specific error message (usually the last non-empty line)
    message = lines[lines.length - 1];
  }

  // Clean up whitespace
  message = message.trim();

  return message;
}

/**
 * Converts a Convex error into a user-friendly message.
 *
 * @param error - The error from Convex (Error object, string, or unknown)
 * @param fallback - Optional fallback message if parsing fails
 * @returns A user-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await convex.mutation(api.todos.create, { text: '' });
 * } catch (err) {
 *   const message = parseConvexError(err);
 *   // Returns: "Please fill in all required fields" instead of
 *   // "Uncaught Error: required field missing\n    at handler..."
 * }
 * ```
 */
export function parseConvexError(error: unknown, fallback?: string): string {
  const coreMessage = extractCoreMessage(error);
  
  if (!coreMessage) {
    return fallback ?? DEFAULT_ERROR_MESSAGE;
  }

  // Check against known patterns
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(coreMessage)) {
      return message;
    }
  }

  // If the core message is reasonably short and doesn't look technical,
  // use it directly (it might be a custom error message from the backend)
  const looksUserFriendly =
    coreMessage.length < 100 &&
    !coreMessage.includes('(') &&
    !coreMessage.includes('{') &&
    !coreMessage.includes('undefined') &&
    !coreMessage.includes('null') &&
    !/[A-Z][a-z]+Error:/.test(coreMessage);

  if (looksUserFriendly) {
    // Capitalize first letter
    return coreMessage.charAt(0).toUpperCase() + coreMessage.slice(1);
  }

  return fallback ?? DEFAULT_ERROR_MESSAGE;
}

/**
 * Type guard to check if an error is an Error object.
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Checks if an error indicates the user is not authenticated.
 */
export function isAuthError(error: unknown): boolean {
  const message = extractCoreMessage(error);
  const lowerMessage = message.toLowerCase();

  // Convex Auth specific patterns
  if (
    message === 'InvalidSecret' ||
    message === 'InvalidAccountId' ||
    message === 'TooManyFailedAttempts' ||
    message === 'Invalid credentials' ||
    message === 'Invalid password' ||
    message === 'Client is not authenticated' ||
    message === 'Not authenticated'
  ) {
    return true;
  }

  return (
    lowerMessage.includes('not authenticated') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('session expired') ||
    lowerMessage.includes('invalid token')
  );
}

/**
 * Checks if an error indicates an authorization/permission issue.
 */
export function isPermissionError(error: unknown): boolean {
  const message = extractCoreMessage(error);
  const lowerMessage = message.toLowerCase();

  return (
    message === 'Unauthorized' ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('permission') ||
    lowerMessage.includes('access denied')
  );
}

/**
 * Checks if an error indicates a resource was not found.
 */
export function isNotFoundError(error: unknown): boolean {
  const message = extractCoreMessage(error);
  const lowerMessage = message.toLowerCase();

  return (
    message === 'Todo not found' ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('does not exist') ||
    lowerMessage.includes('no longer exists')
  );
}

/**
 * Checks if an error indicates a network/connection issue.
 */
export function isNetworkError(error: unknown): boolean {
  const message = extractCoreMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('fetch failed')
  );
}
