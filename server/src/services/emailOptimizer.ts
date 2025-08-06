import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';

export interface EmailCompatibilityResult {
  optimizedHtml: string;
  compatibilityScore: number;
  issues: EmailCompatibilityIssue[];
  optimizations: string[];
}

export interface EmailCompatibilityIssue {
  type: 'warning' | 'error';
  message: string;
  element?: string;
  recommendation: string;
}

export class EmailOptimizer {
  private static readonly EMAIL_SAFE_PROPERTIES = new Set([
    'background-color', 'color', 'font-family', 'font-size', 'font-weight',
    'text-align', 'padding', 'margin', 'border', 'width', 'height',
    'line-height', 'text-decoration', 'vertical-align', 'display'
  ]);

  private static readonly OUTLOOK_SAFE_FONTS = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
    'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
    'Trebuchet MS', 'Arial Black', 'Impact'
  ];

  private static readonly DARK_MODE_ATTRIBUTES = {
    '[data-ogsc]': 'color',
    '[data-ogsb]': 'background-color'
  };

  /**
   * Optimize HTML for email client compatibility
   */
  static async optimizeForEmailClients(html: string): Promise<EmailCompatibilityResult> {
    const $ = cheerio.load(html);
    const issues: EmailCompatibilityIssue[] = [];
    const optimizations: string[] = [];

    try {
      // 1. Convert CSS to inline styles
      this.inlineStyles($, issues, optimizations);

      // 2. Fix table structure for Outlook
      this.optimizeTableStructure($, issues, optimizations);

      // 3. Add dark mode support
      this.addDarkModeSupport($, issues, optimizations);

      // 4. Fix image attributes
      this.optimizeImages($, issues, optimizations);

      // 5. Add Outlook-specific fixes
      this.addOutlookCompatibility($, issues, optimizations);

      // 6. Clean up unsupported elements
      this.cleanupUnsupportedElements($, issues, optimizations);

      // 7. Add email client meta tags
      this.addEmailMetaTags($, optimizations);

      // 8. Validate structure
      this.validateEmailStructure($, issues);

      const optimizedHtml = $.html();
      const compatibilityScore = this.calculateCompatibilityScore(issues);

      logger.info('Email optimization completed', {
        compatibilityScore,
        issuesCount: issues.length,
        optimizationsCount: optimizations.length
      });

      return {
        optimizedHtml,
        compatibilityScore,
        issues,
        optimizations
      };
    } catch (error) {
      logger.error('Email optimization failed', { error });
      throw new Error('Failed to optimize email for client compatibility');
    }
  }

  /**
   * Convert embedded CSS to inline styles
   */
  private static inlineStyles($: cheerio.Root, issues: EmailCompatibilityIssue[], optimizations: string[]): void {
    // Find all style tags
    const styleTags = $('style');
    
    if (styleTags.length > 0) {
      issues.push({
        type: 'warning',
        message: `Found ${styleTags.length} <style> tags. Email clients have limited CSS support.`,
        recommendation: 'Use inline styles instead of CSS blocks for better compatibility.'
      });

      // Remove style tags as they're not well-supported
      styleTags.remove();
      optimizations.push('Removed embedded CSS styles');
    }

    // Ensure all elements have inline styles
    $('*').each((_, element) => {
      const $el = $(element);
      const tagName = $el.get(0)?.tagName?.toLowerCase();
      
      if (tagName && ['table', 'td', 'tr', 'div', 'p', 'span', 'a', 'img'].includes(tagName)) {
        const currentStyle = $el.attr('style') || '';
        
        // Add basic styles if missing
        if (tagName === 'table' && !currentStyle.includes('border-collapse')) {
          $el.attr('style', `${currentStyle}; border-collapse: collapse;`);
        }
        
        if (tagName === 'td' && !currentStyle.includes('padding')) {
          $el.attr('style', `${currentStyle}; padding: 0;`);
        }
      }
    });
  }

  /**
   * Optimize table structure for email clients
   */
  private static optimizeTableStructure($: cheerio.Root, issues: EmailCompatibilityIssue[], optimizations: string[]): void {
    // Ensure all tables have proper structure
    $('table').each((_, table) => {
      const $table = $(table);
      
      // Add table attributes for Outlook
      $table.attr('cellpadding', '0');
      $table.attr('cellspacing', '0');
      $table.attr('border', '0');
      
      // Ensure table has width
      if (!$table.attr('width') && !$table.attr('style')?.includes('width')) {
        $table.attr('width', '100%');
      }

      // Check for nested tables (can cause issues)
      const nestedTables = $table.find('table').length;
      if (nestedTables > 3) {
        issues.push({
          type: 'warning',
          message: `Table has ${nestedTables} nested tables. This may cause layout issues in some email clients.`,
          element: 'table',
          recommendation: 'Consider simplifying the table structure to reduce nesting.'
        });
      }
    });

    // Ensure all td elements have proper attributes
    $('td').each((_, td) => {
      const $td = $(td);
      
      // Add valign for consistent alignment
      if (!$td.attr('valign')) {
        $td.attr('valign', 'top');
      }
    });

    optimizations.push('Optimized table structure for email clients');
  }

  /**
   * Add dark mode support
   */
  private static addDarkModeSupport($: cheerio.Root, issues: EmailCompatibilityIssue[], optimizations: string[]): void {
    // Add dark mode CSS to head
    const darkModeCSS = `
      @media (prefers-color-scheme: dark) {
        .dark-mode-text { color: #ffffff !important; }
        .dark-mode-bg { background-color: #1a1a1a !important; }
        .dark-mode-border { border-color: #333333 !important; }
      }
    `;

    // Find or create head tag
    let $head = $('head');
    if ($head.length === 0) {
      $('html').prepend('<head></head>');
      $head = $('head');
    }

    $head.append(`<style type="text/css">${darkModeCSS}</style>`);

    // Add dark mode attributes to text elements
    $('p, div, span, td, h1, h2, h3, h4, h5, h6').each((_, element) => {
      const $el = $(element);
      const style = $el.attr('style') || '';
      
      // If element has dark background, add light text class
      if (style.includes('background') && (style.includes('#000') || style.includes('#111') || style.includes('#222'))) {
        $el.addClass('dark-mode-text');
      }
    });

    optimizations.push('Added dark mode support');
  }

  /**
   * Optimize images for email clients
   */
  private static optimizeImages($: cheerio.Root, issues: EmailCompatibilityIssue[], optimizations: string[]): void {
    $('img').each((_, img) => {
      const $img = $(img);
      
      // Ensure all images have alt text
      if (!$img.attr('alt')) {
        $img.attr('alt', '');
        issues.push({
          type: 'warning',
          message: 'Image missing alt text',
          element: 'img',
          recommendation: 'Add descriptive alt text for accessibility and when images are blocked.'
        });
      }

      // Add display block for consistent rendering
      const style = $img.attr('style') || '';
      if (!style.includes('display')) {
        $img.attr('style', `${style}; display: block;`);
      }

      // Ensure images have dimensions
      if (!$img.attr('width') && !style.includes('width')) {
        issues.push({
          type: 'warning',
          message: 'Image missing width attribute',
          element: 'img',
          recommendation: 'Add width attribute for consistent rendering across email clients.'
        });
      }
    });

    optimizations.push('Optimized images for email clients');
  }

  /**
   * Add Outlook-specific compatibility fixes
   */
  private static addOutlookCompatibility($: cheerio.Root, issues: EmailCompatibilityIssue[], optimizations: string[]): void {
    // Add Outlook conditional comments for better rendering
    const outlookCSS = `
      <!--[if mso]>
      <style type="text/css">
        table { border-collapse: collapse; border-spacing: 0; }
        td { border-collapse: collapse; }
      </style>
      <![endif]-->
    `;

    let $head = $('head');
    if ($head.length === 0) {
      $('html').prepend('<head></head>');
      $head = $('head');
    }

    $head.append(outlookCSS);

    // Fix font fallbacks for Outlook
    $('*').each((_, element) => {
      const $el = $(element);
      const style = $el.attr('style') || '';
      
      if (style.includes('font-family')) {
        const fontMatch = style.match(/font-family:\s*([^;]+)/);
        if (fontMatch && fontMatch[1]) {
          const fonts = fontMatch[1].split(',').map(f => f.trim().replace(/['"]/g, ''));
          const hasOutlookSafeFont = fonts.some(font => 
            this.OUTLOOK_SAFE_FONTS.includes(font)
          );
          
          if (!hasOutlookSafeFont) {
            const newStyle = style.replace(
              /font-family:\s*([^;]+)/,
              `font-family: ${fonts.join(', ')}, Arial, sans-serif`
            );
            $el.attr('style', newStyle);
          }
        }
      }
    });

    optimizations.push('Added Outlook compatibility fixes');
  }

  /**
   * Clean up unsupported elements and attributes
   */
  private static cleanupUnsupportedElements($: cheerio.Root, issues: EmailCompatibilityIssue[], optimizations: string[]): void {
    // Remove unsupported elements
    const unsupportedElements = ['script', 'link[rel="stylesheet"]', 'meta[name="viewport"]'];
    
    unsupportedElements.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.remove();
        issues.push({
          type: 'warning',
          message: `Removed ${elements.length} unsupported elements: ${selector}`,
          recommendation: 'These elements are not supported in email clients and have been removed.'
        });
      }
    });

    // Clean up unsupported CSS properties
    $('*').each((_, element) => {
      const $el = $(element);
      const style = $el.attr('style');
      
      if (style) {
        const properties = style.split(';').map(prop => prop.trim()).filter(Boolean);
        const cleanedProperties = properties.filter(prop => {
          const property = prop.split(':')[0]?.trim();
          return property && this.EMAIL_SAFE_PROPERTIES.has(property);
        });
        
        if (cleanedProperties.length !== properties.length) {
          $el.attr('style', cleanedProperties.join('; '));
          issues.push({
            type: 'warning',
            message: 'Removed unsupported CSS properties',
            element: $el.get(0)?.tagName?.toLowerCase() || 'unknown',
            recommendation: 'Use only email-safe CSS properties for consistent rendering.'
          });
        }
      }
    });

    optimizations.push('Cleaned up unsupported elements and styles');
  }

  /**
   * Add essential email meta tags
   */
  private static addEmailMetaTags($: cheerio.Root, optimizations: string[]): void {
    let $head = $('head');
    if ($head.length === 0) {
      $('html').prepend('<head></head>');
      $head = $('head');
    }

    // Add essential meta tags
    const metaTags = [
      '<meta charset="UTF-8">',
      '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
      '<meta name="x-apple-disable-message-reformatting">',
      '<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">'
    ];

    metaTags.forEach(tag => {
      $head.append(tag);
    });

    optimizations.push('Added essential email meta tags');
  }

  /**
   * Validate email structure
   */
  private static validateEmailStructure($: cheerio.Root, issues: EmailCompatibilityIssue[]): void {
    // Check for required structure
    if ($('html').length === 0) {
      issues.push({
        type: 'error',
        message: 'Missing HTML document structure',
        recommendation: 'Email should have proper HTML document structure with html, head, and body tags.'
      });
    }

    if ($('head').length === 0) {
      issues.push({
        type: 'error',
        message: 'Missing HEAD section',
        recommendation: 'Email should have a HEAD section for meta tags and styles.'
      });
    }

    if ($('body').length === 0) {
      issues.push({
        type: 'error',
        message: 'Missing BODY section',
        recommendation: 'Email content should be wrapped in a BODY tag.'
      });
    }

    // Check for accessibility
    const imagesWithoutAlt = $('img:not([alt])').length;
    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'warning',
        message: `${imagesWithoutAlt} images missing alt attributes`,
        recommendation: 'Add alt attributes to all images for accessibility and when images are blocked.'
      });
    }
  }

  /**
   * Calculate compatibility score based on issues
   */
  private static calculateCompatibilityScore(issues: EmailCompatibilityIssue[]): number {
    const errorWeight = 20;
    const warningWeight = 5;
    
    const errorCount = issues.filter(issue => issue.type === 'error').length;
    const warningCount = issues.filter(issue => issue.type === 'warning').length;
    
    const deductions = (errorCount * errorWeight) + (warningCount * warningWeight);
    const score = Math.max(0, 100 - deductions);
    
    return Math.round(score);
  }
}