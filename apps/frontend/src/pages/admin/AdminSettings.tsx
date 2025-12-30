import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  phoneVerificationRequired: boolean;
  maxFileUploadSize: number;
  sessionTimeout: number;
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  twoFactorAuthRequired: boolean;
  maxLoginAttempts: number;
  accountLockoutDuration: number;
}

interface PaymentSettings {
  paystackEnabled: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  flutterwaveEnabled: boolean;
  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
  commissionRate: number;
  minimumPayout: number;
  payoutSchedule: 'daily' | 'weekly' | 'monthly';
}

interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  adminEmailAlerts: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'system' | 'payment' | 'notifications'>('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'Tikit',
    siteDescription: 'Nigeria\'s Premier Event Ticketing Platform',
    contactEmail: 'support@tikit.com',
    supportPhone: '+234-800-TIKIT-01',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: false,
    phoneVerificationRequired: true,
    maxFileUploadSize: 10,
    sessionTimeout: 24,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    twoFactorAuthRequired: false,
    maxLoginAttempts: 5,
    accountLockoutDuration: 30
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    paystackEnabled: true,
    paystackPublicKey: 'pk_test_xxxxx',
    paystackSecretKey: '••••••••••••••••',
    flutterwaveEnabled: false,
    flutterwavePublicKey: '',
    flutterwaveSecretKey: '',
    commissionRate: 5,
    minimumPayout: 10000,
    payoutSchedule: 'weekly'
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    adminEmailAlerts: true,
    securityAlerts: true,
    marketingEmails: false
  });

  useEffect(() => {
    // Simulate loading settings
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 1500);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <button onClick={() => navigate('/admin/dashboard')} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>⚙️ Admin Settings</h1>
        </div>
        
        <button 
          onClick={handleSaveSettings}
          disabled={saving}
          style={{
            ...styles.saveButton,
            ...(saving ? styles.saveButtonDisabled : {})
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('system')}
            style={{
              ...styles.tab,
              ...(activeTab === 'system' ? styles.activeTab : {})
            }}
          >
            🖥️ System
          </button>
          <button 
            onClick={() => setActiveTab('payment')}
            style={{
              ...styles.tab,
              ...(activeTab === 'payment' ? styles.activeTab : {})
            }}
          >
            💳 Payment
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
        </div>
      </div>

      <div style={styles.content}>
        {activeTab === 'system' && (
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>System Configuration</h3>
            
            <div style={styles.settingsGrid}>
              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>Site Information</h4>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Site Name</label>
                  <input
                    type="text"
                    value={systemSettings.siteName}
                    onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Site Description</label>
                  <textarea
                    value={systemSettings.siteDescription}
                    onChange={(e) => setSystemSettings({...systemSettings, siteDescription: e.target.value})}
                    style={styles.textarea}
                    rows={3}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Contact Email</label>
                  <input
                    type="email"
                    value={systemSettings.contactEmail}
                    onChange={(e) => setSystemSettings({...systemSettings, contactEmail: e.target.value})}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Support Phone</label>
                  <input
                    type="tel"
                    value={systemSettings.supportPhone}
                    onChange={(e) => setSystemSettings({...systemSettings, supportPhone: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>User Registration</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={systemSettings.registrationEnabled}
                      onChange={(e) => setSystemSettings({...systemSettings, registrationEnabled: e.target.checked})}
                    />
                    <span>Enable user registration</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={systemSettings.emailVerificationRequired}
                      onChange={(e) => setSystemSettings({...systemSettings, emailVerificationRequired: e.target.checked})}
                    />
                    <span>Require email verification</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={systemSettings.phoneVerificationRequired}
                      onChange={(e) => setSystemSettings({...systemSettings, phoneVerificationRequired: e.target.checked})}
                    />
                    <span>Require phone verification</span>
                  </label>
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>Security Settings</h4>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Password minimum length</label>
                  <input
                    type="number"
                    value={systemSettings.passwordMinLength}
                    onChange={(e) => setSystemSettings({...systemSettings, passwordMinLength: parseInt(e.target.value)})}
                    style={styles.input}
                    min="6"
                    max="20"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max login attempts</label>
                  <input
                    type="number"
                    value={systemSettings.maxLoginAttempts}
                    onChange={(e) => setSystemSettings({...systemSettings, maxLoginAttempts: parseInt(e.target.value)})}
                    style={styles.input}
                    min="3"
                    max="10"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Account lockout duration (minutes)</label>
                  <input
                    type="number"
                    value={systemSettings.accountLockoutDuration}
                    onChange={(e) => setSystemSettings({...systemSettings, accountLockoutDuration: parseInt(e.target.value)})}
                    style={styles.input}
                    min="5"
                    max="1440"
                  />
                </div>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={systemSettings.passwordRequireSpecialChars}
                      onChange={(e) => setSystemSettings({...systemSettings, passwordRequireSpecialChars: e.target.checked})}
                    />
                    <span>Require special characters in passwords</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={systemSettings.twoFactorAuthRequired}
                      onChange={(e) => setSystemSettings({...systemSettings, twoFactorAuthRequired: e.target.checked})}
                    />
                    <span>Require two-factor authentication</span>
                  </label>
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>System Maintenance</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                    />
                    <span>Enable maintenance mode</span>
                  </label>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Session timeout (hours)</label>
                  <input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                    style={styles.input}
                    min="1"
                    max="168"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max file upload size (MB)</label>
                  <input
                    type="number"
                    value={systemSettings.maxFileUploadSize}
                    onChange={(e) => setSystemSettings({...systemSettings, maxFileUploadSize: parseInt(e.target.value)})}
                    style={styles.input}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Payment Configuration</h3>
            
            <div style={styles.settingsGrid}>
              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>Paystack Integration</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={paymentSettings.paystackEnabled}
                      onChange={(e) => setPaymentSettings({...paymentSettings, paystackEnabled: e.target.checked})}
                    />
                    <span>Enable Paystack payments</span>
                  </label>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Public Key</label>
                  <input
                    type="text"
                    value={paymentSettings.paystackPublicKey}
                    onChange={(e) => setPaymentSettings({...paymentSettings, paystackPublicKey: e.target.value})}
                    style={styles.input}
                    placeholder="pk_test_xxxxx"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Secret Key</label>
                  <input
                    type="password"
                    value={paymentSettings.paystackSecretKey}
                    onChange={(e) => setPaymentSettings({...paymentSettings, paystackSecretKey: e.target.value})}
                    style={styles.input}
                    placeholder="sk_test_xxxxx"
                  />
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>Flutterwave Integration</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={paymentSettings.flutterwaveEnabled}
                      onChange={(e) => setPaymentSettings({...paymentSettings, flutterwaveEnabled: e.target.checked})}
                    />
                    <span>Enable Flutterwave payments</span>
                  </label>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Public Key</label>
                  <input
                    type="text"
                    value={paymentSettings.flutterwavePublicKey}
                    onChange={(e) => setPaymentSettings({...paymentSettings, flutterwavePublicKey: e.target.value})}
                    style={styles.input}
                    placeholder="FLWPUBK_TEST-xxxxx"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Secret Key</label>
                  <input
                    type="password"
                    value={paymentSettings.flutterwaveSecretKey}
                    onChange={(e) => setPaymentSettings({...paymentSettings, flutterwaveSecretKey: e.target.value})}
                    style={styles.input}
                    placeholder="FLWSECK_TEST-xxxxx"
                  />
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>Commission & Payouts</h4>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Commission rate (%)</label>
                  <input
                    type="number"
                    value={paymentSettings.commissionRate}
                    onChange={(e) => setPaymentSettings({...paymentSettings, commissionRate: parseFloat(e.target.value)})}
                    style={styles.input}
                    min="0"
                    max="20"
                    step="0.1"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Minimum payout (₦)</label>
                  <input
                    type="number"
                    value={paymentSettings.minimumPayout}
                    onChange={(e) => setPaymentSettings({...paymentSettings, minimumPayout: parseInt(e.target.value)})}
                    style={styles.input}
                    min="1000"
                    step="1000"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payout schedule</label>
                  <select
                    value={paymentSettings.payoutSchedule}
                    onChange={(e) => setPaymentSettings({...paymentSettings, payoutSchedule: e.target.value as any})}
                    style={styles.select}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Notification Settings</h3>
            
            <div style={styles.settingsGrid}>
              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>General Notifications</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotificationsEnabled}
                      onChange={(e) => setNotificationSettings({...notificationSettings, emailNotificationsEnabled: e.target.checked})}
                    />
                    <span>Enable email notifications</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotificationsEnabled}
                      onChange={(e) => setNotificationSettings({...notificationSettings, smsNotificationsEnabled: e.target.checked})}
                    />
                    <span>Enable SMS notifications</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotificationsEnabled}
                      onChange={(e) => setNotificationSettings({...notificationSettings, pushNotificationsEnabled: e.target.checked})}
                    />
                    <span>Enable push notifications</span>
                  </label>
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>Admin Alerts</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.adminEmailAlerts}
                      onChange={(e) => setNotificationSettings({...notificationSettings, adminEmailAlerts: e.target.checked})}
                    />
                    <span>Admin email alerts</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.securityAlerts}
                      onChange={(e) => setNotificationSettings({...notificationSettings, securityAlerts: e.target.checked})}
                    />
                    <span>Security alerts</span>
                  </label>
                </div>
              </div>

              <div style={styles.settingGroup}>
                <h4 style={styles.groupTitle}>Marketing</h4>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.marketingEmails}
                      onChange={(e) => setNotificationSettings({...notificationSettings, marketingEmails: e.target.checked})}
                    />
                    <span>Marketing emails</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
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
  saveButton: {
    padding: '12px 24px',
    backgroundColor: '#16a34a',
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
  content: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '30px',
  },
  settingsSection: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '24px',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px',
  },
  settingGroup: {
    padding: '20px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  groupTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    resize: 'vertical' as const,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
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