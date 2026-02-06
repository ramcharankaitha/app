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
    startDate: '',
    endDate: '',
    paymentMode: '',
    month: '',
    chitAmountToPay: '',
    notes: ''
  });
  const [isSearchingChit, setIsSearchingChit] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paidMonths, setPaidMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
        setPaidMonths(customer.paidMonths || []);
        setFormData(prev => ({
          ...prev,
          customerName: customer.customerName,
          customerPhone: customer.phone,
          chitPlanId: customer.chitPlanId,
          chitPlanName: customer.chitPlanName || '',
          chitPlanAmount: customer.chitPlanAmount || '',
          duration: customer.duration || '',
          startDate: customer.startDate || customer.start_date || '',
          endDate: customer.endDate || customer.end_date || '',
          chitAmountToPay: customer.chitPlanAmount || '', // Set the chit amount to pay
          month: '' // Reset month when customer changes
        }));
      } else {
        setError('Chit number not found');
        setSelectedCustomer(null);
        setPaidMonths([]);
        resetForm();
      }
    } catch (err) {
      console.error('Error fetching customer by chit number:', err);
      setError('Chit number not found');
      setSelectedCustomer(null);
      setPaidMonths([]);
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
      startDate: '',
      endDate: '',
      paymentMode: '',
      month: '',
      chitAmountToPay: '',
      notes: ''
    });
    setSelectedCustomer(null);
    setPaidMonths([]);
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

    if (!formData.month || !formData.month.trim()) {
      setError('Please select a month');
      return;
    }

    // Check if selected month is already paid
    const selectedMonth = parseInt(formData.month);
    if (paidMonths.includes(selectedMonth)) {
      setError(`Month ${selectedMonth} has already been paid. Please select a different month.`);
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
            month: formData.month,
            notes: formData.notes || null,
            createdBy: createdBy
          });

          if (response.success) {
            setError('');
            setSuccessMessage('Chit receipt created successfully!');
            // Dispatch event to trigger refresh in ChitEntryMaster
            window.dispatchEvent(new Event('chitEntryCompleted'));
            // Navigate after a short delay
            setTimeout(() => {
              handleBack();
            }, 1500);
          } else {
            setError(response.error || 'Failed to create chit receipt. Please try again.');
            setConfirmState({ open: false, message: '', onConfirm: null });
          }
        } catch (err) {
          console.error('Create chit entry error:', err);
          setError(err.message || 'Failed to create chit receipt. Please try again.');
          setConfirmState({ open: false, message: '', onConfirm: null });
        } finally {
          setIsLoading(false);
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
          <h1 className="add-user-title">Chit Receipt</h1>
        </div>
        <div className="header-right">
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
          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          <div className="form-section">
            {/* First Row: Chit ID, Customer Name, Customer Phone Number, Chit Type */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '4px' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="chitNumber">Chit ID *</label>
                <div className="input-wrapper">
                  <i className="fas fa-hashtag input-icon"></i>
                  <input
                    type="text"
                    id="chitNumber"
                    name="chitNumber"
                    className="form-input"
                    placeholder="Enter chit ID"
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
                <label htmlFor="customerPhone">Customer Phone Number</label>
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
                <label htmlFor="chitPlanName">Chit Type</label>
                <div className="input-wrapper">
                  <i className="fas fa-file-invoice-dollar input-icon"></i>
                  <input
                    type="text"
                    id="chitPlanName"
                    name="chitPlanName"
                    className="form-input"
                    placeholder="Chit type"
                    value={formData.chitPlanName ? `${formData.chitPlanName} - ₹${parseFloat(formData.chitPlanAmount || 0).toLocaleString('en-IN')}` : ''}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            {/* Second Row: Month, Chit Amount to Pay, Payment Mode (only after Chit ID is entered) */}
            {formData.chitNumber && formData.chitNumber.trim() !== '' && (
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '0' }}>
                <div className="form-group">
                  <label htmlFor="month">Month *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-calendar-alt input-icon"></i>
                    <select
                      id="month"
                      name="month"
                      className="form-input"
                      value={formData.month}
                      onChange={handleInputChange}
                      required
                      disabled={!selectedCustomer || !formData.duration || paidMonths.length >= parseInt(formData.duration || 0)}
                      style={{ 
                        paddingLeft: '50px',
                        appearance: 'auto',
                        cursor: (!selectedCustomer || !formData.duration || paidMonths.length >= parseInt(formData.duration || 0)) ? 'not-allowed' : 'pointer',
                        background: (!selectedCustomer || !formData.duration || paidMonths.length >= parseInt(formData.duration || 0)) ? '#f8f9fa' : '#fff'
                      }}
                    >
                      <option value="">
                        {!formData.duration ? 'Select duration first' : (paidMonths.length >= parseInt(formData.duration || 0) ? 'All months paid' : 'Select month')}
                      </option>
                      {formData.duration && Array.from({ length: parseInt(formData.duration) || 0 }, (_, i) => {
                        const monthNumber = i + 1;
                        const isPaid = paidMonths.includes(monthNumber);
                        // Don't show paid months in the dropdown
                        if (isPaid) {
                          return null;
                        }
                        return (
                          <option 
                            key={monthNumber} 
                            value={monthNumber}
                          >
                            Month {monthNumber}
                          </option>
                        );
                      })}
                    </select>
                    <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                  {formData.duration && paidMonths.length > 0 && paidMonths.length < parseInt(formData.duration) && (
                    <small style={{ color: '#666', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      Paid months: {paidMonths.sort((a, b) => a - b).join(', ')} / {formData.duration} months
                    </small>
                  )}
                  {formData.duration && paidMonths.length >= parseInt(formData.duration) && (
                    <small style={{ color: '#dc3545', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      All {formData.duration} months have been paid
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="chitAmountToPay">Chit Amount to Pay</label>
                  <div className="input-wrapper">
                    <i className="fas fa-rupee-sign input-icon"></i>
                    <input
                      type="text"
                      id="chitAmountToPay"
                      name="chitAmountToPay"
                      className="form-input"
                      placeholder="Chit amount"
                      value={formData.chitAmountToPay ? `₹${parseFloat(formData.chitAmountToPay || 0).toLocaleString('en-IN')}` : ''}
                      readOnly
                      style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="paymentMode">Payment *</label>
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
                        paddingLeft: '50px',
                        appearance: 'auto',
                        cursor: !selectedCustomer ? 'not-allowed' : 'pointer',
                        background: !selectedCustomer ? '#f8f9fa' : '#fff'
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
            )}
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
              disabled={isLoading || !selectedCustomer || !formData.paymentMode || !formData.month}
              style={{
                width: '200px',
                maxWidth: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: (isLoading || !selectedCustomer || !formData.paymentMode || !formData.month) ? 'not-allowed' : 'pointer'
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

