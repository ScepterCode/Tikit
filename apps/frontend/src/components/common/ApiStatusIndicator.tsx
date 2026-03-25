/*
API Status Indicator
Shows the connection status to FastAPI backend and Supabase
*/

import { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { supabase } from '../../lib/supabase';
import { useRealtimeConnection } from '../../hooks/useRealtimeConnection';

interface ApiStatus {
  fastapi: 'connected' | 'disconnected' | 'checking';
  supabase: 'connected' | 'disconnected' | 'checking' | 'not_configured';
  realtime: 'connected' | 'disconnected' | 'connecting';
}

interface Position {
  x: number;
  y: number;
}

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<ApiStatus>({
    fastapi: 'checking',
    supabase: 'checking',
    realtime: 'disconnected'
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 20, y: 80 }); // Start below navbar
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isExpanded) return; // Don't drag when expanded
    
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 50;
      
      setPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const checkApiStatus = async () => {
    // Check FastAPI with better error handling
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const health = await apiService.healthCheck();
      clearTimeout(timeoutId);
      
      setStatus(prev => ({
        ...prev,
        fastapi: health.status === 'ok' ? 'connected' : 'disconnected'
      }));
    } catch (error: any) {
      console.log('FastAPI health check failed:', error.message);
      setStatus(prev => ({ ...prev, fastapi: 'disconnected' }));
    }

    // Check Supabase (less frequently to reduce load)
    try {
      if (supabase) {
        const now = Date.now();
        const lastCheck = (window as any).__supabaseLastCheck || 0;
        const shouldCheck = now - lastCheck > 60000 || status.supabase === 'disconnected';
        
        if (shouldCheck) {
          const { error } = await supabase.from('users').select('id').limit(1);
          (window as any).__supabaseLastCheck = now;
          setStatus(prev => ({
            ...prev,
            supabase: error ? 'disconnected' : 'connected'
          }));
        }
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

  if (isMinimized) {
    return (
      <div 
        ref={containerRef}
        style={{
          ...styles.container,
          left: position.x,
          top: position.y,
        }}
      >
        <div 
          style={{
            ...styles.minimizedIndicator,
            backgroundColor: getStatusColor(overallStatus)
          }}
          onClick={() => setIsMinimized(false)}
          title="API Status (Click to expand)"
        >
          {getStatusIcon(overallStatus)}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      style={{
        ...styles.container,
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div 
        style={{
          ...styles.indicator,
          backgroundColor: getStatusColor(overallStatus)
        }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          if (!isDragging) {
            setIsExpanded(!isExpanded);
          }
        }}
        title="API Connection Status (Drag to move)"
      >
        <span style={styles.indicatorIcon}>
          {getStatusIcon(overallStatus)}
        </span>
        <span style={styles.indicatorText}>
          API
        </span>
        <button
          style={styles.minimizeButton}
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(true);
          }}
          title="Minimize"
        >
          −
        </button>
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
              onClick={() => window.open('http://localhost:8000/docs', '_blank')}
              style={styles.actionButton}
            >
              API Docs
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
    zIndex: 1000,
    userSelect: 'none' as const
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
    cursor: 'grab',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.2s ease',
    minWidth: '70px',
    position: 'relative' as const
  },
  minimizedIndicator: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    fontSize: '14px'
  },
  minimizeButton: {
    position: 'absolute' as const,
    top: '-5px',
    right: '-5px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#666',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
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
    left: '0',
    marginTop: '8px',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '280px',
    overflow: 'hidden',
    zIndex: 1001
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
