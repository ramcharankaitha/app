import React, { useState, useEffect } from 'react';
import { chitPlansAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddChitEntry = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    chitPlanId: '',
    chitPlanName: '',
    chitPlanAmount: '',
    paymentMode: '',
    notes: ''
  });
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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

    // Search customers when name changes
    if (name === 'customerName' && value.trim().length > 0) {
      searchCustomers(value.trim());
    } else if (name === 'customerName' && value.trim().length === 0) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setSelectedCustomer(null);
      resetForm();
    }
  };

  const searchCustomers = async (query) => {
    setIsSearchingCustomer(true);
    try {
      const response = await chitPlansAPI.getCustomers();
      if (response.success && response.customers) {
        const filtered = response.customers.filter(customer =>
          customer.customer_name?.toLowerCase().includes(query.toLowerCase())
        );
        setCustomerSearchResults(filtered);
        setShowCustomerDropdown(filtered.length > 0);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerName: customer.customer_name,
      customerPhone: customer.phone,
      chitPlanId: customer.chit_plan_id,
      chitPlanName: customer.plan_name || '',
      chitPlanAmount: customer.plan_amount || ''
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      chitPlanId: '',
      chitPlanName: '',
      chitPlanAmount: '',
      paymentMode: '',
      notes: ''
    });
    setSelectedCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerName.trim()) {
      return;
    }

    if (!formData.chitPlanId) {
      return;
    }

    if (!formData.paymentMode || !formData.paymentMode.trim()) {
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
          <div className="form-section">
            <div className="form-grid three-col">
              {/* Row 1: Customer Name */}
              <div className="form-group" style={{ gridColumn: '1 / -1', position: 'relative' }}>
                <label htmlFor="customerName">Customer Name *</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    className="form-input"
                    placeholder="Enter customer name"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                    autoFocus
                    style={{ paddingRight: isSearchingCustomer ? '40px' : '18px' }}
                  />
                  {isSearchingCustomer && (
                    <i className="fas fa-spinner fa-spin" style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666' 
                    }}></i>
                  )}
                </div>
                {/* Customer Dropdown */}
                {showCustomerDropdown && customerSearchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    {customerSearchResults.map((customer) => (
                      <div
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = '#fff'}
                      >
                        <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                          {customer.customer_name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          <i className="fas fa-phone" style={{ marginRight: '6px' }}></i>
                          {customer.phone || 'N/A'}
                          {customer.plan_name && (
                            <>
                              <span style={{ margin: '0 8px' }}>•</span>
                              <i className="fas fa-file-invoice-dollar" style={{ marginRight: '6px' }}></i>
                              {customer.plan_name} - ₹{customer.plan_amount ? parseFloat(customer.plan_amount).toLocaleString('en-IN') : '0'}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 2: Phone, Chit Plan Name, Chit Plan Amount */}
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

              {/* Row 3: Payment Mode */}
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

