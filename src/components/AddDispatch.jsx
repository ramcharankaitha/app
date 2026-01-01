import React, { useState, useEffect, useRef } from 'react';
import { dispatchAPI, transportAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddDispatch = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    customer: '',
    phone: '',
    address: '',
    area: '',
    city: '',
    material: '',
    packaging: '',
    bookingToCity: '',
    bookingCityNumber: '',
    transportName: '',
    transportPhone: '',
    estimatedDate: '',
    llrNumber: ''
  });
  const [llrFile, setLlrFile] = useState(null);
  const [matchingTransports, setMatchingTransports] = useState([]);
  const [isLoadingTransports, setIsLoadingTransports] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const customerInputRef = useRef(null);
  const customerDropdownRef = useRef(null);
  
  // Booking city autocomplete states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const cityDropdownRef = useRef(null);
  const cityInputRef = useRef(null);
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
        [name]: '',
        transportPhone: '' // Clear transport phone when switching to custom
      }));
      setMatchingTransports([]); // Clear dropdown to show text input
      return;
    }
    
    // Handle transport selection - auto-fill transport phone
    if (name === 'transportName' && value !== '__custom__' && matchingTransports.length > 0) {
      const selectedTransport = matchingTransports.find(t => t.travels_name === value);
      if (selectedTransport) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          transportPhone: selectedTransport.phone_number || ''
        }));
        return;
      }
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
    
    // Handle booking city search
    if (name === 'bookingToCity') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        bookingCityNumber: '' // Clear booking city number when city changes
      }));
      
      if (value.trim().length >= 1) {
        setShowCityDropdown(true);
        searchCities(value);
      } else {
        setShowCityDropdown(false);
        setCitySuggestions([]);
      }
      
      // If city is manually entered and not from dropdown, try to fetch phone number
      if (value.trim().length > 0 && !citySuggestions.includes(value)) {
        fetchBookingCityNumber(value);
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Search cities from transport master
  const searchCities = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setCitySuggestions([]);
      return;
    }

    try {
      setIsLoadingCities(true);
      const response = await transportAPI.getCities(searchTerm);
      if (response.success) {
        setCitySuggestions(response.cities || []);
      }
    } catch (err) {
      console.error('Error searching cities:', err);
      setCitySuggestions([]);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Fetch booking city number from transport master
  const fetchBookingCityNumber = async (cityName) => {
    try {
      const response = await transportAPI.getByAddress(cityName, null, null);
      if (response.success && response.transports && response.transports.length > 0) {
        // Find the city in the addresses array and get its phone number
        for (const transport of response.transports) {
          if (transport.addresses && Array.isArray(transport.addresses)) {
            const cityAddress = transport.addresses.find(addr => 
              addr.city && addr.city.toLowerCase() === cityName.toLowerCase()
            );
            if (cityAddress && cityAddress.phoneNumber) {
              setFormData(prev => ({
                ...prev,
                bookingCityNumber: cityAddress.phoneNumber
              }));
              return;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching booking city number:', err);
    }
  };

  // Handle city selection from dropdown
  const handleCitySelect = (city) => {
    setFormData(prev => ({
      ...prev,
      bookingToCity: city
    }));
    setShowCityDropdown(false);
    setCitySuggestions([]);
    // Fetch phone number for selected city
    fetchBookingCityNumber(city);
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
      address: customer.address || '',
      city: customer.city || '',
      area: customer.state || ''
    }));
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);

    // If address fields are available, immediately trigger transport fetch (don't wait for debounce)
    if (customer.city || customer.state) {
      try {
        setIsLoadingTransports(true);
        console.log('Auto-fetching transports for customer address:', { 
          city: customer.city, 
          state: customer.state
        });
        const transportResponse = await transportAPI.getByAddress(
          customer.city || null,
          customer.state || null,
          null
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

  };

  // Close customer and city dropdowns when clicking outside
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
      
      if (
        cityInputRef.current && 
        !cityInputRef.current.contains(event.target) &&
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target)
      ) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch matching transports when city or area changes
  useEffect(() => {
    // Only fetch if at least one address field is provided
    if (!formData.city && !formData.area) {
      setMatchingTransports([]);
      return;
    }

    // Wait a bit for user to finish typing (debounce)
    const timer = setTimeout(async () => {
      try {
        setIsLoadingTransports(true);
        console.log('Fetching transports for:', { city: formData.city, area: formData.area });
        const response = await transportAPI.getByAddress(
          formData.city || null,
          formData.area || null,
          null
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
  }, [formData.city, formData.area]);

  const submitDispatch = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (!formData.customer || !formData.customer.trim()) {
        setError('Please enter a customer name.');
        setIsLoading(false);
        return;
      }

      const dispatchData = {
        customer: formData.customer,
        name: formData.customer, // Use customer name as the name field
        phone: formData.phone,
        address: formData.address,
        area: formData.area,
        city: formData.city,
        material: formData.material,
        packaging: formData.packaging,
        bookingToCity: formData.bookingToCity,
        bookingCityNumber: formData.bookingCityNumber,
        transportName: formData.transportName,
        transportPhone: formData.transportPhone,
        estimatedDate: formData.estimatedDate,
        llrNumber: formData.llrNumber
      };
      
      // If file exists, send with FormData, otherwise send as JSON
      let response;
      if (llrFile) {
        const itemFormData = new FormData();
        Object.keys(dispatchData).forEach(key => {
          itemFormData.append(key, dispatchData[key]);
        });
        itemFormData.append('llrCopy', llrFile);
        response = await dispatchAPI.createWithFile(itemFormData);
      } else {
        response = await dispatchAPI.create(dispatchData);
      }

      if (response.success) {
        setSuccessMessage('Dispatch record created successfully');
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      } else {
        setError(response.error || 'Failed to create dispatch record. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create dispatch record. Please try again.');
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
            <form onSubmit={handleSubmit} className="add-user-form add-dispatch-form">
                {/* All fields in 3-column grid without section titles */}
                <div className="form-section">
                  <div className="form-grid four-col">
                    {/* Row 1: Customer Name, Customer Phone Number, Street, Area */}
                      <div className="form-group" style={{ position: 'relative' }}>
                      <label htmlFor="customer">Customer Name</label>
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
                      <label htmlFor="phone">Customer Phone Number</label>
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
                      <label htmlFor="area">Area</label>
                      <div className="input-wrapper">
                        <i className="fas fa-map input-icon"></i>
                        <input
                          type="text"
                          id="area"
                          name="area"
                          className="form-input"
                          placeholder="Enter area"
                          value={formData.area}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Row 2: City, Material, Packaging, Booking to City */}
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
                      <label htmlFor="material">Material</label>
                      <div className="input-wrapper">
                        <i className="fas fa-box input-icon"></i>
                        <input
                          type="text"
                          id="material"
                          name="material"
                          className="form-input"
                          placeholder="Enter material"
                          value={formData.material}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="packaging">Packaging</label>
                      <div className="input-wrapper">
                        <i className="fas fa-archive input-icon"></i>
                        <input
                          type="text"
                          id="packaging"
                          name="packaging"
                          className="form-input"
                          placeholder="Enter packaging"
                          value={formData.packaging}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                      <label htmlFor="bookingToCity">Booking to City</label>
                      <div className="input-wrapper" ref={cityInputRef}>
                        <i className="fas fa-city input-icon"></i>
                        <input
                          type="text"
                          id="bookingToCity"
                          name="bookingToCity"
                          className="form-input"
                          placeholder="Enter or select city"
                          value={formData.bookingToCity}
                          onChange={handleInputChange}
                          onFocus={() => {
                            if (formData.bookingToCity.trim().length >= 1) {
                              setShowCityDropdown(true);
                            }
                          }}
                        />
                        {isLoadingCities && (
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
                      {showCityDropdown && citySuggestions.length > 0 && (
                        <div 
                          ref={cityDropdownRef}
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
                          {citySuggestions.map((city, index) => (
                            <div
                              key={index}
                              onClick={() => handleCitySelect(city)}
                              style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: index < citySuggestions.length - 1 ? '1px solid #eee' : 'none',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}
                            >
                              {city}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Row 3: Transport Name, Transport Contact Number, Estimated Date, LR Number */}
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
                      <label htmlFor="transportPhone">Transport Contact Number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="transportPhone"
                          name="transportPhone"
                          className="form-input"
                          placeholder="Enter transport contact number"
                          value={formData.transportPhone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="estimatedDate">Estimated Date</label>
                      <div className="input-wrapper">
                        <i className="fas fa-calendar-alt input-icon"></i>
                        <input
                          type="date"
                          id="estimatedDate"
                          name="estimatedDate"
                          className="form-input"
                          placeholder="Select estimated date"
                          value={formData.estimatedDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="llrNumber">LR Number</label>
                      <div className="input-wrapper" style={{ position: 'relative' }}>
                        <i className="fas fa-file-alt input-icon"></i>
                        <input
                          type="text"
                          id="llrNumber"
                          name="llrNumber"
                          className="form-input"
                          placeholder="Enter LR number"
                          value={formData.llrNumber}
                          onChange={handleInputChange}
                          style={{ paddingRight: '50px' }}
                        />
                        <input
                          type="file"
                          id="llrFileUpload"
                          accept="image/*,.pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setLlrFile(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('llrFileUpload').click()}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '6px 8px',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Upload LLR Copy"
                        >
                          <i className="fas fa-upload"></i>
                        </button>
                      </div>
                      {llrFile && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#28a745', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <i className="fas fa-check-circle"></i>
                          {llrFile.name}
                          <button
                            type="button"
                            onClick={() => {
                              setLlrFile(null);
                              document.getElementById('llrFileUpload').value = '';
                            }}
                            style={{
                              marginLeft: '8px',
                              background: 'transparent',
                              border: 'none',
                              color: '#dc3545',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Remove file"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      )}
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

