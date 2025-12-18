import React, { useState, useEffect, useRef } from 'react';
import { transportAPI } from '../services/api';
import './suppliers.css';

const TransportMaster = ({ onBack, onAddTransport, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [transports, setTransports] = useState([]);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewTransportModal, setViewTransportModal] = useState(null);
  const menuRefs = useRef({});

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('masterMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddTransport = () => {
    if (onAddTransport) {
      onAddTransport();
    } else if (onNavigate) {
      onNavigate('addTransport');
    }
  };

  const handleManagers = () => {
    if (onNavigate) {
      onNavigate('users');
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

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Fetch transports from database
  const fetchTransports = async () => {
    try {
      setError('');
      const response = await transportAPI.getAll();
      if (response.success) {
        const formattedTransports = response.transports.map(transport => ({
          id: transport.id,
          name: transport.name,
          travelsName: transport.travels_name,
          address: transport.address,
          city: transport.city,
          state: transport.state,
          pincode: transport.pincode,
          service: transport.service,
          llrNumber: transport.llr_number,
          vehicleNumber: transport.vehicle_number,
          initials: transport.name 
            ? transport.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            : 'TM',
          created_at: transport.created_at
        }));
        setTransports(formattedTransports);
      }
    } catch (err) {
      console.error('Error fetching transports:', err);
      setError('Failed to load transports. Please try again.');
    }
  };

  useEffect(() => {
    fetchTransports();
  }, []);

  // Filter transports based on search
  const filteredTransports = transports.filter(transport => {
    const matchesSearch = transport.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transport.travelsName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transport.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transport.service?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transport.llrNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transport.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Handle menu toggle
  const toggleMenu = (transportId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === transportId ? null : transportId);
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

  // Handle view transport details
  const handleViewTransportDetails = async (transport) => {
    setOpenMenuId(null);
    try {
      const response = await transportAPI.getById(transport.id);
      if (response.success) {
        setViewTransportModal(response.transport);
      } else {
        setError('Failed to fetch transport details');
      }
    } catch (err) {
      console.error('Error fetching transport details:', err);
      setError('Failed to fetch transport details');
    }
  };

  const closeViewModal = () => {
    setViewTransportModal(null);
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
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item" onClick={handleCustomers}>
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
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
          <h1 className="page-title">Transport Master</h1>
          <p className="page-subtitle">Manage transport services</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="staff-content">
        {/* Tab and Add Button */}
        <div className="staff-top-section">
          <div className="tab-indicator">
            <span className="tab-dot"></span>
            <span className="tab-label">TRANSPORT</span>
          </div>
          <button className="add-staff-btn" onClick={handleAddTransport}>
            <i className="fas fa-plus"></i>
            <span>Add New Transport</span>
          </button>
        </div>

        {/* Heading */}
        <div className="staff-heading">
          <h2>Manage Transport Services</h2>
          <p>View transport services with name, travels name, city, and service details. Filter quickly.</p>
        </div>

        {/* Search and Filter */}
        <div className="staff-controls">
          <div className="staff-search-bar">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search name, travels, city, service, LLR, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredTransports.length} of ${transports.length} transports`}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Transports List */}
        <div className="staff-list">
          {transports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
              <i className="fas fa-truck-moving" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Transport Records Available</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first transport record to the system.</p>
            </div>
          ) : filteredTransports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
              <p>No transport records found matching your search</p>
            </div>
          ) : (
            filteredTransports.map((transport) => (
            <div key={transport.id} className="staff-card">
              <div className="staff-avatar">
                <span>{transport.initials}</span>
              </div>
              <div className="staff-info">
                <div className="staff-name">{transport.name || 'N/A'}</div>
                {transport.travelsName && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px' }}>
                    <i className="fas fa-building" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                    Travels: {transport.travelsName}
                  </div>
                )}
                {transport.city && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px' }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                    {transport.city}
                  </div>
                )}
                {transport.service && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <i className="fas fa-cog" style={{ fontSize: '10px', color: '#666' }}></i>
                    <span>{transport.service}</span>
                  </div>
                )}
                {transport.llrNumber && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px' }}>
                    <i className="fas fa-file-alt" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                    LLR: {transport.llrNumber}
                  </div>
                )}
                {transport.vehicleNumber && (
                  <div className="staff-role" style={{ fontSize: '11px', marginTop: '4px' }}>
                    <i className="fas fa-truck" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                    Vehicle: {transport.vehicleNumber}
                  </div>
                )}
              </div>
              <div 
                className="staff-options-container" 
                ref={el => menuRefs.current[transport.id] = el}
              >
                <button 
                  className="staff-options"
                  onClick={(e) => toggleMenu(transport.id, e)}
                >
                  <i className="fas fa-ellipsis-v"></i>
                </button>
                {openMenuId === transport.id && (
                  <div className="staff-menu-dropdown">
                    <div className="menu-item" onClick={() => handleViewTransportDetails(transport)}>
                      <i className="fas fa-eye"></i>
                      <span>View Transport Details</span>
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

      {/* View Transport Details Modal */}
      {viewTransportModal && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transport Details</h2>
              <button className="modal-close-btn" onClick={closeViewModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{viewTransportModal.name 
                    ? viewTransportModal.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'TM'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{viewTransportModal.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Travels Name:</span>
                    <span className="detail-value">{viewTransportModal.travels_name || 'N/A'}</span>
                  </div>
                  {viewTransportModal.address && (
                    <div className="detail-row">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{viewTransportModal.address}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">City:</span>
                    <span className="detail-value">{viewTransportModal.city || 'N/A'}</span>
                  </div>
                  {viewTransportModal.state && (
                    <div className="detail-row">
                      <span className="detail-label">State:</span>
                      <span className="detail-value">{viewTransportModal.state}</span>
                    </div>
                  )}
                  {viewTransportModal.pincode && (
                    <div className="detail-row">
                      <span className="detail-label">Pincode:</span>
                      <span className="detail-value">{viewTransportModal.pincode}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Service:</span>
                    <span className="detail-value">{viewTransportModal.service || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">LLR Number:</span>
                    <span className="detail-value">{viewTransportModal.llr_number || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Vehicle Number:</span>
                    <span className="detail-value">{viewTransportModal.vehicle_number || 'N/A'}</span>
                  </div>
                  {viewTransportModal.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(viewTransportModal.created_at).toLocaleString()}</span>
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

export default TransportMaster;

