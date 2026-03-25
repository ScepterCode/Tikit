import React, { useState, useEffect } from 'react';
import { BarChart3, Users, MessageCircle, DollarSign, TrendingUp, Eye, Clock, Target } from 'lucide-react';

interface AnalyticsData {
  event_id: string;
  event_title: string;
  invite_analytics: {
    total_codes: number;
    total_uses: number;
    conversion_rate: number;
    usage_by_hour: Record<string, number>;
  };
  ticket_analytics: {
    total_tickets: number;
    total_revenue: number;
    anonymous_percentage: number;
    tier_sales: Record<string, number>;
  };
  chat_analytics: {
    total_messages: number;
    active_participants: number;
    messages_per_participant: number;
  };
  engagement_analytics: {
    engagement_score: number;
    attendee_fill_rate: number;
    time_to_event_hours: number;
    location_revealed: boolean;
  };
  revenue_analytics: {
    total_revenue: number;
    projected_revenue: number;
    average_ticket_value: number;
  };
}

interface SecretEventAnalyticsProps {
  eventId: string;
  onClose?: () => void;
}

const SecretEventAnalytics: React.FC<SecretEventAnalyticsProps> = ({ eventId, onClose }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [eventId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/analytics/secret-event/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.detail || 'Failed to load analytics');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <BarChart3 className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Secret Event Analytics</h1>
              <p className="text-gray-600">{analytics.event_title}</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Engagement Score"
            value={`${Math.round(analytics.engagement_analytics.engagement_score)}%`}
            icon={<Target className="h-6 w-6" />}
            color="text-purple-600"
            subtitle="Overall event engagement"
          />
          
          <MetricCard
            title="Total Revenue"
            value={`₦${analytics.revenue_analytics.total_revenue.toLocaleString()}`}
            icon={<DollarSign className="h-6 w-6" />}
            color="text-green-600"
            subtitle={`Avg: ₦${Math.round(analytics.revenue_analytics.average_ticket_value)}`}
          />
          
          <MetricCard
            title="Chat Messages"
            value={analytics.chat_analytics.total_messages}
            icon={<MessageCircle className="h-6 w-6" />}
            color="text-blue-600"
            subtitle={`${analytics.chat_analytics.active_participants} participants`}
          />
          
          <MetricCard
            title="Tickets Sold"
            value={analytics.ticket_analytics.total_tickets}
            icon={<Users className="h-6 w-6" />}
            color="text-orange-600"
            subtitle={`${Math.round(analytics.ticket_analytics.anonymous_percentage)}% anonymous`}
          />
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invite Analytics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-purple-500" />
              Invite Code Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Codes Generated</span>
                <span className="font-semibold">{analytics.invite_analytics.total_codes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Uses</span>
                <span className="font-semibold">{analytics.invite_analytics.total_uses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-green-600">
                  {Math.round(analytics.invite_analytics.conversion_rate)}%
                </span>
              </div>
            </div>
          </div>

          {/* Chat Analytics */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2 text-blue-500" />
              Anonymous Chat Activity
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Participants</span>
                <span className="font-semibold">{analytics.chat_analytics.active_participants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Messages</span>
                <span className="font-semibold">{analytics.chat_analytics.total_messages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Messages per Participant</span>
                <span className="font-semibold">
                  {Math.round(analytics.chat_analytics.messages_per_participant)}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-500" />
              Revenue Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Revenue</span>
                <span className="font-semibold">₦{analytics.revenue_analytics.total_revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Projected Revenue</span>
                <span className="font-semibold text-green-600">
                  ₦{analytics.revenue_analytics.projected_revenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Ticket Value</span>
                <span className="font-semibold">
                  ₦{Math.round(analytics.revenue_analytics.average_ticket_value).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Event Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-orange-500" />
              Event Status
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Attendee Fill Rate</span>
                <span className="font-semibold">
                  {Math.round(analytics.engagement_analytics.attendee_fill_rate)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Time to Event</span>
                <span className="font-semibold">
                  {Math.round(analytics.engagement_analytics.time_to_event_hours)}h
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Location Revealed</span>
                <span className={`font-semibold ${
                  analytics.engagement_analytics.location_revealed 
                    ? 'text-green-600' 
                    : 'text-orange-600'
                }`}>
                  {analytics.engagement_analytics.location_revealed ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Tier Breakdown */}
        {Object.keys(analytics.ticket_analytics.tier_sales).length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-500" />
              Ticket Tier Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analytics.ticket_analytics.tier_sales).map(([tierName, sales]) => (
                <div key={tierName} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{tierName}</h4>
                  <p className="text-2xl font-bold text-indigo-600">{sales}</p>
                  <p className="text-sm text-gray-500">tickets sold</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretEventAnalytics;