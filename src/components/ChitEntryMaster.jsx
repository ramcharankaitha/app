import React, { useState, useEffect } from 'react';
import { chitPlansAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './products.css';
import './staff.css';

const ChitEntryMaster = ({ onBack, onAddChitEntry, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editEntryModal, setEditEntryModal] = useState(null);
  const [chitPlans, setChitPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transactionMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAddChitEntry = () => {
    if (onAddChitEntry) {
      onAddChitEntry();
    } else if (onNavigate) {
      onNavigate('addChitEntry');
    }
  };

  // Fetch chit entries with retry logic
  const fetchEntries = async (retryCount = 0) => {
    setIsLoading(true);
    try {
      setError('');
      const response = await chitPlansAPI.getEntries();
      if (response.success) {
        setEntries(response.entries || []);
        setFilteredEntries(response.entries || []);
      } else {
        throw new Error(response.error || 'Failed to fetch entries');
      }
    } catch (err) {
      console.error('Error fetching chit entries:', err);
      
      // Retry once if it's a rate limit or network error
      if ((err.message.includes('Too many requests') || err.message.includes('Server is busy') || err.message.includes('Network error')) && retryCount < 1) {
        console.log('Retrying chit entries fetch...');
        setTimeout(() => {
          fetchEntries(retryCount + 1);
        }, 2000); // Wait 2 seconds before retry
        return;
      }
      
      // Show user-friendly error message
      if (err.message.includes('Too many requests') || err.message.includes('Server is busy')) {
        setError('Server is busy. Please wait a moment and refresh the page.');
      } else if (err.message.includes('Network error')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to load chit entries. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chit plans
  const fetchChitPlans = async () => {
    try {
      const response = await chitPlansAPI.getPlans();
      if (response.success) {
        setChitPlans(response.plans || []);
      }
    } catch (err) {
      console.error('Error fetching chit plans:', err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchChitPlans();
    
    // Listen for entry completion event
    const handleEntryCompleted = () => {
      fetchEntries();
    };
    window.addEventListener('chitEntryCompleted', handleEntryCompleted);
    return () => window.removeEventListener('chitEntryCompleted', handleEntryCompleted);
  }, []);

  // Filter entries based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEntries(entries);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = entries.filter(e => 
      e.customer_name?.toLowerCase().includes(query) ||
      e.phone?.toLowerCase().includes(query) ||
      e.plan_name?.toLowerCase().includes(query) ||
      e.payment_mode?.toLowerCase().includes(query)
    );
    setFilteredEntries(filtered);
  }, [searchQuery, entries]);

  const handleViewEntry = (entry) => {
    setSelectedEntry(entry);
    setShowViewModal(true);
  };

  const handleEditEntry = async (entry) => {
    try {
      const response = await chitPlansAPI.getEntryById(entry.id);
      if (response.success) {
        setEditEntryModal(response);
      } else {
        setError('Failed to fetch entry details');
      }
    } catch (err) {
      console.error('Error fetching entry details:', err);
      setError('Failed to fetch entry details');
    }
  };

  const handleDeleteEntry = (entry) => {
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete chit entry for "${entry.customer_name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setError('');
          // Note: You may need to add a delete endpoint to chitPlansAPI
          setError('Delete functionality to be implemented');
          setTimeout(() => setError(''), 3000);
          // const response = await chitPlansAPI.deleteEntry(entry.id);
          // if (response.success) {
          //   await fetchEntries();
          // } else {
          //   setError(response.error || 'Failed to delete entry');
          // }
        } catch (err) {
          console.error('Delete entry error:', err);
          setError(err.message || 'Failed to delete entry');
        } finally {
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedEntry(null);
  };

  const closeEditModal = () => {
    setEditEntryModal(null);
  };

  const handleEditInputChange = (field, value) => {
    if (editEntryModal && editEntryModal.entry) {
      setEditEntryModal({
        ...editEntryModal,
        entry: {
          ...editEntryModal.entry,
          [field]: value
        }
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editEntryModal || !editEntryModal.entry) return;
    
    const entry = editEntryModal.entry;
    if (!entry.payment_mode && !entry.paymentMode) {
      setError('Payment Mode is required');
      return;
    }
    if (!entry.chit_plan_id && !entry.chitPlanId) {
      setError('Chit Plan is required');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await chitPlansAPI.updateEntry(entry.id, {
        chitPlanId: entry.chit_plan_id || entry.chitPlanId,
        paymentMode: entry.payment_mode || entry.paymentMode
      });

      if (response.success) {
        await fetchEntries();
        setEditEntryModal(null);
        setSuccessMessage('Entry updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to update entry');
      }
    } catch (err) {
      console.error('Error updating entry:', err);
      setError(err.message || 'Failed to update entry');
    } finally {
      setIsSaving(false);
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
                <h1 className="staff-title">Chit Receipt Master</h1>
                <p className="staff-subtitle">View and manage all chit payment entries</p>
              </div>
            </div>
            <div className="header-right">
              <button className="add-btn" onClick={handleAddChitEntry}>
                <i className="fas fa-plus"></i>
                <span>Add Chit Receipt</span>
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
                placeholder="Search by customer name, phone, plan name, or payment mode..."
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

          {/* Entries List */}
          <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#999' }}></i>
                <p style={{ marginTop: '16px', color: '#666' }}>Loading entries...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <i className="fas fa-file-invoice-dollar" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
                <p style={{ color: '#666', fontSize: '16px' }}>
                  {searchQuery ? 'No entries found matching your search.' : 'No chit entries found. Click "Add Chit Entry" to create one.'}
                </p>
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
                        Customer Name
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Phone
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Chit Plan
                      </th>
                      <th style={{ textAlign: 'right', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Plan Amount
                      </th>
                      <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                        Payment Mode
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
                    {filteredEntries.map((entry, index) => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                          {entry.customer_name || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {entry.phone || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {entry.plan_name || 'N/A'}
                        </td>
                        <td style={{ 
                          textAlign: 'right',
                          padding: '12px 8px',
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#dc3545'
                        }}>
                          {entry.plan_amount ? `₹${parseFloat(entry.plan_amount).toLocaleString('en-IN')}` : 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {entry.payment_mode || 'N/A'}
                        </td>
                        <td style={{ 
                          padding: '12px 8px',
                          fontSize: '14px',
                          color: '#666'
                        }}>
                          {formatDate(entry.created_at)}
                        </td>
                        <td style={{ 
                          textAlign: 'center',
                          padding: '12px 8px',
                          fontSize: '14px'
                        }}>
                          {entry.is_verified === false ? (
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
                          ) : entry.is_verified === true ? (
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleViewEntry(entry)}
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
                              onClick={() => handleEditEntry(entry)}
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
                            <button
                              onClick={() => handleDeleteEntry(entry)}
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
        </div>
      </div>

      {/* View Entry Modal */}
      {showViewModal && selectedEntry && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={closeViewModal}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '0',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8f9fa',
              borderRadius: '16px 16px 0 0'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>Chit Entry Details</h2>
              <button 
                onClick={closeViewModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#e0e0e0';
                  e.target.style.color = '#333';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#666';
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Customer Name:</span>
                <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{selectedEntry.customer_name || 'N/A'}</span>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Phone:</span>
                <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{selectedEntry.phone || 'N/A'}</span>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Chit Plan:</span>
                <span style={{ fontSize: '16px', color: '#dc3545', fontWeight: '600' }}>
                  {selectedEntry.plan_name || 'N/A'} - ₹{selectedEntry.plan_amount ? parseFloat(selectedEntry.plan_amount).toLocaleString('en-IN') : '0'}
                </span>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Payment Mode:</span>
                <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{selectedEntry.payment_mode || 'N/A'}</span>
              </div>
              <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Entry Date:</span>
                <span style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>{formatDate(selectedEntry.created_at)}</span>
              </div>
              {selectedEntry.notes && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>Notes:</span>
                  <span style={{ fontSize: '16px', color: '#333' }}>{selectedEntry.notes}</span>
                </div>
              )}
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={selectedEntry.is_verified === true}
                      onChange={async (e) => {
                        if (e.target.checked && selectedEntry.is_verified === false) {
                          try {
                            const response = await chitPlansAPI.verifyEntry(selectedEntry.id);
                            if (response.success) {
                              setSelectedEntry({ ...selectedEntry, is_verified: true });
                              setSuccessMessage('Chit entry verified successfully');
                              setTimeout(() => setSuccessMessage(''), 3000);
                              await fetchEntries();
                            } else {
                              setError('Failed to verify chit entry');
                              setTimeout(() => setError(''), 3000);
                            }
                          } catch (err) {
                            console.error('Error verifying chit entry:', err);
                            setError('Failed to verify chit entry');
                            setTimeout(() => setError(''), 3000);
                          }
                        }
                      }}
                      disabled={selectedEntry.is_verified === true}
                      style={{ width: '18px', height: '18px', cursor: selectedEntry.is_verified === true ? 'not-allowed' : 'pointer' }}
                    />
                    <span>Mark as Verified</span>
                  </label>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => {
                    closeViewModal();
                    handleEditEntry(selectedEntry);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#c82333';
                    e.target.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#dc3545';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
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
                    e.target.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#6c757d';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editEntryModal && editEntryModal.entry && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Chit Entry</h2>
              <button className="modal-close-btn" onClick={closeEditModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              {error && (
                <div style={{ 
                  padding: '12px', 
                  background: '#ffe0e0', 
                  color: '#dc3545', 
                  borderRadius: '8px', 
                  marginBottom: '20px' 
                }}>
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{editEntryModal.entry.customer_name 
                    ? editEntryModal.entry.customer_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                    : 'CE'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Customer Name:</span>
                    <input
                      type="text"
                      value={editEntryModal.entry.customer_name || ''}
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
                    <span className="detail-label">Phone:</span>
                    <input
                      type="tel"
                      value={editEntryModal.entry.phone || ''}
                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
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
                    <span className="detail-label">Chit Plan:</span>
                    <select
                      value={editEntryModal.entry.chit_plan_id || editEntryModal.entry.chitPlanId || ''}
                      onChange={(e) => handleEditInputChange('chit_plan_id', parseInt(e.target.value))}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px',
                        background: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select a chit plan</option>
                      {chitPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.plan_name} - ₹{parseFloat(plan.plan_amount || 0).toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment Mode:</span>
                    <select
                      value={editEntryModal.entry.payment_mode || editEntryModal.entry.paymentMode || ''}
                      onChange={(e) => handleEditInputChange('payment_mode', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px',
                        background: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Select payment mode</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Wallet">Wallet</option>
                      <option value="Credit">Credit</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                disabled={isSaving || !editEntryModal.entry.payment_mode || !editEntryModal.entry.chit_plan_id}
                style={{ 
                  background: (isSaving || !editEntryModal.entry.payment_mode || !editEntryModal.entry.chit_plan_id) ? '#ccc' : '#dc3545', 
                  color: '#fff',
                  cursor: (isSaving || !editEntryModal.entry.payment_mode || !editEntryModal.entry.chit_plan_id) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSaving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChitEntryMaster;

