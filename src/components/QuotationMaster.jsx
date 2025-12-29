import React, { useState, useEffect, useRef } from 'react';
import { quotationsAPI } from '../services/api';
import './products.css';
import './staff.css';

const QuotationMaster = ({ onBack, onAddQuotation, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRefs = useRef({});

  // Fetch quotations from database
  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      setError('');
      const response = await quotationsAPI.getAll();
      if (response.success) {
        setQuotations(response.quotations || []);
        setFilteredQuotations(response.quotations || []);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
      setError('Failed to load quotations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
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

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddQuotation = () => {
    if (onAddQuotation) {
      onAddQuotation();
    } else if (onNavigate) {
      onNavigate('addQuotation');
    }
  };

  // Filter quotations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuotations(quotations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = quotations.filter(q => 
      (q.item_code || '').toLowerCase().includes(query) ||
      (q.gst_number || '').toLowerCase().includes(query) ||
      (q.quotation_date || '').toLowerCase().includes(query)
    );
    setFilteredQuotations(filtered);
  }, [searchQuery, quotations]);

  // Handle menu toggle
  const toggleMenu = (quotationId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === quotationId ? null : quotationId);
  };

  const handleView = (quotation) => {
    setViewModal(quotation);
    setOpenMenuId(null);
  };

  const closeViewModal = () => {
    setViewModal(null);
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
      {/* Sidebar */}
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

      {/* Main */}
      <div className="dashboard-main">
        <div className="staff-container">
          {/* Header */}
          <header className="staff-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Quotation Master</h1>
              <p className="page-subtitle">Manage quotations</p>
            </div>
          </header>

          {/* Content */}
          <main className="staff-content">
            <div className="staff-top-section">
              <div className="tab-indicator">
                <span className="tab-dot"></span>
                <span className="tab-label">QUOTATION MASTER</span>
              </div>
              <button className="add-staff-btn" onClick={handleAddQuotation}>
                <i className="fas fa-plus"></i>
                <span>Add New Quotation</span>
              </button>
            </div>

            <div className="staff-heading">
              <h2>Quotations</h2>
              <p>View and manage all quotations.</p>
            </div>

            {/* Search */}
            <div className="staff-controls">
              <div className="staff-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by item code, GST number, or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}

            {/* Results Count */}
            <div className="staff-count">
              {`Showing ${filteredQuotations.length} of ${quotations.length} quotations`}
            </div>

            {/* Quotations List */}
            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                  <p style={{ marginTop: '16px', color: '#666' }}>Loading quotations...</p>
                </div>
              ) : quotations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
                  <i className="fas fa-file-invoice" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Quotations Available</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first quotation.</p>
                </div>
              ) : filteredQuotations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                  <p>No quotations found matching your search</p>
                </div>
              ) : (
                <div className="premium-cards-grid">
                  {filteredQuotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      className="premium-identity-card"
                    >
                      {/* Card Header */}
                      <div className="premium-card-header">
                        <div className="premium-header-content">
                          <h3 className="premium-worker-name">Quotation #{quotation.id || 'N/A'}</h3>
                        </div>
                        {/* Floating Three-Dot Menu */}
                        <div 
                          className="premium-card-menu" 
                          ref={el => menuRefs.current[quotation.id] = el}
                        >
                          <button 
                            className="premium-menu-trigger"
                            onClick={(e) => toggleMenu(quotation.id, e)}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {openMenuId === quotation.id && (
                            <div className="premium-menu-dropdown">
                              <div className="premium-menu-item" onClick={() => handleView(quotation)}>
                                <i className="fas fa-eye"></i>
                                <span>View</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="premium-card-body">
                        <div className="premium-info-row">
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-barcode"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Item Code</span>
                              <span className="premium-info-value">{quotation.item_code || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-rupee-sign"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Price</span>
                              <span className="premium-info-value">
                                ₹{parseFloat(quotation.price || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="premium-info-row">
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-boxes"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Quantity</span>
                              <span className="premium-info-value">{quotation.quantity || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="premium-info-item">
                            <div className="premium-info-icon">
                              <i className="fas fa-file-invoice"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">GST Number</span>
                              <span className="premium-info-value">{quotation.gst_number || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="premium-info-row">
                          <div className="premium-info-item" style={{ gridColumn: '1 / -1' }}>
                            <div className="premium-info-icon">
                              <i className="fas fa-calendar-alt"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Date</span>
                              <span className="premium-info-value">{formatDate(quotation.quotation_date)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="premium-info-row">
                          <div className="premium-info-item" style={{ gridColumn: '1 / -1' }}>
                            <div className="premium-info-icon">
                              <i className="fas fa-calculator"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Total Price</span>
                              <span className="premium-info-value" style={{ fontSize: '20px', color: '#dc3545', fontWeight: '700' }}>
                                ₹{parseFloat(quotation.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Quotation Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>QT</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">GST Number:</span>
                    <span className="detail-value">{viewModal.gst_number || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of Quotation:</span>
                    <span className="detail-value">{formatDate(viewModal.quotation_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Price:</span>
                    <span className="detail-value" style={{ fontSize: '18px', fontWeight: '700', color: '#dc3545' }}>
                      ₹{parseFloat(viewModal.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Items List */}
              {viewModal.items && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e0e0e0' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#333' }}>Items</h3>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>#</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Item Code</th>
                          <th style={{ padding: '10px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#666' }}>Product Name</th>
                          <th style={{ padding: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#666' }}>Quantity</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#666' }}>Price</th>
                          <th style={{ padding: '10px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#666' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let items = [];
                          if (viewModal.items) {
                            if (typeof viewModal.items === 'string') {
                              try {
                                items = JSON.parse(viewModal.items);
                              } catch (e) {
                                console.error('Error parsing items:', e);
                              }
                            } else if (Array.isArray(viewModal.items)) {
                              items = viewModal.items;
                            }
                          }
                          return items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '10px', color: '#666' }}>{index + 1}</td>
                              <td style={{ padding: '10px', fontWeight: '500', color: '#333' }}>{item.itemCode || 'N/A'}</td>
                              <td style={{ padding: '10px', color: '#333' }}>{item.productName || 'N/A'}</td>
                              <td style={{ padding: '10px', textAlign: 'center', color: '#666' }}>{item.quantity || 'N/A'}</td>
                              <td style={{ padding: '10px', textAlign: 'right', color: '#666' }}>
                                ₹{parseFloat(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#28a745' }}>
                                ₹{parseFloat(item.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="modal-close-button" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationMaster;

