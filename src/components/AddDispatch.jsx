import React, { useState, useEffect, useRef } from 'react';
import { dispatchAPI, transportAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddDispatch = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    customer: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    transportName: '',
    packaging: '',
    llrNumber: ''
  });
  const [dispatchItems, setDispatchItems] = useState([]);
  const [matchingTransports, setMatchingTransports] = useState([]);
  const [isLoadingTransports, setIsLoadingTransports] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const customerInputRef = useRef(null);
  const customerDropdownRef = useRef(null);
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
    
    // Handle custom transport option
    if (name === 'transportName' && value === '__custom__') {
      setFormData(prev => ({
        ...prev,
        [name]: ''
      }));
      setMatchingTransports([]); // Clear dropdown to show text input
      return;
    }
    
    // Handle customer name search
    if (name === 'customer') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      setSelectedCustomer(null); // Reset selected customer when typing
      if (value.trim().length >= 2) {
        setShowCustomerDropdown(true);
        searchCustomers(value);
      } else {
        setShowCustomerDropdown(false);
        setCustomerSuggestions([]);
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Search customers by name
  const searchCustomers = async (searchTerm) => {
    try {
      setIsLoadingCustomers(true);
      const response = await customersAPI.search(searchTerm);
      if (response.success) {
        setCustomerSuggestions(response.customers || []);
      }
    } catch (err) {
      console.error('Error searching customers:', err);
      setCustomerSuggestions([]);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // Handle customer selection
  const handleCustomerSelect = async (customer) => {
    setSelectedCustomer(customer);
    
    // Auto-fill address fields - this will trigger transport fetching via useEffect
    setFormData(prev => ({
      ...prev,
      customer: customer.full_name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || ''
    }));
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);

    // If address fields are available, immediately trigger transport fetch (don't wait for debounce)
    if (customer.city || customer.state || customer.pincode) {
      try {
        setIsLoadingTransports(true);
        console.log('Auto-fetching transports for customer address:', { 
          city: customer.city, 
          state: customer.state, 
          pincode: customer.pincode 
        });
        const transportResponse = await transportAPI.getByAddress(
          customer.city || null,
          customer.state || null,
          customer.pincode || null
        );
        
        if (transportResponse.success) {
          console.log(`Found ${transportResponse.transports?.length || 0} matching transports for customer address`);
          setMatchingTransports(transportResponse.transports || []);
        }
      } catch (err) {
        console.error('Error fetching transports for customer address:', err);
      } finally {
        setIsLoadingTransports(false);
      }
    }

    // Fetch customer products
    try {
      console.log('Fetching products for customer:', customer.full_name);
      const productsResponse = await customersAPI.getProducts(customer.full_name);
      console.log('Products response:', productsResponse);
      
      if (productsResponse.success && productsResponse.products && productsResponse.products.length > 0) {
        // Populate dispatch items with customer's products
        // Include products that have either item_code or product_name
        const productItems = productsResponse.products
          .filter(p => p.item_code || p.product_name) // Include if has item_code OR product_name
          .map((product, index) => ({
            id: index + 1,
            name: product.product_name || product.item_code || 'Unknown Product'
          }));
        
        console.log('Populating dispatch items with products:', productItems);
        
        if (productItems.length > 0) {
          setDispatchItems(productItems);
        } else {
          console.warn('No valid products found for customer');
          setDispatchItems([]);
        }
      } else {
        console.warn('No products returned for customer or response failed');
        setDispatchItems([]);
      }
    } catch (err) {
      console.error('Error fetching customer products:', err);
      setDispatchItems([]);
    }
  };

  // Close customer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerInputRef.current && 
        !customerInputRef.current.contains(event.target) &&
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch matching transports when city, state, or pincode changes
  useEffect(() => {
    // Only fetch if at least one address field is provided
    if (!formData.city && !formData.state && !formData.pincode) {
      setMatchingTransports([]);
      return;
    }

    // Wait a bit for user to finish typing (debounce)
    const timer = setTimeout(async () => {
      try {
        setIsLoadingTransports(true);
        console.log('Fetching transports for:', { city: formData.city, state: formData.state, pincode: formData.pincode });
        const response = await transportAPI.getByAddress(
          formData.city || null,
          formData.state || null,
          formData.pincode || null
        );
        
        console.log('Transport API response:', response);
        if (response.success) {
          console.log(`Found ${response.transports?.length || 0} matching transports`);
          setMatchingTransports(response.transports || []);
        }
      } catch (err) {
        console.error('Error fetching matching transports:', err);
        setMatchingTransports([]);
      } finally {
        setIsLoadingTransports(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.city, formData.state, formData.pincode]);

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
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          transportName: formData.transportName,
          packaging: formData.packaging,
          llrNumber: formData.llrNumber
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
          <span>Supervisors</span>
        </div>
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
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('transactionMenu')}>
          <div className="nav-icon">
            <i className="fas fa-exchange-alt"></i>
          </div>
          <span>Transaction</span>
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
                {/* All fields in 3-column grid without section titles */}
                <div className="form-section">
                  <div className="form-grid three-col">
                    {/* Row 1: Name (Customer), Phone Number, Email */}
                      <div className="form-group" style={{ position: 'relative' }}>
                      <label htmlFor="customer">Name</label>
                        <div className="input-wrapper" ref={customerInputRef}>
                          <i className="fas fa-user input-icon"></i>
                          <input
                            type="text"
                            id="customer"
                            name="customer"
                            className="form-input"
                            placeholder="Type customer name to search..."
                            value={formData.customer}
                            onChange={handleInputChange}
                            onFocus={() => {
                              if (formData.customer.trim().length >= 2) {
                                setShowCustomerDropdown(true);
                              }
                            }}
                            required
                            autoComplete="off"
                          />
                          {isLoadingCustomers && (
                            <div style={{ 
                              position: 'absolute', 
                              right: '10px', 
                              top: '50%', 
                              transform: 'translateY(-50%)',
                              color: '#999'
                            }}>
                              <i className="fas fa-spinner fa-spin"></i>
                            </div>
                          )}
                        </div>
                        {showCustomerDropdown && customerSuggestions.length > 0 && (
                          <div 
                            ref={customerDropdownRef}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              backgroundColor: '#fff',
                              border: '1px solid #ddd',
                              borderRadius: '8px',
                              marginTop: '4px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              zIndex: 1000,
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            {customerSuggestions.map((customer, index) => (
                              <div
                                key={index}
                                onClick={() => handleCustomerSelect(customer)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  borderBottom: index < customerSuggestions.length - 1 ? '1px solid #eee' : 'none',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                              >
                                <div style={{ fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                  {customer.full_name}
                                </div>
                                {customer.phone && (
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    <i className="fas fa-phone" style={{ marginRight: '6px' }}></i>
                                    {customer.phone}
                                  </div>
                                )}
                                {customer.city && (
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    <i className="fas fa-map-marker-alt" style={{ marginRight: '6px' }}></i>
                                    {customer.city}{customer.state ? `, ${customer.state}` : ''}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
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

                    {/* Row 3: Pincode, Transport Name, LLR Number */}
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
                      <label htmlFor="transportName">Transport Name</label>
                      <div className="input-wrapper" style={{ position: 'relative' }}>
                        <i className="fas fa-truck input-icon"></i>
                        {matchingTransports.length > 0 ? (
                          <select
                            id="transportName"
                            name="transportName"
                            className="form-input"
                            value={formData.transportName || ''}
                            onChange={handleInputChange}
                            required
                            style={{ paddingLeft: '40px', appearance: 'auto', cursor: 'pointer' }}
                          >
                            <option value="">Select transport</option>
                            {matchingTransports.map((transport) => (
                              <option key={transport.id} value={transport.travels_name}>
                                {transport.travels_name} {transport.name ? `- ${transport.name}` : ''}
                              </option>
                            ))}
                            <option value="__custom__">Enter custom transport name</option>
                          </select>
                        ) : (
                          <>
                            <input
                              type="text"
                              id="transportName"
                              name="transportName"
                              className="form-input"
                              placeholder={isLoadingTransports ? "Loading transports..." : "Enter transport name"}
                              value={formData.transportName}
                              onChange={handleInputChange}
                              required
                              disabled={isLoadingTransports}
                            />
                            {isLoadingTransports && (
                              <div style={{ 
                                position: 'absolute', 
                                right: '10px', 
                                top: '50%', 
                                transform: 'translateY(-50%)',
                                color: '#999'
                              }}>
                                <i className="fas fa-spinner fa-spin"></i>
                              </div>
                            )}
                          </>
                        )}
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                        {matchingTransports.length > 0 && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#28a745', 
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <i className="fas fa-info-circle"></i>
                            Found {matchingTransports.length} transport(s) matching this address
                          </div>
                        )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="llrNumber">LLR Number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-file-alt input-icon"></i>
                        <input
                          type="text"
                          id="llrNumber"
                          name="llrNumber"
                          className="form-input"
                          placeholder="Enter LLR number"
                          value={formData.llrNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Row 4: Products to Dispatch and Packaging side-by-side */}
                    <div className="form-group">
                      <label>Products to Dispatch</label>
                      {/* Input field to add new product */}
                      <div className="input-wrapper" style={{ marginBottom: '10px' }}>
                        <i className="fas fa-box input-icon"></i>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter product name..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const value = e.target.value.trim();
                              if (value) {
                                const newId = dispatchItems.length > 0 
                                  ? Math.max(...dispatchItems.map(item => item.id)) + 1 
                                  : 1;
                                setDispatchItems(prev => [...prev, { id: newId, name: value }]);
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                      </div>
                      {/* Display Added Products - Horizontal cards like transport addresses */}
                      {dispatchItems.length > 0 && dispatchItems.some(item => item.name && item.name.trim() !== '') && (
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'row',
                          gap: '8px',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          width: '100%',
                          maxHeight: '150px'
                        }}>
                          {dispatchItems
                            .filter(item => item.name && item.name.trim() !== '')
                            .map((item, index) => (
                              <div
                                key={item.id}
                                style={{
                                  padding: '8px',
                                  background: '#f8f9fa',
                                  border: '2px solid #e0e0e0',
                                  borderRadius: '6px',
                                  position: 'relative',
                                  minWidth: '200px',
                                  maxWidth: '200px',
                                  flexShrink: 0,
                                  boxSizing: 'border-box'
                                }}
                              >
                                <div style={{ marginBottom: '6px', fontWeight: '600', color: '#dc3545', fontSize: '11px' }}>
                                  Product {index + 1}
                                </div>
                                <div style={{ fontSize: '12px', lineHeight: '1.3', color: '#333', wordBreak: 'break-word' }}>
                                  {item.name}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeDispatchItem(item.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    background: '#dc3545',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    padding: 0
                                  }}
                                  title="Remove this product"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="packaging">Packaging</label>
                      <div className="input-wrapper">
                        <i className="fas fa-box-open input-icon"></i>
                        <input
                          type="text"
                          id="packaging"
                          name="packaging"
                          className="form-input"
                          placeholder="Enter packaging details"
                          value={formData.packaging}
                          onChange={handleInputChange}
                        />
                      </div>
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

