// API client for EmailCraft AI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types based on backend API responses
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: string;
  tokensUsed: number;
  tokenLimit: number;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultEmailType: 'newsletter' | 'promotional' | 'transactional' | 'announcement';
  autoSave: boolean;
  preferredModel: string;
  creativity: number;
  defaultFromName?: string;
  defaultFromEmail?: string;
  defaultSubject?: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  title: string;
  description?: string;
  htmlContent: string;
  subject?: string;
  previewText?: string;
  templateType: string;
  industry?: string;
  isPublic: boolean;
  isFavorite: boolean;
  usageCount: number;
  compatibilityScore?: number;
  createdAt: string;
  updatedAt: string;
  tags: { tagName: string }[];
}

export interface GenerateTemplateRequest {
  prompt: string;
  emailType?: 'newsletter' | 'promotional' | 'transactional' | 'announcement';
  industry?: string;
  brandColors?: string[];
  fromName?: string;
  fromEmail?: string;
  model?: 'CLAUDE_3_5_SONNET' | 'CLAUDE_3_HAIKU' | 'CLAUDE_3_OPUS';
  creativity?: number;
  includeImages?: boolean;
  responsive?: boolean;
}

export interface GenerateTemplateResponse {
  success: boolean;
  message: string;
  data: {
    template: {
      htmlContent: string;
      subject?: string;
      previewText?: string;
      prompt: string;
      templateType: string;
      industry?: string;
    };
    generation: {
      tokensUsed: {
        input: number;
        output: number;
        total: number;
      };
      model: string;
      generationTime: number;
      cost: number;
    };
    user: {
      tokensRemaining: number;
      tokensUsed: number;
    };
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  fields?: Array<{ field: string; message: string }>;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

// API Client class
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  // Auth methods
  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getProfile(): Promise<{ success: boolean; data: { user: User } }> {
    return this.request('/auth/profile');
  }

  async refreshToken(): Promise<{ success: boolean; data: { accessToken: string } }> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Template methods
  async generateTemplate(request: GenerateTemplateRequest): Promise<GenerateTemplateResponse> {
    return this.request<GenerateTemplateResponse>('/templates/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async saveTemplate(template: {
    title: string;
    description?: string;
    htmlContent: string;
    subject?: string;
    previewText?: string;
    templateType?: string;
    industry?: string;
    tags?: string[];
    prompt?: string;
    aiModel?: string;
    tokensUsed?: number;
  }): Promise<{ success: boolean; message: string; data: { template: Template } }> {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  async getTemplates(params?: {
    page?: number;
    limit?: number;
    templateType?: string;
    industry?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    success: boolean;
    data: {
      templates: Template[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return this.request(`/templates?${queryParams.toString()}`);
  }

  async getTemplate(id: string): Promise<{ success: boolean; data: { template: Template } }> {
    return this.request(`/templates/${id}`);
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<{ success: boolean; message: string; data: { template: Template } }> {
    return this.request(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/templates/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleFavorite(id: string): Promise<{ success: boolean; message: string; data: { template: { id: string; title: string; isFavorite: boolean } } }> {
    return this.request(`/templates/${id}/favorite`, {
      method: 'PUT',
    });
  }

  // User methods
  async updateProfile(updates: { firstName?: string; lastName?: string }): Promise<{ success: boolean; message: string; data: { user: User } }> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getPreferences(): Promise<{ success: boolean; data: { preferences: UserPreferences } }> {
    return this.request('/users/preferences');
  }

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<{ success: boolean; message: string; data: { preferences: UserPreferences } }> {
    return this.request('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async getUserStats(): Promise<{
    success: boolean;
    data: {
      stats: {
        totalTemplates: number;
        favoriteTemplates: number;
        tokensUsed: number;
        tokensRemaining: number;
        tokenLimit: number;
        subscriptionTier: string;
        templatesByType: Record<string, number>;
        recentTemplates: Array<{
          id: string;
          title: string;
          templateType: string;
          createdAt: string;
        }>;
      };
    };
  }> {
    return this.request('/users/stats');
  }

  async deleteAccount(password: string): Promise<{ success: boolean; message: string }> {
    return this.request('/users/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Utility function to handle API errors
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Token management helpers
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const clearAuth = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};