import { useState } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router';
import { PremiumStatus } from '../../components/premium/PremiumStatus';

export function OrganizerSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'premium'>('profile');
  const [saving, setSaving] = useState(false);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    organizationName: user?.organizationName || '',
    organizationType: user?.organizationType || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    state: user?.state || ''
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    ticketSales: true,
    attendeeMessages: true
  });

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      if (!supabase || !user) {
        alert('Unable to update profile. Please try again.');
        return;
      }

      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          organization_name: profileData.organizationName,
          organization_type: profileData.organizationType,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          state: profileData.state
        }
      });

      if (error) {
        console.error('Error updating profile:', error);
        alert(`Failed to update profile: ${error.message}`);
      } else {
        alert('Profile updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
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
    try {
      const { supabase } = await import('../../lib/supabase');
      
      if (!supabase) {
        alert('Unable to change password. Please try again.');
        return;
      }

      // Update password in Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Error changing password:', error);
        alert(`Failed to change password: ${error.message}`);
      } else {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Password changed successfully!');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(`Failed to change password: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setSaving(true);
    try {
      const { supabase } = await import('../../lib/supabase');
      
      if (!supabase || !user) {
        alert('Unable to update notification settings. Please try again.');
        return;
      }

      // Update notification settings in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          notification_settings: notificationSettings
        }
      });

      if (error) {
        console.error('Error updating notifications:', error);
        alert(`Failed to update notification settings: ${error.message}`);
      } else {
        alert('Notification settings updated successfully!');
      }
    } catch (error: any) {
      console.error('Error updating notifications:', error);
      alert(`Failed to update notification settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteVerification = () => {
    alert('Verification process:\n\n1. Submit business documents\n2. Verify contact information\n3. Wait for admin approval\n\nThis feature will be fully implemented soon!');
  };

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Grooovy</h1>
        <div style={styles.userMenu}>
          <span style={styles.userName}>{user?.organizationName || user?.firstName}</span>
          <button onClick={() => signOut()} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.layout}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <nav style={styles.nav}>
            <NavItem icon="📊" label="Dashboard" onClick={() => navigate('/organizer/dashboard')} />
            <NavItem icon="🎉" label="My Events" onClick={() => navigate('/organizer/events')} />
            <NavItem icon="➕" label="Create Event" onClick={() => navigate('/organizer/create-event')} />
            <NavItem icon="👥" label="Attendees" onClick={() => navigate('/organizer/attendees')} />
            <NavItem icon="💰" label="Financials" onClick={() => navigate('/organizer/financials')} />
            <NavItem icon="📢" label="Broadcast" onClick={() => navigate('/organizer/broadcast')} />
            <NavItem icon="📱" label="Scanner" onClick={() => navigate('/organizer/scanner')} />
            <NavItem icon="⚙️" label="Settings" active />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Settings</h2>
              <p style={styles.pageSubtitle}>
                Manage your account and organization settings
              </p>
            </div>
          </div>

          <div style={styles.content}>
            {/* Tabs */}
            <div style={styles.tabsContainer}>
              <button 
                onClick={() => setActiveTab('profile')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'profile' ? styles.activeTab : {})
                }}
              >
                📝 Profile
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
                onClick={() => setActiveTab('notifications')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'notifications' ? styles.activeTab : {})
                }}
              >
                🔔 Notifications
              </button>
              <button 
                onClick={() => setActiveTab('premium')}
                style={{
                  ...styles.tab,
                  ...(activeTab === 'premium' ? styles.activeTab : {})
                }}
              >
                ✨ Premium
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div style={styles.settingsSection}>
                <h3 style={styles.sectionTitle}>Organization Information</h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Organization Name</label>
                    <input
                      type="text"
                      value={profileData.organizationName}
                      onChange={(e) => setProfileData({...profileData, organizationName: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Organization Type</label>
                    <input
                      type="text"
                      value={profileData.organizationType}
                      onChange={(e) => setProfileData({...profileData, organizationType: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contact First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contact Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      style={{...styles.input, backgroundColor: '#f9fafb', color: '#6b7280'}}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>State</label>
                    <select
                      value={profileData.state}
                      onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                      style={styles.input}
                    >
                      <option value="">Select State</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Kano">Kano</option>
                      <option value="Rivers">Rivers</option>
                      <option value="Oyo">Oyo</option>
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

                <div style={{marginTop: '32px'}}>
                  <h3 style={styles.sectionTitle}>Account Verification</h3>
                  <div style={styles.verificationCard}>
                    <div style={styles.verificationIcon}>
                      {user?.isVerified ? '✅' : '⏳'}
                    </div>
                    <div style={styles.verificationContent}>
                      <h4 style={styles.verificationTitle}>
                        {user?.isVerified ? 'Account Verified' : 'Verification Pending'}
                      </h4>
                      <p style={styles.verificationText}>
                        {user?.isVerified 
                          ? 'Your account has been verified and you have full access to all features.'
                          : 'Complete the verification process to unlock all organizer features.'}
                      </p>
                      {!user?.isVerified && (
                        <button onClick={handleCompleteVerification} style={styles.verifyButton}>
                          Complete Verification
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div style={styles.settingsSection}>
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
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div style={styles.settingsSection}>
                <h3 style={styles.sectionTitle}>Notification Preferences</h3>
                <div style={styles.notificationGrid}>
                  <div style={styles.notificationGroup}>
                    <h4 style={styles.notificationGroupTitle}>Communication Channels</h4>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                      />
                      <span>Email Notifications</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                      />
                      <span>SMS Notifications</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                      />
                      <span>Push Notifications</span>
                    </label>
                  </div>
                  <div style={styles.notificationGroup}>
                    <h4 style={styles.notificationGroupTitle}>Event Notifications</h4>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.eventReminders}
                        onChange={(e) => setNotificationSettings({...notificationSettings, eventReminders: e.target.checked})}
                      />
                      <span>Event Reminders</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.ticketSales}
                        onChange={(e) => setNotificationSettings({...notificationSettings, ticketSales: e.target.checked})}
                      />
                      <span>Ticket Sales Updates</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.attendeeMessages}
                        onChange={(e) => setNotificationSettings({...notificationSettings, attendeeMessages: e.target.checked})}
                      />
                      <span>Attendee Messages</span>
                    </label>
                  </div>
                </div>
                <button 
                  onClick={handleNotificationUpdate}
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

            {/* Premium Tab */}
            {activeTab === 'premium' && (
              <div style={styles.settingsSection}>
                <h3 style={styles.sectionTitle}>Premium Membership</h3>
                <PremiumStatus showUpgradeButton={true} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      style={{
        ...styles.navItem,
        ...(active ? styles.navItemActive : {}),
      }}
      onClick={onClick}
    >
      <span style={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#667eea',
    margin: 0,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151',
  },
  layout: {
    display: 'flex',
  },
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e5e7eb',
    minHeight: 'calc(100vh - 65px)',
    padding: '24px 0',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    padding: '0 12px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#6b7280',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  navItemActive: {
    backgroundColor: '#f5f7ff',
    color: '#667eea',
    fontWeight: '500',
  },
  navIcon: {
    fontSize: '18px',
  },
  main: {
    flex: 1,
    padding: '32px',
    maxWidth: '1200px',
  },
  titleRow: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '24px',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid' as const,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    color: '#667eea',
    borderBottomColor: '#667eea',
  },
  settingsSection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
    marginBottom: '24px',
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
  saveButton: {
    padding: '12px 24px',
    backgroundColor: '#667eea',
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
  verificationCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  verificationIcon: {
    fontSize: '32px',
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  verificationText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  verifyButton: {
    padding: '8px 16px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  notificationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  notificationGroup: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  notificationGroupTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    marginBottom: '8px',
  },
};
