/**
 * Premium Membership Hook
 * Manages user membership status and premium features
 */
import { useState, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../utils/auth';

export interface Membership {
  id: string;
  user_id: string;
  tier: 'regular' | 'special' | 'legend';
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'pending';
  features: string[];
  expires_at: number | null;
  trial_used: boolean;
  created_at: number;
  updated_at: number;
  payment_history: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  tier: string;
  duration: string;
  payment_reference: string;
  created_at: number;
}

export interface PricingInfo {
  special: {
    monthly: number;
  };
  legend: {
    monthly: number;
  };
}

export function useMembership() {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch membership status
  const fetchMembership = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('http://localhost:8000/api/memberships/status');
      const data = await response.json();

      if (data.success) {
        setMembership(data.data.membership);
      } else {
        setError('Failed to fetch membership status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch membership');
      console.error('Error fetching membership:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pricing information
  const fetchPricing = useCallback(async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/memberships/pricing');
      const data = await response.json();

      if (data.success) {
        setPricing(data.data.pricing);
      }
    } catch (err) {
      console.error('Error fetching pricing:', err);
    }
  }, []);

  // Start 7-day free trial
  const startTrial = useCallback(async (tier: 'special' | 'legend') => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('http://localhost:8000/api/memberships/start-trial', {
        method: 'POST',
        body: JSON.stringify({ tier })
      });

      const data = await response.json();

      if (data.success) {
        setMembership(data.data.membership);
        return { success: true, message: data.message, trial_ends_at: data.data.trial_ends_at };
      } else {
        setError(data.error || 'Failed to start trial');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start trial';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Process payment after trial
  const processPayment = useCallback(async (tier: 'special' | 'legend', paymentReference: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('http://localhost:8000/api/memberships/process-payment', {
        method: 'POST',
        body: JSON.stringify({
          tier,
          payment_reference: paymentReference
        })
      });

      const data = await response.json();

      if (data.success) {
        setMembership(data.data.membership);
        return { success: true, message: data.message };
      } else {
        setError(data.error || 'Payment processing failed');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Upgrade membership
  const upgradeMembership = useCallback(async (
    tier: 'special' | 'legend',
    duration: 'monthly' = 'monthly',
    paymentReference?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('http://localhost:8000/api/memberships/upgrade', {
        method: 'POST',
        body: JSON.stringify({
          tier,
          duration,
          payment_reference: paymentReference
        })
      });

      const data = await response.json();

      if (data.success) {
        setMembership(data.data.membership);
        return { success: true, message: data.message };
      } else {
        setError(data.error || 'Upgrade failed');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upgrade failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cancel membership
  const cancelMembership = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch('http://localhost:8000/api/memberships/cancel', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setMembership(data.data.membership);
        return { success: true, message: data.message };
      } else {
        setError(data.error || 'Cancellation failed');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Cancellation failed';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Check feature access
  const checkFeatureAccess = useCallback(async (feature: string) => {
    try {
      const response = await authenticatedFetch(`http://localhost:8000/api/memberships/check-feature/${feature}`);
      const data = await response.json();

      if (data.success) {
        return data.data.has_access;
      }
      return false;
    } catch (err) {
      console.error('Error checking feature access:', err);
      return false;
    }
  }, []);

  // Helper functions
  const isPremium = membership?.tier !== 'regular';
  const isSpecial = membership?.tier === 'special';
  const isLegend = membership?.tier === 'legend';
  const isTrial = membership?.status === 'trial';
  const isExpired = membership?.status === 'expired';
  const daysRemaining = membership?.expires_at 
    ? Math.max(0, Math.floor((membership.expires_at * 1000 - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Initialize
  useEffect(() => {
    fetchMembership();
    fetchPricing();
  }, [fetchMembership, fetchPricing]);

  return {
    membership,
    pricing,
    loading,
    error,
    isPremium,
    isSpecial,
    isLegend,
    isTrial,
    isExpired,
    daysRemaining,
    fetchMembership,
    startTrial,
    processPayment,
    upgradeMembership,
    cancelMembership,
    checkFeatureAccess
  };
}
