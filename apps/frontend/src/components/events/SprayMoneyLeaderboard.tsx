import React, { useState } from 'react';
import { useSprayMoneyLeaderboard } from '../../hooks/useSprayMoneyLeaderboard';

interface SprayMoneyLeaderboardProps {
  eventId: string;
  onSprayMoney: (amount: number, message: string) => void;
  isOnline?: boolean;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];
const MEDALS = ['🥇', '🥈', '🥉'];

export function SprayMoneyLeaderboard({ eventId, onSprayMoney, isOnline = false }: SprayMoneyLeaderboardProps) {
  const { leaderboard, loading, error } = useSprayMoneyLeaderboard(eventId);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSpray = leaderboard.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(amount);
    if (!num || num < 100) { alert('Minimum spray amount is ₦100'); return; }
    if (num > 1000000) { alert('Maximum spray amount is ₦1,000,000'); return; }

    setIsSubmitting(true);
    try {
      await onSprayMoney(num, message);
      setAmount('');
      setMessage('');
      setShowForm(false);
    } catch (err) {
      console.error('Error spraying money:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={s.centerState}>
        <div style={s.spinner} />
        <p style={s.centerText}>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={s.errorBox}>
        <p style={{ margin: 0 }}>Error loading leaderboard: {error}</p>
      </div>
    );
  }

  return (
    <div style={s.root}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.titleRow}>
          <p style={s.title}>💰 Spray Money</p>
          {isOnline && (
            <span style={s.liveBadge}>
              <span style={s.liveDot} />
              LIVE
            </span>
          )}
        </div>
        <p style={s.headerSub}>Show your love and support! Contributions appear live.</p>
      </div>

      {/* Total card */}
      <div style={s.totalCard}>
        <div style={s.totalOrb} />
        <div style={s.totalInner}>
          <p style={s.totalLabel}>Total Sprayed</p>
          <p style={s.totalAmount}>₦{totalSpray.toLocaleString()}</p>
          <p style={s.totalCount}>{leaderboard.length} contributor{leaderboard.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Spray button / form */}
      {!showForm ? (
        <button style={s.sprayBtn} onClick={() => setShowForm(true)}>
          💸 Spray Money
        </button>
      ) : (
        <form onSubmit={handleSubmit} style={s.form}>
          <p style={s.formTitle}>Spray Money</p>

          <div style={s.quickAmountsRow}>
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(String(a))}
                style={{ ...s.quickChip, ...(amount === String(a) ? s.quickChipActive : {}) }}
              >
                ₦{a.toLocaleString()}
              </button>
            ))}
          </div>

          <div style={s.formField}>
            <label style={s.formLabel}>Amount (₦)</label>
            <input
              type="number"
              min="100"
              max="1000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={s.input}
              required
            />
          </div>

          <div style={s.formField}>
            <label style={s.formLabel}>Message <span style={s.optionalTag}>(optional)</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Congratulations! Wishing you both happiness..."
              maxLength={200}
              style={s.textarea}
            />
            <p style={s.charCount}>{message.length}/200</p>
          </div>

          <div style={s.formActions}>
            <button type="button" onClick={() => setShowForm(false)} style={s.cancelBtn} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amount}
              style={{ ...s.submitBtn, ...(isSubmitting || !amount ? s.submitBtnDisabled : {}) }}
            >
              {isSubmitting ? 'Processing...' : `Spray ₦${parseInt(amount || '0').toLocaleString()}`}
            </button>
          </div>
        </form>
      )}

      {/* Leaderboard */}
      <div>
        <p style={s.sectionTitle}>Top Contributors</p>
        {leaderboard.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyIconWrap}><span style={s.emptyIcon}>💰</span></div>
            <p style={s.emptyTitle}>No contributions yet</p>
            <p style={s.emptyText}>Be the first to spray money and show your support!</p>
          </div>
        ) : (
          <div style={s.list}>
            {leaderboard.slice(0, 10).map((entry, index) => {
              const displayName = entry.user_name || 'Anonymous';
              const medal = index < 3 ? MEDALS[index] : null;
              const isTop3 = index < 3;
              return (
                <div key={entry.user_id} style={{ ...s.listItem, ...(isTop3 ? s.listItemTop : {}) }}>
                  <div style={s.rank}>
                    {medal || <span style={s.rankNum}>#{index + 1}</span>}
                  </div>
                  <div style={s.contributorInfo}>
                    <p style={s.contributorName}>{displayName}</p>
                    {entry.message && <p style={s.contributorMsg}>"{entry.message}"</p>}
                  </div>
                  <p style={s.contributorAmount}>₦{entry.amount.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isOnline && (
        <div style={s.liveInfo}>
          <p style={s.liveInfoText}>💡 This leaderboard updates in real-time. Your contributions will appear instantly!</p>
        </div>
      )}

    </div>
  );
}

const s = {
  root: { display: 'flex', flexDirection: 'column' as const, gap: '20px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' },

  centerState: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '40px 20px', gap: '12px' },
  spinner: { width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  centerText: { fontSize: '13px', color: '#9ca3af', margin: 0 },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '14px 16px', borderRadius: '12px', border: '1px solid #fecaca', fontSize: '13.5px' },

  header: { textAlign: 'center' as const },
  titleRow: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  title: { fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 },
  liveBadge: { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#dc2626', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px' },
  liveDot: { width: '7px', height: '7px', backgroundColor: '#fff', borderRadius: '50%', animation: 'pulse 2s infinite' },
  headerSub: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  totalCard: { position: 'relative' as const, background: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)', borderRadius: '20px', overflow: 'hidden', padding: '28px', textAlign: 'center' as const },
  totalOrb: { position: 'absolute' as const, width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', top: '-60px', right: '-40px', pointerEvents: 'none' as const },
  totalInner: { position: 'relative' as const, zIndex: 1 },
  totalLabel: { fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: '0 0 6px', fontWeight: '500' },
  totalAmount: { fontSize: '36px', fontWeight: '800', color: '#fff', margin: '0 0 4px', lineHeight: 1 },
  totalCount: { fontSize: '12px', color: 'rgba(255,255,255,0.65)', margin: 0 },

  sprayBtn: { width: '100%', padding: '15px', fontSize: '15px', fontWeight: '700', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer' },

  form: { backgroundColor: '#f9fafb', borderRadius: '16px', border: '1px solid #f1f3f5', padding: '20px', display: 'flex', flexDirection: 'column' as const, gap: '14px' },
  formTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 },
  quickAmountsRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const },
  quickChip: { padding: '7px 13px', fontSize: '13px', fontWeight: '500', backgroundColor: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '20px', cursor: 'pointer', color: '#374151' },
  quickChipActive: { backgroundColor: '#ecfdf5', borderColor: '#059669', color: '#059669', fontWeight: '700' },

  formField: { display: 'flex', flexDirection: 'column' as const, gap: '6px' },
  formLabel: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  optionalTag: { fontSize: '12px', fontWeight: '400', color: '#9ca3af' },
  input: { width: '100%', padding: '11px 14px', fontSize: '15px', fontWeight: '600', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', boxSizing: 'border-box' as const, color: '#111827', backgroundColor: '#fff' },
  textarea: { width: '100%', padding: '11px 14px', fontSize: '13.5px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', minHeight: '80px', resize: 'vertical' as const, boxSizing: 'border-box' as const, color: '#111827', backgroundColor: '#fff', fontFamily: 'inherit' },
  charCount: { fontSize: '11px', color: '#9ca3af', textAlign: 'right' as const, margin: 0 },
  formActions: { display: 'flex', gap: '10px' },
  cancelBtn: { flex: 1, padding: '12px', fontSize: '14px', fontWeight: '600', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer' },
  submitBtn: { flex: 2, padding: '12px', fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg,#059669,#047857)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' },
  submitBtnDisabled: { opacity: 0.4, cursor: 'not-allowed' },

  sectionTitle: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' },
  emptyState: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f3f5', padding: '40px 20px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '10px' },
  emptyIconWrap: { width: '64px', height: '64px', borderRadius: '18px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' },
  emptyIcon: { fontSize: '28px', lineHeight: 1 },
  emptyTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 },
  emptyText: { fontSize: '13px', color: '#9ca3af', margin: 0 },

  list: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  listItem: { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f1f3f5' },
  listItemTop: { background: 'linear-gradient(135deg,#fef3c7 0%,#fde68a 100%)', borderColor: '#f59e0b' },
  rank: { fontSize: '22px', minWidth: '36px', textAlign: 'center' as const, flexShrink: 0 },
  rankNum: { fontSize: '13px', fontWeight: '700', color: '#6b7280' },
  contributorInfo: { flex: 1, minWidth: 0 },
  contributorName: { fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 2px' },
  contributorMsg: { fontSize: '12px', color: '#6b7280', fontStyle: 'italic', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  contributorAmount: { fontSize: '16px', fontWeight: '800', color: '#059669', margin: 0, flexShrink: 0 },

  liveInfo: { backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', padding: '12px 14px' },
  liveInfoText: { margin: 0, fontSize: '13px', color: '#1e40af' },
};
