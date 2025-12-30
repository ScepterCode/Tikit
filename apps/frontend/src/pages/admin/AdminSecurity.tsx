import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SecurityLog {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'admin_access' | 'suspicious_activity' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userAgent?: string;
  ipAddress: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  status: 'resolved' | 'investigating' | 'open';
}

interface SecurityMetrics {
  totalLogs: number;
  criticalAlerts: number;
  failedLogins: number;
  suspiciousActivities: number;
  blockedIPs: number;
}

export function AdminSecurity() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const navigate = useNavigate();

  // Mock data for now - replace with API call
  useEffect(() => {
    const mockMetrics: SecurityMetrics = {
      totalLogs: 1247,
      criticalAlerts: 3,
      failedLogins: 45,
      suspiciousActivities: 12,
      blockedIPs: 8
    };

    const mockLogs: SecurityLog[] = [
      {
        id: '1',
        type: 'admin_access',
        severity: 'medium',
        description: 'Admin user logged in successfully',
        ipAddress: '192.168.1.100',
        userId: '1',
        userName: 'John Doe',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: '2025-12-30T10:30:00.000Z',
        status: 'resolved'
      },
      {
        id: '2',
        type: 'failed_login',
        severity: 'high',
        description: 'Multiple failed login attempts detected',
        ipAddress: '203.0.113.45',
        userAgent: 'curl/7.68.0',
        timestamp: '2025-12-30T09:15:00.000Z',
        status: 'investigating'
      },
      {
        id: '3',
        type: 'suspicious_activity',
        severity: 'critical',
        description: 'Unusual API access pattern detected',
        ipAddress: '198.51.100.23',
        userId: '15',
        userName: 'Unknown User',
        userAgent: 'Python-requests/2.25.1',
        timestamp: '2025-12-30T08:45:00.000Z',
        status: 'open'
      },
      {
        id: '4',
        type: 'login_attempt',
        severity: 'low',
        description: 'User login from new device',
        ipAddress: '192.168.1.50',
        userId: '8',
        userName: 'Jane Smith',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        timestamp: '2025-12-30T07:20:00.000Z',
        status: 'resolved'
      },
      {
        id: '5',
        type: 'data_breach',
        severity: 'critical',
        description: 'Potential data exfiltration attempt',
        ipAddress: '185.220.101.42',
        userAgent: 'Wget/1.20.3',
        timestamp: '2025-12-29T23:30:00.000Z',
        status: 'investigating'
      }
    ];

    setTimeout(() => {
      setMetrics(mockMetrics);
      setLogs(mockLogs);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
    const matchesType = filterType === 'all' || log.type === filterType;
    return matchesSeverity && matchesType;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#16a34a';
      case 'medium': return '#f59e0b';
      case 'high': return '#ea580c';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return '🔐';
      case 'failed_login': return '❌';
      case 'admin_access': return '👑';
      case 'suspicious_activity': return '⚠️';
      case 'data_breach': return '🚨';
      default: return '🔍';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return '#16a34a';
      case 'investigating': return '#f59e0b';
      case 'open': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading security data...</p>
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
          <h1 style={styles.title}>🔒 Security Monitoring</h1>
        </div>
        
        {metrics && (
          <div style={styles.stats}>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>{metrics.totalLogs}</span>
              <span style={styles.statLabel}>Total Logs</span>
            </div>
            <div style={{...styles.statCard, borderLeft: '4px solid #dc2626'}}>
              <span style={styles.statNumber}>{metrics.criticalAlerts}</span>
              <span style={styles.statLabel}>Critical Alerts</span>
            </div>
            <div style={{...styles.statCard, borderLeft: '4px solid #ea580c'}}>
              <span style={styles.statNumber}>{metrics.failedLogins}</span>
              <span style={styles.statLabel}>Failed Logins</span>
            </div>
            <div style={{...styles.statCard, borderLeft: '4px solid #f59e0b'}}>
              <span style={styles.statNumber}>{metrics.suspiciousActivities}</span>
              <span style={styles.statLabel}>Suspicious Activities</span>
            </div>
            <div style={{...styles.statCard, borderLeft: '4px solid #6b7280'}}>
              <span style={styles.statNumber}>{metrics.blockedIPs}</span>
              <span style={styles.statLabel}>Blocked IPs</span>
            </div>
          </div>
        )}
      </div>

      <div style={styles.controls}>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="login_attempt">Login Attempts</option>
          <option value="failed_login">Failed Logins</option>
          <option value="admin_access">Admin Access</option>
          <option value="suspicious_activity">Suspicious Activity</option>
          <option value="data_breach">Data Breach</option>
        </select>

        <button style={styles.exportButton}>
          📊 Export Logs
        </button>
      </div>

      <div style={styles.alertsSection}>
        <h3 style={styles.sectionTitle}>🚨 Recent Security Events</h3>
        <div style={styles.logsList}>
          {filteredLogs.map((log) => (
            <div key={log.id} style={styles.logItem}>
              <div style={styles.logIcon}>
                {getTypeIcon(log.type)}
              </div>
              
              <div style={styles.logContent}>
                <div style={styles.logHeader}>
                  <span style={styles.logDescription}>{log.description}</span>
                  <div style={styles.logBadges}>
                    <span 
                      style={{
                        ...styles.severityBadge,
                        backgroundColor: getSeverityColor(log.severity)
                      }}
                    >
                      {log.severity}
                    </span>
                    <span 
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(log.status)
                      }}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
                
                <div style={styles.logDetails}>
                  <span style={styles.logDetail}>IP: {log.ipAddress}</span>
                  {log.userName && (
                    <span style={styles.logDetail}>User: {log.userName}</span>
                  )}
                  <span style={styles.logDetail}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {log.userAgent && (
                  <div style={styles.userAgent}>
                    User Agent: {log.userAgent}
                  </div>
                )}
              </div>
              
              <div style={styles.logActions}>
                <button style={styles.actionButton}>Investigate</button>
                <button style={styles.actionButton}>Block IP</button>
                <button style={styles.actionButton}>Resolve</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.securitySettings}>
        <h3 style={styles.sectionTitle}>⚙️ Security Settings</h3>
        <div style={styles.settingsGrid}>
          <div style={styles.settingCard}>
            <h4 style={styles.settingTitle}>Login Security</h4>
            <div style={styles.settingOptions}>
              <label style={styles.settingOption}>
                <input type="checkbox" defaultChecked />
                <span>Enable two-factor authentication</span>
              </label>
              <label style={styles.settingOption}>
                <input type="checkbox" defaultChecked />
                <span>Lock account after 5 failed attempts</span>
              </label>
              <label style={styles.settingOption}>
                <input type="checkbox" />
                <span>Require password change every 90 days</span>
              </label>
            </div>
          </div>
          
          <div style={styles.settingCard}>
            <h4 style={styles.settingTitle}>Monitoring</h4>
            <div style={styles.settingOptions}>
              <label style={styles.settingOption}>
                <input type="checkbox" defaultChecked />
                <span>Log all admin actions</span>
              </label>
              <label style={styles.settingOption}>
                <input type="checkbox" defaultChecked />
                <span>Alert on suspicious activity</span>
              </label>
              <label style={styles.settingOption}>
                <input type="checkbox" />
                <span>Real-time notifications</span>
              </label>
            </div>
          </div>
          
          <div style={styles.settingCard}>
            <h4 style={styles.settingTitle}>IP Protection</h4>
            <div style={styles.settingOptions}>
              <label style={styles.settingOption}>
                <input type="checkbox" defaultChecked />
                <span>Auto-block suspicious IPs</span>
              </label>
              <label style={styles.settingOption}>
                <input type="checkbox" />
                <span>Whitelist admin IPs only</span>
              </label>
              <label style={styles.settingOption}>
                <input type="checkbox" defaultChecked />
                <span>Rate limiting enabled</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div style={styles.noResults}>
          <p>No security logs found for the selected criteria.</p>
        </div>
      )}
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
    marginBottom: '30px',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
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
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  controls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
  },
  filterSelect: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  exportButton: {
    padding: '12px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  alertsSection: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    maxHeight: '500px',
    overflowY: 'auto' as const,
  },
  logItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    border: '1px solid #f3f4f6',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  logIcon: {
    fontSize: '20px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    border: '1px solid #e5e7eb',
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  logDescription: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
  },
  logBadges: {
    display: 'flex',
    gap: '6px',
  },
  severityBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '10px',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
  },
  statusBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '10px',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
  },
  logDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  logDetail: {
    whiteSpace: 'nowrap' as const,
  },
  userAgent: {
    fontSize: '11px',
    color: '#9ca3af',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
  logActions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  actionButton: {
    padding: '4px 8px',
    fontSize: '11px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#374151',
    whiteSpace: 'nowrap' as const,
  },
  securitySettings: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  settingCard: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: '#f9fafb',
  },
  settingTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  settingOptions: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  settingOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
};