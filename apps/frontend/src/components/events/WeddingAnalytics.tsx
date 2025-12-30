import { useEffect, useState } from 'react';

interface WeddingAnalyticsData {
  foodCounts: Record<string, number>;
  asoEbiSales: Record<string, number>;
  totalSprayMoney: number;
  totalTickets: number;
}

interface WeddingAnalyticsProps {
  eventId: string;
}

export function WeddingAnalytics({ eventId }: WeddingAnalyticsProps) {
  const [analytics, setAnalytics] = useState<WeddingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/wedding-analytics`);
        const data = await response.json();

        if (data.success) {
          setAnalytics(data.analytics);
          setError(null);
        } else {
          setError(data.message || 'Failed to load analytics');
        }
      } catch (err) {
        setError('Failed to load analytics');
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [eventId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">{error || 'No analytics available'}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Wedding Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Food RSVP Summary */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            🍽️ Food RSVP Summary
          </h3>
          {Object.keys(analytics.foodCounts).length === 0 ? (
            <p className="text-gray-500">No food selections yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(analytics.foodCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([food, count]) => (
                  <div key={food} className="flex justify-between items-center">
                    <span className="text-gray-700">{food}</span>
                    <span className="font-semibold text-blue-600">{count}</span>
                  </div>
                ))}
              <div className="pt-2 border-t mt-2">
                <div className="flex justify-between items-center font-bold">
                  <span>Total Responses</span>
                  <span>{Object.values(analytics.foodCounts).reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Aso-ebi Sales */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            👗 Aso-ebi Sales by Tier
          </h3>
          {Object.keys(analytics.asoEbiSales).length === 0 ? (
            <p className="text-gray-500">No aso-ebi purchases yet</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(analytics.asoEbiSales)
                .sort(([, a], [, b]) => b - a)
                .map(([tier, count]) => (
                  <div key={tier} className="flex justify-between items-center">
                    <span className="text-gray-700">{tier}</span>
                    <span className="font-semibold text-purple-600">{count}</span>
                  </div>
                ))}
              <div className="pt-2 border-t mt-2">
                <div className="flex justify-between items-center font-bold">
                  <span>Total Sales</span>
                  <span>{Object.values(analytics.asoEbiSales).reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Spray Money Total */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            💰 Total Spray Money
          </h3>
          <div className="text-4xl font-bold text-yellow-700">
            ₦{analytics.totalSprayMoney.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Collected from guest contributions
          </p>
        </div>

        {/* Total Tickets */}
        <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            🎫 Total Tickets Sold
          </h3>
          <div className="text-4xl font-bold text-green-700">
            {analytics.totalTickets}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Confirmed attendees
          </p>
        </div>
      </div>
    </div>
  );
}
