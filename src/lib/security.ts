import DOMPurify from 'dompurify';

// Input validation constants
export const VALIDATION_LIMITS = {
  PROMPT_MAX_LENGTH: 2000,
  PROMPT_MIN_LENGTH: 10,
} as const;

// Security validation patterns
const SUSPICIOUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /data:text\/html/gi,
];

/**
 * Validates user input for prompt generation
 */
export function validatePrompt(prompt: string): { isValid: boolean; error?: string } {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt is required' };
  }

  const trimmedPrompt = prompt.trim();

  if (trimmedPrompt.length < VALIDATION_LIMITS.PROMPT_MIN_LENGTH) {
    return { isValid: false, error: `Prompt must be at least ${VALIDATION_LIMITS.PROMPT_MIN_LENGTH} characters` };
  }

  if (trimmedPrompt.length > VALIDATION_LIMITS.PROMPT_MAX_LENGTH) {
    return { isValid: false, error: `Prompt must not exceed ${VALIDATION_LIMITS.PROMPT_MAX_LENGTH} characters` };
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmedPrompt)) {
      return { isValid: false, error: 'Prompt contains potentially unsafe content' };
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes HTML content using DOMPurify
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Configure DOMPurify for email templates
  const cleanHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'html', 'head', 'body', 'title', 'meta', 'style',
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'table', 'tr', 'td', 'th', 'tbody', 'thead',
      'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'u', 'center'
    ],
    ALLOWED_ATTR: [
      'class', 'id', 'style', 'src', 'alt', 'href', 'target',
      'width', 'height', 'border', 'cellpadding', 'cellspacing',
      'role', 'aria-label', 'aria-describedby'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'iframe'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']
  });

  return cleanHTML;
}

/**
 * Validates generated HTML for email compatibility
 */
export function validateEmailHTML(html: string): { isValid: boolean; error?: string } {
  if (!html || typeof html !== 'string') {
    return { isValid: false, error: 'HTML content is required' };
  }

  const sanitizedHTML = sanitizeHTML(html);
  
  if (sanitizedHTML.length === 0) {
    return { isValid: false, error: 'HTML content was removed due to security concerns' };
  }

  // Basic structure validation
  if (!sanitizedHTML.includes('<html') || !sanitizedHTML.includes('</html>')) {
    return { isValid: false, error: 'Invalid HTML structure' };
  }

  return { isValid: true };
}

/**
 * Creates a safe error message that doesn't expose sensitive information
 */
export function createSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Only expose safe error messages
    const safeMessages = [
      'network error',
      'timeout',
      'invalid input',
      'validation failed',
      'template generation failed'
    ];
    
    const errorMessage = error.message.toLowerCase();
    const isSafe = safeMessages.some(safe => errorMessage.includes(safe));
    
    if (isSafe) {
      return error.message;
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}