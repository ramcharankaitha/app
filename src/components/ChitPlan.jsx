import React, { useState, useEffect } from 'react';
import { customersAPI, chitPlansAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const ChitPlan = ({ onBack, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    whatsapp: '',
    chitPlanId: '',
    duration: ''
  });
  const [chitPlans, setChitPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [generatedChitNumber, setGeneratedChitNumber] = useState('');

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

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('chitPlanList');
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

    if (!formData.fullName || !formData.phone || !formData.chitPlanId) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    const createdBy = getUserIdentifier();
    
    setConfirmState({
      open: true,
      message: `Create chit plan customer for ${formData.fullName}?`,
      onConfirm: async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
          const response = await customersAPI.createChitPlanCustomer({
            fullName: formData.fullName.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            state: formData.state.trim() || null,
            pincode: formData.pincode.trim() || null,
            whatsapp: formData.whatsapp.trim() || null,
            chitPlanId: parseInt(formData.chitPlanId),
            duration: formData.duration.trim() || null,
            createdBy: createdBy
          });

          if (response.success) {
            setGeneratedChitNumber(response.chitNumber || '');
            setSuccessMessage(`Customer created successfully! Chit Number: ${response.chitNumber || 'N/A'}`);
            setTimeout(() => {
              setFormData({
                fullName: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                whatsapp: '',
                chitPlanId: '',
                duration: ''
              });
            setGeneratedChitNumber('');
            setSuccessMessage('');
            if (onNavigate) {
              onNavigate('chitPlanList');
            }
            }, 3000);
          } else {
            setError(response.error || 'Failed to create customer');
          }
        } catch (err) {
          console.error('Create chit plan customer error:', err);
          setError(err.message || 'Failed to create customer. Please try again.');
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
            <div className="form-grid four-col">
              {/* Row 1: Name, Phone, WhatsApp, Address */}
              <div className="form-group">
                <label htmlFor="fullName">Customer Name *</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className="form-input"
                    placeholder="Enter customer name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
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
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="whatsapp">WhatsApp Number</label>
                <div className="input-wrapper">
                  <i className="fab fa-whatsapp input-icon"></i>
                  <input
                    type="tel"
                    id="whatsapp"
                    name="whatsapp"
                    className="form-input"
                    placeholder="Enter WhatsApp number"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <div className="input-wrapper">
                  <i className="fas fa-map-marker-alt input-icon"></i>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className="form-input"
                    placeholder="Enter address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Row 2: City, State, Pincode, Chit Plan */}
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

              <div className="form-group">
                <label htmlFor="chitPlanId">Chit Plan *</label>
                <div className="input-wrapper">
                  <i className="fas fa-file-invoice-dollar input-icon"></i>
                  <select
                    id="chitPlanId"
                    name="chitPlanId"
                    className="form-input"
                    value={formData.chitPlanId}
                    onChange={handleInputChange}
                    required
                    style={{ paddingLeft: '30px', appearance: 'auto', cursor: 'pointer' }}
                  >
                    <option value="">Select Chit Plan</option>
                    {chitPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.plan_name} - ₹{parseFloat(plan.plan_amount || 0).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down dropdown-icon"></i>
                </div>
              </div>

              {/* Row 3: Duration */}
              <div className="form-group">
                <label htmlFor="duration">Duration (Months)</label>
                <div className="input-wrapper">
                  <i className="fas fa-calendar-alt input-icon"></i>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    className="form-input"
                    placeholder="Enter duration in months"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-actions" style={{ marginTop: '40px', paddingTop: '20px' }}>
            <button
              type="submit"
              disabled={isLoading || !formData.fullName || !formData.phone || !formData.chitPlanId}
              className="submit-btn"
              style={{
                width: '200px',
                margin: '0 auto',
                padding: '12px 24px',
                background: (isLoading || !formData.fullName || !formData.phone || !formData.chitPlanId) ? '#ccc' : '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (isLoading || !formData.fullName || !formData.phone || !formData.chitPlanId) ? 'not-allowed' : 'pointer',
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
                  Create Customer
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

