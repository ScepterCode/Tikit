import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: 'attendee' | 'organizer' | 'admin';
  state: string;
  isVerified: boolean;
  walletBalance: number;
  createdAt: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const navigate = useNavigate();

  // Mock data for now - replace with API call
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        phoneNumber: '+2348012345678',
        firstName: 'John',
        lastName: 'Doe',
        email: 'admin@grooovy.com',
        role: 'admin',
        state: 'Lagos',
        isVerified: true,
        walletBalance: 0,
        createdAt: '2025-12-30T09:57:13.384Z'
      },
      {
        id: '2',
        phoneNumber: '+2348123456789',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'organizer',
        state: 'Abuja',
        isVerified: true,
        walletBalance: 15000,
        createdAt: '2025-12-29T14:30:00.000Z'
      },
      {
        id: '3',
        phoneNumber: '+2348234567890',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike@example.com',
        role: 'attendee',
        state: 'Kano',
        isVerified: true,
        walletBalance: 5000,
        createdAt: '2025-12-28T10:15:00.000Z'
      },
      {
        id: '4',
        phoneNumber: '+2348345678901',
        firstName: 'Sarah',
        lastName: 'Williams',
        role: 'attendee',
        state: 'Rivers',
        isVerified: false,
        walletBalance: 0,
        createdAt: '2025-12-27T16:45:00.000Z'
      }
    ];

    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc2626';
      case 'organizer': return '#2563eb';
      case 'attendee': return '#16a34a';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Loading users...</p>
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
          <h1 style={styles.title}>👥 User Management</h1>
        </div>
        
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{users.length}</span>
            <span style={styles.statLabel}>Total Users</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{users.filter(u => u.role === 'organizer').length}</span>
            <span style={styles.statLabel}>Organizers</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{users.filter(u => u.role === 'attendee').length}</span>
            <span style={styles.statLabel}>Attendees</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{users.filter(u => u.isVerified).length}</span>
            <span style={styles.statLabel}>Verified</span>
          </div>
        </div>
      </div>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="organizer">Organizer</option>
          <option value="attendee">Attendee</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>User</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Wallet</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <div style={styles.userName}>{user.firstName} {user.lastName}</div>
                      <div style={styles.userId}>ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td style={styles.td}>
                  <div>{user.phoneNumber}</div>
                  {user.email && <div style={styles.email}>{user.email}</div>}
                </td>
                <td style={styles.td}>
                  <span 
                    style={{
                      ...styles.roleBadge,
                      backgroundColor: getRoleBadgeColor(user.role)
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td style={styles.td}>{user.state}</td>
                <td style={styles.td}>₦{user.walletBalance.toLocaleString()}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: user.isVerified ? '#16a34a' : '#f59e0b'
                  }}>
                    {user.isVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button style={styles.actionButton}>View</button>
                    <button style={styles.actionButton}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div style={styles.noResults}>
          <p>No users found matching your criteria.</p>
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
  searchInput: {
    flex: 1,
    minWidth: '300px',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  filterSelect: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tableRow: {
    borderTop: '1px solid #e5e7eb',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#374151',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: '500',
    color: '#1f2937',
  },
  userId: {
    fontSize: '12px',
    color: '#6b7280',
  },
  email: {
    fontSize: '12px',
    color: '#6b7280',
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'capitalize' as const,
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    fontSize: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    color: '#374151',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
};