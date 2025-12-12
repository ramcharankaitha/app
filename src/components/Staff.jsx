import React, { useState, useEffect, useRef } from 'react';
import { staffAPI } from '../services/api';

const Staff = ({ onBack, onAddStaff, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewStaffModal, setViewStaffModal] = useState(null);
  const menuRefs = useRef({});

  // Fetch staff from database
  const fetchStaff = async () => {
    try {
      setError('');
      const response = await staffAPI.getAll();
      if (response.success) {
        const formattedStaff = response.staff.map(member => ({
          id: member.id,
          name: member.full_name,
          initials: member.full_name 
            ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'ST',
          email: member.email,
          role: member.role || 'Staff',
          store: member.store_allocated || 'Not Assigned',
          created_at: member.created_at
        }));
        setStaff(formattedStaff);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff. Please try again.');
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddStaff = () => {
    if (onAddStaff) {
      onAddStaff();
    } else if (onNavigate) {
      onNavigate('addStaff');
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

  const handleCustomers = () => {
    if (onNavigate) {
      onNavigate('customers');
    }
  };

  const handleSuppliers = () => {
    if (onNavigate) {
      onNavigate('suppliers');
    }
  };

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Filter staff based on search and store
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = selectedStore === 'All Stores' || member.store === selectedStore;
    return matchesSearch && matchesStore;
  });

  // Handle menu toggle
  const toggleMenu = (staffId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === staffId ? null : staffId);
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

  // Handle view staff details
  const handleViewStaffDetails = async (member) => {
    setOpenMenuId(null);
    try {
      const response = await staffAPI.getById(member.id);
      if (response.success) {
        setViewStaffModal(response);
      } else {
        setError('Failed to fetch staff details');
      }
    } catch (err) {
      console.error('Error fetching staff details:', err);
      setError('Failed to fetch staff details');
    }
  };

  const closeViewModal = () => {
    setViewStaffModal(null);
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
        <div className="nav-item" onClick={handleManagers}>
          <div className="nav-icon">
            <i className="fas fa-users"></i>
          </div>
          <span>Managers</span>
        </div>
        <div className="nav-item" onClick={handleProducts}>
          <div className="nav-icon">
            <i className="fas fa-box"></i>
          </div>
          <span>Products</span>
        </div>
        <div className="nav-item" onClick={handleBack}>
          <div className="nav-icon">
            <i className="fas fa-store"></i>
          </div>
          <span>Stores</span>
        </div>
        <div className="nav-item active">
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item" onClick={handleCustomers}>
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div className="nav-item" onClick={handleSuppliers}>
          <div className="nav-icon">
            <i className="fas fa-truck"></i>
          </div>
          <span>Supply Master</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate ? onNavigate('chitPlans') : null}>
          <div className="nav-icon">
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
          <span>Chit Plan</span>
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
          <h1 className="page-title">Staff Details</h1>
          <p className="page-subtitle">Manage store staff</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">USERS & STAFF</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddStaff}>
            <i className="fas fa-plus"></i>
            <span>Add New User</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Store Staff</h2>
          <p>View staff, their roles, and working stores. Filter quickly.</p>
        </div>

        {/* Search and Filter */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search name, role, store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="store-filter-btn">
            <i className="fas fa-store"></i>
            <span>{selectedStore}</span>
            <i className="fas fa-chevron-down"></i>
          </button>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredStaff.length} of ${staff.length} staff`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Staff List */}
        <div className="staff-list">
          {staff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-user-tie" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Staff Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first staff member to the system.</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No staff found matching your search</p>
            </div>
          ) : (
            filteredStaff.map((member) => (
            <div key={member.id} className="staff-card">
              <div className="staff-avatar">
                <span>{member.initials}</span>
              </div>
              <div className="staff-info">
                <div className="staff-name">{member.name}</div>
                <div className="staff-role">{member.role}</div>
                <div className="staff-store-badge">
                  <i className="fas fa-check-circle"></i>
                  <span>{member.store}</span>
                </div>
              </div>
              <div className="staff-email">{member.email}</div>
              <div 
                className="staff-options-container" 
                ref={el => menuRefs.current[member.id] = el}
              >
                <button 
                  className="staff-options"
                  onClick={(e) => toggleMenu(member.id, e)}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
                {openMenuId === member.id && (
                  <div className="staff-menu-dropdown">
                    <div className="menu-item" onClick={() => handleViewStaffDetails(member)}>
                      <i className="fas fa-eye"></i>
                      <span>View Staff Details</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </main>
      </div>
      </div>

      {/* View Staff Details Modal */}
      {viewStaffModal && viewStaffModal.staff && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Staff Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewStaffModal.staff.full_name 
                    ? viewStaffModal.staff.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'ST'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">{viewStaffModal.staff.full_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{viewStaffModal.staff.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{viewStaffModal.staff.username || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">{viewStaffModal.staff.role || 'Staff'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{viewStaffModal.staff.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Store Allocated:</span>
                    <span className="detail-value">{viewStaffModal.staff.store_allocated || 'Not Assigned'}</span>
                  </div>
                  {viewStaffModal.staff.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{viewStaffModal.staff.address}</span>
                    </div>
                  )}
                  {viewStaffModal.staff.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewStaffModal.staff.created_at).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {/* Sales Section */}
                  {viewStaffModal.sales && viewStaffModal.sales.length > 0 && (
                    <>
                      <div className="detail-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                        <span className="detail-label" style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>Sales Summary</span>
                        <span className="detail-value" style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>
                          Total Sales: {viewStaffModal.sales.length}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Total Revenue:</span>
                        <span className="detail-value" style={{ color: '#28a745', fontWeight: '600' }}>
                          ₹{viewStaffModal.sales.reduce((sum, sale) => {
                            const revenue = (parseFloat(sale.sell_rate) || 0) * (parseInt(sale.quantity) || 0);
                            return sum + revenue;
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ marginBottom: '12px', fontWeight: '600', color: '#000' }}>Recent Sales:</div>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {viewStaffModal.sales.slice(0, 10).map((sale, index) => (
                            <div key={index} style={{ 
                              padding: '12px', 
                              marginBottom: '8px', 
                              background: '#f8f9fa', 
                              borderRadius: '8px',
                              border: '1px solid #e9ecef'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: '600', fontSize: '13px' }}>Customer: {sale.full_name || 'N/A'}</span>
                                <span style={{ fontSize: '12px', color: '#666' }}>{new Date(sale.created_at).toLocaleDateString()}</span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                {sale.product_name && <span>Product: {sale.product_name} | </span>}
                                Item: {sale.item_code || 'N/A'} | Qty: {sale.quantity || 0}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span>Rate: ₹{sale.sell_rate || '0'}</span>
                                <span style={{ fontWeight: '600', color: '#28a745' }}>
                                  Total: ₹{((parseFloat(sale.sell_rate) || 0) * (parseInt(sale.quantity) || 0)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {viewStaffModal.sales.length > 10 && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                            Showing 10 of {viewStaffModal.sales.length} sales
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {(!viewStaffModal.sales || viewStaffModal.sales.length === 0) && (
                    <div className="detail-row" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e9ecef' }}>
                      <span className="detail-label" style={{ fontSize: '16px', fontWeight: '700', color: '#000' }}>Sales Summary</span>
                      <span className="detail-value" style={{ color: '#666' }}>No sales recorded</span>
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

export default Staff;

