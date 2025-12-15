import React, { useState } from 'react';
import { dispatchAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddDispatch = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    customer: '',
    phone: '',
    transportName: ''
  });
  const [dispatchItems, setDispatchItems] = useState([
    { id: 1, name: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('dispatch');
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

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('dispatch');
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

  const handleItemChange = (id, value) => {
    setDispatchItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, name: value } : item
      )
    );
  };

  const addDispatchItem = () => {
    const newId = dispatchItems.length > 0 
      ? Math.max(...dispatchItems.map(item => item.id)) + 1 
      : 1;
    setDispatchItems(prev => [...prev, { id: newId, name: '' }]);
  };

  const removeDispatchItem = (id) => {
    if (dispatchItems.length > 1) {
      setDispatchItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const submitDispatch = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Filter out empty items
      const validItems = dispatchItems.filter(item => item.name.trim() !== '');
      
      if (validItems.length === 0) {
        setError('Please add at least one product to dispatch.');
        setIsLoading(false);
        return;
      }

      // Create a dispatch record for each item
      const promises = validItems.map(item =>
        dispatchAPI.create({
          customer: formData.customer,
          name: item.name,
          phone: formData.phone,
          transportName: formData.transportName
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(result => result.success);

      if (allSuccess) {
        setSuccessMessage('Save changes are done');
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      } else {
        setError('Some dispatch records failed to create. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create dispatch records. Please try again.');
      console.error('Create dispatch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitDispatch,
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
        <div className="nav-item" onClick={handleManagers}>
          <div className="nav-icon">
            <i className="fas fa-users"></i>
          </div>
          <span>Managers</span>
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
              <h1 className="page-title">Add Dispatch Record</h1>
              <p className="page-subtitle">Create a new dispatch record.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Dispatch Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Dispatch details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="customer">Customer</label>
                      <div className="input-wrapper">
                        <i className="fas fa-user input-icon"></i>
                        <input
                          type="text"
                          id="customer"
                          name="customer"
                          className="form-input"
                          placeholder="Enter customer name."
                          value={formData.customer}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Products to Dispatch</label>
                      {dispatchItems.map((item, index) => (
                        <div key={item.id} style={{ 
                          display: 'flex', 
                          gap: '10px', 
                          marginBottom: '10px',
                          alignItems: 'flex-start'
                        }}>
                          <div className="input-wrapper" style={{ flex: 1 }}>
                            <i className="fas fa-box input-icon"></i>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`Enter product name ${index + 1}...`}
                              value={item.name}
                              onChange={(e) => handleItemChange(item.id, e.target.value)}
                              required={index === 0}
                            />
                          </div>
                          {dispatchItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDispatchItem(item.id)}
                              style={{
                                padding: '10px 14px',
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '40px',
                                height: '40px'
                              }}
                              title="Remove this product"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addDispatchItem}
                        style={{
                          marginTop: '10px',
                          padding: '10px 16px',
                          background: '#28a745',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <i className="fas fa-plus"></i>
                        <span>Add More Products</span>
                      </button>
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
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="transportName">Transport Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-truck input-icon"></i>
                        <input
                          type="text"
                          id="transportName"
                          name="transportName"
                          className="form-input"
                          placeholder="Enter transport name."
                          value={formData.transportName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning Message */}
                <p className="form-warning">
                  Make sure all dispatch details are correct before saving.
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
                    {isLoading ? 'Creating...' : 'Create Dispatch Record'}
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

export default AddDispatch;

