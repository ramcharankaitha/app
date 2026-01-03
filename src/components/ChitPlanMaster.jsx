import React, { useState, useEffect, useRef } from 'react';
import { chitPlansAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './staff.css';

const ChitPlanMaster = ({ onBack, onAddChitPlan, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null, plan: null });
  const menuRefs = useRef({});

  // Fetch chit plans from database
  const fetchPlans = async () => {
    try {
      setError('');
      const response = await chitPlansAPI.getPlans();
      if (response && response.success) {
        setPlans(response.plans || []);
      } else {
        setError('Failed to load chit plans');
      }
    } catch (err) {
      console.error('Error fetching chit plans:', err);
      setError('Failed to load chit plans. Please try again.');
    }
  };

  useEffect(() => {
    fetchPlans();
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

  const toggleMenu = (planId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === planId ? null : planId);
  };

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const handleEditPlan = async (plan) => {
    setOpenMenuId(null);
    try {
      const response = await chitPlansAPI.getPlanById(plan.id);
      if (response && response.success) {
        setEditPlanModal(response.plan);
      } else {
        setError('Failed to fetch chit plan details');
      }
    } catch (err) {
      console.error('Error fetching chit plan details:', err);
      setError('Failed to fetch chit plan details');
    }
  };

  // Handle save plan details
  const handleSavePlanDetails = async () => {
    if (!editPlanModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await chitPlansAPI.updatePlan(editPlanModal.id, {
        planName: editPlanModal.plan_name,
        planAmount: editPlanModal.plan_amount
      });
      
      if (response && response.success) {
        // Refresh plans list
        await fetchPlans();
        setEditPlanModal(null);
        setError('');
        setSuccessMessage('Chit plan updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response?.error || 'Failed to update chit plan');
      }
    } catch (err) {
      console.error('Error updating chit plan:', err);
      setError(err.message || 'Failed to update chit plan');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change in edit modal
  const handleEditInputChange = (field, value) => {
    if (editPlanModal) {
      setEditPlanModal({
        ...editPlanModal,
        [field]: value
      });
    }
  };

  const closeEditModal = () => {
    setEditPlanModal(null);
  };

  const handleDeletePlan = (plan) => {
    setOpenMenuId(null);
    setConfirmState({
      open: true,
      message: `Are you sure you want to delete "${plan.plan_name}"? This action cannot be undone.`,
      plan: plan,
      onConfirm: async () => {
        try {
          const response = await chitPlansAPI.deletePlan(plan.id);
          if (response && response.success) {
            setSuccessMessage('Chit plan deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
            await fetchPlans();
            setConfirmState({ open: false, message: '', onConfirm: null, plan: null });
          } else {
            setError(response?.error || 'Failed to delete chit plan');
            setConfirmState({ open: false, message: '', onConfirm: null, plan: null });
          }
        } catch (err) {
          setError(err.message || 'Failed to delete chit plan');
          setConfirmState({ open: false, message: '', onConfirm: null, plan: null });
        }
      }
    });
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('masterMenu');
    } else if (onBack) {
      onBack();
    }
  };

  const handleAdd = () => {
    if (onAddChitPlan) {
      onAddChitPlan();
    } else if (onNavigate) {
      onNavigate('addChitPlan');
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

  // Filter plans based on search
  const filtered = plans.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.plan_name?.toLowerCase().includes(q) ||
      p.plan_amount?.toString().includes(q);
    return matchesSearch;
  });

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

      {/* Main */}
      <div className="dashboard-main">
        <div className="staff-container">
          {/* Header */}
          <header className="staff-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Chit Plan Master</h1>
              <p className="page-subtitle">Manage chit plans</p>
            </div>
          </header>

          {/* Content */}
          <main className="staff-content">
            <div className="staff-top-section">
              <div className="tab-indicator">
                <span className="tab-dot"></span>
                <span className="tab-label">CHIT PLAN MASTER</span>
              </div>
              <button className="add-staff-btn" onClick={handleAdd}>
                <i className="fas fa-plus"></i>
                <span>Add New Plan</span>
              </button>
            </div>

            <div className="staff-heading">
              <h2>Chit Plans</h2>
              <p>Manage and organize chit plans with name and cost.</p>
            </div>

            {/* Search */}
            <div className="staff-controls">
              <div className="staff-search-bar">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search by plan name or amount..."
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

            {successMessage && (
              <div style={{ padding: '12px', background: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px' }}>
                <i className="fas fa-check-circle"></i> {successMessage}
              </div>
            )}

            {/* Results Count */}
            <div className="staff-count">
              {`Showing ${filtered.length} of ${plans.length} plans`}
            </div>

            {/* Plans List */}
            <div className="staff-list-container" style={{ padding: '0 24px 24px' }}>
              {plans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', color: '#666' }}>
                  <i className="fas fa-file-invoice-dollar" style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.4, color: '#dc3545' }}></i>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>No Chit Plans Available</h3>
                  <p style={{ fontSize: '14px', color: '#666' }}>Start by adding your first chit plan to the system.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <i className="fas fa-search" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}></i>
                  <p>No plans found matching your search</p>
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
                          Plan Name
                        </th>
                        <th style={{ textAlign: 'right', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Amount
                        </th>
                        <th style={{ textAlign: 'left', fontWeight: '600', color: '#333', padding: '12px 8px', background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                          Description
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
                      {filtered.map((plan, index) => (
                        <tr key={plan.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
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
                            {plan.plan_name || 'N/A'}
                          </td>
                          <td style={{ 
                            textAlign: 'right',
                            padding: '12px 8px',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#dc3545'
                          }}>
                            ₹{parseFloat(plan.plan_amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ 
                            padding: '12px 8px',
                            fontSize: '14px',
                            color: '#666'
                          }}>
                            {plan.description || 'N/A'}
                          </td>
                          <td style={{ 
                            textAlign: 'center',
                            padding: '12px 8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <button
                                onClick={() => handleViewPlan(plan)}
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
                                onClick={() => handleEditPlan(plan)}
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title="Delete Chit Plan"
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null, plan: null })}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* View Chit Plan Details Modal */}
      {showViewModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chit Plan Details</h2>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="customer-detail-section">
                <div className="detail-avatar">
                  <span>{selectedPlan.plan_name 
                    ? selectedPlan.plan_name.substring(0, 2).toUpperCase()
                    : 'CP'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Plan Name:</span>
                    <span className="detail-value">{selectedPlan.plan_name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Plan Amount:</span>
                    <span className="detail-value" style={{ fontSize: '18px', fontWeight: '700', color: '#dc3545' }}>
                      ₹{parseFloat(selectedPlan.plan_amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {selectedPlan.description && (
                    <div className="detail-row">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{selectedPlan.description}</span>
                    </div>
                  )}
                  {selectedPlan.created_at && (
                    <div className="detail-row">
                      <span className="detail-label">Created At:</span>
                      <span className="detail-value">{new Date(selectedPlan.created_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(userRole === 'admin' || userRole === 'supervisor') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={selectedPlan.is_verified === true}
                      onChange={async (e) => {
                        console.log('Checkbox clicked:', e.target.checked, 'Current verified status:', selectedPlan.is_verified);
                        if (e.target.checked) {
                          try {
                            console.log('Calling verify API for chit plan ID:', selectedPlan.id);
                            const response = await chitPlansAPI.verifyPlan(selectedPlan.id);
                            console.log('Verify API response:', response);
                            if (response.success) {
                              setSelectedPlan({ ...selectedPlan, is_verified: true });
                              setSuccessMessage('Chit plan verified successfully');
                              setTimeout(() => setSuccessMessage(''), 3000);
                              // Refresh from server to update the list
                              await fetchPlans();
                            } else {
                              setError(response.error || 'Failed to verify chit plan');
                              setTimeout(() => setError(''), 3000);
                            }
                          } catch (err) {
                            console.error('Error verifying chit plan:', err);
                            setError(err.message || 'Failed to verify chit plan');
                            setTimeout(() => setError(''), 3000);
                          }
                        }
                      }}
                      disabled={selectedPlan.is_verified === true}
                      style={{ width: '18px', height: '18px', cursor: selectedPlan.is_verified === true ? 'not-allowed' : 'pointer' }}
                    />
                    <span>Mark as Verified</span>
                  </label>
                )}
              </div>
              <button className="modal-close-button" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Chit Plan Modal */}
      {editPlanModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Chit Plan Details</h2>
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
                  <span>{editPlanModal.plan_name 
                    ? editPlanModal.plan_name.substring(0, 2).toUpperCase()
                    : 'CP'}</span>
                </div>
                <div className="detail-info">
                  <div className="detail-row">
                    <span className="detail-label">Plan Name:</span>
                    <input
                      type="text"
                      value={editPlanModal.plan_name || ''}
                      onChange={(e) => handleEditInputChange('plan_name', e.target.value)}
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
                    <span className="detail-label">Plan Amount:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editPlanModal.plan_amount || ''}
                      onChange={(e) => handleEditInputChange('plan_amount', parseFloat(e.target.value) || 0)}
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
                  {editPlanModal.description && (
                    <div className="detail-row">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{editPlanModal.description}</span>
                    </div>
                  )}
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
                onClick={handleSavePlanDetails}
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
    </div>
  );
};

export default ChitPlanMaster;

