import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { DashboardSidebar, SIDEBAR_WIDTH, SIDEBAR_BREAK } from '../../components/layout/DashboardSidebar';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

export function Wallet() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < SIDEBAR_BREAK);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleAddFunds = () => {
    alert(`Adding ₦${parseInt(amount).toLocaleString()} to wallet (Mock)`);
    setShowModal(false);
    setAmount('');
  };

  if (loading || !user) {
    return (
      <div style={s.fullCenter}>
        <div style={s.spinner} />
      </div>
    );
  }

  const mainPadding = isMobile
    ? '96px 16px 60px'
    : `96px 40px 60px ${SIDEBAR_WIDTH + 40}px`;

  return (
    <div style={s.root}>
      <DashboardNavbar user={user} onLogout={handleLogout} />
      <DashboardSidebar />

      <main style={{ ...s.main, padding: mainPadding }}>

        {/* Page header */}
        <div style={s.pageHeader}>
          <div>
            <h1 style={s.pageTitle}>My Wallet</h1>
            <p style={s.pageSub}>Manage your funds and transactions</p>
          </div>
        </div>

        {/* Balance card */}
        <div style={s.balanceCard}>
          <div style={s.balanceOrb1} />
          <div style={s.balanceOrb2} />
          <div style={s.balanceInner}>
            <div style={s.balanceLeft}>
              <p style={s.balanceLabel}>Available Balance</p>
              <p style={s.balanceAmount}>₦{(user.walletBalance || 0).toLocaleString()}</p>
              <p style={s.balanceSub}>Grooovy Wallet</p>
            </div>
            <div style={s.balanceActions}>
              <ActionBtn icon="💳" label="Add Funds" onClick={() => setShowModal(true)} />
              <ActionBtn icon="📤" label="Send" onClick={() => {}} />
              <ActionBtn icon="📥" label="Request" onClick={() => {}} />
            </div>
          </div>
        </div>

        {/* Quick amounts */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Quick Add</h2>
          <div style={s.amountGrid}>
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                style={s.amountChip}
                onClick={() => { setAmount(String(amt)); setShowModal(true); }}
              >
                <span style={s.amountValue}>₦{amt.toLocaleString()}</span>
                <span style={s.amountPlus}>+</span>
              </button>
            ))}
          </div>
        </section>

        {/* Transactions */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Recent Transactions</h2>
          <div style={s.emptyCard}>
            <div style={s.emptyIconWrap}><span style={s.emptyIcon}>💳</span></div>
            <p style={s.emptyTitle}>No transactions yet</p>
            <p style={s.emptyText}>Your transaction history will appear here.</p>
          </div>
        </section>

      </main>

      {/* Add funds modal */}
      {showModal && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHead}>
              <div>
                <p style={s.modalTitle}>Add Funds</p>
                <p style={s.modalSub}>Enter the amount to top up your wallet</p>
              </div>
              <button style={s.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={s.modalBody}>
              <label style={s.inputLabel}>Amount (₦)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={s.input}
                placeholder="e.g. 5000"
                min="100"
                autoFocus
              />
              <div style={s.quickRow}>
                {QUICK_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    style={{ ...s.quickChip, ...(amount === String(a) ? s.quickChipActive : {}) }}
                    onClick={() => setAmount(String(a))}
                  >
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.modalFoot}>
              <button style={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button
                style={{ ...s.confirmBtn, ...(!amount || parseInt(amount) < 100 ? s.confirmBtnDisabled : {}) }}
                onClick={handleAddFunds}
                disabled={!amount || parseInt(amount) < 100}
              >
                Add ₦{amount ? parseInt(amount).toLocaleString() : '0'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button style={s.balanceActionBtn} onClick={onClick}>
      <span style={s.balanceActionIcon}>{icon}</span>
      <span style={s.balanceActionLabel}>{label}</span>
    </button>
  );
}

const s = {
  root: { minHeight: '100vh', backgroundColor: '#f5f6fa', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },
  main: { maxWidth: '1100px' },
  fullCenter: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f6fa' },
  spinner: { width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

  pageHeader: { marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 4px' },
  pageSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  // Balance card
  balanceCard: { position: 'relative' as const, background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 60%,#4c1d95 100%)', borderRadius: '20px', marginBottom: '24px', overflow: 'hidden' },
  balanceOrb1: { position: 'absolute' as const, width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(167,139,250,0.15)', top: '-60px', right: '-40px', pointerEvents: 'none' as const },
  balanceOrb2: { position: 'absolute' as const, width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', bottom: '-50px', left: '30%', pointerEvents: 'none' as const },
  balanceInner: { position: 'relative' as const, zIndex: 1, padding: '32px 36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' as const },
  balanceLeft: { flex: 1, minWidth: 0 },
  balanceLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.55)', margin: '0 0 8px', fontWeight: '500' },
  balanceAmount: { fontSize: '40px', fontWeight: '800', color: '#fff', margin: '0 0 6px', lineHeight: 1 },
  balanceSub: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0 },
  balanceActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' as const },
  balanceActionBtn: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '6px', padding: '12px 18px', backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'all 0.18s ease', minWidth: '72px' },
  balanceActionIcon: { fontSize: '20px', lineHeight: 1 },
  balanceActionLabel: { fontSize: '11.5px', fontWeight: '600', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' as const },

  // Sections
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 12px' },

  amountGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '10px' },
  amountChip: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', backgroundColor: '#fff', border: '1px solid #f1f3f5', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.18s ease' },
  amountValue: { fontSize: '15px', fontWeight: '700', color: '#111827' },
  amountPlus: { fontSize: '18px', fontWeight: '700', color: '#667eea' },

  emptyCard: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '52px 32px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px' },
  emptyIconWrap: { width: '72px', height: '72px', borderRadius: '20px', backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' },
  emptyIcon: { fontSize: '32px', lineHeight: 1 },
  emptyTitle: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 },
  emptyText: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  // Modal
  overlay: { position: 'fixed' as const, inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modal: { backgroundColor: '#fff', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' },
  modalHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid #f1f3f5' },
  modalTitle: { fontSize: '17px', fontWeight: '700', color: '#111827', margin: '0 0 4px' },
  modalSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },
  modalClose: { width: '30px', height: '30px', border: 'none', backgroundColor: '#f3f4f6', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280', flexShrink: 0 },
  modalBody: { padding: '24px' },
  inputLabel: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
  input: { width: '100%', padding: '12px 14px', fontSize: '16px', fontWeight: '600', border: '2px solid #e5e7eb', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' as const, color: '#111827', marginBottom: '16px', transition: 'border-color 0.15s ease' },
  quickRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  quickChip: { padding: '6px 14px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '20px', cursor: 'pointer', color: '#374151', transition: 'all 0.15s ease' },
  quickChipActive: { backgroundColor: '#eef2ff', borderColor: '#667eea', color: '#4f46e5' },
  modalFoot: { display: 'flex', gap: '10px', padding: '16px 24px', borderTop: '1px solid #f1f3f5' },
  cancelBtn: { flex: 1, padding: '12px', fontSize: '14px', fontWeight: '600', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: '12px', fontSize: '14px', fontWeight: '600', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' },
  confirmBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },
};
