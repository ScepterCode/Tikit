import React, { useEffect, useState } from 'react';
import supabase from '../../lib/supabase';

interface EventAnalytics {
  salesCounters: {
    totalTicketsSold: number;
    ticketsByTier: Record<string, number>;
    pendingPayments: number;
    completedPayments: number;
  };
  revenue: {
    totalRevenue: number;
    revenueByTier: Record<string, number>;
    revenueByPaymentMethod: Record<string, number>;
    pendingRevenue: number;
  };
  demographics: {
    attendeesByState: Record<string, number>;
    attendeesByLGA: Record<string, number>;
    newVsReturning: {
      new: number;
      returning: number;
    };
  };
  capacity: {
    total: number;
    sold: number;
    remaining: number;
    percentageSold: number;
  };
}

interface AnalyticsDashboardProps {
  eventId: string;
  onFetchAnalytics: (eventId: string) => Promise<EventAnalytics>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  eventId,
  onFetchAnalytics,
}) => {
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await onFetchAnalytics(eventId);
      setAnalytics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return;
    
    const channel = supabase
      .channel(`event-analytics-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Ticket',
          filter: `eventId=eq.${eventId}`,
        },
        () => {
          // Refetch analytics when tickets change
          fetchAnalytics();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Payment',
        },
        () => {
          // Refetch analytics when payments change
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [eventId]);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Event Analytics</h2>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
          <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </div>
      </div>

      {/* Sales Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Total Tickets Sold</div>
          <div className="text-3xl font-bold text-blue-600">
            {analytics.salesCounters.totalTicketsSold}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Completed Payments</div>
          <div className="text-3xl font-bold text-green-600">
            {analytics.salesCounters.completedPayments}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Pending Payments</div>
          <div className="text-3xl font-bold text-yellow-600">
            {analytics.salesCounters.pendingPayments}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Capacity Used</div>
          <div className="text-3xl font-bold text-purple-600">
            {formatPercentage(analytics.capacity.percentageSold)}
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(analytics.revenue.totalRevenue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Pending Revenue</div>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(analytics.revenue.pendingRevenue)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Expected Total</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(analytics.revenue.totalRevenue + analytics.revenue.pendingRevenue)}
            </div>
          </div>
        </div>

        {/* Revenue by Payment Method */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Revenue by Payment Method</h4>
          <div className="space-y-2">
            {Object.entries(analytics.revenue.revenueByPaymentMethod).map(([method, amount]) => (
              <div key={method} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                <span className="text-sm font-semibold">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets by Tier */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Tickets by Tier</h3>
        <div className="space-y-3">
          {Object.entries(analytics.salesCounters.ticketsByTier).map(([tier, count]) => {
            const revenue = analytics.revenue.revenueByTier[tier] || 0;
            return (
              <div key={tier} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-semibold">{tier}</div>
                  <div className="text-sm text-gray-600">{count} tickets sold</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">{formatCurrency(revenue)}</div>
                  <div className="text-sm text-gray-600">revenue</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Capacity */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Capacity</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Sold</span>
            <span className="font-semibold">{analytics.capacity.sold} / {analytics.capacity.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                analytics.capacity.percentageSold >= 100
                  ? 'bg-red-600'
                  : analytics.capacity.percentageSold >= 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(analytics.capacity.percentageSold, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="font-semibold">{analytics.capacity.remaining} tickets</span>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendees by State */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Attendees by State</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(analytics.demographics.attendeesByState)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([state, count]) => (
                <div key={state} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{state}</span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
          </div>
        </div>

        {/* New vs Returning */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">New vs Returning Attendees</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium text-blue-900">New Users</span>
              <span className="text-2xl font-bold text-blue-600">
                {analytics.demographics.newVsReturning.new}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
              <span className="text-sm font-medium text-green-900">Returning Users</span>
              <span className="text-2xl font-bold text-green-600">
                {analytics.demographics.newVsReturning.returning}
              </span>
            </div>
            <div className="text-sm text-gray-600 text-center">
              {analytics.demographics.newVsReturning.new > 0 && (
                <>
                  {formatPercentage(
                    (analytics.demographics.newVsReturning.new /
                      (analytics.demographics.newVsReturning.new +
                        analytics.demographics.newVsReturning.returning)) *
                      100
                  )}{' '}
                  are new users
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendees by LGA */}
      {Object.keys(analytics.demographics.attendeesByLGA).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Attendees by LGA (Top 10)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(analytics.demographics.attendeesByLGA)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([lga, count]) => (
                <div key={lga} className="p-3 bg-gray-50 rounded text-center">
                  <div className="text-sm text-gray-600 truncate">{lga}</div>
                  <div className="text-lg font-bold text-blue-600">{count}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
