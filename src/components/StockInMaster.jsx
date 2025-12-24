import React, { useState, useEffect, useRef } from 'react';
import { stockAPI } from '../services/api';
import './products.css';

const StockInMaster = ({ onBack, onAddStockIn, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddStockIn = () => {
    if (onAddStockIn) {
      onAddStockIn();
    } else if (onNavigate) {
      onNavigate('stockIn');
    }
  };

  // Fetch stock in transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      setError('');
      const response = await stockAPI.getTransactions(null, null, 'STOCK_IN', 1000, 0);
      if (response.success) {
        setTransactions(response.transactions || []);
        setFilteredTransactions(response.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching stock in transactions:', err);
      setError('Failed to load stock in transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = transactions.filter(t => 
      t.item_code?.toLowerCase().includes(query) ||
      t.product_name?.toLowerCase().includes(query) ||
      t.created_by?.toLowerCase().includes(query) ||
      t.notes?.toLowerCase().includes(query)
    );
    setFilteredTransactions(filtered);
  }, [searchQuery, transactions]);

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(null);
    setSelectedTransaction(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
        </div>
        <div className="nav-item active">
          <div className="nav-icon">
            <i className="fas fa-box-open"></i>
          </div>
          <span>Stock In</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('settings')}>
          <div className="nav-icon">
            <i className="fas fa-cog"></i>
          </div>
          <span>Settings</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="dashboard-main">
        <div className="staff-container">
          {/* Header */}
          <header className="staff-header">
            <div className="header-left">
              <button className="back-btn" onClick={handleBack}>
                <i className="fas fa-arrow-left"></i>
              </button>
              <div>
                <h1 className="staff-title">Stock In Master</h1>
                <p className="staff-subtitle">View and manage all stock in transactions</p>
              </div>
            </div>
            <div className="header-right">
              <button className="add-btn" onClick={handleAddStockIn}>
                <i className="fas fa-plus"></i>
                <span>Add Stock In</span>
              </button>
            </div>
          </header>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="alert alert-success" style={{ margin: '16px 24px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ margin: '16px 24px' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="search-container" style={{ padding: '16px 24px' }}>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by item code, product name, created by, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Transactions List */}
          <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                <p style={{ marginTop: '16px', color: '#666' }}>Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-box-open" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  {searchQuery ? 'No transactions found matching your search.' : 'No stock in transactions yet.'}
                </p>
                {!searchQuery && (
                  <button className="add-btn" onClick={handleAddStockIn} style={{ marginTop: '16px' }}>
                    <i className="fas fa-plus"></i>
                    <span>Create First Stock In</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="products-grid">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="product-card stock-in-card"
                    onClick={() => handleViewTransaction(transaction)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="product-header">
                      <div className="product-title">{transaction.product_name || 'Unknown Product'}</div>
                      <div className="product-badge" style={{ background: '#28a745', color: '#fff' }}>
                        <i className="fas fa-arrow-up"></i> Stock In
                      </div>
                    </div>
                    <div className="product-details">
                      <div className="detail-row">
                        <span className="detail-label">Item Code:</span>
                        <span className="detail-value">{transaction.item_code || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Quantity Added:</span>
                        <span className="detail-value" style={{ color: '#28a745', fontWeight: 'bold' }}>
                          +{transaction.quantity || 0}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Previous Stock:</span>
                        <span className="detail-value">{transaction.previous_quantity || 0}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">New Stock:</span>
                        <span className="detail-value" style={{ fontWeight: 'bold' }}>
                          {transaction.new_quantity || 0}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Created By:</span>
                        <span className="detail-value">{transaction.created_by || 'System'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(transaction.created_at)}</span>
                      </div>
                    </div>
                    {transaction.notes && (
                      <div className="product-notes">
                        <i className="fas fa-sticky-note"></i>
                        {transaction.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Transaction Modal */}
      {showViewModal && selectedTransaction && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={closeViewModal}
        >
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Stock In Transaction Details</h2>
              <button
                onClick={closeViewModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <strong>Product Name:</strong> {selectedTransaction.product_name || 'N/A'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Item Code:</strong> {selectedTransaction.item_code || 'N/A'}
                </div>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Transaction ID:</strong> {selectedTransaction.id || 'N/A'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#fff3cd', borderRadius: '8px' }}>
                  <strong>Previous Stock:</strong> {selectedTransaction.previous_quantity || 0}
                </div>
                <div style={{ padding: '12px', background: '#d4edda', borderRadius: '8px' }}>
                  <strong>Quantity Added:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>+{selectedTransaction.quantity || 0}</span>
                </div>
                <div style={{ padding: '12px', background: '#d1ecf1', borderRadius: '8px' }}>
                  <strong>New Stock:</strong> <span style={{ fontWeight: 'bold' }}>{selectedTransaction.new_quantity || 0}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Created By:</strong> {selectedTransaction.created_by || 'System'}
                </div>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Date & Time:</strong> {formatDate(selectedTransaction.created_at)}
                </div>
              </div>
              {selectedTransaction.notes && (
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Notes:</strong> {selectedTransaction.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInMaster;

