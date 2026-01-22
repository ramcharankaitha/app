import React, { useState, useEffect, useRef } from 'react';
import { customersAPI, chitPlansAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const ChitPlan = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    chitPlanId: '',
    duration: '',
    startDate: new Date().toISOString().split('T')[0], // Current date as default
    endDate: '',
    customerName: '',
    phone: ''
  });
  const [chitPlans, setChitPlans] = useState([]);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [generatedChitNumber, setGeneratedChitNumber] = useState('');
  const customerDropdownRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Fetch chit plans on mount
  useEffect(() => {
    const fetchChitPlans = async () => {
      try {
        const response = await chitPlansAPI.getPlans();
        if (response && response.success) {
          setChitPlans(response.plans || []);
        }
      } catch (err) {
        console.error('Error fetching chit plans:', err);
      }
    };
    fetchChitPlans();
  }, []);

  // Calculate end date when duration or start date changes
  useEffect(() => {
    if (formData.startDate && formData.duration && parseInt(formData.duration) > 0) {
      const start = new Date(formData.startDate);
      const months = parseInt(formData.duration);
      const end = new Date(start);
      end.setMonth(end.getMonth() + months);
      setFormData(prev => ({
        ...prev,
        endDate: end.toISOString().split('T')[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        endDate: ''
      }));
    }
  }, [formData.startDate, formData.duration]);

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target) && 
          phoneInputRef.current && !phoneInputRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('chitPlan');
    } else if (onBack) {
      onBack();
    }
  };

  // Search customers by phone number
  const searchCustomers = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setCustomerSuggestions([]);
      setShowCustomerDropdown(false);
      return;
    }

    try {
      setIsLoadingCustomers(true);
      const response = await customersAPI.search(searchTerm);
      if (response.success) {
        setCustomerSuggestions(response.customers || []);
        setShowCustomerDropdown(true);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomerSuggestions([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Handle customer selection from dropdown
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      customerName: customer.full_name || '',
      phone: customer.phone || ''
    }));
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle phone number input with customer search
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        customerName: selectedCustomer && selectedCustomer.phone === value ? selectedCustomer.full_name : prev.customerName
      }));
      
      // Reset selected customer if phone changes
      if (selectedCustomer && selectedCustomer.phone !== value) {
        setSelectedCustomer(null);
      }
      
      // Search customers when phone number is entered
      if (value.trim().length >= 2) {
        searchCustomers(value);
      } else {
        setCustomerSuggestions([]);
        setShowCustomerDropdown(false);
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!formData.customerName || !formData.phone || !formData.chitPlanId || !formData.duration || !formData.startDate) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    const createdBy = getUserIdentifier();
    
    setConfirmState({
      open: true,
      message: `Create chit plan for ${formData.customerName}?`,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
          const response = await customersAPI.createChitPlanCustomer({
            fullName: formData.customerName.trim(),
            phone: formData.phone.trim(),
            chitPlanId: parseInt(formData.chitPlanId),
            duration: formData.duration.trim(),
            startDate: formData.startDate,
            endDate: formData.endDate,
            createdBy: createdBy
          });

          if (response.success) {
            setGeneratedChitNumber(response.chitNumber || '');
            setSuccessMessage(`Chit plan created successfully! Chit ID: ${response.chitNumber || 'N/A'}`);
            setTimeout(() => {
              setFormData({
                chitPlanId: '',
                duration: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                customerName: '',
                phone: ''
              });
              setSelectedCustomer(null);
              setGeneratedChitNumber('');
              setSuccessMessage('');
              if (onNavigate) {
                onNavigate('chitPlanList');
              }
            }, 3000);
          } else {
            setError(response.error || 'Failed to create chit plan');
          }
        } catch (err) {
          console.error('Create chit plan error:', err);
          setError(err.message || 'Failed to create chit plan. Please try again.');
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
          <h1 className="add-user-title">Chit Plan</h1>
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

          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: '20px' }}>
              <i className="fas fa-check-circle"></i> {successMessage}
            </div>
          )}

          <div className="form-section">
            {/* First Row: Customer Name, Phone Number, Type, Duration */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '4px' }}>
              <div className="form-group">
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
                  />
                </div>
              </div>

              {/* Phone Number with Autocomplete */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label htmlFor="phone">Phone Number *</label>
                <div className="input-wrapper" ref={phoneInputRef}>
                  <i className="fas fa-phone input-icon"></i>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-input"
                    placeholder="Type phone number to search"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {showCustomerDropdown && customerSuggestions.length > 0 && (
                  <div 
                    ref={customerDropdownRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 10000,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}
                  >
                    {isLoadingCustomers ? (
                      <div style={{ padding: '12px 16px', textAlign: 'center', color: '#666' }}>
                        <i className="fas fa-spinner fa-spin"></i> Searching...
                      </div>
                    ) : (
                      customerSuggestions.map((customer, index) => (
                        <div
                          key={index}
                          onClick={() => handleCustomerSelect(customer)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: index < customerSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                            background: selectedCustomer && selectedCustomer.phone === customer.phone ? '#f0f7ff' : '#fff',
                            color: selectedCustomer && selectedCustomer.phone === customer.phone ? '#007bff' : '#333'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                          onMouseLeave={(e) => e.target.style.background = selectedCustomer && selectedCustomer.phone === customer.phone ? '#f0f7ff' : '#fff'}
                        >
                          <div style={{ fontWeight: '600' }}>{customer.full_name}</div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{customer.phone}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Chit Plan Type */}
              <div className="form-group">
                <label htmlFor="chitPlanId">Type *</label>
                <div className="input-wrapper">
                  <i className="fas fa-file-invoice-dollar input-icon"></i>
                  <select
                    id="chitPlanId"
                    name="chitPlanId"
                    className="form-input"
                    value={formData.chitPlanId}
                    onChange={handleInputChange}
                    required
                    style={{ paddingLeft: '50px', appearance: 'auto', cursor: 'pointer' }}
                  >
                    <option value="">Select Chit Plan</option>
                    {chitPlans.slice(0, 2).map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_name} - ₹{parseFloat(plan.plan_amount || 0).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down dropdown-icon"></i>
                </div>
              </div>

              {/* Duration (Predefined dropdown) */}
              <div className="form-group">
                <label htmlFor="duration">Duration *</label>
                <div className="input-wrapper">
                  <i className="fas fa-calendar-alt input-icon"></i>
                  <select
                    id="duration"
                    name="duration"
                    className="form-input"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    style={{ paddingLeft: '50px', appearance: 'auto', cursor: 'pointer' }}
                  >
                    <option value="">Select Duration</option>
                    <option value="3">3 Months</option>
                    <option value="4">4 Months</option>
                    <option value="5">5 Months</option>
                    <option value="6">6 Months</option>
                    <option value="7">7 Months</option>
                  </select>
                  <i className="fas fa-chevron-down dropdown-icon"></i>
                </div>
              </div>
            </div>

            {/* Second Row: Start Date, End Date (same width as above fields) */}
            <div className="form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '0' }}>
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <div className="input-wrapper">
                  <i className="fas fa-calendar input-icon"></i>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="form-input"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* End Date (Auto-calculated) */}
              <div className="form-group">
                <label htmlFor="endDate">End Date</label>
                <div className="input-wrapper">
                  <i className="fas fa-calendar-check input-icon"></i>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="form-input"
                    value={formData.endDate}
                    readOnly
                    style={{ background: '#f8f9fa', cursor: 'not-allowed' }}
                    title="Automatically calculated based on start date and duration"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions" style={{ marginTop: '40px', paddingTop: '20px' }}>
            <button
              type="submit"
              disabled={isLoading || !formData.customerName || !formData.phone || !formData.chitPlanId || !formData.duration || !formData.startDate}
              className="submit-btn"
              style={{
                width: '200px',
                margin: '0 auto',
                padding: '12px 24px',
                background: (isLoading || !formData.customerName || !formData.phone || !formData.chitPlanId || !formData.duration || !formData.startDate) ? '#ccc' : '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (isLoading || !formData.customerName || !formData.phone || !formData.chitPlanId || !formData.duration || !formData.startDate) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create Chit Plan
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ChitPlan;
