import React, { useState } from 'react';
import { Lock, Key, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import SecretEventCard from '../../components/secret-events/SecretEventCard';
import DiscoveryFeed from '../../components/secret-events/DiscoveryFeed';
import InviteRequestModal from '../../components/secret-events/InviteRequestModal';
import useSecretEvents from '../../hooks/useSecretEvents';
import { useMembership } from '../../hooks/useMembership';

export default function AttendeeSecretEvents() {
  const { events, loading, error, refetch, validateInviteCode, requestInvite } = useSecretEvents();
  const { membership, loading: membershipLoading } = useMembership();
  const [inviteCode, setInviteCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);
  const [validateSuccess, setValidateSuccess] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'my-events' | 'discover'>('my-events');

  const userTier = membership?.tier || 'free';

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setValidateError('Please enter an invite code');
      return;
    }

    try {
      setValidating(true);
      setValidateError(null);
      setValidateSuccess(false);
      
      await validateInviteCode(inviteCode);
      
      setValidateSuccess(true);
      setInviteCode('');
      
      // Refresh events list
      setTimeout(() => {
        refetch();
        setValidateSuccess(false);
      }, 2000);
    } catch (err: any) {
      setValidateError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleRequestInvite = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async (message: string) => {
    await requestInvite(selectedEventId, message);
  };

  if (membershipLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-8 h-8" />
              <h1 className="text-3xl font-bold">Secret Events</h1>
            </div>
            <p className="text-purple-100 text-lg">
              Discover exclusive events with progressive location reveals
            </p>
          </div>
        </div>

        {/* Premium Required Notice */}
        {userTier === 'free' && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Lock className="w-6 h-6 text-purple-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Premium Feature
                </h3>
                <p className="text-gray-700 mb-4">
                  Secret Events are exclusive to Premium and VIP members. Upgrade to access exclusive events with progressive location reveals.
                </p>
                <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all">
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {userTier !== 'free' && (
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my-events')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'my-events'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Secret Events
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'discover'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Discover
            </button>
          </div>
        )}

        {/* My Events Tab */}
        {activeTab === 'my-events' && userTier !== 'free' && (
          <div className="space-y-6">
            {/* Invite Code Entry */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Enter Invite Code
                </h2>
              </div>
              
              <form onSubmit={handleValidateCode} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code (e.g., ABC12345)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                    maxLength={8}
                    disabled={validating}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Got an invite code? Enter it here to access the secret event
                  </p>
                </div>

                {validateError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">Invalid Code</p>
                      <p className="text-red-600 text-sm">{validateError}</p>
                    </div>
                  </div>
                )}

                {validateSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-green-800 font-medium">Success!</p>
                      <p className="text-green-600 text-sm">
                        Invite code validated. Event added to your list.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={validating || !inviteCode.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {validating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Validating...
                    </>
                  ) : (
                    <>
                      <Key className="w-5 h-5" />
                      Validate Code
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* My Secret Events List */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                My Secret Events
              </h2>

              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading your secret events...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">Error loading events</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {!loading && !error && events.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">
                    No secret events yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    Enter an invite code above or discover events in the Discover tab
                  </p>
                </div>
              )}

              {!loading && !error && events.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <SecretEventCard
                      key={event.id}
                      event={event}
                      userTier={userTier}
                      showLocationCountdown={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && userTier !== 'free' && (
          <DiscoveryFeed
            userTier={userTier}
            onRequestInvite={handleRequestInvite}
          />
        )}

        {/* Invite Request Modal */}
        <InviteRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleSubmitRequest}
          eventId={selectedEventId}
        />
      </div>
    </DashboardLayout>
  );
}
