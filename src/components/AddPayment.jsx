import React, { useState, useEffect, useRef } from 'react';
import { paymentsAPI, suppliersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import './addUser.css';

const AddPayment = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    chqNumber: '',
    utr: '',
    dateToBePaid: '',
    amount: ''
  });
  const [supplierSearchResults, setSupplierSearchResults] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [isSearchingSupplier, setIsSearchingSupplier] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const supplierDropdownRef = useRef(null);

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
      onNavigate('paymentMaster');
    } else if (onBack) {
      onBack();
    }
  };

  const handleCancel = () => {
    if (onNavigate) {
      onNavigate('paymentMaster');
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

    if (name === 'supplierName') {
      searchSuppliers(value);
    }
  };

  const searchSuppliers = async (query) => {
    if (!query || query.length < 2) {
      setSupplierSearchResults([]);
      setShowSupplierDropdown(false);
      return;
    }

    setIsSearchingSupplier(true);
    try {
      const response = await suppliersAPI.getAll();
      if (response.success) {
        const searchQuery = query.toLowerCase();
        const filtered = response.suppliers.filter(supplier => {
          const supplierName = (supplier.name || supplier.supplier_name || '').toLowerCase();
          const phone = supplier.phone || supplier.phone_number_1 || '';
          return supplierName.includes(searchQuery) || phone.includes(query);
        });
        setSupplierSearchResults(filtered.slice(0, 5));
        setShowSupplierDropdown(filtered.length > 0);
      }
    } catch (err) {
      console.error('Error searching suppliers:', err);
    } finally {
      setIsSearchingSupplier(false);
    }
  };

  const handleSupplierSelect = (supplier) => {
    const supplierName = supplier.name || supplier.supplier_name || '';
    setFormData(prev => ({
      ...prev,
      supplierName: supplierName
    }));
    setSupplierSearchResults([]);
    setShowSupplierDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target)) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const submitPayment = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!formData.supplierName || formData.supplierName.trim() === '') {
        setError('Please enter a supplier name');
        setIsLoading(false);
        return;
      }

      if (!formData.dateToBePaid) {
        setError('Please select date to be paid');
        setIsLoading(false);
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Please enter a valid amount');
        setIsLoading(false);
        return;
      }

      const createdBy = getUserIdentifier();

      const response = await paymentsAPI.create({
        supplierName: formData.supplierName.trim(),
        chqNumber: formData.chqNumber.trim() || null,
        utr: formData.utr.trim() || null,
        dateToBePaid: formData.dateToBePaid,
        amount: parseFloat(formData.amount),
        createdBy: createdBy
      });

      if (response.success) {
        setFormData({
          supplierName: '',
          chqNumber: '',
          utr: '',
          dateToBePaid: '',
          amount: ''
        });
        setSuccessMessage('Payment created successfully!');
        // Dispatch event to notify PaymentMaster page to refresh
        window.dispatchEvent(new CustomEvent('paymentCreated'));
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 1500);
      } else {
        setError(response.error || 'Failed to create payment');
      }
    } catch (err) {
      console.error('Payment creation error:', err);
      setError('Failed to create payment. Please try again.');
    } finally {
      setIsLoading(false);
      setConfirmState({ open: false, message: '', onConfirm: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: `Create payment for ${formData.supplierName}?`,
      onConfirm: submitPayment,
    });
  };

  return (
    <div className="dashboard-container">
      {/* Left Sidebar Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-item" onClick={() => onNavigate && onNavigate('dashboard')}>
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
          <div className="nav-item" onClick={() => onNavigate && onNavigate('staff')}>
            <div className="nav-icon">
              <i className="fas fa-user-tie"></i>
            </div>
            <span>Staff</span>
          </div>
        )}
        <div className="nav-item" onClick={() => onNavigate && onNavigate('masterMenu')}>
          <div className="nav-icon">
            <i className="fas fa-th-large"></i>
          </div>
          <span>Master Menu</span>
        </div>
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
        </div>
        <div className="nav-item" onClick={() => onNavigate && onNavigate('settings')}>
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
              <h1 className="page-title">Add Payment</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
              <div className="form-grid three-col">
                {/* Row 1: Supplier Name, CHQ Number, UTR */}
                <div className="form-group" ref={supplierDropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
                  <label htmlFor="supplierName">Supplier Name *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-truck input-icon"></i>
                    <input
                      type="text"
                      id="supplierName"
                      name="supplierName"
                      className="form-input"
                      placeholder="Enter supplier name"
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      required
                      autoFocus
                    />
                    {isSearchingSupplier && (
                      <i className="fas fa-spinner fa-spin" style={{ 
                        position: 'absolute', 
                        right: '10px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        color: '#999'
                      }}></i>
                    )}
                  </div>
                  {showSupplierDropdown && supplierSearchResults.length > 0 && (
                    <div className="typeahead-dropdown">
                      {supplierSearchResults.map(supplier => (
                        <div
                          key={supplier.id}
                          onClick={() => handleSupplierSelect(supplier)}
                        >
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                            {supplier.name || supplier.supplier_name}
                          </div>
                          {(supplier.phone || supplier.phone_number_1) && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              {supplier.phone || supplier.phone_number_1}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="chqNumber">CHQ Number</label>
                  <div className="input-wrapper">
                    <i className="fas fa-file-invoice input-icon"></i>
                    <input
                      type="text"
                      id="chqNumber"
                      name="chqNumber"
                      className="form-input"
                      placeholder="Enter CHQ number"
                      value={formData.chqNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="utr">UTR</label>
                  <div className="input-wrapper">
                    <i className="fas fa-hashtag input-icon"></i>
                    <input
                      type="text"
                      id="utr"
                      name="utr"
                      className="form-input"
                      placeholder="Enter UTR number"
                      value={formData.utr}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Row 2: Date to be Paid, Amount */}
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="dateToBePaid">Date to be Paid *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-calendar input-icon"></i>
                    <input
                      type="date"
                      id="dateToBePaid"
                      name="dateToBePaid"
                      className="form-input"
                      value={formData.dateToBePaid}
                      onChange={handleInputChange}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label htmlFor="amount">Amount *</label>
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
                      required
                    />
                  </div>
                </div>
              </div>

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
                  {isLoading ? 'Creating...' : 'Create Payment'}
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
        title="Confirm Creation"
        message={confirmState.message}
        confirmText="Yes, Create"
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

export default AddPayment;



