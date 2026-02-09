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
  const [editPaymentModal, setEditPaymentModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleEditPayment = async (payment) => {
    setOpenMenuId(null);
    try {
      const response = await paymentsAPI.getById(payment.id);
      if (response.success) {
        setEditPaymentModal(response.payment);
      } else {
        setError('Failed to fetch payment details');
      }
    } catch (err) {
      console.error('Error fetching payment details for edit:', err);
      setError('Failed to fetch payment details');
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editPaymentModal) {
      setEditPaymentModal(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle save changes in edit modal
  const handleSavePaymentDetails = async () => {
    if (!editPaymentModal) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const paymentData = {
        supplierName: editPaymentModal.supplier_name,
        chqNumber: editPaymentModal.chq_number || null,
        utr: editPaymentModal.utr || null,
        dateToBePaid: editPaymentModal.date_to_be_paid,
        amount: editPaymentModal.amount
      };

      const response = await paymentsAPI.update(editPaymentModal.id, paymentData);

      if (response.success) {
        setSuccessMessage('Payment updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchPayments(); // Refresh list
        closeEditModal();
      } else {
        setError(response.error || 'Failed to update payment');
      }
    } catch (err) {
      console.error('Error saving payment details:', err);
      setError(err.message || 'Failed to update payment');
    } finally {
      setIsSaving(false);
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditPaymentModal(null);
    setError('');
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
              </div>
            </div>
            <div className="header-right">
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

      {/* Edit Payment Modal */}
      {editPaymentModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Payment Details</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '15px' }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{editPaymentModal.supplier_name
                    ? editPaymentModal.supplier_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'PY'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Supplier Name:</span>
                    <input
                      type="text"
                      value={editPaymentModal.supplier_name || ''}
                      onChange={(e) => handleEditInputChange('supplier_name', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Cheque Number:</span>
                    <input
                      type="text"
                      value={editPaymentModal.chq_number || ''}
                      onChange={(e) => handleEditInputChange('chq_number', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">UTR:</span>
                    <input
                      type="text"
                      value={editPaymentModal.utr || ''}
                      onChange={(e) => handleEditInputChange('utr', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date to be Paid:</span>
                    <input
                      type="date"
                      value={editPaymentModal.date_to_be_paid ? new Date(editPaymentModal.date_to_be_paid).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleEditInputChange('date_to_be_paid', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Amount:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editPaymentModal.amount || ''}
                      onChange={(e) => handleEditInputChange('amount', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    />
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      {editPaymentModal.is_verified === false ? (
                        <span style={{ color: '#dc3545', fontWeight: '600' }}>Not Verified</span>
                      ) : (
                        <span style={{ color: '#28a745', fontWeight: '600' }}>Verified</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleSavePaymentDetails} disabled={isSaving} style={{
                padding: '10px 20px',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isSaving ? 0.6 : 1
              }}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={closeEditModal} disabled={isSaving} style={{
                padding: '10px 20px',
                background: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMaster;

