import React, { useState, useEffect } from 'react';
import { chitPlansAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddChitEntry = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    chitNumber: '',
    customerName: '',
    customerPhone: '',
    chitPlanId: '',
    chitPlanName: '',
    chitPlanAmount: '',
    duration: '',
    paymentMode: '',
    notes: ''
  });
  const [isSearchingChit, setIsSearchingChit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const getUserIdentifier = () => {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        return userData.username || userData.email || userData.full_name || 'system';
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }
    return 'system';
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('chitEntryMaster');
    } else if (onBack) {
      onBack();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Search customer by chit number when chit number changes
    if (name === 'chitNumber' && value.trim().length > 0) {
      fetchCustomerByChitNumber(value.trim());
    } else if (name === 'chitNumber' && value.trim().length === 0) {
      resetForm();
    }
  };

  const fetchCustomerByChitNumber = async (chitNumber) => {
    setIsSearchingChit(true);
    setError('');
    try {
      const response = await customersAPI.getByChitNumber(chitNumber);
      if (response.success && response.customer) {
        const customer = response.customer;
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customerName: customer.customerName,
          customerPhone: customer.phone,
          chitPlanId: customer.chitPlanId,
          chitPlanName: customer.chitPlanName || '',
          chitPlanAmount: customer.chitPlanAmount || '',
          duration: customer.duration || ''
        }));
      } else {
        setError('Chit number not found');
        setSelectedCustomer(null);
        resetForm();
      }
    } catch (err) {
      console.error('Error fetching customer by chit number:', err);
      setError('Chit number not found');
      setSelectedCustomer(null);
      resetForm();
    } finally {
      setIsSearchingChit(false);
    }
  };

  const resetForm = () => {
    setFormData({
      chitNumber: '',
      customerName: '',
      customerPhone: '',
      chitPlanId: '',
      chitPlanName: '',
      chitPlanAmount: '',
      duration: '',
      paymentMode: '',
      notes: ''
    });
    setSelectedCustomer(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.chitNumber || !formData.chitNumber.trim()) {
      setError('Please enter a chit number');
      return;
    }

    if (!selectedCustomer) {
      setError('Please enter a valid chit number');
      return;
    }

    if (!formData.paymentMode || !formData.paymentMode.trim()) {
      setError('Please select a payment mode');
      return;
    }

    const confirmMessage = `Record payment for ${formData.customerName} - ${formData.chitPlanName}?`;
    
    setConfirmState({
      open: true,
      message: confirmMessage,
      onConfirm: async () => {
        setIsLoading(true);
        
        try {
          const createdBy = getUserIdentifier();
          const response = await chitPlansAPI.createEntry({
            customerId: selectedCustomer.id,
            chitPlanId: formData.chitPlanId,
            paymentMode: formData.paymentMode,
            notes: formData.notes || null,
            createdBy: createdBy
          });

          if (response.success) {
            // Dispatch event to trigger refresh in ChitEntryMaster
            window.dispatchEvent(new Event('chitEntryCompleted'));
            // Navigate after a short delay
            setTimeout(() => {
              handleBack();
            }, 500);
          }
        } catch (err) {
          console.error('Create chit entry error:', err);
        } finally {
          setIsLoading(false);
          setConfirmState({ open: false, message: '', onConfirm: null });
        }
      }
    });
  };

  return (
    <div className="add-user-container">
      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ open: false, message: '', onConfirm: null })}
      />
      
      {/* Header */}
      <header className="add-user-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="add-user-title">Add Chit Entry</h1>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={() => onNavigate && onNavigate('dashboard')}>
            <i className="fas fa-home"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="add-user-content">
        <form onSubmit={handleSubmit} className="add-user-form">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}

          <div className="form-section">
            <div className="form-grid three-col">
              {/* Row 1: Chit Number */}
              <div className="form-group" style={{ gridColumn: '1 / -1', position: 'relative' }}>
                <label htmlFor="chitNumber">Chit Number *</label>
                <div className="input-wrapper">
                  <i className="fas fa-hashtag input-icon"></i>
                  <input
                    type="text"
                    id="chitNumber"
                    name="chitNumber"
                    className="form-input"
                    placeholder="Enter chit number (e.g., CHIT-1234)"
                    value={formData.chitNumber}
                    onChange={handleInputChange}
                    required
                    autoFocus
                    style={{ paddingRight: isSearchingChit ? '40px' : '18px' }}
                  />
                  {isSearchingChit && (
                    <i className="fas fa-spinner fa-spin" style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666' 
                    }}></i>
                  )}
                </div>
              </div>

              {/* Row 2: Customer Name, Phone, Chit Plan */}
              <div className="form-group">
                <label htmlFor="customerName">Customer Name</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    className="form-input"
                    placeholder="Customer name"
                    value={formData.customerName}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="customerPhone">Phone Number</label>
                <div className="input-wrapper">
                  <i className="fas fa-phone input-icon"></i>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    className="form-input"
                    placeholder="Phone number"
                    value={formData.customerPhone}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="chitPlanName">Chit Plan</label>
                <div className="input-wrapper">
                  <i className="fas fa-file-invoice-dollar input-icon"></i>
                  <input
                    type="text"
                    id="chitPlanName"
                    name="chitPlanName"
                    className="form-input"
                    placeholder="Chit plan"
                    value={formData.chitPlanName ? `${formData.chitPlanName} - ₹${parseFloat(formData.chitPlanAmount || 0).toLocaleString('en-IN')}` : ''}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              {/* Row 3: Duration */}
              {formData.duration && (
                <div className="form-group">
                  <label htmlFor="duration">Duration (Months)</label>
                  <div className="input-wrapper">
                    <i className="fas fa-calendar-alt input-icon"></i>
                    <input
                      type="text"
                      id="duration"
                      name="duration"
                      className="form-input"
                      placeholder="Duration"
                      value={`${formData.duration} months`}
                      readOnly
                      style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>
              )}

              {/* Row 4: Payment Mode */}
              <div className="form-group">
                <label htmlFor="paymentMode">Payment Mode *</label>
                <div className="input-wrapper">
                  <i className="fas fa-credit-card input-icon"></i>
                  <select
                    id="paymentMode"
                    name="paymentMode"
                    className="form-input"
                    value={formData.paymentMode}
                    onChange={handleInputChange}
                    required
                    disabled={!selectedCustomer}
                    style={{ 
                      background: !selectedCustomer ? '#f8f9fa' : '#fff',
                      cursor: !selectedCustomer ? 'not-allowed' : 'pointer'
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
                  <i className="fas fa-chevron-down dropdown-icon"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginTop: '40px',
            paddingTop: '20px'
          }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !selectedCustomer || !formData.paymentMode}
              style={{
                width: '200px',
                maxWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: (isLoading || !selectedCustomer || !formData.paymentMode) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i> Submit Entry
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddChitEntry;

