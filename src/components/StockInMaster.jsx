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
      onNavigate('transactionMenu');
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

  // Handle verify transaction
  const handleVerifyTransaction = async (transaction) => {
    if (transaction.is_verified === true) {
      return; // Already verified
    }

    try {
      setError('');
      const response = await stockAPI.verifyStockIn(transaction.id);
      if (response.success) {
        setSuccessMessage('Stock in transaction verified successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchTransactions();
      } else {
        setError(response.error || 'Failed to mark transaction as verified');
      }
    } catch (err) {
      console.error('Error marking transaction as verified:', err);
      setError(err.message || 'Failed to mark transaction as verified');
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm(`Are you sure you want to delete this stock in transaction for ${transaction.product_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setError('');
      // Note: You may need to add a delete endpoint to stockAPI
      // For now, this is a placeholder
      setSuccessMessage('Delete functionality to be implemented');
      setTimeout(() => setSuccessMessage(''), 3000);
      // await stockAPI.deleteTransaction(transaction.id);
      // await fetchTransactions();
    } catch (err) {
      console.error('Error deleting transaction:', err);
      setError(err.message || 'Failed to delete transaction');
      setTimeout(() => setError(''), 3000);
    }
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
        {userRole === 'admin' && (
          <div className="nav-item" onClick={() => onNavigate && onNavigate('users')}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={() => onNavigate && onNavigate('staff')}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
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
              <div className="attendance-table-container" style={{ 
                marginTop: '0', 
                maxHeight: 'none',
                overflowX: 'auto',
                width: '100%'
              }}>
                <table className="attendance-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '60px' }}>
                        #
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Product Name
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Item Code
                      </th>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Quantity Added
                      </th>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Previous Stock
                      </th>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        New Stock
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Created By
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Date
                      </th>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Status
                      </th>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '200px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction, index) => {
                      return (
                        <tr key={transaction.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ 
                            textAlign: 'center', 
                            color: '#666',
                            padding: '12px 8px',
                            fontSize: '14px'
                          }}>
                            {index + 1}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#333'
                          }}>
                            {transaction.product_name || 'Unknown Product'}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {transaction.item_code || 'N/A'}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#28a745'
                          }}>
                            +{transaction.quantity || 0}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {transaction.previous_quantity || 0}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333'
                          }}>
                            {transaction.new_quantity || 0}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {transaction.created_by || 'System'}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {formatDate(transaction.created_at)}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px'
                          }}>
                            {transaction.is_verified === true ? (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#28a745', 
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i className="fas fa-check-circle"></i> Verified
                              </span>
                            ) : (
                              <span style={{ 
                                fontSize: '12px', 
                                color: '#dc3545', 
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <i className="fas fa-exclamation-circle"></i> Not Verified
                              </span>
                            )}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleViewTransaction(transaction)}
                                style={{
                                  background: '#007bff',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  fontSize: '13px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s ease',
                                  fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#0056b3';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#007bff';
                                }}
                              >
                                <i className="fas fa-eye"></i>
                                View
                              </button>
                              {(transaction.is_verified !== true) && (userRole === 'admin' || userRole === 'supervisor') && (
                                <button
                                  onClick={() => handleVerifyTransaction(transaction)}
                                  style={{
                                    background: '#ff9800',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s ease',
                                    fontWeight: '500'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.background = '#e68900';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = '#ff9800';
                                  }}
                                >
                                  <i className="fas fa-check-circle"></i>
                                  Mark as Verified
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
              {(userRole === 'admin' || userRole === 'supervisor') && (
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginTop: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                  {selectedTransaction.is_verified === false ? (
                    <button
                      onClick={async () => {
                        try {
                          const response = await stockAPI.verifyStockIn(selectedTransaction.id);
                          if (response.success) {
                            setSelectedTransaction({ ...selectedTransaction, is_verified: true });
                            setSuccessMessage('Stock in transaction verified successfully');
                            setTimeout(() => setSuccessMessage(''), 3000);
                            fetchTransactions();
                          } else {
                            setError(response.error || 'Failed to verify transaction');
                            setTimeout(() => setError(''), 3000);
                          }
                        } catch (err) {
                          console.error('Error verifying transaction:', err);
                          setError(err.message || 'Failed to verify transaction');
                          setTimeout(() => setError(''), 3000);
                        }
                      }}
                      style={{
                        background: '#ff9800',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fas fa-check-circle"></i>
                      Mark as Verified
                    </button>
                  ) : (
                    <span style={{ color: '#28a745', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-check-circle"></i>
                      Verified
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '12px' }}>
              <button
                onClick={closeViewModal}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockInMaster;

