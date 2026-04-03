import React, { useState, useEffect } from 'react';
import { Lock, Plus, Users, Key, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import SecretEventCard from '../../components/secret-events/SecretEventCard';
import { useMembership } from '../../hooks/useMembership';
import { MembershipUpgradeModal } from '../../components/membership/MembershipUpgradeModal';
import { apiService as api } from '../../services/api';

interface InviteRequest {
  id: string;
  user_id: string;
  message: string;
  status: 'pending' | 'approved' | 'denied';
  requested_at: string;
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function OrganizerSecretEvents() {
  const { membership, loading: membershipLoading, startTrial } = useMembership();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [inviteRequests, setInviteRequests] = useState<InviteRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const userTier = membership?.tier || 'regular';

  const handleUpgrade = async (tier: 'special' | 'legend') => {
    const result = await startTrial(tier);
    if (result.success) {
      setShowUpgradeModal(false);
      // Refresh the page to show new features
      window.location.reload();
    }
    return result;
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.request('/secret-events/accessible');
      
      if (response.success) {
        setEvents(response.data?.events || []);
      } else {
        setError(response.error?.message || 'Failed to load secret events');
      }
    } catch (err: any) {
      setError('Failed to load secret events');
    } finally {
      setLoading(false);
    }
  };

  const fetchInviteRequests = async (eventId: string) => {
    try {
      setLoadingRequests(true);
      const response = await api.request(`/secret-events/invite-requests/${eventId}`);
      
      if (response.success) {
        setInviteRequests(response.data?.requests || []);
      }
    } catch (err: any) {
      console.error('Failed to load invite requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await api.request(`/secret-events/approve-invite-request/${requestId}`, {
        method: 'POST'
      });
      
      if (response.success && selectedEvent) {
        fetchInviteRequests(selectedEvent.id);
      }
    } catch (err: any) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleViewRequests = (event: any) => {
    setSelectedEvent(event);
    fetchInviteRequests(event.id);
  };

  if (membershipLoading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              border: '3px solid #e5e7eb', 
              borderTopColor: '#9333ea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(to right, #9333ea, #7c3aed, #6366f1)',
          borderRadius: '12px',
          padding: '32px',
          color: 'white',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Lock size={32} />
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>Secret Events</h1>
              </div>
              <p style={{ fontSize: '16px', opacity: 0.9, margin: 0 }}>
                Create exclusive events with progressive location reveals
              </p>
            </div>
            {userTier !== 'free' && (
              <button
                onClick={() => window.location.href = '/organizer/create-event?type=secret'}
                style={{
                  background: 'white',
                  color: '#9333ea',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={20} />
                Create Secret Event
              </button>
            )}
          </div>
        </div>

        {/* Premium Required Notice */}
        {userTier === 'free' && (
          <div style={{
            background: 'linear-gradient(to right, #faf5ff, #eef2ff)',
            border: '2px solid #e9d5ff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Lock size={24} color="#9333ea" style={{ flexShrink: 0, marginTop: '4px' }} />
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: 0, marginBottom: '8px' }}>
                  Premium Feature
                </h3>
                <p style={{ color: '#374151', marginBottom: '16px' }}>
                  Secret Events are exclusive to Special and Legend organizers. Upgrade to create exclusive events with progressive location reveals.
                </p>
                <button 
                  onClick={() => setShowUpgradeModal(true)}
                  style={{
                    background: 'linear-gradient(to right, #9333ea, #6366f1)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        {userTier !== 'regular' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
              Your Secret Events
            </h2>

            {loading && (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  border: '3px solid #e5e7eb', 
                  borderTopColor: '#9333ea',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px'
                }} />
                <p style={{ color: '#6b7280' }}>Loading your secret events...</p>
              </div>
            )}

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                color: '#991b1b'
              }}>
                {error}
              </div>
            )}

            {!loading && !error && events.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                background: '#f9fafb',
                borderRadius: '12px'
              }}>
                <Lock size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontSize: '18px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                  No secret events yet
                </p>
                <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
                  Create your first secret event to get started
                </p>
                <button
                  onClick={() => window.location.href = '/organizer/create-event?type=secret'}
                  style={{
                    background: 'linear-gradient(to right, #9333ea, #6366f1)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={20} />
                  Create Secret Event
                </button>
              </div>
            )}

            {!loading && !error && events.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
                gap: '24px'
              }}>
                {events.map((event) => (
                  <div key={event.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <SecretEventCard
                      event={event}
                      userTier={userTier}
                      showLocationCountdown={true}
                    />
                    
                    {/* Organizer Actions */}
                    <div style={{
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      padding: '16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Key size={20} color="#9333ea" />
                          <span style={{ fontWeight: '600', color: '#111827' }}>
                            Master Invite Code:
                          </span>
                        </div>
                        <code style={{
                          background: '#f3e8ff',
                          color: '#7c3aed',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold'
                        }}>
                          {event.master_invite_code || 'N/A'}
                        </code>
                      </div>
                      
                      <button
                        onClick={() => handleViewRequests(event)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(to right, #9333ea, #6366f1)',
                          color: 'white',
                          padding: '10px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Users size={20} />
                        View Invite Requests
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invite Requests Modal */}
        {selectedEvent && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(to right, #9333ea, #6366f1)',
                padding: '24px',
                color: 'white'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Invite Requests</h2>
                <p style={{ opacity: 0.9 }}>
                  Manage invite requests for this secret event
                </p>
              </div>

              {/* Body */}
              <div style={{ padding: '24px' }}>
                {loadingRequests && (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      border: '3px solid #e5e7eb', 
                      borderTopColor: '#9333ea',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto'
                    }} />
                  </div>
                )}

                {!loadingRequests && inviteRequests.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px' }}>
                    <Users size={64} color="#d1d5db" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#6b7280' }}>No invite requests yet</p>
                  </div>
                )}

                {!loadingRequests && inviteRequests.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {inviteRequests.map((request) => (
                      <div
                        key={request.id}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '16px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'start',
                          justifyContent: 'space-between',
                          marginBottom: '12px'
                        }}>
                          <div>
                            <p style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                              {request.users?.first_name} {request.users?.last_name}
                            </p>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>
                              {request.users?.email}
                            </p>
                          </div>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: request.status === 'pending' ? '#fef3c7' : request.status === 'approved' ? '#d1fae5' : '#fee2e2',
                            color: request.status === 'pending' ? '#92400e' : request.status === 'approved' ? '#065f46' : '#991b1b'
                          }}>
                            {request.status}
                          </span>
                        </div>

                        <p style={{ color: '#374151', fontSize: '14px', marginBottom: '12px' }}>
                          {request.message}
                        </p>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: '#9ca3af',
                          marginBottom: '12px'
                        }}>
                          <Clock size={16} />
                          {new Date(request.requested_at).toLocaleString()}
                        </div>

                        {request.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              style={{
                                flex: 1,
                                background: '#10b981',
                                color: 'white',
                                padding: '8px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              style={{
                                flex: 1,
                                background: '#ef4444',
                                color: 'white',
                                padding: '8px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <XCircle size={16} />
                              Deny
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                background: '#f9fafb',
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setSelectedEvent(null)}
                  style={{
                    width: '100%',
                    background: '#6b7280',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Membership Upgrade Modal */}
      <MembershipUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentTier={userTier as 'regular' | 'special' | 'legend'}
        onUpgrade={handleUpgrade}
      />
    </DashboardLayout>
  );
}
