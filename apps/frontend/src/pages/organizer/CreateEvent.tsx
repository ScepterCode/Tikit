import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/FastAPIAuthContext';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../../components/layout/DashboardNavbar';
import { OrganizerSidebar, ORG_SIDEBAR_WIDTH, ORG_SIDEBAR_BREAK } from '../../components/layout/OrganizerSidebar';

export function CreateEvent() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < ORG_SIDEBAR_BREAK);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    ticketPrice: '',
    totalTickets: '',
    category: 'conference',
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < ORG_SIDEBAR_BREAK);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await signOut(); navigate('/'); };
  const mainPadding = isMobile ? '96px 16px 60px' : `96px 40px 60px ${ORG_SIDEBAR_WIDTH + 40}px`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating event:', formData);
    alert('Event creation will be implemented soon!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div style={s.root}>
      <DashboardNavbar user={user!} onLogout={handleLogout} />
      <OrganizerSidebar />
      <main style={{ ...s.main, padding: mainPadding }}>

        <div style={s.titleRow}>
          <div>
            <h2 style={s.pageTitle}>Create Event</h2>
            <p style={s.pageSubtitle}>Set up a new event and start selling tickets</p>
          </div>
        </div>

        <div style={s.card}>
          <form onSubmit={handleSubmit} style={s.form}>

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Event Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} style={s.input} placeholder="Enter event title" required />
              </div>

              <div style={s.field}>
                <label style={s.label}>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} style={s.input} required>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="concert">Concert</option>
                  <option value="party">Party</option>
                  <option value="wedding">Wedding</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={s.field}>
                <label style={s.label}>Date *</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} style={s.input} required />
              </div>

              <div style={s.field}>
                <label style={s.label}>Time *</label>
                <input type="time" name="time" value={formData.time} onChange={handleChange} style={s.input} required />
              </div>

              <div style={s.field}>
                <label style={s.label}>Ticket Price (₦) *</label>
                <input type="number" name="ticketPrice" value={formData.ticketPrice} onChange={handleChange} style={s.input} placeholder="0" min="0" required />
              </div>

              <div style={s.field}>
                <label style={s.label}>Total Tickets *</label>
                <input type="number" name="totalTickets" value={formData.totalTickets} onChange={handleChange} style={s.input} placeholder="100" min="1" required />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Venue *</label>
              <input type="text" name="venue" value={formData.venue} onChange={handleChange} style={s.input} placeholder="Enter venue address" required />
            </div>

            <div style={{ ...s.field, marginTop: '4px' }}>
              <label style={s.label}>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} style={s.textarea} placeholder="Describe your event..." rows={4} required />
            </div>

            <div style={s.btnRow}>
              <button type="button" onClick={() => navigate('/organizer/events')} style={s.cancelBtn}>Cancel</button>
              <button type="submit" style={s.submitBtn}>Create Event</button>
            </div>

          </form>
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
  card: { backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #f1f3f5', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', padding: '32px' },
  form: { maxWidth: '800px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '20px', marginBottom: '20px' },
  field: { display: 'flex', flexDirection: 'column' as const, gap: '6px', marginBottom: '4px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '12px 14px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', fontFamily: 'inherit', boxSizing: 'border-box' as const, width: '100%', backgroundColor: '#fff' },
  textarea: { padding: '12px 14px', fontSize: '14px', border: '1.5px solid #e5e7eb', borderRadius: '12px', outline: 'none', color: '#111827', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' as const },
  btnRow: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '28px' },
  cancelBtn: { padding: '12px 24px', fontSize: '14px', fontWeight: '600', backgroundColor: '#f5f6fa', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer' },
  submitBtn: { padding: '12px 28px', fontSize: '14px', fontWeight: '700', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer' },
};
