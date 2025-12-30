import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  type: 'ticket_sale' | 'refund' | 'withdrawal' | 'commission';
  amount: number;
  description: string;
  eventTitle?: string;
  userName: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

interface FinancialSummary {
  totalRevenue: number;
  totalCommission: number;
  totalRefunds: number;
  pendingPayouts: number;
  monthlyGrowth: number;
}

export function AdminFinancials() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('30');
  const navigate = useNavigate();

  // Mock data for now - replace with API call
  useEffect(() => {
    const mockSummary: FinancialSummary = {
      totalRevenue: 15750000,
      totalCommission: 787500,
      totalRefunds: 125000,
      pendingPayouts: 450000,
      monthlyGrowth: 12.5
    };

    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'ticket_sale',
        amount: 5000,
        description: 'Ticket purchase for Lagos Tech Conference',
        eventTitle: 'Lagos Tech Conference 2025',
        userName: 'John Doe',
        status: 'completed',
        createdAt: '2025-12-30T10:30:00.000Z'
      },
      {
        id: '2',
        type: 'commission',
        amount: 250,
        description: 'Platform commission (5%)',
        eventTitle: 'Lagos Tech Conference 2025',
        userName: 'Platform',
        status: 'completed',
        createdAt: '2025-12-30T10:30:00.000Z'
      },
      {
        id: '3',
        type: 'ticket_sale',
        amount: 10000,
        description: 'VIP ticket for Afrobeats Festival',
        eventTitle: 'Afrobeats Music Festival',
        userName: 'Jane Smith',
        status: 'completed',
        createdAt: '2025-12-29T15:45:00.000Z'
      },
      {
        id: '4',
        type: 'refund',
        amount: -5000,
        description: 'Refund for cancelled event',
        eventTitle: 'Business Summit Nigeria',
        userName: 'Mike Johnson',
        status: 'completed',
        createdAt: '2025-12-28T09:15:00.000Z'
      },
      {
        id: '5',
        type: 'withdrawal',
        amount: -50000,
        description: 'Organizer payout',
        userName: 'Sarah Williams',
        status: 'pending',
        createdAt: '2025-12-27T14:20:00.000Z'
      }
    ];

    setTimeout(() => {
      setSummary(mockSummary);
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    return filterType === 'all' || transaction.type === filterType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ticket_sale': return '🎫';
      case 'refund': return '↩️';
      case 'withdrawal': return '💸';
      case 'commission': return '💰';
      default: return '💳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'pending': return '#f59e0b';
      case 'failed': return '#dc2626';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading financial data...</p>
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
          <h1 style={styles.title}>💰 Financial Overview</h1>
        </div>
        
        {summary && (
          <div style={styles.stats}>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>₦{summary.totalRevenue.toLocaleString()}</span>
              <span style={styles.statLabel}>Total Revenue</span>
              <span style={{...styles.growth, color: summary.monthlyGrowth > 0 ? '#16a34a' : '#dc2626'}}>
                {summary.monthlyGrowth > 0 ? '+' : ''}{summary.monthlyGrowth}% this month
              </span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>₦{summary.totalCommission.toLocaleString()}</span>
              <span style={styles.statLabel}>Platform Commission</span>
              <span style={styles.subtext}>5% of total sales</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>₦{summary.totalRefunds.toLocaleString()}</span>
              <span style={styles.statLabel}>Total Refunds</span>
              <span style={styles.subtext}>0.8% of revenue</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNumber}>₦{summary.pendingPayouts.toLocaleString()}</span>
              <span style={styles.statLabel}>Pending Payouts</span>
              <span style={styles.subtext}>Awaiting processing</span>
            </div>
          </div>
        )}
      </div>

      <div style={styles.controls}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Transactions</option>
          <option value="ticket_sale">Ticket Sales</option>
          <option value="commission">Commission</option>
          <option value="refund">Refunds</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={styles.filterSelect}
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

      <div style={styles.content}>
        <div style={styles.chartSection}>
          <h3 style={styles.sectionTitle}>Revenue Trends</h3>
          <div style={styles.chartPlaceholder}>
            <div style={styles.chartBars}>
              {[65, 45, 80, 55, 70, 85, 90].map((height, index) => (
                <div 
                  key={index}
                  style={{
                    ...styles.chartBar,
                    height: `${height}%`
                  }}
                ></div>
              ))}
            </div>
            <div style={styles.chartLabels}>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        <div style={styles.transactionsSection}>
          <h3 style={styles.sectionTitle}>Recent Transactions</h3>
          <div style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} style={styles.transactionItem}>
                <div style={styles.transactionIcon}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div style={styles.transactionDetails}>
                  <div style={styles.transactionDescription}>
                    {transaction.description}
                  </div>
                  <div style={styles.transactionMeta}>
                    {transaction.eventTitle && (
                      <span style={styles.eventTitle}>{transaction.eventTitle}</span>
                    )}
                    <span style={styles.userName}>{transaction.userName}</span>
                    <span style={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={styles.transactionAmount}>
                  <span style={{
                    color: transaction.amount > 0 ? '#16a34a' : '#dc2626',
                    fontWeight: 'bold'
                  }}>
                    {transaction.amount > 0 ? '+' : ''}₦{Math.abs(transaction.amount).toLocaleString()}
                  </span>
                  <span 
                    style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(transaction.status)
                    }}
                  >
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div style={styles.noResults}>
          <p>No transactions found for the selected criteria.</p>
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
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
  growth: {
    fontSize: '12px',
    fontWeight: '500',
  },
  subtext: {
    fontSize: '12px',
    color: '#9ca3af',
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
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  chartSection: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  chartPlaceholder: {
    height: '300px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-end',
  },
  chartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '250px',
    marginBottom: '10px',
  },
  chartBar: {
    width: '30px',
    backgroundColor: '#3b82f6',
    borderRadius: '4px 4px 0 0',
    minHeight: '20px',
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#6b7280',
  },
  transactionsSection: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  transactionsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto' as const,
  },
  transactionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    border: '1px solid #f3f4f6',
    borderRadius: '6px',
  },
  transactionIcon: {
    fontSize: '20px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '50%',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '4px',
  },
  transactionMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#6b7280',
  },
  eventTitle: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  userName: {
    color: '#6b7280',
  },
  transactionDate: {
    color: '#9ca3af',
  },
  transactionAmount: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '4px',
  },
  statusBadge: {
    padding: '2px 6px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '10px',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
};