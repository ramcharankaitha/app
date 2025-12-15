import React, { useState, useEffect } from 'react';
import { chitPlansAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddChitCustomer = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    address: '',
    email: '',
    chitPlanId: '',
    paymentMode: ''
  });
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await chitPlansAPI.getPlans();
        if (response.success) {
          setPlans(response.plans);
        }
      } catch (err) {
        console.error('Error fetching chit plans:', err);
      }
    };
    fetchPlans();
  }, []);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('chitPlans');
    } else if (onBack) {
      onBack();
    }
  };

  const handleHome = () => {
    if (onNavigate) {
      onNavigate('dashboard');
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

  const handleSuppliers = () => {
    if (onNavigate) {
      onNavigate('suppliers');
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

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('chitPlans');
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitCustomer = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await chitPlansAPI.createCustomer({
        customerName: formData.customerName,
        phone: formData.phone,
        address: formData.address,
        email: formData.email,
        chitPlanId: parseInt(formData.chitPlanId),
        paymentMode: formData.paymentMode
      });

      if (response.success) {
        setSuccessMessage('Save changes are done');
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create chit customer. Please try again.');
      console.error('Create chit customer error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitCustomer,
    });
  };

  const selectedPlan = plans.find(p => p.id === parseInt(formData.chitPlanId));

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={handleHome}>
          <div className="nav-icon">
            <i className="fas fa-home"></i>
          </div>
          <span>Home</span>
        </div>
        <div className="nav-item" onClick={handleStaff}>
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
        <div className="add-user-container">
          {/* Header */}
          <header className="add-user-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Add Chit Customer</h1>
              <p className="page-subtitle">Enroll a new customer in a chit plan.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Customer Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Customer details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="customerName">Customer Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input
                          type="text"
                          id="customerName"
                          name="customerName"
                          className="form-input"
                          placeholder="Enter customer name."
                          value={formData.customerName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-input"
                          placeholder="Enter phone number."
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <div className="input-wrapper">
                        <i className="fas fa-envelope input-icon"></i>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="form-input"
                          placeholder="customer@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chit Plan Selection */}
                <div className="form-section">
                  <h3 className="section-title">Chit Plan Selection</h3>
                  
                  <div className="form-group">
                    <label htmlFor="chitPlanId">Chit Plan</label>
                    <div className="input-wrapper">
                      <i className="fas fa-file-invoice-dollar input-icon"></i>
                      <select
                        id="chitPlanId"
                        name="chitPlanId"
                        className="form-input"
                        value={formData.chitPlanId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select a chit plan</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.plan_name} - ₹{parseFloat(plan.plan_amount).toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedPlan && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px 12px', 
                        background: '#f8f9fa', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: '#666'
                      }}>
                        <strong>Selected Plan:</strong> {selectedPlan.plan_name} - ₹{parseFloat(selectedPlan.plan_amount).toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="paymentMode">Payment Mode</label>
                    <div className="input-wrapper">
                      <i className="fas fa-credit-card input-icon"></i>
                      <select
                        id="paymentMode"
                        name="paymentMode"
                        className="form-input"
                        value={formData.paymentMode}
                        onChange={handleInputChange}
                      >
                        <option value="">Select payment mode</option>
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="form-section">
                  <h3 className="section-title">Address</h3>
                  
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <div className="input-wrapper">
                      <i className="fas fa-map-marker-alt input-icon"></i>
                      <textarea
                        id="address"
                        name="address"
                        className="form-input textarea-input"
                        placeholder="Street, area, city&#10;State, pincode"
                        rows="2"
                        value={formData.address}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Info Message */}
                <div style={{ 
                  padding: '12px', 
                  background: '#e7f3ff', 
                  color: '#0066cc', 
                  borderRadius: '8px', 
                  marginBottom: '20px',
                  fontSize: '13px'
                }}>
                  <i className="fas fa-info-circle"></i> Enrollment date will be automatically set to today's date.
                </div>

                {/* Warning Message */}
                <p className="form-warning">
                  Make sure all customer details are correct before saving.
                </p>

                {/* Error Message */}
                {error && (
                  <div className="error-message" style={{ 
                    padding: '12px', 
                    background: '#ffe0e0', 
                    color: '#dc3545', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                  }}>
                    <i className="fas fa-exclamation-circle"></i> {error}
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="success-message" style={{ 
                    padding: '12px', 
                    background: '#d4edda', 
                    color: '#155724', 
                    borderRadius: '8px', 
                    marginBottom: '20px' 
                  }}>
                    <i className="fas fa-check-circle"></i> {successMessage}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="form-actions">
                  <button type="submit" className="create-user-btn" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Customer'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel and go back
                  </button>
                </div>
              </form>
          </main>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmState.open}
        title="Confirm Submission"
        message={confirmState.message}
        confirmText="Yes, Submit"
        cancelText="Cancel"
        onConfirm={() => {
          setConfirmState({ open: false, message: '', onConfirm: null });
          if (confirmState.onConfirm) confirmState.onConfirm();
        }}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
    </div>
  );
};

export default AddChitCustomer;

