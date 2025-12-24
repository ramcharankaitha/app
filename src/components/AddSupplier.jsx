import React, { useState } from 'react';
import { suppliersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddSupplier = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    email: '',
    chequeNumber: '',
    amount: '',
    chequeDate: '',
    paidDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('suppliers');
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
      onNavigate('suppliers');
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

  const submitSupplier = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await suppliersAPI.create({
        supplierName: formData.supplierName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        email: formData.email,
        chequeNumber: formData.chequeNumber,
        amount: formData.amount,
        chequeDate: formData.chequeDate,
        paidDate: formData.paidDate
      });

      if (response.success) {
        setSuccessMessage('Save changes are done');
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create supplier. Please try again.');
      console.error('Create supplier error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitSupplier,
    });
  };

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
        {userRole === 'admin' && (
          <div className="nav-item" onClick={handleManagers}>
            <div className="nav-icon">
              <i className="fas fa-users"></i>
            </div>
            <span>Supervisors</span>
          </div>
        )}
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
              <h1 className="page-title">Add Supplier</h1>
              <p className="page-subtitle">Create a new supplier for your store.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Supplier Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Supplier details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="supplierName">Supplier Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-building input-icon"></i>
                        <input
                          type="text"
                          id="supplierName"
                          name="supplierName"
                          className="form-input"
                          placeholder="Enter supplier name."
                          value={formData.supplierName}
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
                          placeholder="supplier@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="form-section">
                  <h3 className="section-title">Address</h3>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label htmlFor="address">Street Address</label>
                      <div className="input-wrapper">
                        <i className="fas fa-map-marker-alt input-icon"></i>
                        <textarea
                          id="address"
                          name="address"
                          className="form-input textarea-input"
                          placeholder="Enter street address, area"
                          rows="2"
                          value={formData.address}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <div className="input-wrapper">
                        <i className="fas fa-city input-icon"></i>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          className="form-input"
                          placeholder="Enter city"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="state">State</label>
                      <div className="input-wrapper">
                        <i className="fas fa-map input-icon"></i>
                        <input
                          type="text"
                          id="state"
                          name="state"
                          className="form-input"
                          placeholder="Enter state"
                          value={formData.state}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="pincode">Pincode</label>
                      <div className="input-wrapper">
                        <i className="fas fa-mail-bulk input-icon"></i>
                        <input
                          type="text"
                          id="pincode"
                          name="pincode"
                          className="form-input"
                          placeholder="Enter pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          maxLength="10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Mode Section */}
                <div className="form-section">
                  <h3 className="section-title">Payment Mode</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="chequeNumber">Cheque Number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-file-invoice-dollar input-icon"></i>
                        <input
                          type="text"
                          id="chequeNumber"
                          name="chequeNumber"
                          className="form-input"
                          placeholder="Enter cheque number"
                          value={formData.chequeNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="amount">Amount</label>
                      <div className="input-wrapper">
                        <i className="fas fa-rupee-sign input-icon"></i>
                        <input
                          type="number"
                          id="amount"
                          name="amount"
                          className="form-input"
                          placeholder="Enter amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="chequeDate">Cheque Date</label>
                      <div className="input-wrapper">
                        <i className="fas fa-calendar input-icon"></i>
                        <input
                          type="date"
                          id="chequeDate"
                          name="chequeDate"
                          className="form-input"
                          value={formData.chequeDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="paidDate">Paid Date</label>
                      <div className="input-wrapper">
                        <i className="fas fa-calendar-check input-icon"></i>
                        <input
                          type="date"
                          id="paidDate"
                          name="paidDate"
                          className="form-input"
                          value={formData.paidDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <p className="form-warning">
                  Make sure all supplier details are correct before saving.
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
                    {isLoading ? 'Creating...' : 'Create Supplier'}
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

export default AddSupplier;

