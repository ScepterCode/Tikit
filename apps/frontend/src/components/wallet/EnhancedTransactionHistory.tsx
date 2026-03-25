import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { authenticatedFetch } from '../../utils/auth';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: number;
  category?: string;
  reference?: string;
  metadata?: any;
}

interface TransactionFilters {
  start_date?: number;
  end_date?: number;
  transaction_type?: string;
  category?: string;
  min_amount?: number;
  max_amount?: number;
}

const EnhancedTransactionHistory: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadTransactions();
    loadAnalytics();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await authenticatedFetch(`/api/wallet/transactions/enhanced?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.debug('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await authenticatedFetch('/api/wallet/transactions/analytics');
      const data = await response.json();
      
      if (data.success && !data.data.error) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.debug('Failed to load analytics:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await authenticatedFetch(`/api/wallet/transactions/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success && data.data.transactions) {
        setTransactions(data.data.transactions);
      }
    } catch (error) {
      console.debug('Search failed:', error);
    }
  };

  const exportTransactions = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await authenticatedFetch(`/api/wallet/transactions/export?${params}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.debug('Export failed:', error);
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = `₦${Math.abs(amount).toLocaleString()}`;
    return type === 'debit' || type === 'withdrawal' || type === 'transfer_out' ? `-${formatted}` : `+${formatted}`;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
      case 'credit':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
      case 'debit':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={exportTransactions}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                <select
                  value={filters.transaction_type || ''}
                  onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Types</option>
                  <option value="topup">Top-up</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="transfer">Transfer</option>
                  <option value="spray_money">Spray Money</option>
                  <option value="ticket_purchase">Ticket Purchase</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                <input
                  type="number"
                  placeholder="₦0"
                  value={filters.min_amount || ''}
                  onChange={(e) => setFilters({ ...filters, min_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                <input
                  type="number"
                  placeholder="₦1,000,000"
                  value={filters.max_amount || ''}
                  onChange={(e) => setFilters({ ...filters, max_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Spending Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.categories?.slice(0, 3).map((category: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-600 capitalize">{category.category}</div>
                <div className="text-2xl font-bold text-gray-900">₦{category.amount.toLocaleString()}</div>
                <div className="text-sm text-gray-500">{category.count} transactions</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <div className="font-medium text-gray-900 capitalize">
                      {transaction.description || transaction.type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(transaction.created_at * 1000).toLocaleDateString()} • 
                      {transaction.reference && ` ${transaction.reference}`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    transaction.type === 'debit' || transaction.type === 'withdrawal' 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EnhancedTransactionHistory;