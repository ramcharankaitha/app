import React, { useState, useEffect, useRef } from 'react';
import { transportAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './suppliers.css';

const TransportMaster = ({ onBack, onAddTransport, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [transports, setTransports] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewTransportModal, setViewTransportModal] = useState(null);
  const [editTransportModal, setEditTransportModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null, transport: null });
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
        const formattedTransports = response.transports.map(transport => {
          // Parse addresses from JSONB if available, otherwise use legacy fields
          let addresses = [];
          if (transport.addresses) {
            try {
              addresses = typeof transport.addresses === 'string' 
                ? JSON.parse(transport.addresses) 
                : transport.addresses;
            } catch (e) {
              console.error('Error parsing addresses:', e);
            }
          }
          
          // If no addresses in JSONB, create one from legacy fields
          if (addresses.length === 0 && (transport.city || transport.address)) {
            addresses = [{
              address: transport.address || '',
              city: transport.city || '',
              state: transport.state || '',
              pincode: transport.pincode || ''
            }];
          }

          return {
            id: transport.id,
            name: transport.name,
            travelsName: transport.travels_name,
            addresses: addresses,
            city: transport.city, // Keep for backward compatibility
            state: transport.state,
            pincode: transport.pincode,
            service: transport.service,
            vehicleNumber: transport.vehicle_number,
            initials: transport.name 
              ? transport.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
              : 'TM',
            created_at: transport.created_at,
            is_verified: transport.is_verified
          };
        });
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
    const searchLower = searchQuery.toLowerCase();
    const matchesName = transport.name?.toLowerCase().includes(searchLower);
    const matchesTravels = transport.travelsName?.toLowerCase().includes(searchLower);
    const matchesService = transport.service?.toLowerCase().includes(searchLower);
    const matchesVehicle = transport.vehicleNumber?.toLowerCase().includes(searchLower);
    
    // Check all addresses for city/state/pincode matches
    const matchesAddress = transport.addresses?.some(addr => 
      addr.city?.toLowerCase().includes(searchLower) ||
      addr.state?.toLowerCase().includes(searchLower) ||
      addr.pincode?.toLowerCase().includes(searchLower) ||
      addr.address?.toLowerCase().includes(searchLower)
    ) || transport.city?.toLowerCase().includes(searchLower);
    
    return matchesName || matchesTravels || matchesService || matchesVehicle || matchesAddress;
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

  // Handle edit transport
  const handleEditTransport = async (transport) => {
    setOpenMenuId(null);
    try {
      const response = await transportAPI.getById(transport.id);
      if (response.success) {
        setEditTransportModal(response.transport);
      } else {
        setError('Failed to fetch transport details');
      }
    } catch (err) {
      console.error('Error fetching transport details:', err);
      setError('Failed to fetch transport details');
    }
  };

  // Handle save transport details
  const handleSaveTransportDetails = async () => {
    if (!editTransportModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      // Parse addresses if they're in JSONB format
      let addressesData = [];
      if (editTransportModal.addresses) {
        try {
          addressesData = typeof editTransportModal.addresses === 'string' 
            ? JSON.parse(editTransportModal.addresses) 
            : editTransportModal.addresses;
        } catch (e) {
          console.error('Error parsing addresses:', e);
          // If parsing fails, try to create from legacy fields
          if (editTransportModal.city) {
            addressesData = [{
              city: editTransportModal.city,
              state: editTransportModal.state || '',
              pincode: editTransportModal.pincode || ''
            }];
          }
        }
      } else if (editTransportModal.city) {
        addressesData = [{
          city: editTransportModal.city,
          state: editTransportModal.state || '',
          pincode: editTransportModal.pincode || ''
        }];
      }

      const response = await transportAPI.update(editTransportModal.id, {
        name: editTransportModal.name,
        travels_name: editTransportModal.travels_name,
        addresses: addressesData,
        city: editTransportModal.city,
        state: editTransportModal.state,
        pincode: editTransportModal.pincode,
        service: editTransportModal.service,
        vehicle_number: editTransportModal.vehicle_number
      });
      
      if (response.success) {
        await fetchTransports();
        setEditTransportModal(null);
        setError('');
      } else {
        setError('Failed to update transport');
      }
    } catch (err) {
      console.error('Error updating transport:', err);
      setError(err.message || 'Failed to update transport');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editTransportModal) {
      setEditTransportModal({
        ...editTransportModal,
        [field]: value
      });
    }
  };

  const closeEditModal = () => {
    setEditTransportModal(null);
  };

  // Handle disable transport
  const handleVerifyTransport = async (transport) => {
    setOpenMenuId(null);
    if (!window.confirm(`Mark "${transport.travelsName || transport.name}" as verified?`)) {
      return;
    }

    try {
      const response = await transportAPI.verify(transport.id);
      if (response.success) {
        await fetchTransports();
        setSuccessMessage('Transport verified successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to verify transport');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      console.error('Error verifying transport:', err);
      setError('Failed to verify transport. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDisableTransport = (transport) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to disable ${transport.name}? This action can be reversed later.`,
      transport: transport,
      onConfirm: async () => {
        try {
          // Use delete API to disable/remove transport
          const response = await transportAPI.delete(transport.id);
          
          if (response.success) {
            await fetchTransports();
            setConfirmState({ open: false, message: '', onConfirm: null, transport: null });
          } else {
            setError('Failed to disable transport');
            setConfirmState({ open: false, message: '', onConfirm: null, transport: null });
          }
        } catch (err) {
          console.error('Error disabling transport:', err);
          setError('Failed to disable transport');
          setConfirmState({ open: false, message: '', onConfirm: null, transport: null });
        }
      }
    });
  };

  return (
    <div className="dashboard-container">
      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Disable Transport"
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null, transport: null })}
        confirmText="Disable"
        cancelText="Cancel"
      />
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
              placeholder="Search name, travels, city, service, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="staff-count">
          {`Showing ${filteredTransports.length} of ${transports.length} transports`}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', margin: '0 24px 20px' }}>
            <i className="fas fa-check-circle"></i> {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ padding: '12px', background: '#ffe0e0', color: '#dc3545', borderRadius: '8px', marginBottom: '20px' }}>
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Transports List */}
        <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
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
                      Name
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Travels Name
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Locations
                    </th>
                    <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      Vehicle Number
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
                  {filteredTransports.map((transport, index) => {
                    // Format cities display: "2 Cities • Sundarapaly" or just city name if one
                    const getCitiesDisplay = () => {
                      if (transport.addresses && transport.addresses.length > 0) {
                        const cities = transport.addresses.map(a => a.city).filter(Boolean);
                        if (cities.length === 0) return 'N/A';
                        if (cities.length === 1) return cities[0];
                        return `${cities.length} Cities • ${cities[0]}`;
                      }
                      if (transport.city) return transport.city;
                      return 'N/A';
                    };

                    return (
                      <tr key={transport.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                          fontSize: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#007bff',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '14px',
                              flexShrink: 0
                            }}>
                              {transport.initials || 'TM'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '500', color: '#333' }}>
                                {transport.name || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {transport.travelsName || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {getCitiesDisplay()}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {transport.vehicleNumber || 'N/A'}
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          padding: '12px 8px',
                          fontSize: '14px'
                        }}>
                          {transport.is_verified === false ? (
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
                          ) : transport.is_verified === true ? (
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
                              color: '#666', 
                              fontWeight: '500'
                            }}>
                              N/A
                            </span>
                          )}
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          padding: '12px 8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleViewTransportDetails(transport)}
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
                              onClick={() => handleEditTransport(transport)}
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
                            {(userRole === 'admin' || userRole === 'supervisor') && transport.is_verified === false && (
                              <button
                                onClick={() => handleVerifyTransport(transport)}
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
                                  e.target.style.background = '#f57c00';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#ff9800';
                                }}
                              >
                                <i className="fas fa-check-circle"></i>
                                Verify
                              </button>
                            )}
                            <button
                              onClick={() => handleDisableTransport(transport)}
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
      </main>
      </div>
      </div>

      {/* Edit Transport Details Modal */}
      {editTransportModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h2>Edit Transport Details</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content" style={{ padding: '20px' }}>
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{editTransportModal.name 
                    ? editTransportModal.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'TM'}</span>
                </div>
                <div className="detail-info" style={{ width: '100%' }}>
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Name:</span>
                    <input
                      type="text"
                      value={editTransportModal.name || ''}
                      onChange={(e) => handleEditInputChange('name', e.target.value)}
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
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Travels Name:</span>
                    <input
                      type="text"
                      value={editTransportModal.travels_name || ''}
                      onChange={(e) => handleEditInputChange('travels_name', e.target.value)}
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
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>City:</span>
                    <input
                      type="text"
                      value={editTransportModal.city || ''}
                      onChange={(e) => handleEditInputChange('city', e.target.value)}
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
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>State:</span>
                    <input
                      type="text"
                      value={editTransportModal.state || ''}
                      onChange={(e) => handleEditInputChange('state', e.target.value)}
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
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Pincode:</span>
                    <input
                      type="text"
                      value={editTransportModal.pincode || ''}
                      onChange={(e) => handleEditInputChange('pincode', e.target.value)}
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
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Service:</span>
                    <input
                      type="text"
                      value={editTransportModal.service || ''}
                      onChange={(e) => handleEditInputChange('service', e.target.value)}
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
                  <div className="detail-row" style={{ marginBottom: '16px' }}>
                    <span className="detail-label" style={{ minWidth: '140px', marginRight: '12px' }}>Vehicle Number:</span>
                    <input
                      type="text"
                      value={editTransportModal.vehicle_number || ''}
                      onChange={(e) => handleEditInputChange('vehicle_number', e.target.value)}
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
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '20px' }}>
              <button 
                className="modal-close-button" 
                onClick={closeEditModal}
                style={{ background: '#6c757d', color: '#fff' }}
              >
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={handleSaveTransportDetails}
                disabled={isSaving}
                style={{ 
                  background: '#dc3545', 
                  color: '#fff',
                  opacity: isSaving ? 0.6 : 1,
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {(() => {
                    // Parse addresses from JSONB if available
                    let addresses = [];
                    if (viewTransportModal.addresses) {
                      try {
                        addresses = typeof viewTransportModal.addresses === 'string' 
                          ? JSON.parse(viewTransportModal.addresses) 
                          : viewTransportModal.addresses;
                      } catch (e) {
                        console.error('Error parsing addresses:', e);
                      }
                    }
                    
                    // If no addresses in JSONB, create one from legacy fields
                    if (addresses.length === 0 && (viewTransportModal.city || viewTransportModal.address)) {
                      addresses = [{
                        address: viewTransportModal.address || '',
                        city: viewTransportModal.city || '',
                        state: viewTransportModal.state || '',
                        pincode: viewTransportModal.pincode || ''
                      }];
                    }

                    if (addresses.length > 0) {
                      return addresses.map((addr, index) => (
                        <React.Fragment key={index}>
                          {addresses.length > 1 && (
                            <div className="detail-row" style={{ marginTop: index > 0 ? '16px' : '0', paddingTop: index > 0 ? '16px' : '0', borderTop: index > 0 ? '1px solid #eee' : 'none' }}>
                              <span className="detail-label" style={{ fontWeight: '600', color: '#dc3545' }}>Address {index + 1}:</span>
                            </div>
                          )}
                          {addr.address && (
                            <div className="detail-row">
                              <span className="detail-label">Street Address:</span>
                              <span className="detail-value">{addr.address}</span>
                            </div>
                          )}
                          <div className="detail-row">
                            <span className="detail-label">City:</span>
                            <span className="detail-value">{addr.city || 'N/A'}</span>
                          </div>
                          {addr.state && (
                            <div className="detail-row">
                              <span className="detail-label">State:</span>
                              <span className="detail-value">{addr.state}</span>
                            </div>
                          )}
                          {addr.pincode && (
                            <div className="detail-row">
                              <span className="detail-label">Pincode:</span>
                              <span className="detail-value">{addr.pincode}</span>
                            </div>
                          )}
                        </React.Fragment>
                      ));
                    }
                    return null;
                  })()}
                  <div className="detail-row">
                    <span className="detail-label">Service:</span>
                    <span className="detail-value">{viewTransportModal.service || 'N/A'}</span>
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
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      {viewTransportModal.is_verified === false ? (
                        <span style={{ color: '#ff9800', fontWeight: '600' }}>Not Verified</span>
                      ) : viewTransportModal.is_verified === true ? (
                        <span style={{ color: '#28a745', fontWeight: '600' }}>Verified</span>
                      ) : (
                        <span style={{ color: '#28a745', fontWeight: '600' }}>Verified</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(userRole === 'admin' || userRole === 'supervisor') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={viewTransportModal.is_verified === true}
                      onChange={async (e) => {
                        console.log('Checkbox clicked:', e.target.checked, 'Current verified status:', viewTransportModal.is_verified);
                        if (e.target.checked) {
                          try {
                            console.log('Calling verify API for transport ID:', viewTransportModal.id);
                            const response = await transportAPI.verify(viewTransportModal.id);
                            console.log('Verify API response:', response);
                            if (response.success) {
                              setViewTransportModal({ ...viewTransportModal, is_verified: true });
                              setSuccessMessage('Transport verified successfully');
                              setTimeout(() => setSuccessMessage(''), 3000);
                              // Refresh from server to update the list
                              await fetchTransports();
                            } else {
                              setError(response.error || 'Failed to verify transport');
                              setTimeout(() => setError(''), 3000);
                            }
                          } catch (err) {
                            console.error('Error verifying transport:', err);
                            setError(err.message || 'Failed to verify transport');
                            setTimeout(() => setError(''), 3000);
                          }
                        }
                      }}
                      disabled={viewTransportModal.is_verified === true}
                      style={{ width: '18px', height: '18px', cursor: viewTransportModal.is_verified === true ? 'not-allowed' : 'pointer' }}
                    />
                    <span>Mark as Verified</span>
                  </label>
                )}
              </div>
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

