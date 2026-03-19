import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { DashboardSidebar, SIDEBAR_WIDTH, SIDEBAR_BREAK } from '../../components/layout/DashboardSidebar';

type Tab = 'profile' | 'security' | 'preferences';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  state: string;
  dateOfBirth: string;
  gender: string;
  preferredLanguage: string;
  notifications: { email: boolean; sms: boolean; push: boolean };
  privacy: { profileVisible: boolean; showAttendedEvents: boolean };
}

export function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < SIDEBAR_BREAK);
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        state: user.state || '',
        dateOfBirth: '',
        gender: '',
        preferredLanguage: 'en',
        notifications: { email: true, sms: true, push: true },
        privacy: { profileVisible: true, showAttendedEvents: false },
      });
    }
  }, [user]);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); alert('Saved!'); }, 1200);
  };

  const handlePasswordChange = () => {
    if (passwords.next !== passwords.confirm) return alert('Passwords do not match');
    if (passwords.next.length < 6) return alert('Password must be at least 6 characters');
    setSaving(true);
    setTimeout(() => { setSaving(false); setPasswords({ current: '', next: '', confirm: '' }); alert('Password changed!'); }, 1200);
  };

  if (!profileData) {
    return (
      <div style={s.fullCenter}>
        <div style={s.spinner} />
      </div>
    );
  }

  const initials = `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase();
  const mainPadding = isMobile
    ? '96px 16px 60px'
    : `96px 40px 60px ${SIDEBAR_WIDTH + 40}px`;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile Info' },
    { key: 'security', label: 'Security' },
    { key: 'preferences', label: 'Preferences' },
  ];

  return (
    <div style={s.root}>
      <DashboardNavbar user={user!} onLogout={handleLogout} />
      <DashboardSidebar />

      <main style={{ ...s.main, padding: mainPadding }}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>My Profile</h1>
          <p style={s.pageSub}>Manage your personal information and preferences</p>
        </div>

        {/* Profile summary card */}
        <div style={s.summaryCard}>
          <div style={s.avatarCircle}>{initials || '??'}</div>
          <div style={s.summaryInfo}>
            <h2 style={s.summaryName}>{profileData.firstName} {profileData.lastName}</h2>
            <p style={s.summaryMeta}>{profileData.email || profileData.phoneNumber}</p>
            <div style={s.summaryBadges}>
              <span style={s.roleBadge}>Attendee</span>
              {user?.isVerified && <span style={s.verifiedBadge}>✓ Verified</span>}
            </div>
          </div>
          <div style={s.summaryStats}>
            <div style={s.summaryStat}>
              <span style={s.summaryStatVal}>0</span>
              <span style={s.summaryStatLabel}>Events</span>
            </div>
            <div style={s.summaryStatDivider} />
            <div style={s.summaryStat}>
              <span style={s.summaryStatVal}>₦{(user?.walletBalance || 0).toLocaleString()}</span>
              <span style={s.summaryStatLabel}>Wallet</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          {TABS.map((t) => (
            <button
              key={t.key}
              style={{ ...s.tab, ...(activeTab === t.key ? s.tabActive : {}) }}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
              {activeTab === t.key && <span style={s.tabUnderline} />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={s.tabContent}>
          {activeTab === 'profile' && (
            <>
              <div style={s.formGrid}>
                <Field label="First Name">
                  <input style={s.input} value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} />
                </Field>
                <Field label="Last Name">
                  <input style={s.input} value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} />
                </Field>
                <Field label="Email Address">
                  <input style={s.input} type="email" value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
                </Field>
                <Field label="Phone Number" hint="Cannot be changed">
                  <input style={{ ...s.input, ...s.inputDisabled }} value={profileData.phoneNumber} disabled />
                </Field>
                <Field label="State">
                  <select style={s.select} value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}>
                    <option value="">Select state</option>
                    {['Lagos','Abuja','Kano','Rivers','Oyo','Enugu','Delta','Anambra','Kaduna','Imo'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date of Birth">
                  <input style={s.input} type="date" value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })} />
                </Field>
                <Field label="Gender">
                  <select style={s.select} value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </Field>
                <Field label="Preferred Language">
                  <select style={s.select} value={profileData.preferredLanguage}
                    onChange={(e) => setProfileData({ ...profileData, preferredLanguage: e.target.value })}>
                    <option value="en">English</option>
                    <option value="ha">Hausa</option>
                    <option value="ig">Igbo</option>
                    <option value="yo">Yoruba</option>
                    <option value="pcm">Pidgin</option>
                  </select>
                </Field>
              </div>
              <SaveButton saving={saving} label="Save Changes" onClick={handleSave} />
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h3 style={s.sectionTitle}>Change Password</h3>
              <div style={{ ...s.formGrid, maxWidth: '560px' }}>
                <Field label="Current Password">
                  <input style={s.input} type="password" value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" />
                </Field>
                <Field label="New Password">
                  <input style={s.input} type="password" value={passwords.next}
                    onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} placeholder="••••••••" />
                </Field>
                <Field label="Confirm New Password">
                  <input style={s.input} type="password" value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="••••••••" />
                </Field>
              </div>
              <SaveButton saving={saving} label="Change Password" onClick={handlePasswordChange} />

              <div style={s.dangerZone}>
                <p style={s.dangerTitle}>Danger Zone</p>
                <p style={s.dangerText}>Deleting your account is permanent and cannot be undone.</p>
                <button
                  style={s.deleteBtn}
                  onClick={() => window.confirm('Are you sure? This cannot be undone.') && alert('Deletion request submitted.')}
                >
                  Delete Account
                </button>
              </div>
            </>
          )}

          {activeTab === 'preferences' && (
            <>
              <div style={s.prefGrid}>
                <div style={s.prefCard}>
                  <h3 style={s.prefTitle}>Notifications</h3>
                  {[
                    { key: 'email', label: 'Email notifications' },
                    { key: 'sms',   label: 'SMS notifications' },
                    { key: 'push',  label: 'Push notifications' },
                  ].map(({ key, label }) => (
                    <Toggle
                      key={key}
                      label={label}
                      checked={profileData.notifications[key as keyof typeof profileData.notifications]}
                      onChange={(v) => setProfileData({ ...profileData, notifications: { ...profileData.notifications, [key]: v } })}
                    />
                  ))}
                </div>
                <div style={s.prefCard}>
                  <h3 style={s.prefTitle}>Privacy</h3>
                  <Toggle
                    label="Make profile visible to others"
                    checked={profileData.privacy.profileVisible}
                    onChange={(v) => setProfileData({ ...profileData, privacy: { ...profileData.privacy, profileVisible: v } })}
                  />
                  <Toggle
                    label="Show attended events on profile"
                    checked={profileData.privacy.showAttendedEvents}
                    onChange={(v) => setProfileData({ ...profileData, privacy: { ...profileData.privacy, showAttendedEvents: v } })}
                  />
                </div>
              </div>
              <SaveButton saving={saving} label="Save Preferences" onClick={handleSave} />
            </>
          )}
        </div>

      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.fieldLabel}>{label}</label>
      {children}
      {hint && <span style={s.fieldHint}>{hint}</span>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={s.toggleRow}>
      <span style={s.toggleLabel}>{label}</span>
      <button
        style={{ ...s.toggleBtn, ...(checked ? s.toggleBtnOn : {}) }}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
        <span style={{ ...s.toggleKnob, ...(checked ? s.toggleKnobOn : {}) }} />
      </button>
    </div>
  );
}

function SaveButton({ saving, label, onClick }: { saving: boolean; label: string; onClick: () => void }) {
  return (
    <button
      style={{ ...s.saveBtn, ...(saving ? s.saveBtnDisabled : {}) }}
      onClick={onClick}
      disabled={saving}
    >
      {saving ? 'Saving…' : label}
    </button>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1100px' },
  fullCenter: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f6fa' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 4px' },
  pageSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  // Summary card
  summaryCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' as const },
  avatarCircle: { width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', flexShrink: 0 },
  summaryInfo: { flex: 1, minWidth: '160px' },
  summaryName: { fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 4px' },
  summaryMeta: { fontSize: '13px', color: '#6b7280', margin: '0 0 10px' },
  summaryBadges: { display: 'flex', gap: '8px' },
  roleBadge: { padding: '3px 10px', fontSize: '11px', fontWeight: '700', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '20px', border: '1px solid #c7d2fe' },
  verifiedBadge: { padding: '3px 10px', fontSize: '11px', fontWeight: '700', backgroundColor: '#ecfdf5', color: '#059669', borderRadius: '20px', border: '1px solid #a7f3d0' },
  summaryStats: { display: 'flex', alignItems: 'center', gap: '16px' },
  summaryStat: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '2px' },
  summaryStatVal: { fontSize: '18px', fontWeight: '800', color: '#111827' },
  summaryStatLabel: { fontSize: '11px', color: '#9ca3af', fontWeight: '500' },
  summaryStatDivider: { width: '1px', height: '32px', backgroundColor: '#f1f3f5' },

  // Tabs
  tabRow: { display: 'flex', gap: '0', borderBottom: '1px solid #f1f3f5', marginBottom: '24px', overflowX: 'auto' as const },
  tab: { position: 'relative' as const, padding: '12px 20px', fontSize: '14px', fontWeight: '500', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const, transition: 'color 0.15s ease' },
  tabActive: { color: '#4f46e5', fontWeight: '700' },
  tabUnderline: { position: 'absolute' as const, bottom: '-1px', left: 0, right: 0, height: '2px', backgroundColor: '#4f46e5', borderRadius: '2px 2px 0 0' },

  // Tab content
  tabContent: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '28px' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: '0 0 20px' },

  // Form
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '18px', marginBottom: '24px' },
  fieldGroup: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  fieldLabel: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  fieldHint: { fontSize: '11px', color: '#9ca3af' },
  input: { padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', backgroundColor: '#fff', transition: 'border-color 0.15s ease' },
  inputDisabled: { backgroundColor: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' },
  select: { padding: '11px 14px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', backgroundColor: '#fff', cursor: 'pointer' },
  saveBtn: { padding: '12px 28px', fontSize: '14px', fontWeight: '600', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' },
  saveBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' },

  // Danger zone
  dangerZone: { marginTop: '32px', padding: '20px', border: '1px solid #fecaca', borderRadius: '16px', backgroundColor: '#fff5f5' },
  dangerTitle: { fontSize: '15px', fontWeight: '700', color: '#dc2626', margin: '0 0 6px' },
  dangerText: { fontSize: '13px', color: '#6b7280', margin: '0 0 16px' },
  deleteBtn: { padding: '10px 20px', fontSize: '13px', fontWeight: '600', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer' },

  // Preferences
  prefGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '16px', marginBottom: '24px' },
  prefCard: { padding: '20px', border: '1px solid #f1f3f5', borderRadius: '16px', backgroundColor: '#fafafa' },
  prefTitle: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 16px' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f3f5' },
  toggleLabel: { fontSize: '13px', color: '#374151', fontWeight: '500' },
  toggleBtn: { width: '42px', height: '24px', borderRadius: '12px', border: 'none', backgroundColor: '#d1d5db', cursor: 'pointer', position: 'relative' as const, flexShrink: 0, transition: 'background 0.2s ease' },
  toggleBtnOn: { backgroundColor: '#4f46e5' },
  toggleKnob: { position: 'absolute' as const, top: '3px', left: '3px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s ease' },
  toggleKnobOn: { transform: 'translateX(18px)' },
};
