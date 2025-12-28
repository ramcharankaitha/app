import React, { useState, useEffect, useRef } from 'react';
import { chitPlansAPI } from '../services/api';
import './staff.css';

const ChitPlanMaster = ({ onBack, onAddChitPlan, onNavigate, userRole = 'admin' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
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

  const handleDeletePlan = (plan) => {
    setSelectedPlan(plan);
    setShowDeleteConfirm(true);
    setOpenMenuId(null);
  };

  const confirmDelete = async () => {
    if (!selectedPlan) return;
    
    try {
      const response = await chitPlansAPI.deletePlan(selectedPlan.id);
      if (response && response.success) {
        setSuccessMessage('Chit plan deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchPlans();
      } else {
        setError(response?.error || 'Failed to delete chit plan');
      }
      setShowDeleteConfirm(false);
      setSelectedPlan(null);
    } catch (err) {
      setError(err.message || 'Failed to delete chit plan');
      setShowDeleteConfirm(false);
    }
  };

  // Handle save chit plan details
  const handleSavePlanDetails = async () => {
    if (!editPlanModal) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await chitPlansAPI.updatePlan(editPlanModal.id, {
        planName: editPlanModal.plan_name,
        planAmount: parseFloat(editPlanModal.plan_amount),
        description: editPlanModal.description || ''
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
            <div className="staff-list">
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
                filtered.map((plan) => (
                  <div key={plan.id} className="staff-card" style={{ position: 'relative' }}>
                    <div className="staff-info" style={{ flex: 1 }}>
                      <div className="staff-name">{plan.plan_name}</div>
                      <div className="staff-role" style={{ fontSize: '16px', fontWeight: '700', color: '#dc3545', marginTop: '8px' }}>
                        ₹{parseFloat(plan.plan_amount).toLocaleString('en-IN')}
                      </div>
                      {plan.description && (
                        <div className="staff-role" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {plan.description}
                        </div>
                      )}
                    </div>
                    <div 
                      className="staff-options-container" 
                      ref={el => menuRefs.current[plan.id] = el}
                    >
                      <button 
                        className="staff-options"
                        onClick={(e) => toggleMenu(plan.id, e)}
                      >
                        <i className="fas fa-ellipsis-v"></i>
                      </button>
                      {openMenuId === plan.id && (
                        <div className="staff-menu-dropdown">
                          <div className="menu-item" onClick={() => handleViewPlan(plan)}>
                            <i className="fas fa-eye"></i>
                            <span>View Details</span>
                          </div>
                          <div className="menu-item" onClick={() => handleEditPlan(plan)}>
                            <i className="fas fa-edit"></i>
                            <span>Edit Plan</span>
                          </div>
                          <div className="menu-item" onClick={() => handleDeletePlan(plan)}>
                            <i className="fas fa-trash"></i>
                            <span>Delete</span>
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

      {/* View Modal */}
      {showViewModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Chit Plan Details</h2>
              <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <strong>Plan Name:</strong> {selectedPlan.plan_name}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Plan Amount:</strong> ₹{parseFloat(selectedPlan.plan_amount).toLocaleString('en-IN')}
              </div>
              {selectedPlan.description && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>Description:</strong> {selectedPlan.description}
                </div>
              )}
              <div style={{ marginBottom: '16px' }}>
                <strong>Created At:</strong> {new Date(selectedPlan.created_at).toLocaleString()}
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-close-button" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editPlanModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="customer-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Chit Plan</h2>
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
                      value={editPlanModal.plan_amount || ''}
                      onChange={(e) => handleEditInputChange('plan_amount', e.target.value)}
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
                    <span className="detail-label">Description:</span>
                    <textarea
                      value={editPlanModal.description || ''}
                      onChange={(e) => handleEditInputChange('description', e.target.value)}
                      rows="3"
                      placeholder="Enter description (optional)"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        width: '100%',
                        maxWidth: '300px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-close-button" 
                onClick={closeEditModal}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={handleSavePlanDetails}
                disabled={isSaving}
                style={{ 
                  background: '#28a745', 
                  color: '#fff', 
                  marginLeft: '8px' 
                }}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteConfirm(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the chit plan "{selectedPlan.plan_name}"?</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-close-button" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button 
                className="modal-close-button" 
                onClick={confirmDelete}
                style={{ background: '#dc3545', color: '#fff', marginLeft: '8px' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChitPlanMaster;

