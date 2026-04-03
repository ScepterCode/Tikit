import React, { useState, useEffect } from 'react';
import { Search, Filter, Crown, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { apiService as api } from '../../services/api';

interface DiscoveryEvent {
  id: string;
  event_id: string;
  teaser_description: string;
  category: string;
  vibe: string;
  premium_tier_required: string;
  current_attendees?: number;
  max_attendees?: number;
  has_requested: boolean;
  request_status?: 'pending' | 'approved' | 'denied';
}

interface DiscoveryFeedProps {
  userTier: 'free' | 'premium' | 'vip';
  onRequestInvite: (eventId: string) => void;
}

export default function DiscoveryFeed({ userTier, onRequestInvite }: DiscoveryFeedProps) {
  const [events, setEvents] = useState<DiscoveryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', 'party', 'concert', 'networking', 'exclusive', 'secret'];

  useEffect(() => {
    fetchDiscoveryFeed();
  }, [selectedCategory]);

  const fetchDiscoveryFeed = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const response = await api.get('/secret-events/discovery-feed', { params });
      
      if (response.data.success) {
        setEvents(response.data.data.events);
      } else {
        setError(response.data.error || 'Failed to load discovery feed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load discovery feed');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event =>
    event.teaser_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.vibe.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRequestButtonText = (event: DiscoveryEvent) => {
    if (event.has_requested) {
      switch (event.request_status) {
        case 'pending':
          return 'Request Pending...';
        case 'approved':
          return 'Approved! ✓';
        case 'denied':
          return 'Request Denied';
        default:
          return 'Requested';
      }
    }
    return 'Request Invite';
  };

  const getRequestButtonStyle = (event: DiscoveryEvent) => {
    if (event.has_requested) {
      switch (event.request_status) {
        case 'pending':
          return 'bg-yellow-500 hover:bg-yellow-600 cursor-wait';
        case 'approved':
          return 'bg-green-500 hover:bg-green-600';
        case 'denied':
          return 'bg-red-500 hover:bg-red-600 cursor-not-allowed';
        default:
          return 'bg-gray-500 cursor-not-allowed';
      }
    }
    return 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700';
  };

  if (userTier === 'free') {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-8 text-center">
        <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Premium Feature
        </h3>
        <p className="text-gray-600 mb-6">
          Upgrade to Premium or VIP to discover exclusive secret events
        </p>
        <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all">
          Upgrade Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Discover Secret Events
          </h2>
          <p className="text-gray-600 mt-1">
            Browse exclusive events and request invites
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading secret events...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error loading events</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {!loading && !error && (
        <>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No secret events found</p>
              <p className="text-gray-500 text-sm mt-2">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-purple-100 hover:border-purple-300 transition-all"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold">🎭 Secret Event</h3>
                      {event.premium_tier_required === 'vip' ? (
                        <div className="flex items-center gap-1 bg-yellow-500 px-2 py-1 rounded-full text-xs font-semibold">
                          <Crown className="w-3 h-3" />
                          VIP
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                          <Lock className="w-3 h-3" />
                          Premium
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                        {event.category}
                      </span>
                      <span className="px-2 py-1 bg-white/20 rounded-full text-xs">
                        ✨ {event.vibe}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-4">
                    <p className="text-gray-700 text-sm line-clamp-3">
                      {event.teaser_description}
                    </p>

                    {event.current_attendees !== undefined && (
                      <div className="text-sm text-gray-600">
                        {event.current_attendees} / {event.max_attendees} interested
                      </div>
                    )}

                    <button
                      onClick={() => !event.has_requested && onRequestInvite(event.id)}
                      disabled={event.has_requested && event.request_status !== 'denied'}
                      className={`w-full text-white py-2 rounded-lg font-semibold transition-all ${getRequestButtonStyle(event)}`}
                    >
                      {getRequestButtonText(event)}
                    </button>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-purple-50 px-4 py-2 border-t border-purple-100">
                    <p className="text-xs text-center text-purple-600">
                      🔒 Location revealed to invited guests only
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
