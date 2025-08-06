import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { logger } from '../utils/logger';

// AWS Configuration
export const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

// Validate AWS credentials
export const validateAwsCredentials = (): boolean => {
  const { accessKeyId, secretAccessKey } = awsConfig.credentials;
  
  if (!accessKeyId || !secretAccessKey) {
    logger.warn('AWS credentials not configured. AI features will be disabled.');
    return false;
  }
  
  if (accessKeyId === 'your-aws-access-key-id' || secretAccessKey === 'your-aws-secret-access-key') {
    logger.warn('AWS credentials are using placeholder values. Please configure real credentials.');
    return false;
  }
  
  return true;
};

// Initialize Bedrock Runtime Client
let bedrockClient: BedrockRuntimeClient | null = null;

export const getBedrockClient = (): BedrockRuntimeClient | null => {
  if (!validateAwsCredentials()) {
    return null;
  }
  
  if (!bedrockClient) {
    try {
      bedrockClient = new BedrockRuntimeClient({
        region: awsConfig.region,
        credentials: awsConfig.credentials,
        maxAttempts: 3,
        retryMode: 'adaptive',
      });
      
      logger.info(`Bedrock client initialized for region: ${awsConfig.region}`);
    } catch (error) {
      logger.error('Failed to initialize Bedrock client:', error);
      return null;
    }
  }
  
  return bedrockClient;
};

// Available AI Models configuration
export const AI_MODELS = {
  CLAUDE_3_5_SONNET: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  CLAUDE_3_HAIKU: 'anthropic.claude-3-haiku-20240307-v1:0',
  CLAUDE_3_OPUS: 'anthropic.claude-3-opus-20240229-v1:0',
} as const;

// Default model for email template generation
export const DEFAULT_AI_MODEL = AI_MODELS.CLAUDE_3_5_SONNET;

// Model pricing (tokens per dollar for cost tracking)
export const MODEL_PRICING = {
  [AI_MODELS.CLAUDE_3_5_SONNET]: {
    inputTokensPerDollar: 3000,
    outputTokensPerDollar: 600,
  },
  [AI_MODELS.CLAUDE_3_HAIKU]: {
    inputTokensPerDollar: 4000,
    outputTokensPerDollar: 2000,
  },
  [AI_MODELS.CLAUDE_3_OPUS]: {
    inputTokensPerDollar: 666,
    outputTokensPerDollar: 333,
  },
} as const;