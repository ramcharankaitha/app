import React, { useState, useEffect, useRef } from 'react';
import { quotationsAPI, purchaseOrdersAPI, salesOrdersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './products.css';
import './staff.css';

const QuotationMaster = ({ onBack, onAddQuotation, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [editQuotationModal, setEditQuotationModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversionModal, setConversionModal] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
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
      (q.customer_name || '').toLowerCase().includes(query) ||
      (q.customer_number || '').toLowerCase().includes(query) ||
      (q.item_code || '').toLowerCase().includes(query) ||
      (q.gst_number || '').toLowerCase().includes(query) ||
      (q.created_at || '').toLowerCase().includes(query)
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

  // Handle verify quotation
  const handleVerifyQuotation = async (quotation) => {
    if (quotation.is_verified === true) {
      return; // Already verified
    }

    try {
      setError('');
      const response = await quotationsAPI.verify(quotation.id);
      if (response.success) {
        setSuccessMessage('Quotation verified successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchQuotations();
      } else {
        setError(response.error || 'Failed to mark quotation as verified');
      }
    } catch (err) {
      console.error('Error marking quotation as verified:', err);
      setError(err.message || 'Failed to mark quotation as verified');
    }
  };

  const handleEdit = async (quotation) => {
    setOpenMenuId(null);
    try {
      const response = await quotationsAPI.getById(quotation.id);
      if (response.success) {
        setEditQuotationModal(response.quotation);
      } else {
        setError('Failed to fetch quotation details');
      }
    } catch (err) {
      console.error('Error fetching quotation details for edit:', err);
      setError('Failed to fetch quotation details');
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editQuotationModal) {
      setEditQuotationModal(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle save changes in edit modal
  const handleSaveQuotationDetails = async () => {
    if (!editQuotationModal) return;

    setIsSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Parse items if it's a string
      let items = [];
      if (editQuotationModal.items) {
        if (typeof editQuotationModal.items === 'string') {
          items = JSON.parse(editQuotationModal.items);
        } else if (Array.isArray(editQuotationModal.items)) {
          items = editQuotationModal.items;
        }
      }

      // Calculate total price from items if not provided
      let totalPrice = editQuotationModal.total_price;
      if (!totalPrice && items.length > 0) {
        totalPrice = items.reduce((total, item) => {
          const price = parseFloat(item.price) || 0;
          const quantity = parseFloat(item.quantity) || 0;
          return total + (price * quantity);
        }, 0);
      }

      const quotationData = {
        itemCode: editQuotationModal.item_code || '',
        price: items.length > 0 ? items[0].price : editQuotationModal.price || 0,
        quantity: items.length > 0 ? items[0].quantity : editQuotationModal.quantity || 0,
        gstNumber: editQuotationModal.gst_number || '',
        quotationDate: editQuotationModal.quotation_date || new Date().toISOString().split('T')[0],
        totalPrice: totalPrice || 0
      };

      const response = await quotationsAPI.update(editQuotationModal.id, quotationData);

      if (response.success) {
        setSuccessMessage('Quotation updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchQuotations(); // Refresh list
        closeEditModal();
      } else {
        setError(response.error || 'Failed to update quotation');
      }
    } catch (err) {
      console.error('Error saving quotation details:', err);
      setError(err.message || 'Failed to update quotation');
    } finally {
      setIsSaving(false);
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditQuotationModal(null);
    setError('');
  };

  const closeViewModal = () => {
    setViewModal(null);
  };

  const handleApprove = async (quotation) => {
    setConfirmState({
      open: true,
      message: `Approve quotation #${quotation.id}?`,
      onConfirm: async () => {
        try {
          setError('');
          const response = await quotationsAPI.approve(quotation.id);
          if (response.success) {
            // Show conversion modal after approval
            setConversionModal(quotation);
            await fetchQuotations(); // Refresh list
          } else {
            setError(response.error || 'Failed to approve quotation');
          }
        } catch (err) {
          console.error('Approve quotation error:', err);
          setError(err.message || 'Failed to approve quotation');
        } finally {
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const handleDelete = async (quotation) => {
    setConfirmState({
      open: true,
      message: `Delete quotation #${quotation.id}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError('');
          const response = await quotationsAPI.delete(quotation.id);
          if (response.success) {
            await fetchQuotations(); // Refresh list
          } else {
            setError(response.error || 'Failed to delete quotation');
          }
        } catch (err) {
          console.error('Delete quotation error:', err);
          setError(err.message || 'Failed to delete quotation');
        } finally {
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const handleConvertToPurchaseOrder = async (quotation) => {
    try {
      setError('');
      setIsLoading(true);
      
      // Parse items from quotation
      let items = [];
      if (quotation.items) {
        if (typeof quotation.items === 'string') {
          items = JSON.parse(quotation.items);
        } else if (Array.isArray(quotation.items)) {
          items = quotation.items;
        }
      }

      // Convert quotation items to purchase order items format
      const poItems = items.map(item => ({
        itemCode: item.itemCode,
        productName: item.productName,
        skuCode: item.skuCode || '',
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.totalPrice || (item.quantity * item.price)
      }));

      const getUserIdentifier = () => {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            return userData.username || userData.email || userData.full_name || 'system';
          } catch (e) {
            return 'system';
          }
        }
        return 'system';
      };

      const response = await purchaseOrdersAPI.create({
        supplierName: quotation.customer_name || 'N/A',
        supplierNumber: quotation.customer_number || null,
        orderDate: new Date().toISOString().split('T')[0],
        items: poItems,
        totalAmount: quotation.total_price || 0,
        createdBy: getUserIdentifier()
      });

      if (response.success) {
        setConversionModal(null);
        if (onNavigate) {
          onNavigate('purchaseOrderMaster');
        }
      } else {
        setError(response.error || 'Failed to create purchase order');
      }
    } catch (err) {
      console.error('Convert to purchase order error:', err);
      setError(err.message || 'Failed to create purchase order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToSalesOrder = async (quotation) => {
    try {
      setError('');
      setIsLoading(true);
      
      // Parse items from quotation
      let items = [];
      if (quotation.items) {
        if (typeof quotation.items === 'string') {
          items = JSON.parse(quotation.items);
        } else if (Array.isArray(quotation.items)) {
          items = quotation.items;
        }
      }

      // Convert quotation items to sales order products format
      const products = items.map(item => ({
        itemCode: item.itemCode,
        productName: item.productName,
        quantity: item.quantity,
        sellRate: item.price,
        mrp: item.price
      }));

      const getUserIdentifier = () => {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            return userData.username || userData.email || userData.full_name || 'system';
          } catch (e) {
            return 'system';
          }
        }
        return 'system';
      };

      const response = await salesOrdersAPI.create({
        customerName: quotation.customer_name || 'N/A',
        customerContact: quotation.customer_number || '',
        dateOfDuration: new Date().toISOString().split('T')[0],
        products: products,
        totalAmount: quotation.total_price || 0,
        createdBy: getUserIdentifier()
      });

      if (response.success) {
        setConversionModal(null);
        if (onNavigate) {
          onNavigate('salesOrderMaster');
        }
      } else {
        setError(response.error || 'Failed to create sales order');
      }
    } catch (err) {
      console.error('Convert to sales order error:', err);
      setError(err.message || 'Failed to create sales order');
    } finally {
      setIsLoading(false);
    }
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
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
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
                    placeholder="Search by customer name, number, item code, or date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
            </div>

            {/* Messages */}
            {successMessage && (
              <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px' }}>
                <i className="fas fa-check-circle"></i> {successMessage}
              </div>
            )}
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
                          Quotation ID
                        </th>
                        <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Customer Name
                        </th>
                        <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Customer Number
                        </th>
                        <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          GST Number
                        </th>
                        <th style={{ textAlign: 'right', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Total Price
                        </th>
                        <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Creation Date
                        </th>
                        <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Status
                        </th>
                        <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '300px' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuotations.map((quotation, index) => (
                        <tr key={quotation.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                            fontWeight: '600',
                            color: '#333'
                          }}>
                            #{quotation.id || 'N/A'}
                            {quotation.status === 'approved' && (
                              <span style={{ 
                                fontSize: '10px', 
                                color: '#28a745', 
                                fontWeight: '600',
                                marginLeft: '8px',
                                display: 'inline-block'
                              }}>
                                <i className="fas fa-check-circle"></i> Approved
                              </span>
                            )}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#333'
                          }}>
                            {quotation.customer_name || 'N/A'}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {quotation.customer_number || 'N/A'}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {quotation.gst_number || 'N/A'}
                          </td>
                          <td style={{ 
                            textAlign: 'right',
                            padding: '12px 8px',
                            fontSize: '14px',
                            fontWeight: '700',
                            color: '#dc3545'
                          }}>
                            ₹{parseFloat(quotation.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {formatDate(quotation.created_at)}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px',
                            fontSize: '14px'
                          }}>
                            {quotation.is_verified === true ? (
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
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => handleView(quotation)}
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
                                onClick={() => handleEdit(quotation)}
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
                              {quotation.status !== 'approved' && (
                                <button
                                  onClick={() => handleApprove(quotation)}
                                  style={{
                                    background: '#ffc107',
                                    color: '#333',
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
                                    e.target.style.background = '#e0a800';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.background = '#ffc107';
                                  }}
                                >
                                  <i className="fas fa-check"></i>
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(quotation)}
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
                      ))}
                    </tbody>
                  </table>
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
                    <span className="detail-label">Customer Name:</span>
                    <span className="detail-value">{viewModal.customer_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Customer Number:</span>
                    <span className="detail-value">{viewModal.customer_number || 'N/A'}</span>
                  </div>
                  {viewModal.gst_number && (
                    <div className="detail-row">
                      <span className="detail-label">GST Number:</span>
                      <span className="detail-value">{viewModal.gst_number}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Creation Date:</span>
                    <span className="detail-value">{formatDate(viewModal.created_at)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Price:</span>
                    <span className="detail-value" style={{ fontSize: '18px', fontWeight: '700', color: '#dc3545' }}>
                      ₹{parseFloat(viewModal.total_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {viewModal.created_by && (
                    <div className="detail-row">
                      <span className="detail-label">Created By:</span>
                      <span className="detail-value">{viewModal.created_by}</span>
                    </div>
                  )}
                  {(userRole === 'admin' || userRole === 'supervisor') && (
                    <div className="detail-row" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                      {viewModal.is_verified !== true ? (
                        <button
                          onClick={async () => {
                            try {
                              const response = await quotationsAPI.verify(viewModal.id);
                              if (response.success) {
                                setViewModal({ ...viewModal, is_verified: true });
                                setSuccessMessage('Quotation verified successfully');
                                setTimeout(() => setSuccessMessage(''), 3000);
                                await fetchQuotations();
                              } else {
                                setError(response.error || 'Failed to verify quotation');
                                setTimeout(() => setError(''), 3000);
                              }
                            } catch (err) {
                              console.error('Verify quotation error:', err);
                              setError(err.message || 'Failed to verify quotation');
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

      {/* Conversion Modal */}
      {conversionModal && (
        <div className="modal-overlay" onClick={() => setConversionModal(null)}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Convert Quotation to Order</h2>
              <button className="modal-close-btn" onClick={() => setConversionModal(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content" style={{ padding: '24px' }}>
              <p style={{ marginBottom: '24px', color: '#666' }}>
                Quotation #{conversionModal.id} has been approved. Choose how you want to proceed:
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  onClick={() => handleConvertToPurchaseOrder(conversionModal)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.background = '#0056b3';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.background = '#007bff';
                    }
                  }}
                >
                  <i className="fas fa-shopping-cart"></i>
                  Convert to Purchase Order
                </button>
                
                <button
                  onClick={() => handleConvertToSalesOrder(conversionModal)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    opacity: isLoading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.background = '#218838';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.background = '#28a745';
                    }
                  }}
                >
                  <i className="fas fa-file-invoice-dollar"></i>
                  Convert to Sales Order
                </button>
                
                <button
                  onClick={() => setConversionModal(null)}
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'transparent',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    marginTop: '8px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quotation Modal */}
      {editQuotationModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Quotation Details</h2>
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
                  <span>{editQuotationModal.customer_name
                    ? editQuotationModal.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'QT'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Customer Name:</span>
                    <input
                      type="text"
                      value={editQuotationModal.customer_name || ''}
                      onChange={(e) => handleEditInputChange('customer_name', e.target.value)}
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
                    <span className="detail-label">Customer Number:</span>
                    <input
                      type="text"
                      value={editQuotationModal.customer_number || ''}
                      onChange={(e) => handleEditInputChange('customer_number', e.target.value)}
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
                    <span className="detail-label">Item Code:</span>
                    <input
                      type="text"
                      value={editQuotationModal.item_code || ''}
                      onChange={(e) => handleEditInputChange('item_code', e.target.value)}
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
                    <span className="detail-label">GST Number:</span>
                    <input
                      type="text"
                      value={editQuotationModal.gst_number || ''}
                      onChange={(e) => handleEditInputChange('gst_number', e.target.value)}
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
                    <span className="detail-label">Quotation Date:</span>
                    <input
                      type="date"
                      value={editQuotationModal.quotation_date ? new Date(editQuotationModal.quotation_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleEditInputChange('quotation_date', e.target.value)}
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
                    <span className="detail-label">Total Price:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editQuotationModal.total_price || ''}
                      onChange={(e) => handleEditInputChange('total_price', e.target.value)}
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
                      {editQuotationModal.is_verified === false ? (
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
              <button onClick={handleSaveQuotationDetails} disabled={isSaving} style={{
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

export default QuotationMaster;

