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
                <div className="premium-cards-grid">
                  {filtered.map((plan) => (
                    <div
                      key={plan.id}
                      className="premium-identity-card"
                    >
                      {/* Card Header */}
                      <div className="premium-card-header">
                        <div className="premium-header-content">
                          <h3 className="premium-worker-name">{plan.plan_name || 'N/A'}</h3>
                        </div>
                        {/* Floating Three-Dot Menu */}
                        <div 
                          className="premium-card-menu" 
                          ref={el => menuRefs.current[plan.id] = el}
                        >
                          <button 
                            className="premium-menu-trigger"
                            onClick={(e) => toggleMenu(plan.id, e)}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {openMenuId === plan.id && (
                            <div className="premium-menu-dropdown">
                              <div className="premium-menu-item" onClick={() => handleViewPlan(plan)}>
                                <i className="fas fa-eye"></i>
                                <span>View</span>
                              </div>
                              <div className="premium-menu-item premium-menu-item-danger" onClick={() => handleDeletePlan(plan)}>
                                <i className="fas fa-trash"></i>
                                <span>Delete</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="premium-card-body">
                        <div className="premium-info-row">
                          <div className="premium-info-item" style={{ gridColumn: '1 / -1' }}>
                            <div className="premium-info-icon">
                              <i className="fas fa-rupee-sign"></i>
                            </div>
                            <div className="premium-info-content">
                              <span className="premium-info-label">Amount</span>
                              <span className="premium-info-value" style={{ fontSize: '20px', color: '#dc3545', fontWeight: '700' }}>
                                ₹{parseFloat(plan.plan_amount || 0).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        {plan.description && (
                          <div className="premium-info-row" style={{ marginTop: '16px' }}>
                            <div className="premium-info-item" style={{ gridColumn: '1 / -1' }}>
                              <div className="premium-info-icon">
                                <i className="fas fa-file-alt"></i>
                              </div>
                              <div className="premium-info-content">
                                <span className="premium-info-label">Description</span>
                                <span className="premium-info-value" style={{ fontSize: '13px', color: '#64748b' }}>
                                  {plan.description}
                                </span>
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
            <div className="modal-footer">
              <button className="modal-close-button" onClick={() => setShowViewModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChitPlanMaster;

