import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../../utils/auth';

interface ScanResult {
  id: string;
  ticketId: string;
  attendeeName: string;
  eventName: string;
  status: 'valid' | 'invalid' | 'already_used';
  timestamp: string;
  message: string;
}

export function OrganizerScanner() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState({
    validToday: 0,
    invalidToday: 0,
    totalScanned: 0
  });
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchScanHistory();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/events');
      const data = await response.json();
      if (data.success) {
        setEvents(data.data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchScanHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organizer/scan-history`, {
        headers: {
          'Authorization': `Bearer ${user?.session?.access_token}`,
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setScanHistory(data.data || []);
        
        // Update stats
        const valid = data.data.filter((s: any) => s.status === 'valid').length;
        const invalid = data.data.filter((s: any) => s.status === 'invalid' || s.status === 'already_used').length;
        setStats({
          validToday: valid,
          invalidToday: invalid,
          totalScanned: data.data.length
        });
      }
    } catch (error) {
      console.error('Error fetching scan history:', error);
      setScanHistory([]);
      setStats({ validToday: 0, invalidToday: 0, totalScanned: 0 });
    }
  };

  const handleStartScanning = () => {
    setIsScanning(true);
    // In a real implementation, this would activate the camera
    alert('Camera scanning would start here.\n\nFor now, use the manual code entry below to test ticket verification.');
  };

  const handleStopScanning = () => {
    setIsScanning(false);
  };

  const handleManualVerification = async () => {
    if (!manualCode.trim()) {
      alert('Please enter a ticket code');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organizer/verify-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.session?.access_token}`,
        },
        body: JSON.stringify({
          ticket_code: manualCode,
          event_id: selectedEvent
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newScan: ScanResult = {
          id: Date.now().toString(),
          ticketId: manualCode,
          attendeeName: data.attendee_name || 'Unknown',
          eventName: data.event_name || 'Unknown Event',
          status: data.status,
          timestamp: new Date().toISOString(),
          message: data.message
        };

        setScanHistory([newScan, ...scanHistory]);
        setManualCode('');
        
        // Update stats
        const newStats = { ...stats };
        if (data.status === 'valid') {
          newStats.validToday += 1;
        } else {
          newStats.invalidToday += 1;
        }
        newStats.totalScanned += 1;
        setStats(newStats);
        
        alert(data.message);
      } else {
        alert(data.error?.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      alert('Error verifying ticket. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return '#10b981';
      case 'invalid':
        return '#ef4444';
      case 'already_used':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return '✅';
      case 'invalid':
        return '❌';
      case 'already_used':
        return '⚠️';
      default:
        return '❓';
    }
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
            <NavItem icon="📱" label="Scanner" active />
            <NavItem icon="⚙️" label="Settings" onClick={() => navigate('/organizer/settings')} />
          </nav>
        </aside>

        {/* Main Content */}
        <main style={styles.main}>
          <div style={styles.titleRow}>
            <div>
              <h2 style={styles.pageTitle}>Ticket Scanner</h2>
              <p style={styles.pageSubtitle}>
                Scan and verify attendee tickets at your events
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, color: '#10b981'}}>✅</div>
              <div style={styles.statContent}>
                <h4 style={styles.statTitle}>Valid Scans Today</h4>
                <p style={styles.statValue}>{stats.validToday}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, color: '#ef4444'}}>❌</div>
              <div style={styles.statContent}>
                <h4 style={styles.statTitle}>Invalid Scans Today</h4>
                <p style={styles.statValue}>{stats.invalidToday}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, color: '#3b82f6'}}>📊</div>
              <div style={styles.statContent}>
                <h4 style={styles.statTitle}>Total Scanned</h4>
                <p style={styles.statValue}>{stats.totalScanned}</p>
              </div>
            </div>
          </div>

          {/* Scanner Section */}
          <div style={styles.scannerSection}>
            <div style={styles.scannerCard}>
              <div style={styles.scannerHeader}>
                <h3 style={styles.scannerTitle}>QR Code Scanner</h3>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  style={styles.eventSelect}
                >
                  <option value="all">All Events</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                  ))}
                </select>
              </div>

              {!isScanning ? (
                <div style={styles.scannerPlaceholder}>
                  <div style={styles.scannerIcon}>📱</div>
                  <p style={styles.scannerText}>
                    Click the button below to start scanning QR codes with your device camera
                  </p>
                  <button onClick={handleStartScanning} style={styles.startButton}>
                    Start Camera Scanner
                  </button>
                </div>
              ) : (
                <div style={styles.scannerActive}>
                  <div style={styles.cameraPlaceholder}>
                    <div style={styles.scanFrame}>
                      <div style={styles.scanCorner} />
                      <div style={{...styles.scanCorner, right: 0}} />
                      <div style={{...styles.scanCorner, bottom: 0}} />
                      <div style={{...styles.scanCorner, bottom: 0, right: 0}} />
                      <p style={styles.scanInstruction}>Position QR code within frame</p>
                    </div>
                  </div>
                  <button onClick={handleStopScanning} style={styles.stopButton}>
                    Stop Scanner
                  </button>
                </div>
              )}

              {/* Manual Entry */}
              <div style={styles.manualEntry}>
                <h4 style={styles.manualTitle}>Manual Ticket Verification</h4>
                <p style={styles.manualSubtitle}>Enter ticket code manually if QR scan fails</p>
                <div style={styles.manualInputGroup}>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter ticket code (e.g., TKT-12345)"
                    style={styles.manualInput}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualVerification()}
                  />
                  <button onClick={handleManualVerification} style={styles.verifyButton}>
                    Verify
                  </button>
                </div>
                <p style={styles.helpText}>
                  💡 Tip: Try entering "TKT-VALID" or "TKT-INVALID" to test
                </p>
              </div>
            </div>
          </div>

          {/* Scan History */}
          <div style={styles.historySection}>
            <h3 style={styles.historyTitle}>Recent Scans</h3>
            {scanHistory.length === 0 ? (
              <div style={styles.emptyHistory}>
                <p style={styles.emptyText}>No scans yet. Start scanning tickets to see history here.</p>
              </div>
            ) : (
              <div style={styles.historyList}>
                {scanHistory.map((scan) => (
                  <div key={scan.id} style={styles.historyItem}>
                    <div style={styles.historyIcon}>
                      {getStatusIcon(scan.status)}
                    </div>
                    <div style={styles.historyContent}>
                      <div style={styles.historyHeader}>
                        <span style={styles.historyTicketId}>{scan.ticketId}</span>
                        <span 
                          style={{
                            ...styles.historyStatus,
                            backgroundColor: getStatusColor(scan.status) + '20',
                            color: getStatusColor(scan.status)
                          }}
                        >
                          {scan.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p style={styles.historyName}>{scan.attendeeName}</p>
                      <p style={styles.historyEvent}>{scan.eventName}</p>
                      <p style={styles.historyMessage}>{scan.message}</p>
                      <p style={styles.historyTime}>
                        {new Date(scan.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIcon: {
    fontSize: '32px',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '4px',
    margin: 0,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  scannerSection: {
    marginBottom: '24px',
  },
  scannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  scannerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  scannerTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  eventSelect: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  scannerPlaceholder: {
    textAlign: 'center' as const,
    padding: '48px 24px',
  },
  scannerIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  scannerText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    maxWidth: '400px',
    margin: '0 auto 24px',
  },
  startButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  scannerActive: {
    textAlign: 'center' as const,
  },
  cameraPlaceholder: {
    backgroundColor: '#000000',
    borderRadius: '12px',
    padding: '48px',
    marginBottom: '16px',
    position: 'relative' as const,
    minHeight: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: '300px',
    height: '300px',
    border: '3px solid #667eea',
    borderRadius: '12px',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCorner: {
    position: 'absolute' as const,
    width: '40px',
    height: '40px',
    borderTop: '4px solid #ffffff',
    borderLeft: '4px solid #ffffff',
    top: -2,
    left: -2,
  },
  scanInstruction: {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
  },
  stopButton: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  manualEntry: {
    marginTop: '32px',
    padding: '24px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  manualTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  manualSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  manualInputGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
  },
  manualInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  verifyButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    backgroundColor: '#667eea',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  historySection: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  historyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px',
  },
  emptyHistory: {
    textAlign: 'center' as const,
    padding: '48px 24px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  historyItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  historyIcon: {
    fontSize: '24px',
  },
  historyContent: {
    flex: 1,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  historyTicketId: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  historyStatus: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
  },
  historyName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    margin: '0 0 4px 0',
  },
  historyEvent: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 4px 0',
  },
  historyMessage: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic' as const,
    margin: '0 0 8px 0',
  },
  historyTime: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
  },
};
