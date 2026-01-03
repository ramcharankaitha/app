import React, { useState, useEffect, useRef } from 'react';
import { paymentsAPI } from '../services/api';
import './products.css';
import './staff.css';

const PaymentMaster = ({ onBack, onAddPayment, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRefs = useRef({});

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddPayment = () => {
    if (onAddPayment) {
      onAddPayment();
    } else if (onNavigate) {
      onNavigate('addPayment');
    }
  };

  // Fetch payments
  const fetchPayments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await paymentsAPI.getAll();
      if (response && response.success) {
        setPayments(response.payments || []);
        setFilteredPayments(response.payments || []);
        setError('');
      } else if (response && response.error) {
        setError(response.error || 'Failed to load payments');
      } else {
        if (response && response.payments) {
          setPayments(response.payments || []);
          setFilteredPayments(response.payments || []);
          setError('');
        } else {
          setError('Failed to load payments');
        }
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
      if (payments.length === 0) {
        setError('Failed to load payments. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    
    // Refresh on payment created event
    const handlePaymentCreated = () => {
      fetchPayments();
    };
    window.addEventListener('paymentCreated', handlePaymentCreated);
    
    return () => {
      window.removeEventListener('paymentCreated', handlePaymentCreated);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && menuRefs.current[openMenuId] && !menuRefs.current[openMenuId].contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Filter payments based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPayments(payments);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = payments.filter(payment => 
      payment.supplier_name?.toLowerCase().includes(query) ||
      payment.supplier_number?.toLowerCase().includes(query) ||
      payment.chq_number?.toLowerCase().includes(query) ||
      payment.utr?.toLowerCase().includes(query) ||
      payment.created_by?.toLowerCase().includes(query)
    );
    setFilteredPayments(filtered);
  }, [searchQuery, payments]);

  const toggleMenu = (paymentId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === paymentId ? null : paymentId);
  };

  const handleViewPayment = async (payment) => {
    try {
      const response = await paymentsAPI.getById(payment.id);
      if (response.success) {
        setSelectedPayment(response.payment);
        setShowViewModal(true);
      } else {
        setSelectedPayment(payment);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setSelectedPayment(payment);
      setShowViewModal(true);
    }
    setOpenMenuId(null);
  };

  // Handle verify payment
  const handleVerifyPayment = async (payment) => {
    if (payment.is_verified === true) {
      return; // Already verified
    }

    try {
      setError('');
      const response = await paymentsAPI.verify(payment.id);
      if (response.success) {
        setSuccessMessage('Payment verified successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchPayments();
      } else {
        setError(response.error || 'Failed to mark payment as verified');
      }
    } catch (err) {
      console.error('Error marking payment as verified:', err);
      setError(err.message || 'Failed to mark payment as verified');
    }
  };

  const handleEditPayment = (payment) => {
    setOpenMenuId(null);
    if (onNavigate) {
      onNavigate('addPayment', { editId: payment.id });
    }
  };

  const handleDeletePayment = async (payment) => {
    if (!window.confirm(`Are you sure you want to delete payment for ${payment.supplier_name}?`)) {
      setOpenMenuId(null);
      return;
    }

    try {
      const response = await paymentsAPI.delete(payment.id);
      if (response.success) {
        setSuccessMessage('Payment deleted successfully');
        fetchPayments();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.error || 'Failed to delete payment');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError('Failed to delete payment. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
    setOpenMenuId(null);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedPayment(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={() => onNavigate && onNavigate('dashboard')}>
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
                <h1 className="staff-title">Payment Master</h1>
                <p className="staff-subtitle">View and manage all payment records</p>
              </div>
            </div>
            <div className="header-right" style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="add-btn" 
                onClick={async () => {
                  try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/payments/test-notification`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await response.json();
                    if (data.success) {
                      setSuccessMessage('Test notification sent! Check your notifications panel.');
                      setTimeout(() => setSuccessMessage(''), 5000);
                    } else {
                      setError('Failed to send test notification');
                      setTimeout(() => setError(''), 3000);
                    }
                  } catch (err) {
                    console.error('Error sending test notification:', err);
                    setError('Failed to send test notification');
                    setTimeout(() => setError(''), 3000);
                  }
                }}
                style={{ 
                  background: '#ff9800', 
                  border: 'none',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-bell"></i>
                <span>Test Notification</span>
              </button>
              <button className="add-btn" onClick={handleAddPayment}>
                <i className="fas fa-plus"></i>
                <span>Add Payment</span>
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
                placeholder="Search by supplier name, supplier number, CHQ number, UTR..."
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

          {/* Payments List */}
          <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                <p style={{ marginTop: '16px', color: '#666' }}>Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-money-bill-wave" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  {searchQuery ? 'No payments found matching your search.' : 'No payments yet.'}
                </p>
                {!searchQuery && (
                  <button className="add-btn" onClick={handleAddPayment} style={{ marginTop: '16px' }}>
                    <i className="fas fa-plus"></i>
                    <span>Create First Payment</span>
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
                        Supplier Name
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Supplier Number
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        CHQ Number
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        UTR
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Date to be Paid
                      </th>
                      <th style={{ textAlign: 'right', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Amount
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
                    {filteredPayments.map((payment, index) => {
                      return (
                        <tr key={payment.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                            {payment.supplier_name || 'N/A'}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {payment.supplier_number || 'N/A'}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {payment.chq_number || 'N/A'}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {payment.utr || 'N/A'}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {formatDate(payment.date_to_be_paid)}
                          </td>
                          <td style={{ 
                            textAlign: 'right',
                            padding: '12px 8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#28a745'
                          }}>
                            {formatCurrency(payment.amount)}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px'
                          }}>
                            {payment.is_verified === true ? (
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
                                onClick={() => handleViewPayment(payment)}
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
                              <button
                                onClick={() => handleEditPayment(payment)}
                                style={{
                                  background: '#28a745',
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
                                  e.target.style.background = '#218838';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#28a745';
                                }}
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </button>
                              {(payment.is_verified !== true) && (userRole === 'admin' || userRole === 'supervisor') && (
                                <button
                                  onClick={() => handleVerifyPayment(payment)}
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
                              <button
                                onClick={() => handleDeletePayment(payment)}
                                style={{
                                  background: '#dc3545',
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
                                  e.target.style.background = '#c82333';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#dc3545';
                                }}
                              >
                                <i className="fas fa-trash"></i>
                                Delete
                              </button>
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

      {/* View Modal */}
      {showViewModal && selectedPayment && (
        <div 
          className="modal-overlay" 
          onClick={closeViewModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Payment Details</h2>
              <button
                onClick={closeViewModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <strong>Supplier Name:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{selectedPayment.supplier_name || 'N/A'}</p>
              </div>
              <div>
                <strong>Supplier Number:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{selectedPayment.supplier_number || 'N/A'}</p>
              </div>
              <div>
                <strong>CHQ Number:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{selectedPayment.chq_number || 'N/A'}</p>
              </div>
              <div>
                <strong>UTR:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{selectedPayment.utr || 'N/A'}</p>
              </div>
              <div>
                <strong>Date to be Paid:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{formatDate(selectedPayment.date_to_be_paid)}</p>
              </div>
              <div>
                <strong>Amount:</strong>
                <p style={{ margin: '4px 0', color: '#28a745', fontWeight: '600', fontSize: '18px' }}>
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>
              <div>
                <strong>Created At:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{formatDate(selectedPayment.created_at)}</p>
              </div>
              <div>
                <strong>Created By:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{selectedPayment.created_by || 'N/A'}</p>
              </div>
            </div>
            <div style={{ 
              padding: '20px 24px', 
              borderTop: '1px solid #e0e0e0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: '12px',
              background: '#f8f9fa',
              borderRadius: '0 0 8px 8px',
              marginTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(userRole === 'admin' || userRole === 'supervisor') && (
                  selectedPayment.is_verified !== true ? (
                    <button
                      onClick={async () => {
                        try {
                          const response = await paymentsAPI.verify(selectedPayment.id);
                          if (response.success) {
                            setSelectedPayment({ ...selectedPayment, is_verified: true });
                            setSuccessMessage('Payment verified successfully');
                            setTimeout(() => setSuccessMessage(''), 3000);
                            await fetchPayments();
                          } else {
                            setError(response.error || 'Failed to verify payment');
                            setTimeout(() => setError(''), 3000);
                          }
                        } catch (err) {
                          console.error('Error verifying payment:', err);
                          setError(err.message || 'Failed to verify payment');
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
                  )
                )}
              </div>
              <button 
                onClick={closeViewModal}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#5a6268';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#6c757d';
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

export default PaymentMaster;

