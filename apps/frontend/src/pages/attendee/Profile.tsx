import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  state: string;
  lga?: string;
  dateOfBirth?: string;
  gender?: string;
  preferredLanguage: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showAttendedEvents: boolean;
  };
}

export function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Initialize profile data from user context
    if (user) {
      const mockProfileData: ProfileData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        state: user.state || '',
        lga: '',
        dateOfBirth: '',
        gender: '',
        preferredLanguage: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true
        },
        privacy: {
          profileVisible: true,
          showAttendedEvents: false
        }
      };
      
      setProfileData(mockProfileData);
      setLoading(false);
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!profileData) return;
    
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert('Profile updated successfully!');
    }, 1500);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long!');
      return;
    }

    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully!');
    }, 1500);
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    
    if (confirmed) {
      // Simulate account deletion
      alert('Account deletion request submitted. You will receive a confirmation email.');
    }
  };

  if (loading || !profileData) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/attendee/dashboard')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1 style={styles.title}>👤 My Profile</h1>
      </div>

      {/* Profile Summary Card */}
      <div style={styles.profileCard}>
        <div style={styles.avatar}>
          {profileData.firstName[0]}{profileData.lastName[0]}
        </div>
        <div style={styles.profileInfo}>
          <h2 style={styles.profileName}>
            {profileData.firstName} {profileData.lastName}
          </h2>
          <p style={styles.profileEmail}>{profileData.email || 'No email provided'}</p>
          <p style={styles.profilePhone}>{profileData.phoneNumber}</p>
          <div style={styles.profileBadges}>
            <span style={styles.badge}>Attendee</span>
            {user?.isVerified && <span style={styles.verifiedBadge}>✓ Verified</span>}
          </div>
        </div>
        <div style={styles.profileStats}>
          <div style={styles.stat}>
            <span style={styles.statNumber}>0</span>
            <span style={styles.statLabel}>Events Attended</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNumber}>₦{(user?.walletBalance || 0).toLocaleString()}</span>
            <span style={styles.statLabel}>Wallet Balance</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{
              ...styles.tab,
              ...(activeTab === 'profile' ? styles.activeTab : {})
            }}
          >
            📝 Profile Info
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            style={{
              ...styles.tab,
              ...(activeTab === 'security' ? styles.activeTab : {})
            }}
          >
            🔒 Security
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            style={{
              ...styles.tab,
              ...(activeTab === 'preferences' ? styles.activeTab : {})
            }}
          >
            ⚙️ Preferences
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {activeTab === 'profile' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phoneNumber}
                  disabled
                  style={{...styles.input, backgroundColor: '#f9fafb', color: '#6b7280'}}
                />
                <small style={styles.helpText}>Phone number cannot be changed</small>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>State</label>
                <select
                  value={profileData.state}
                  onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                  style={styles.select}
                >
                  <option value="">Select State</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja">Abuja</option>
                  <option value="Kano">Kano</option>
                  <option value="Rivers">Rivers</option>
                  <option value="Oyo">Oyo</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Gender</label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                  style={styles.select}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Preferred Language</label>
                <select
                  value={profileData.preferredLanguage}
                  onChange={(e) => setProfileData({...profileData, preferredLanguage: e.target.value})}
                  style={styles.select}
                >
                  <option value="en">English</option>
                  <option value="ha">Hausa</option>
                  <option value="ig">Igbo</option>
                  <option value="yo">Yoruba</option>
                  <option value="pcm">Pidgin</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={handleProfileUpdate}
              disabled={saving}
              style={{
                ...styles.saveButton,
                ...(saving ? styles.saveButtonDisabled : {})
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {activeTab === 'security' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Change Password</h3>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  style={styles.input}
                />
              </div>
            </div>
            
            <button 
              onClick={handlePasswordChange}
              disabled={saving}
              style={{
                ...styles.saveButton,
                ...(saving ? styles.saveButtonDisabled : {})
              }}
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>

            <div style={styles.dangerZone}>
              <h3 style={styles.dangerTitle}>Danger Zone</h3>
              <p style={styles.dangerDescription}>
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button onClick={handleDeleteAccount} style={styles.deleteButton}>
                Delete Account
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Notification Preferences</h3>
            <div style={styles.preferencesGrid}>
              <div style={styles.preferenceGroup}>
                <h4 style={styles.preferenceTitle}>Communication</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={profileData.notifications.email}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        notifications: {...profileData.notifications, email: e.target.checked}
                      })}
                    />
                    <span>Email notifications</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={profileData.notifications.sms}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        notifications: {...profileData.notifications, sms: e.target.checked}
                      })}
                    />
                    <span>SMS notifications</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={profileData.notifications.push}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        notifications: {...profileData.notifications, push: e.target.checked}
                      })}
                    />
                    <span>Push notifications</span>
                  </label>
                </div>
              </div>

              <div style={styles.preferenceGroup}>
                <h4 style={styles.preferenceTitle}>Privacy</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={profileData.privacy.profileVisible}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        privacy: {...profileData.privacy, profileVisible: e.target.checked}
                      })}
                    />
                    <span>Make profile visible to other users</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={profileData.privacy.showAttendedEvents}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        privacy: {...profileData.privacy, showAttendedEvents: e.target.checked}
                      })}
                    />
                    <span>Show attended events on profile</span>
                  </label>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleProfileUpdate}
              disabled={saving}
              style={{
                ...styles.saveButton,
                ...(saving ? styles.saveButtonDisabled : {})
              }}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '30px',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    minWidth: '200px',
  },
  profileName: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  profileEmail: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '2px',
  },
  profilePhone: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  profileBadges: {
    display: 'flex',
    gap: '8px',
  },
  badge: {
    padding: '4px 8px',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  verifiedBadge: {
    padding: '4px 8px',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  profileStats: {
    display: 'flex',
    gap: '24px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
  },
  statNumber: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  tabsContainer: {
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '30px',
  },
  tabs: {
    display: 'flex',
    gap: '0',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    borderBottom: '2px solid transparent',
  },
  activeTab: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
  },
  tabContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '30px',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  select: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
  },
  saveButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  dangerZone: {
    marginTop: '40px',
    padding: '20px',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    backgroundColor: '#fef2f2',
  },
  dangerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: '8px',
  },
  dangerDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  deleteButton: {
    padding: '10px 20px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  preferencesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
    marginBottom: '30px',
  },
  preferenceGroup: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  preferenceTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
};