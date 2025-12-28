import React, { useState, useEffect, useRef } from 'react';
import { suppliersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './suppliers.css';

const Suppliers = ({ onBack, onAddSupplier, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewSupplierModal, setViewSupplierModal] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null, supplier: null });
  const menuRefs = useRef({});

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('masterMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddSupplier = () => {
    if (onAddSupplier) {
      onAddSupplier();
    } else if (onNavigate) {
      onNavigate('addSupplier');
    }
  };

  const handleManagers = () => {
    if (onNavigate) {
      onNavigate('users');
    }
  };

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
    }
  };

  const handleStaff = () => {
    if (onNavigate) {
      onNavigate('staff');
    }
  };

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
    }
  };

  const handleChitPlans = () => {
    if (onNavigate) {
      onNavigate('chitPlans');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Fetch suppliers from database
  const fetchSuppliers = async () => {
    try {
      setError('');
      const response = await suppliersAPI.getAll();
      if (response.success) {
        setSuppliers(response.suppliers || []);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to load suppliers. Please try again.');
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.phone1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handle menu toggle
  const toggleMenu = (supplierId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === supplierId ? null : supplierId);
  };

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

  // Handle view supplier details
  const handleViewSupplierDetails = async (supplier) => {
    setOpenMenuId(null);
    try {
      const response = await suppliersAPI.getById(supplier.id);
      if (response.success) {
        setViewSupplierModal(response.supplier);
      } else {
        setError('Failed to fetch supplier details');
      }
    } catch (err) {
      console.error('Error fetching supplier details:', err);
      setError('Failed to fetch supplier details');
    }
  };

  const closeViewModal = () => {
    setViewSupplierModal(null);
  };

  // Handle delete supplier
  const handleDeleteSupplier = (supplier) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete "${supplier.supplier_name}"? This action cannot be undone.`,
      supplier: supplier,
      onConfirm: async () => {
        try {
          const response = await suppliersAPI.delete(supplier.id);
          if (response.success) {
            setSuccessMessage('Supplier deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            await fetchSuppliers();
            setConfirmState({ open: false, message: '', onConfirm: null, supplier: null });
          } else {
            setError('Failed to delete supplier');
            setConfirmState({ open: false, message: '', onConfirm: null, supplier: null });
          }
        } catch (err) {
          setError(err.message || 'Failed to delete supplier');
          setConfirmState({ open: false, message: '', onConfirm: null, supplier: null });
        }
      }
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
          <div className="nav-item" onClick={handleManagers}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
        </div>
        <div className="nav-item" onClick={handleSettings}>
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
        <button className="back-btn" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <div className="header-content">
          <h1 className="page-title">Supply Master</h1>
          <p className="page-subtitle">Manage suppliers</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">SUPPLIERS</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddSupplier}>
            <i className="fas fa-plus"></i>
            <span>Add New Supplier</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Suppliers</h2>
          <p>View suppliers, their contact information, and addresses. Filter quickly.</p>
        </div>

        {/* Search and Filter */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search name, phone, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredSuppliers.length} of ${suppliers.length} suppliers`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {/* Suppliers List */}
        <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
          {suppliers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-truck" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Suppliers Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first supplier to the system.</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No suppliers found matching your search</p>
            </div>
          ) : (
            <div className="premium-cards-grid">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="premium-identity-card"
                >
                  {/* Card Header */}
                  <div className="premium-card-header">
                    <div className="premium-header-content">
                      <h3 className="premium-worker-name">{supplier.supplier_name || 'N/A'}</h3>
                    </div>
                    {/* Floating Three-Dot Menu */}
                    <div 
                      className="premium-card-menu" 
                      ref={el => menuRefs.current[supplier.id] = el}
                    >
                      <button 
                        className="premium-menu-trigger"
                        onClick={(e) => toggleMenu(supplier.id, e)}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {openMenuId === supplier.id && (
                        <div className="premium-menu-dropdown">
                          <div className="premium-menu-item" onClick={() => handleViewSupplierDetails(supplier)}>
                            <i className="fas fa-eye"></i>
                            <span>View</span>
                          </div>
                          <div className="premium-menu-item premium-menu-item-danger" onClick={() => handleDeleteSupplier(supplier)}>
                            <i className="fas fa-trash"></i>
                            <span>Delete</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body - Two Column Layout */}
                  <div className="premium-card-body">
                    <div className="premium-info-row">
                      <div className="premium-info-item">
                        <div className="premium-info-icon">
                          <i className="fas fa-phone"></i>
                        </div>
                        <div className="premium-info-content">
                          <span className="premium-info-label">Phone</span>
                          <span className="premium-info-value">{supplier.phone || supplier.phone1 || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {supplier.address && (
                      <div className="premium-info-row" style={{ marginTop: '16px' }}>
                        <div className="premium-info-item">
                          <div className="premium-info-icon">
                            <i className="fas fa-map-marker-alt"></i>
                          </div>
                          <div className="premium-info-content">
                            <span className="premium-info-label">Address</span>
                            <span className="premium-info-value">{supplier.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Delete Supplier"
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null, supplier: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* View Supplier Details Modal */}
      {viewSupplierModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Supplier Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewSupplierModal.supplier_name 
                    ? viewSupplierModal.supplier_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'SU'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Supplier Name:</span>
                    <span className="detail-value">{viewSupplierModal.supplier_name || 'N/A'}</span>
                  </div>
                  {viewSupplierModal.phone1 && (
                    <div className="detail-row">
                      <span className="detail-label">Phone 1:</span>
                      <span className="detail-value">{viewSupplierModal.phone1}</span>
                    </div>
                  )}
                  {viewSupplierModal.phone2 && (
                    <div className="detail-row">
                      <span className="detail-label">Phone 2:</span>
                      <span className="detail-value">{viewSupplierModal.phone2}</span>
                    </div>
                  )}
                  {viewSupplierModal.phone3 && (
                    <div className="detail-row">
                      <span className="detail-label">Phone 3:</span>
                      <span className="detail-value">{viewSupplierModal.phone3}</span>
                    </div>
                  )}
                  {viewSupplierModal.phone && !viewSupplierModal.phone1 && (
                    <div className="detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{viewSupplierModal.phone}</span>
                    </div>
                  )}
                  {viewSupplierModal.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{viewSupplierModal.address}</span>
                    </div>
                  )}
                  {viewSupplierModal.city && (
                    <div className="detail-row">
                      <span className="detail-label">City:</span>
                      <span className="detail-value">{viewSupplierModal.city}</span>
                    </div>
                  )}
                  {viewSupplierModal.state && (
                    <div className="detail-row">
                      <span className="detail-label">State:</span>
                      <span className="detail-value">{viewSupplierModal.state}</span>
                    </div>
                  )}
                  {viewSupplierModal.pincode && (
                    <div className="detail-row">
                      <span className="detail-label">Pincode:</span>
                      <span className="detail-value">{viewSupplierModal.pincode}</span>
                    </div>
                  )}
                  {viewSupplierModal.brand && (
                    <div className="detail-row">
                      <span className="detail-label">Brand:</span>
                      <span className="detail-value">{viewSupplierModal.brand}</span>
                    </div>
                  )}
                  {viewSupplierModal.notifications && (
                    <div className="detail-row">
                      <span className="detail-label">Notifications To:</span>
                      <span className="detail-value">{viewSupplierModal.notifications}</span>
                    </div>
                  )}
                </div>
              </div>
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

export default Suppliers;

