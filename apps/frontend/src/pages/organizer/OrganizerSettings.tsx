import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { OrganizerSidebar, ORG_SIDEBAR_WIDTH, ORG_SIDEBAR_BREAK } from '../../components/layout/OrganizerSidebar';

export function OrganizerSettings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < ORG_SIDEBAR_BREAK);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < ORG_SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };
  const mainPadding = isMobile ? '96px 16px 60px' : `96px 40px 60px ${ORG_SIDEBAR_WIDTH + 40}px`;

  const infoRows = [
    { label: 'Organization Name',  value: user?.organizationName  || 'Not set' },
    { label: 'Organization Type',  value: user?.organizationType  || 'Not set' },
    { label: 'Contact Name',       value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set' },
    { label: 'Phone Number',       value: user?.phoneNumber       || 'Not set' },
    { label: 'Email',              value: user?.email             || 'Not set' },
    { label: 'State',              value: user?.state             || 'Not set' },
    { label: 'Account Status',     value: user?.isVerified ? 'Verified' : 'Pending Verification' },
    { label: 'Member Since',       value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown' },
  ];

  const actions = [
    { label: 'Edit Profile',             fn: () => alert('Profile editing will be implemented soon!') },
    { label: 'Complete Verification',    fn: () => alert('Verification process will be implemented soon!') },
    { label: 'Change Password',          fn: () => alert('Password change will be implemented soon!') },
    { label: 'Notification Settings',    fn: () => alert('Notification settings will be implemented soon!') },
  ];

  return (
    <div style={s.root}>
      <DashboardNavbar user={user!} onLogout={handleLogout} />
      <OrganizerSidebar />
      <main style={{ ...s.main, padding: mainPadding }}>

        <div style={s.titleRow}>
          <div>
            <h2 style={s.pageTitle}>Settings</h2>
            <p style={s.pageSubtitle}>Manage your account and organization settings</p>
          </div>
        </div>

        <div style={s.sections}>

          {/* Account info */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Account Information</h3>
            <div style={s.infoGrid}>
              {infoRows.map((r) => (
                <div key={r.label} style={s.infoItem}>
                  <span style={s.infoLabel}>{r.label}</span>
                  <span style={s.infoValue}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Quick Actions</h3>
            <div style={s.actionsGrid}>
              {actions.map((a) => (
                <button key={a.label} style={s.actionBtn} onClick={a.fn}>{a.label}</button>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1200px' },
  titleRow: { marginBottom: '28px' },
  pageTitle: { fontSize: '26px', fontWeight: '800', color: '#111827', margin: '0 0 4px' },
  pageSubtitle: { fontSize: '14px', color: '#9ca3af', margin: 0 },
  sections: { display: 'flex', flexDirection: 'column' as const, gap: '24px' },
  card: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '28px 32px' },
  sectionTitle: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: '0 0 20px' },
  infoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px' },
  infoItem: { display: 'flex', flexDirection: 'column' as const, gap: '3px' },
  infoLabel: { fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  infoValue: { fontSize: '14px', fontWeight: '600', color: '#111827' },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' },
  actionBtn: { padding: '12px 16px', fontSize: '14px', fontWeight: '600', backgroundColor: '#f5f6fa', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s ease' },
};
