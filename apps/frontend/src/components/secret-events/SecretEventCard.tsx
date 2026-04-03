import React from 'react';
import { Eye, EyeOff, MapPin, Users, Crown, Lock, Calendar } from 'lucide-react';
import LocationRevealCountdown from './LocationRevealCountdown';

interface SecretEventCardProps {
  event: {
    id: string;
    event_id: string;
    title?: string;
    teaser_description?: string;
    category?: string;
    vibe?: string;
    current_location: string;
    location_stage: string;
    location_revealed: boolean;
    countdown_seconds: number;
    vip_early_access?: boolean;
    premium_tier_required: string;
    current_attendees?: number;
    max_attendees?: number;
    attendee_list_hidden?: boolean;
    location_reveal_time: string;
  };
  userTier: 'free' | 'premium' | 'vip';
  onViewDetails?: () => void;
  showLocationCountdown?: boolean;
}

export default function SecretEventCard({
  event,
  userTier,
  onViewDetails,
  showLocationCountdown = true
}: SecretEventCardProps) {
  const getTierBadge = () => {
    if (event.premium_tier_required === 'vip') {
      return (
        <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
          <Crown className="w-3 h-3" />
          VIP Only
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
        <Lock className="w-3 h-3" />
        Premium
      </div>
    );
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'party':
        return 'bg-pink-100 text-pink-700';
      case 'concert':
        return 'bg-purple-100 text-purple-700';
      case 'networking':
        return 'bg-blue-100 text-blue-700';
      case 'exclusive':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-purple-100 hover:border-purple-300 transition-all">
      {/* Header with Mystery Theme */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">
                {event.title || '🎭 Secret Event'}
              </h3>
              {event.teaser_description && (
                <p className="text-purple-100 text-sm line-clamp-2">
                  {event.teaser_description}
                </p>
              )}
            </div>
            {getTierBadge()}
          </div>

          {/* Category and Vibe */}
          <div className="flex flex-wrap gap-2">
            {event.category && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
            )}
            {event.vibe && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                ✨ {event.vibe}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Location Status */}
        <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
          <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Current Location:
            </p>
            <p className="text-lg font-semibold text-purple-600">
              {event.current_location}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Stage: {event.location_stage.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Attendee Count */}
        {!event.attendee_list_hidden && event.current_attendees !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {event.attendee_list_hidden ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            <span>
              {event.attendee_list_hidden
                ? 'Attendee list hidden'
                : `${event.current_attendees} / ${event.max_attendees} attending`}
            </span>
          </div>
        )}

        {/* Location Countdown */}
        {showLocationCountdown && (
          <LocationRevealCountdown
            locationRevealTime={event.location_reveal_time}
            currentLocation={event.current_location}
            locationStage={event.location_stage}
            isRevealed={event.location_revealed}
            countdownSeconds={event.countdown_seconds}
            vipEarlyAccess={event.vip_early_access}
            userTier={userTier}
          />
        )}

        {/* Action Button */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            View Event Details
          </button>
        )}
      </div>

      {/* Mystery Footer */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-3 border-t border-purple-100">
        <p className="text-xs text-center text-purple-600 font-medium">
          🔒 Location reveals progressively as event approaches
        </p>
      </div>
    </div>
  );
}
