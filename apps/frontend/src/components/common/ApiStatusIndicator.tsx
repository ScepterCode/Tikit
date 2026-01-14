/*
API Status Indicator
Shows the connection status to FastAPI backend and Supabase
*/

import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';

interface ApiStatus {
  fastapi: 'connected' | 'disconnected' | 'checking';
  supabase: 'connected' | 'disconnected' | 'checking' | 'not_configured';
  realtime: 'connected' | 'disconnected' | 'connecting';
}

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<ApiStatus>({
    fastapi: 'checking',
    supabase: 'checking',
    realtime: 'disconnected'
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const realtimeConnection = useRealtimeConnection({ autoConnect: false });

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setStatus(prev => ({
      ...prev,
      realtime: realtimeConnection.connected ? 'connected' : 
                realtimeConnection.connecting ? 'connecting' : 'disconnected'
    }));
  }, [realtimeConnection.connected, realtimeConnection.connecting]);

  const checkApiStatus = async () => {
    // Check FastAPI
    try {
      const health = await apiService.healthCheck();
      setStatus(prev => ({
        ...prev,
        fastapi: health.status === 'ok' ? 'connected' : 'disconnected'
      }));
    } catch (error) {
      setStatus(prev => ({ ...prev, fastapi: 'disconnected' }));
    }

    // Check Supabase
    try {
      if (supabase) {
        const { error } = await supabase.from('users').select('id').limit(1);
        setStatus(prev => ({
          ...prev,
          supabase: error ? 'disconnected' : 'connected'
        }));
      } else {
        setStatus(prev => ({ ...prev, supabase: 'not_configured' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, supabase: 'disconnected' }));
    }
  };

  const getStatusColor = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'checking': return '#6b7280';
      default: return '#ef4444';
    }
  };

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'connected': return '✅';
      case 'connecting': return '🔄';
      case 'checking': return '⏳';
      default: return '❌';
    }
  };

  const overallStatus = Object.values(status).every(s => s === 'connected') ? 'connected' :
                       Object.values(status).some(s => s === 'connecting' || s === 'checking') ? 'checking' :
                       'disconnected';

  return (
    <div style={styles.container}>
      <div 
        style={{
          ...styles.indicator,
          backgroundColor: getStatusColor(overallStatus)
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        title="API Connection Status"
      >
        <span style={styles.indicatorIcon}>
          {getStatusIcon(overallStatus)}
        </span>
        <span style={styles.indicatorText}>
          API
        </span>
      </div>

      {isExpanded && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <h4>API Status</h4>
            <button 
              onClick={() => setIsExpanded(false)}
              style={styles.closeButton}
            >
              ×
            </button>
          </div>
          
          <div style={styles.statusList}>
            <div style={styles.statusItem}>
              <span style={styles.statusLabel}>FastAPI Backend:</span>
              <span style={{
                ...styles.statusValue,
                color: getStatusColor(status.fastapi)
              }}>
                {getStatusIcon(status.fastapi)} {status.fastapi}
              </span>
            </div>
            
            <div style={styles.statusItem}>
              <span style={styles.statusLabel}>Supabase Database:</span>
              <span style={{
                ...styles.statusValue,
                color: getStatusColor(status.supabase)
              }}>
                {getStatusIcon(status.supabase)} {status.supabase}
              </span>
            </div>
            
            <div style={styles.statusItem}>
              <span style={styles.statusLabel}>Real-time WebSocket:</span>
              <span style={{
                ...styles.statusValue,
                color: getStatusColor(status.realtime)
              }}>
                {getStatusIcon(status.realtime)} {status.realtime}
              </span>
            </div>
          </div>

          <div style={styles.actions}>
            <button 
              onClick={checkApiStatus}
              style={styles.actionButton}
            >
              Refresh
            </button>
            <button 
              onClick={() => window.open('/debug/fastapi', '_blank')}
              style={styles.actionButton}
            >
              Test API
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    zIndex: 1000
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease'
  },
  indicatorIcon: {
    fontSize: '14px'
  },
  indicatorText: {
    fontSize: '11px'
  },
  dropdown: {
    position: 'absolute' as const,
    top: '100%',
    right: '0',
    marginTop: '8px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '280px',
    overflow: 'hidden'
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusList: {
    padding: '12px 16px'
  },
  statusItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f1f5f9'
  },
  statusLabel: {
    fontSize: '13px',
    color: '#374151'
  },
  statusValue: {
    fontSize: '12px',
    fontWeight: 'bold'
  },
  actions: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0'
  },
  actionButton: {
    flex: 1,
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  }
};