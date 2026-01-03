import React, { useState, useEffect, useRef } from 'react';
import { purchaseOrdersAPI } from '../services/api';
import './products.css';
import './staff.css';

const PurchaseOrderMaster = ({ onBack, onAddPurchaseOrder, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const menuRefs = useRef({});

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddPurchaseOrder = () => {
    if (onAddPurchaseOrder) {
      onAddPurchaseOrder();
    } else if (onNavigate) {
      onNavigate('addPurchaseOrder');
    }
  };

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await purchaseOrdersAPI.getAll();
      if (response && response.success) {
        setPurchaseOrders(response.orders || []);
        setFilteredOrders(response.orders || []);
        setError(''); // Clear any previous errors
      } else if (response && response.error) {
        // If response has an error field, show it
        setError(response.error || 'Failed to load purchase orders');
      } else {
        // If response doesn't have success or error, check if orders exist
        if (response && response.orders) {
          setPurchaseOrders(response.orders || []);
          setFilteredOrders(response.orders || []);
          setError('');
        } else {
          setError('Failed to load purchase orders');
        }
      }
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
      // Only set error if we don't have any orders to display
      if (purchaseOrders.length === 0) {
        setError('Failed to load purchase orders. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
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

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(purchaseOrders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = purchaseOrders.filter(order => 
      order.order_number?.toLowerCase().includes(query) ||
      order.supplier_name?.toLowerCase().includes(query) ||
      order.status?.toLowerCase().includes(query) ||
      order.created_by?.toLowerCase().includes(query)
    );
    setFilteredOrders(filtered);
  }, [searchQuery, purchaseOrders]);

  const toggleMenu = (orderId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === orderId ? null : orderId);
  };

  const handleViewOrder = async (order) => {
    try {
      // Fetch full order details
      const response = await purchaseOrdersAPI.getById(order.id);
      if (response.success) {
        setSelectedOrder(response.order);
        setShowViewModal(true);
      } else {
        // Fallback to the order from list
        setSelectedOrder(order);
        setShowViewModal(true);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      // Fallback to the order from list
      setSelectedOrder(order);
      setShowViewModal(true);
    }
    setOpenMenuId(null);
  };

  // Handle verify order
  const handleVerifyOrder = async (order) => {
    if (order.is_verified === true) {
      return; // Already verified
    }

    try {
      setError('');
      const response = await purchaseOrdersAPI.verify(order.id);
      if (response.success) {
        setSuccessMessage('Purchase order verified successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        await fetchPurchaseOrders();
      } else {
        setError(response.error || 'Failed to mark order as verified');
      }
    } catch (err) {
      console.error('Error marking order as verified:', err);
      setError(err.message || 'Failed to mark order as verified');
    }
  };

  const handleEditOrder = async (order) => {
    setOpenMenuId(null);
    try {
      const response = await purchaseOrdersAPI.getById(order.id);
      if (response.success) {
        setEditOrderModal(response.order);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details');
    }
  };


  const closeEditModal = () => {
    setEditOrderModal(null);
  };

  const handleEditInputChange = (field, value) => {
    if (editOrderModal) {
      setEditOrderModal({
        ...editOrderModal,
        [field]: value
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editOrderModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await purchaseOrdersAPI.update(editOrderModal.id, {
        supplierName: editOrderModal.supplier_name,
        supplierNumber: editOrderModal.supplier_number,
        handlerName: editOrderModal.handler_name,
        poNumber: editOrderModal.po_number,
        orderDate: editOrderModal.order_date,
        expectedDeliveryDate: editOrderModal.expected_delivery_date,
        status: editOrderModal.status
      });
      
      if (response.success) {
        await fetchPurchaseOrders();
        setEditOrderModal(null);
        setSuccessMessage('Purchase order updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update purchase order');
      }
    } catch (err) {
      console.error('Error updating purchase order:', err);
      setError(err.message || 'Failed to update purchase order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendSMS = async (order) => {
    setOpenMenuId(null);
    try {
      const response = await purchaseOrdersAPI.sendSMS(order.id);
      if (response.success) {
        setSuccessMessage('SMS sent successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to send SMS');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error sending SMS:', err);
      setError('Failed to send SMS');
      setTimeout(() => setError(''), 3000);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedOrder(null);
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
                <h1 className="staff-title">Purchase Order Master</h1>
                <p className="staff-subtitle">View and manage all purchase orders</p>
              </div>
            </div>
            <div className="header-right">
              <button className="add-btn" onClick={handleAddPurchaseOrder}>
                <i className="fas fa-plus"></i>
                <span>Add Purchase Order</span>
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
                placeholder="Search by order number, supplier name, status, or created by..."
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

          {/* Purchase Orders List */}
          <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                <p style={{ marginTop: '16px', color: '#666' }}>Loading purchase orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-shopping-cart" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  {searchQuery ? 'No purchase orders found matching your search.' : 'No purchase orders yet.'}
                </p>
                {!searchQuery && (
                  <button className="add-btn" onClick={handleAddPurchaseOrder} style={{ marginTop: '16px' }}>
                    <i className="fas fa-plus"></i>
                    <span>Create First Purchase Order</span>
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
                        PO Number
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Supplier
                      </th>
                      <th style={{ textAlign: 'right', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Total Amount
                      </th>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Items
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Date
                      </th>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Status
                      </th>
                      <th style={{ textAlign: 'center', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', width: '250px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, index) => (
                      <tr key={order.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                          #{order.order_number || `PO-${order.id}`}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {order.supplier_name || 'N/A'}
                        </td>
                        <td style={{ 
                          textAlign: 'right',
                          padding: '12px 8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#333'
                        }}>
                          ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {order.items_count || 0} items
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {formatDate(order.created_at)}
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          padding: '12px 8px',
                          fontSize: '14px'
                        }}>
                          {order.is_verified === true ? (
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
                              onClick={() => handleViewOrder(order)}
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
                              onClick={() => handleEditOrder(order)}
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
                            {(order.is_verified !== true) && (userRole === 'admin' || userRole === 'supervisor') && (
                              <button
                                onClick={() => handleVerifyOrder(order)}
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      {editOrderModal && (
        <div
          className="modal-overlay"
          onClick={closeEditModal}
        >
          <div
            className="customer-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Edit Purchase Order</h2>
              <button
                className="modal-close-button"
                onClick={closeEditModal}
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
            <div className="modal-body" style={{ padding: '24px' }}>
              <div className="customer-detail-section" style={{ padding: '0' }}>
                <div className="detail-info" style={{ padding: '0', margin: '0' }}>
                  <div className="detail-row" style={{ marginBottom: '20px', padding: '0' }}>
                    <span className="detail-label" style={{ minWidth: '180px', marginRight: '16px' }}>Supplier Name:</span>
                    <input
                      type="text"
                      value={editOrderModal.supplier_name || ''}
                      onChange={(e) => handleEditInputChange('supplier_name', e.target.value)}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '350px',
                        flex: '1'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '20px', padding: '0' }}>
                    <span className="detail-label" style={{ minWidth: '180px', marginRight: '16px' }}>Supplier Number:</span>
                    <input
                      type="tel"
                      value={editOrderModal.supplier_number || ''}
                      onChange={(e) => handleEditInputChange('supplier_number', e.target.value)}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '350px',
                        flex: '1'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '20px', padding: '0' }}>
                    <span className="detail-label" style={{ minWidth: '180px', marginRight: '16px' }}>Handler Name:</span>
                    <input
                      type="text"
                      value={editOrderModal.handler_name || ''}
                      onChange={(e) => handleEditInputChange('handler_name', e.target.value)}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '350px',
                        flex: '1'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '20px', padding: '0' }}>
                    <span className="detail-label" style={{ minWidth: '180px', marginRight: '16px' }}>PO Number:</span>
                    <input
                      type="text"
                      value={editOrderModal.po_number || ''}
                      onChange={(e) => handleEditInputChange('po_number', e.target.value)}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '350px',
                        flex: '1'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '20px', padding: '0' }}>
                    <span className="detail-label" style={{ minWidth: '180px', marginRight: '16px' }}>Order Date:</span>
                    <input
                      type="date"
                      value={editOrderModal.order_date ? (editOrderModal.order_date.includes('T') ? editOrderModal.order_date.split('T')[0] : editOrderModal.order_date) : ''}
                      onChange={(e) => handleEditInputChange('order_date', e.target.value)}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '350px',
                        flex: '1'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '20px', padding: '0' }}>
                    <span className="detail-label" style={{ minWidth: '180px', marginRight: '16px' }}>Expected Delivery Date:</span>
                    <input
                      type="date"
                      value={editOrderModal.expected_delivery_date ? (editOrderModal.expected_delivery_date.includes('T') ? editOrderModal.expected_delivery_date.split('T')[0] : editOrderModal.expected_delivery_date) : ''}
                      onChange={(e) => handleEditInputChange('expected_delivery_date', e.target.value)}
                      min={editOrderModal.order_date ? (editOrderModal.order_date.includes('T') ? editOrderModal.order_date.split('T')[0] : editOrderModal.order_date) : ''}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '350px',
                        flex: '1'
                      }}
                    />
                  </div>
                  <div className="detail-row" style={{ marginBottom: '20px', padding: '0' }}>
                    <span className="detail-label" style={{ minWidth: '180px', marginRight: '16px' }}>Status:</span>
                    <select
                      value={editOrderModal.status || 'pending'}
                      onChange={(e) => handleEditInputChange('status', e.target.value)}
                      style={{
                        padding: '10px 14px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '350px',
                        flex: '1',
                        background: '#fff'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '20px 24px', borderTop: '1px solid #e0e0e0' }}>
              <button 
                className="modal-close-button" 
                onClick={closeEditModal}
                style={{ background: '#6c757d', color: '#fff' }}
              >
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{ 
                  background: '#dc3545', 
                  color: '#fff',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1
                }}
              >
                {isSaving ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
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
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Purchase Order Details</h2>
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
                <strong>Order Number:</strong> {selectedOrder.order_number || `PO-${selectedOrder.id}`}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Supplier:</strong> {selectedOrder.supplier_name || 'N/A'}
                </div>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Supplier Number:</strong> {selectedOrder.supplier_number || 'N/A'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Handler Name:</strong> {selectedOrder.handler_name || 'N/A'}
                </div>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>PO Number:</strong> {selectedOrder.po_number || 'N/A'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Order Date:</strong> {selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleDateString('en-IN') : 'N/A'}
                </div>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Expected Delivery:</strong> {selectedOrder.expected_delivery_date ? new Date(selectedOrder.expected_delivery_date).toLocaleDateString('en-IN') : 'N/A'}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Status:</strong> {selectedOrder.status || 'Pending'}
                </div>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Total Amount:</strong> ₹{parseFloat(selectedOrder.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              
              {/* Items List */}
              {selectedOrder.items && (() => {
                const items = typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items;
                return items.length > 0 ? (
                  <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '12px' }}>Order Items:</strong>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#e9ecef', borderBottom: '2px solid #dee2e6' }}>
                            <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>#</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>Item Code</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px' }}>Product Name</th>
                            <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Qty</th>
                            <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Unit Price</th>
                            <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                              <td style={{ padding: '8px', fontSize: '13px' }}>{index + 1}</td>
                              <td style={{ padding: '8px', fontSize: '13px' }}>{item.itemCode || item.item_code || 'N/A'}</td>
                              <td style={{ padding: '8px', fontSize: '13px' }}>{item.productName || item.product_name || 'N/A'}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>{item.quantity || 0}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>₹{parseFloat(item.unitPrice || item.mrp || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold' }}>₹{parseFloat(item.totalPrice || (item.quantity || 0) * (item.unitPrice || item.mrp || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null;
              })()}
              
              {selectedOrder.notes && (
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Notes:</strong> {selectedOrder.notes}
                </div>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Created By:</strong> {selectedOrder.created_by || 'System'}
                </div>
                <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <strong>Date & Time:</strong> {formatDate(selectedOrder.created_at)}
                </div>
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
              borderRadius: '0 0 16px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(userRole === 'admin' || userRole === 'supervisor') && (
                  selectedOrder.is_verified !== true ? (
                    <button
                      onClick={async () => {
                        try {
                          const response = await purchaseOrdersAPI.verify(selectedOrder.id);
                          if (response.success) {
                            setSelectedOrder({ ...selectedOrder, is_verified: true });
                            setSuccessMessage('Purchase order verified successfully');
                            setTimeout(() => setSuccessMessage(''), 3000);
                            await fetchPurchaseOrders();
                          } else {
                            setError(response.error || 'Failed to verify purchase order');
                            setTimeout(() => setError(''), 3000);
                          }
                        } catch (err) {
                          console.error('Error verifying purchase order:', err);
                          setError(err.message || 'Failed to verify purchase order');
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

export default PurchaseOrderMaster;

