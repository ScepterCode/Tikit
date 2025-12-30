import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsData {
  userGrowth: {
    period: string;
    users: number;
    organizers: number;
    attendees: number;
  }[];
  eventMetrics: {
    totalEvents: number;
    activeEvents: number;
    completedEvents: number;
    averageAttendance: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageTicketPrice: number;
    conversionRate: number;
  };
  topEvents: {
    id: string;
    title: string;
    ticketsSold: number;
    revenue: number;
  }[];
  topOrganizers: {
    id: string;
    name: string;
    eventsCreated: number;
    totalRevenue: number;
  }[];
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>('30');
  const navigate = useNavigate();

  // Mock data for now - replace with API call
  useEffect(() => {
    const mockAnalytics: AnalyticsData = {
      userGrowth: [
        { period: 'Week 1', users: 120, organizers: 15, attendees: 105 },
        { period: 'Week 2', users: 180, organizers: 22, attendees: 158 },
        { period: 'Week 3', users: 250, organizers: 28, attendees: 222 },
        { period: 'Week 4', users: 320, organizers: 35, attendees: 285 },
      ],
      eventMetrics: {
        totalEvents: 45,
        activeEvents: 12,
        completedEvents: 28,
        averageAttendance: 85.5
      },
      revenueMetrics: {
        totalRevenue: 15750000,
        monthlyRevenue: 3200000,
        averageTicketPrice: 7500,
        conversionRate: 12.8
      },
      topEvents: [
        { id: '1', title: 'Afrobeats Music Festival', ticketsSold: 1200, revenue: 6000000 },
        { id: '2', title: 'Lagos Tech Conference 2025', ticketsSold: 450, revenue: 2250000 },
        { id: '3', title: 'Business Summit Nigeria', ticketsSold: 300, revenue: 1500000 },
        { id: '4', title: 'Art & Culture Exhibition', ticketsSold: 250, revenue: 1000000 },
      ],
      topOrganizers: [
        { id: '1', name: 'Jane Smith', eventsCreated: 8, totalRevenue: 4500000 },
        { id: '2', name: 'Mike Johnson', eventsCreated: 6, totalRevenue: 3200000 },
        { id: '3', name: 'Sarah Williams', eventsCreated: 5, totalRevenue: 2800000 },
        { id: '4', name: 'David Brown', eventsCreated: 4, totalRevenue: 1900000 },
      ]
    };

    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, [timeRange]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <button onClick={() => navigate('/admin/dashboard')} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>📈 Analytics Dashboard</h1>
        </div>
        
        <div style={styles.controls}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={styles.timeRangeSelect}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          <button style={styles.exportButton}>
            📊 Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>👥</div>
          <div style={styles.metricContent}>
            <span style={styles.metricNumber}>{analytics.userGrowth[analytics.userGrowth.length - 1]?.users || 0}</span>
            <span style={styles.metricLabel}>Total Users</span>
            <span style={styles.metricGrowth}>+25% this month</span>
          </div>
        </div>
        
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>🎉</div>
          <div style={styles.metricContent}>
            <span style={styles.metricNumber}>{analytics.eventMetrics.totalEvents}</span>
            <span style={styles.metricLabel}>Total Events</span>
            <span style={styles.metricGrowth}>+12% this month</span>
          </div>
        </div>
        
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>💰</div>
          <div style={styles.metricContent}>
            <span style={styles.metricNumber}>₦{analytics.revenueMetrics.totalRevenue.toLocaleString()}</span>
            <span style={styles.metricLabel}>Total Revenue</span>
            <span style={styles.metricGrowth}>+18% this month</span>
          </div>
        </div>
        
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>📊</div>
          <div style={styles.metricContent}>
            <span style={styles.metricNumber}>{analytics.revenueMetrics.conversionRate}%</span>
            <span style={styles.metricLabel}>Conversion Rate</span>
            <span style={styles.metricGrowth}>+2.3% this month</span>
          </div>
        </div>
      </div>

      <div style={styles.chartsGrid}>
        {/* User Growth Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>User Growth Trends</h3>
          <div style={styles.chartContainer}>
            <div style={styles.chartBars}>
              {analytics.userGrowth.map((data, index) => (
                <div key={index} style={styles.barGroup}>
                  <div 
                    style={{
                      ...styles.bar,
                      height: `${(data.users / 400) * 100}%`,
                      backgroundColor: '#3b82f6'
                    }}
                  ></div>
                  <span style={styles.barLabel}>{data.period}</span>
                </div>
              ))}
            </div>
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <div style={{...styles.legendColor, backgroundColor: '#3b82f6'}}></div>
                <span>Total Users</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Distribution */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Revenue Distribution</h3>
          <div style={styles.pieChartContainer}>
            <div style={styles.pieChart}>
              <div style={styles.pieSlice1}></div>
              <div style={styles.pieSlice2}></div>
              <div style={styles.pieSlice3}></div>
            </div>
            <div style={styles.pieChartLegend}>
              <div style={styles.legendItem}>
                <div style={{...styles.legendColor, backgroundColor: '#3b82f6'}}></div>
                <span>Ticket Sales (70%)</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{...styles.legendColor, backgroundColor: '#10b981'}}></div>
                <span>Commission (25%)</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{...styles.legendColor, backgroundColor: '#f59e0b'}}></div>
                <span>Other (5%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.tablesGrid}>
        {/* Top Events */}
        <div style={styles.tableCard}>
          <h3 style={styles.tableTitle}>🏆 Top Performing Events</h3>
          <div style={styles.tableContainer}>
            {analytics.topEvents.map((event, index) => (
              <div key={event.id} style={styles.tableRow}>
                <div style={styles.rank}>#{index + 1}</div>
                <div style={styles.eventInfo}>
                  <div style={styles.eventName}>{event.title}</div>
                  <div style={styles.eventStats}>
                    {event.ticketsSold} tickets • ₦{event.revenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Organizers */}
        <div style={styles.tableCard}>
          <h3 style={styles.tableTitle}>⭐ Top Organizers</h3>
          <div style={styles.tableContainer}>
            {analytics.topOrganizers.map((organizer, index) => (
              <div key={organizer.id} style={styles.tableRow}>
                <div style={styles.rank}>#{index + 1}</div>
                <div style={styles.organizerInfo}>
                  <div style={styles.organizerName}>{organizer.name}</div>
                  <div style={styles.organizerStats}>
                    {organizer.eventsCreated} events • ₦{organizer.totalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
  controls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  timeRangeSelect: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  exportButton: {
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '30px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  metricIcon: {
    fontSize: '32px',
    width: '60px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
  },
  metricContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  metricNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  metricGrowth: {
    fontSize: '12px',
    color: '#16a34a',
    fontWeight: '500',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  chartContainer: {
    height: '250px',
  },
  chartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '200px',
    marginBottom: '16px',
  },
  barGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  bar: {
    width: '40px',
    backgroundColor: '#3b82f6',
    borderRadius: '4px 4px 0 0',
    minHeight: '20px',
  },
  barLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  chartLegend: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#6b7280',
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
  },
  pieChartContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  pieChart: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    background: 'conic-gradient(#3b82f6 0deg 252deg, #10b981 252deg 342deg, #f59e0b 342deg 360deg)',
    position: 'relative' as const,
  },
  pieSlice1: {},
  pieSlice2: {},
  pieSlice3: {},
  pieChartLegend: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  tablesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  tableContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
  },
  rank: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#3b82f6',
    minWidth: '30px',
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '2px',
  },
  eventStats: {
    fontSize: '12px',
    color: '#6b7280',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '2px',
  },
  organizerStats: {
    fontSize: '12px',
    color: '#6b7280',
  },
};