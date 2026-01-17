/*
API Service
Centralized API client for FastAPI backend integration
*/

import { supabase } from '../lib/supabase';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    timestamp: number;
  };
  message?: string;
}

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  requireAuth?: boolean;
}

class ApiService {
  private baseUrl: string;
  private csrfToken: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.baseUrl = `${API_BASE_URL}${API_VERSION}`;
    this.initializeCSRF();
  }

  /**
   * Initialize CSRF protection
   */
  private async initializeCSRF() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csrf-token`);
      if (!response.ok) {
        console.warn('CSRF token endpoint not available, continuing without CSRF protection');
        return;
      }
      const data = await response.json();
      this.csrfToken = data.csrf_token;
    } catch (error) {
      console.warn('CSRF initialization failed, continuing without CSRF protection:', error);
    }
  }

  /**
   * Get authentication token from Supabase
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      if (!supabase) return null;
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Make HTTP request to FastAPI backend
   */
  private async request<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true
    } = config;

    try {
      // Prepare headers
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers
      };

      // Add authentication if required
      if (requireAuth) {
        const token = await this.getAuthToken();
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }
      }

      // Add CSRF protection for state-changing operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        if (this.csrfToken && this.sessionId) {
          requestHeaders['X-CSRF-Token'] = this.csrfToken;
          requestHeaders['X-Session-ID'] = this.sessionId;
        }
      }

      // Make request
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include'
      });

      // Parse response
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.detail || 'Request failed');
      }

      return data;

    } catch (error: any) {
      console.error(`API request failed [${method} ${endpoint}]:`, error);
      
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error.message || 'An unexpected error occurred',
          timestamp: Date.now()
        }
      };
    }
  }

  // Authentication endpoints
  async register(userData: {
    phoneNumber: string;
    password: string;
    firstName: string;
    lastName: string;
    email?: string;
    state: string;
    role?: string;
    organizationName?: string;
  }) {
    // Debug logging
    console.log('🔍 API Service Register Debug:');
    console.log('- Input userData:', userData);
    console.log('- Role from input:', userData.role);
    
    // Convert camelCase to snake_case for backend
    const backendData = {
      phone_number: userData.phoneNumber,
      password: userData.password,
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      state: userData.state,
      role: userData.role,
      organization_name: userData.organizationName
    };
    
    console.log('- Backend data being sent:', backendData);
    console.log('- Role in backend data:', backendData.role);
    
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: backendData,
      requireAuth: false
    });
    
    console.log('- Backend response:', response);
    if (response.data?.user) {
      console.log('- User role in response:', response.data.user.role);
    }
    
    return response;
  }

  async login(credentials: { phoneNumber: string; password: string }) {
    // Convert camelCase to snake_case for backend
    const backendData = {
      phone_number: credentials.phoneNumber,
      password: credentials.password
    };
    
    return this.request('/auth/login', {
      method: 'POST',
      body: backendData,
      requireAuth: false
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST'
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async refreshToken(refreshToken: string) {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      requireAuth: false
    });
  }

  // Event endpoints
  async getEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
    state?: string;
    eventType?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request(`/events${query ? `?${query}` : ''}`, {
      requireAuth: false
    });
  }

  async getEvent(eventId: string) {
    return this.request(`/events/${eventId}`, {
      requireAuth: false
    });
  }

  async createEvent(eventData: any) {
    return this.request('/events', {
      method: 'POST',
      body: eventData
    });
  }

  async updateEvent(eventId: string, eventData: any) {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: eventData
    });
  }

  async deleteEvent(eventId: string) {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE'
    });
  }

  // Ticket endpoints
  async purchaseTicket(purchaseData: {
    eventId: string;
    tierId: string;
    quantity: number;
    paymentMethod: string;
  }) {
    return this.request('/tickets/purchase', {
      method: 'POST',
      body: purchaseData
    });
  }

  async getMyTickets() {
    return this.request('/tickets/my-tickets');
  }

  async getTicket(ticketId: string) {
    return this.request(`/tickets/${ticketId}`);
  }

  async verifyTicket(verificationData: {
    ticketId: string;
    scanType: string;
    location?: string;
  }) {
    return this.request('/tickets/verify', {
      method: 'POST',
      body: verificationData
    });
  }

  async getTicketQR(ticketId: string) {
    return this.request(`/tickets/${ticketId}/qr`);
  }

  // Payment endpoints
  async processPayment(paymentData: {
    amount: number;
    paymentMethod: string;
    reference: string;
    metadata?: any;
  }) {
    return this.request('/payments/process', {
      method: 'POST',
      body: paymentData
    });
  }

  async getWalletBalance() {
    return this.request('/payments/wallet/balance');
  }

  async topupWallet(amount: number, paymentMethod: string) {
    return this.request('/payments/wallet/topup', {
      method: 'POST',
      body: { amount, paymentMethod }
    });
  }

  async getTransactionHistory(params?: {
    limit?: number;
    offset?: number;
    transactionType?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request(`/payments/transactions${query ? `?${query}` : ''}`);
  }

  async requestRefund(refundData: {
    transactionId: string;
    amount?: number;
    reason: string;
  }) {
    return this.request('/payments/refund', {
      method: 'POST',
      body: refundData
    });
  }

  async getPaymentMethods() {
    return this.request('/payments/methods', {
      requireAuth: false
    });
  }

  // Notification endpoints
  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request(`/notifications/${query ? `?${query}` : ''}`);
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT'
    });
  }

  async getNotificationPreferences() {
    return this.request('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request('/notifications/preferences', {
      method: 'PUT',
      body: preferences
    });
  }

  // Analytics endpoints
  async getAnalyticsDashboard(period: string = '30d') {
    return this.request(`/analytics/dashboard?period=${period}`);
  }

  async getEventAnalytics(eventId?: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (eventId) params.append('event_id', eventId);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const query = params.toString();
    return this.request(`/analytics/events${query ? `?${query}` : ''}`);
  }

  async getRevenueAnalytics(startDate?: string, endDate?: string, granularity: string = 'daily') {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('granularity', granularity);
    
    return this.request(`/analytics/revenue?${params.toString()}`);
  }

  // Admin endpoints (admin only)
  async getAdminDashboard() {
    return this.request('/admin/dashboard');
  }

  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request(`/admin/users${query ? `?${query}` : ''}`);
  }

  async updateUserStatus(userId: string, status: string, reason?: string) {
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: { status, reason }
    });
  }

  async moderateEvent(eventId: string, action: string, reason?: string) {
    return this.request(`/admin/events/${eventId}/moderate`, {
      method: 'PUT',
      body: { action, reason }
    });
  }

  // Health check
  async healthCheck() {
    return fetch(`${API_BASE_URL}/health`).then(res => res.json());
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export types
export type { ApiResponse };

// Utility functions
export const isApiError = (response: ApiResponse): response is ApiResponse & { success: false } => {
  return !response.success;
};

export const getApiErrorMessage = (response: ApiResponse): string => {
  if (isApiError(response)) {
    return response.error?.message || 'An unexpected error occurred';
  }
  return '';
};