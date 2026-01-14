/*
API Hook
React hook for making API calls to FastAPI backend
*/

import { useState, useCallback } from 'react';
import { apiService, ApiResponse, isApiError, getApiErrorMessage } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showErrorToast?: boolean;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (
    apiCall: () => Promise<ApiResponse<T>>
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();

      if (isApiError(response)) {
        const errorMessage = getApiErrorMessage(response);
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        
        if (options.onError) {
          options.onError(errorMessage);
        }

        return { success: false, error: errorMessage };
      }

      setState(prev => ({ 
        ...prev, 
        loading: false, 
        data: response.data || response as T,
        error: null 
      }));

      if (options.onSuccess) {
        options.onSuccess(response.data || response);
      }

      return { success: true, data: response.data || response as T };

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      
      if (options.onError) {
        options.onError(errorMessage);
      }

      return { success: false, error: errorMessage };
    }
  }, [options]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
}

// Specific hooks for common API operations

export function useEvents() {
  const api = useApi();

  const getEvents = useCallback((params?: {
    page?: number;
    limit?: number;
    search?: string;
    state?: string;
    eventType?: string;
  }) => {
    return api.execute(() => apiService.getEvents(params));
  }, [api]);

  const getEvent = useCallback((eventId: string) => {
    return api.execute(() => apiService.getEvent(eventId));
  }, [api]);

  const createEvent = useCallback((eventData: any) => {
    return api.execute(() => apiService.createEvent(eventData));
  }, [api]);

  const updateEvent = useCallback((eventId: string, eventData: any) => {
    return api.execute(() => apiService.updateEvent(eventId, eventData));
  }, [api]);

  const deleteEvent = useCallback((eventId: string) => {
    return api.execute(() => apiService.deleteEvent(eventId));
  }, [api]);

  return {
    ...api,
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent
  };
}

export function useTickets() {
  const api = useApi();

  const purchaseTicket = useCallback((purchaseData: {
    eventId: string;
    tierId: string;
    quantity: number;
    paymentMethod: string;
  }) => {
    return api.execute(() => apiService.purchaseTicket(purchaseData));
  }, [api]);

  const getMyTickets = useCallback(() => {
    return api.execute(() => apiService.getMyTickets());
  }, [api]);

  const getTicket = useCallback((ticketId: string) => {
    return api.execute(() => apiService.getTicket(ticketId));
  }, [api]);

  const verifyTicket = useCallback((verificationData: {
    ticketId: string;
    scanType: string;
    location?: string;
  }) => {
    return api.execute(() => apiService.verifyTicket(verificationData));
  }, [api]);

  const getTicketQR = useCallback((ticketId: string) => {
    return api.execute(() => apiService.getTicketQR(ticketId));
  }, [api]);

  return {
    ...api,
    purchaseTicket,
    getMyTickets,
    getTicket,
    verifyTicket,
    getTicketQR
  };
}

export function usePayments() {
  const api = useApi();

  const processPayment = useCallback((paymentData: {
    amount: number;
    paymentMethod: string;
    reference: string;
    metadata?: any;
  }) => {
    return api.execute(() => apiService.processPayment(paymentData));
  }, [api]);

  const getWalletBalance = useCallback(() => {
    return api.execute(() => apiService.getWalletBalance());
  }, [api]);

  const topupWallet = useCallback((amount: number, paymentMethod: string) => {
    return api.execute(() => apiService.topupWallet(amount, paymentMethod));
  }, [api]);

  const getTransactionHistory = useCallback((params?: {
    limit?: number;
    offset?: number;
    transactionType?: string;
  }) => {
    return api.execute(() => apiService.getTransactionHistory(params));
  }, [api]);

  const requestRefund = useCallback((refundData: {
    transactionId: string;
    amount?: number;
    reason: string;
  }) => {
    return api.execute(() => apiService.requestRefund(refundData));
  }, [api]);

  const getPaymentMethods = useCallback(() => {
    return api.execute(() => apiService.getPaymentMethods());
  }, [api]);

  return {
    ...api,
    processPayment,
    getWalletBalance,
    topupWallet,
    getTransactionHistory,
    requestRefund,
    getPaymentMethods
  };
}

export function useNotifications() {
  const api = useApi();

  const getNotifications = useCallback((params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) => {
    return api.execute(() => apiService.getNotifications(params));
  }, [api]);

  const markNotificationRead = useCallback((notificationId: string) => {
    return api.execute(() => apiService.markNotificationRead(notificationId));
  }, [api]);

  const markAllNotificationsRead = useCallback(() => {
    return api.execute(() => apiService.markAllNotificationsRead());
  }, [api]);

  const getNotificationPreferences = useCallback(() => {
    return api.execute(() => apiService.getNotificationPreferences());
  }, [api]);

  const updateNotificationPreferences = useCallback((preferences: any) => {
    return api.execute(() => apiService.updateNotificationPreferences(preferences));
  }, [api]);

  return {
    ...api,
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    getNotificationPreferences,
    updateNotificationPreferences
  };
}

export function useAnalytics() {
  const api = useApi();

  const getAnalyticsDashboard = useCallback((period: string = '30d') => {
    return api.execute(() => apiService.getAnalyticsDashboard(period));
  }, [api]);

  const getEventAnalytics = useCallback((eventId?: string, startDate?: string, endDate?: string) => {
    return api.execute(() => apiService.getEventAnalytics(eventId, startDate, endDate));
  }, [api]);

  const getRevenueAnalytics = useCallback((startDate?: string, endDate?: string, granularity: string = 'daily') => {
    return api.execute(() => apiService.getRevenueAnalytics(startDate, endDate, granularity));
  }, [api]);

  return {
    ...api,
    getAnalyticsDashboard,
    getEventAnalytics,
    getRevenueAnalytics
  };
}

export function useAdmin() {
  const api = useApi();

  const getAdminDashboard = useCallback(() => {
    return api.execute(() => apiService.getAdminDashboard());
  }, [api]);

  const getUsers = useCallback((params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    return api.execute(() => apiService.getUsers(params));
  }, [api]);

  const updateUserStatus = useCallback((userId: string, status: string, reason?: string) => {
    return api.execute(() => apiService.updateUserStatus(userId, status, reason));
  }, [api]);

  const moderateEvent = useCallback((eventId: string, action: string, reason?: string) => {
    return api.execute(() => apiService.moderateEvent(eventId, action, reason));
  }, [api]);

  return {
    ...api,
    getAdminDashboard,
    getUsers,
    updateUserStatus,
    moderateEvent
  };
}