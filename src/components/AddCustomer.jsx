import React, { useState, useRef, useEffect } from 'react';
import { customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddCustomer = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    whatsapp: ''
  });
  const [customerTokens, setCustomerTokens] = useState(0);
  const [isCheckingTokens, setIsCheckingTokens] = useState(false);
  const [phoneExistsError, setPhoneExistsError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const phoneCheckTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('customers');
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

  const handleSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('customers');
    } else if (onCancel) {
      onCancel();
    }
  };

  const checkPhoneExists = async (phone) => {
    if (!phone || phone.trim() === '') {
      setPhoneExistsError('');
      return false;
    }

    setIsCheckingPhone(true);
    setPhoneExistsError('');
    
    try {
      // Search for customers with this phone number
      const response = await customersAPI.search(phone.trim());
      
      if (response.success && response.customers && response.customers.length > 0) {
        // Check if any customer has this exact phone number
        const customerWithPhone = response.customers.find(c => 
          c.phone && c.phone.trim() === phone.trim()
        );
        
        if (customerWithPhone) {
          setPhoneExistsError(`Mobile number already exists! This number is registered with customer: ${customerWithPhone.full_name || customerWithPhone.fullName || 'N/A'} (${customerWithPhone.email || 'N/A'})`);
          return true;
        }
      }
      
      setPhoneExistsError('');
      return false;
    } catch (err) {
      console.error('Error checking phone number:', err);
      // Don't show error for API errors, just log it
      setPhoneExistsError('');
      return false;
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Check for existing customer tokens when phone changes
    if (name === 'phone') {
      // Removed token checking - tokens are handled in Transaction Menu only
    }

    // Check if phone number already exists when phone changes
    if (name === 'phone') {
      // Clear previous timeout
      if (phoneCheckTimeoutRef.current) {
        clearTimeout(phoneCheckTimeoutRef.current);
      }
      
      // Clear error immediately when user starts typing
      setPhoneExistsError('');
      
      // Debounce the check - wait 800ms after user stops typing
      phoneCheckTimeoutRef.current = setTimeout(() => {
        checkPhoneExists(value);
      }, 800);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (phoneCheckTimeoutRef.current) {
        clearTimeout(phoneCheckTimeoutRef.current);
      }
    };
  }, []);


  // Product handling removed - products are handled in Stock Out (Transaction Menu) only

  const submitCustomer = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');


    // Check if phone number already exists before submission
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneExists = await checkPhoneExists(formData.phone);
      if (phoneExists) {
        setIsLoading(false);
        return;
      }
    }

    try {
      // Master Menu customer creation - only basic customer info, no products or payment

      // Get current user information for created_by field
      const getUserIdentifier = () => {
        const userRole = localStorage.getItem('userRole');
        const userDataStr = localStorage.getItem('userData');
        
        // If admin, use email to identify
        if (userRole === 'admin') {
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              return userData.email || userData.name || 'admin';
            } catch (e) {
              console.error('Error parsing userData:', e);
            }
          }
          return 'admin';
        }
        
        // For staff/supervisor, use username or name
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            return userData.username || userData.email || userData.name || userData.full_name || 'system';
          } catch (e) {
            console.error('Error parsing userData:', e);
          }
        }
        return 'system';
      };

      const createdBy = getUserIdentifier();

      // Create basic customer record (no products or payment in Master Menu)
      const customerData = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        whatsapp: formData.whatsapp,
        itemCode: null,
        quantity: 0,
        mrp: null,
        sellRate: null,
        discount: 0,
        paymentMode: null,
        tokensUsed: 0,
        tokensEarned: 0,
        totalAmount: 0,
        createdBy: createdBy
      };


      const response = await customersAPI.create(customerData);

      if (response.success) {
        setSuccessMessage('Customer created successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 3000);
      } else {
        setError('Failed to create customer. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create customer records. Please try again.');
      console.error('Create customer error:', err);
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
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
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
        <div className="nav-item active" onClick={handleSettings}>
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
              <h1 className="page-title">Add Customer</h1>
              <p className="page-subtitle">Create a new customer for this store.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            {/* Photo Upload */}
            <div className="photo-upload-section">
              <div className="photo-placeholder">
                <i className="fas fa-camera"></i>
              </div>
              <button type="button" className="upload-photo-btn">
                <i className="fas fa-camera"></i>
                <span>Upload photo</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="add-user-form add-customer-form">
                {/* All fields in 3-column grid without section titles */}
                <div className="form-section">
                  <div className="form-grid three-col">
                    {/* Row 1: Name, Phone Number, Email, WhatsApp */}
                    <div className="form-group">
                      <label htmlFor="fullName">Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-input"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-input"
                          placeholder="Enter phone number"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          style={phoneExistsError ? { borderColor: '#dc3545' } : {}}
                        />
                        {isCheckingPhone && (
                          <i className="fas fa-spinner fa-spin" style={{ 
                            position: 'absolute', 
                            right: '12px', 
                            color: '#666' 
                          }}></i>
                        )}
                      </div>
                      {phoneExistsError && (
                        <div style={{ 
                          marginTop: '4px', 
                          fontSize: '12px', 
                          color: '#dc3545', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <i className="fas fa-exclamation-circle"></i>
                          {phoneExistsError}
                        </div>
                      )}
                      {!phoneExistsError && isCheckingTokens && formData.phone && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                          <i className="fas fa-spinner fa-spin" style={{ marginRight: '4px' }}></i>
                          Checking for tokens...
                        </div>
                      )}
                      {!phoneExistsError && !isCheckingTokens && customerTokens > 0 && formData.phone && (
                        <div style={{ 
                          marginTop: '4px', 
                          fontSize: '12px', 
                          color: '#28a745', 
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <i className="fas fa-gift"></i>
                          Returning customer! You have {customerTokens} token(s) available.
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="whatsapp">WhatsApp</label>
                        <div className="input-wrapper">
                          <i className="fab fa-whatsapp input-icon"></i>
                          <select
                            id="whatsapp"
                            name="whatsapp"
                            className="form-input"
                            value={formData.whatsapp}
                            onChange={handleInputChange}
                          >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                          <i className="fas fa-chevron-down dropdown-icon"></i>
                        </div>
                    </div>


                    {/* Row 2: Street, City, State */}
                    <div className="form-group">
                      <label htmlFor="address">Street</label>
                      <div className="input-wrapper">
                        <i className="fas fa-map-marker-alt input-icon"></i>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          className="form-input"
                          placeholder="Enter street address"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                        />
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
                          required
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
                          required
                        />
                      </div>
                    </div>

                    {/* Row 3: Pincode (alone) */}
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
                          required
                          maxLength="10"
                        />
                      </div>
                    </div>
                  </div>
                </div>


                {/* Products and payment details are handled in Stock Out (Transaction Menu) only */}


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

export default AddCustomer;

