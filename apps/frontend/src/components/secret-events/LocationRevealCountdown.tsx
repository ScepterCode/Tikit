import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Crown, Lock, Unlock } from 'lucide-react';

interface LocationRevealCountdownProps {
  locationRevealTime: string;
  currentLocation: string;
  locationStage: string;
  isRevealed: boolean;
  countdownSeconds: number;
  vipEarlyAccess?: boolean;
  userTier: 'free' | 'premium' | 'vip';
}

export default function LocationRevealCountdown({
  locationRevealTime,
  currentLocation,
  locationStage,
  isRevealed,
  countdownSeconds: initialCountdown,
  vipEarlyAccess = false,
  userTier
}: LocationRevealCountdownProps) {
  const [countdown, setCountdown] = useState(initialCountdown);

  useEffect(() => {
    if (isRevealed || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRevealed, countdown]);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };

  const getStageInfo = () => {
    switch (locationStage) {
      case '24h':
        return {
          label: 'Very Vague',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          progress: 10
        };
      case '12h':
        return {
          label: 'Area Revealed',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          progress: 30
        };
      case '6h':
        return {
          label: 'Street Revealed',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          progress: 60
        };
      case '2h':
      case '3h_vip':
        return {
          label: vipEarlyAccess ? 'VIP Early Access!' : 'Almost There',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          progress: 90
        };
      case 'revealed':
        return {
          label: 'Fully Revealed',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          progress: 100
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          progress: 0
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isRevealed ? (
            <Unlock className="w-5 h-5 text-green-600" />
          ) : (
            <Lock className="w-5 h-5 text-purple-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">
            Location Status
          </h3>
        </div>
        {vipEarlyAccess && (
          <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            <Crown className="w-4 h-4" />
            VIP Early Access
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-medium ${stageInfo.color}`}>
            {stageInfo.label}
          </span>
          <span className="text-sm text-gray-600">
            {stageInfo.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isRevealed
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : 'bg-gradient-to-r from-purple-500 to-purple-600'
            }`}
            style={{ width: `${stageInfo.progress}%` }}
          />
        </div>
      </div>

      {/* Current Location */}
      <div className={`${stageInfo.bgColor} rounded-lg p-4 mb-4`}>
        <div className="flex items-start gap-3">
          <MapPin className={`w-5 h-5 ${stageInfo.color} mt-0.5`} />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Current Location Hint:
            </p>
            <p className={`text-lg font-semibold ${stageInfo.color}`}>
              {currentLocation}
            </p>
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      {!isRevealed && countdown > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-1">
                {vipEarlyAccess
                  ? 'VIP Full Reveal In:'
                  : 'Next Reveal In:'}
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {formatTime(countdown)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fully Revealed Message */}
      {isRevealed && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Unlock className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700">
                🎉 Full location revealed! See you there!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIP Benefit Notice */}
      {userTier === 'premium' && !isRevealed && (
        <div className="mt-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <Crown className="w-4 h-4 inline mr-1" />
            Upgrade to VIP to get location 1 hour earlier!
          </p>
        </div>
      )}

      {/* Timeline Preview */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Reveal Timeline:</p>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>24h before:</span>
            <span className="font-medium">City/Area</span>
          </div>
          <div className="flex justify-between">
            <span>12h before:</span>
            <span className="font-medium">District</span>
          </div>
          <div className="flex justify-between">
            <span>6h before:</span>
            <span className="font-medium">Street</span>
          </div>
          <div className="flex justify-between">
            <span>{userTier === 'vip' ? '3h' : '2h'} before:</span>
            <span className="font-medium">Full Address</span>
          </div>
        </div>
      </div>
    </div>
  );
}
