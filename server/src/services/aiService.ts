import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient, DEFAULT_AI_MODEL, AI_MODELS, MODEL_PRICING } from '../config/aws';
import { logger } from '../utils/logger';

// AI Service Response Types
export interface AIGenerationResult {
  html: string;
  subject?: string;
  previewText?: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  model: string;
  generationTime: number;
  cost: number;
}

export interface AIGenerationOptions {
  prompt: string;
  emailType?: 'newsletter' | 'promotional' | 'transactional' | 'announcement';
  industry?: string;
  brandColors?: string[];
  fromName?: string;
  fromEmail?: string;
  model?: keyof typeof AI_MODELS;
  creativity?: number; // 0.0 to 1.0
  includeImages?: boolean;
  responsive?: boolean;
}

// Email Template Generation Service
export class AIService {
  private static instance: AIService;
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }
  
  // Main method to generate email templates
  async generateEmailTemplate(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const startTime = Date.now();
    const bedrockClient = getBedrockClient();
    
    if (!bedrockClient) {
      throw new Error('AWS Bedrock client not available. Please configure AWS credentials.');
    }
    
    try {
      const model = options.model ? AI_MODELS[options.model] : DEFAULT_AI_MODEL;
      const prompt = this.buildEmailPrompt(options);
      
      logger.info('Generating email template', {
        model,
        emailType: options.emailType,
        industry: options.industry,
        promptLength: prompt.length,
      });
      
      // Prepare the request payload for Claude
      const requestBody = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
        temperature: options.creativity || 0.7,
        top_p: 0.9,
      };
      
      // Invoke the Bedrock model
      const command = new InvokeModelCommand({
        modelId: model,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(requestBody),
      });
      
      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      // Extract the generated content
      const generatedContent = responseBody.content[0].text;
      const inputTokens = responseBody.usage?.input_tokens || 0;
      const outputTokens = responseBody.usage?.output_tokens || 0;
      
      // Parse the generated content
      const parsedResult = this.parseGeneratedContent(generatedContent);
      
      // Calculate cost
      const cost = this.calculateCost(model, inputTokens, outputTokens);
      const generationTime = Date.now() - startTime;
      
      logger.info('Email template generated successfully', {
        model,
        tokensUsed: inputTokens + outputTokens,
        generationTime,
        cost,
      });
      
      return {
        ...parsedResult,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        model,
        generationTime,
        cost,
      };
      
    } catch (error) {
      const generationTime = Date.now() - startTime;
      logger.error('Failed to generate email template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime,
        options,
      });
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Build the prompt for email template generation
  private buildEmailPrompt(options: AIGenerationOptions): string {
    const {
      prompt,
      emailType = 'newsletter',
      industry,
      brandColors,
      fromName,
      fromEmail,
      includeImages = true,
      responsive = true,
    } = options;
    
    const systemPrompt = `You are an expert email template designer specializing in creating responsive HTML email templates. Your task is to generate a complete, professional email template based on the user's requirements.

Requirements:
- Create valid, email-client compatible HTML (tables for layout, inline CSS)
- Ensure compatibility with Gmail, Outlook, Apple Mail, and other major clients
- Use web-safe fonts and colors
- Include proper fallbacks for images and modern CSS
- Generate responsive design that works on mobile and desktop
- Follow email design best practices for deliverability

Email Type: ${emailType}
${industry ? `Industry: ${industry}` : ''}
${brandColors ? `Brand Colors: ${brandColors.join(', ')}` : ''}
${fromName ? `From Name: ${fromName}` : ''}
${fromEmail ? `From Email: ${fromEmail}` : ''}
Include Images: ${includeImages}
Responsive: ${responsive}

Please provide your response in the following format:

SUBJECT: [Email subject line]
PREVIEW: [Preview text that appears in inbox]
HTML:
[Complete HTML email template with inline CSS]`;
    
    return `${systemPrompt}

User Request: ${prompt}

Generate a professional email template that meets all the requirements above.`;
  }
  
  // Parse the AI-generated content into structured format
  private parseGeneratedContent(content: string): Pick<AIGenerationResult, 'html' | 'subject' | 'previewText'> {
    const lines = content.split('\n');
    let subject = '';
    let previewText = '';
    let html = '';
    let htmlStarted = false;
    
    for (const line of lines) {
      if (line.startsWith('SUBJECT:')) {
        subject = line.replace('SUBJECT:', '').trim();
      } else if (line.startsWith('PREVIEW:')) {
        previewText = line.replace('PREVIEW:', '').trim();
      } else if (line.startsWith('HTML:')) {
        htmlStarted = true;
        continue;
      } else if (htmlStarted) {
        html += line + '\n';
      }
    }
    
    // Clean up the HTML
    html = html.trim();
    
    // If no structured format, treat entire content as HTML
    if (!subject && !html) {
      html = content;
    }
    
    return {
      html: html || content,
      subject: subject || undefined,
      previewText: previewText || undefined,
    };
  }
  
  // Calculate the cost of the AI generation
  private calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[modelId as keyof typeof MODEL_PRICING];
    if (!pricing) {
      logger.warn(`No pricing information for model: ${modelId}`);
      return 0;
    }
    
    const inputCost = inputTokens / pricing.inputTokensPerDollar;
    const outputCost = outputTokens / pricing.outputTokensPerDollar;
    
    return inputCost + outputCost;
  }
  
  // Test the AI service connection
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateEmailTemplate({
        prompt: 'Create a simple welcome email template',
        emailType: 'transactional',
      });
      
      logger.info('AI service test successful', {
        tokensUsed: result.tokensUsed.total,
        generationTime: result.generationTime,
      });
      
      return true;
    } catch (error) {
      logger.error('AI service test failed', error);
      return false;
    }
  }
}

// Export singleton instance
export const aiService = AIService.getInstance();