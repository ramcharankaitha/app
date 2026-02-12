import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { dispatchAPI, transportAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const AddDispatch = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    customer: '',
    phone: '',
    address: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
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
  const [customerDropdownPosition, setCustomerDropdownPosition] = useState(null);
  
  // Booking city autocomplete states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingCityNumber, setIsLoadingCityNumber] = useState(false);
  const [cityNumberFound, setCityNumberFound] = useState(false);
  const cityDropdownRef = useRef(null);
  const cityInputRef = useRef(null);
  const [cityDropdownPosition, setCityDropdownPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [isFetchingCustomerByPhone, setIsFetchingCustomerByPhone] = useState(false);
  const [customerVerifiedByPhone, setCustomerVerifiedByPhone] = useState(false);

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
        // Calculate dropdown position
        if (customerInputRef.current) {
          const rect = customerInputRef.current.getBoundingClientRect();
          setCustomerDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
        setShowCustomerDropdown(true);
        searchCustomers(value);
      } else {
        setShowCustomerDropdown(false);
        setCustomerSuggestions([]);
        setCustomerDropdownPosition(null);
      }
      return;
    }
    
    // Handle booking city search
    if (name === 'bookingToCity') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        bookingCityNumber: '', // Clear booking city number when city changes
        transportName: '', // Clear transport name when city changes
        transportPhone: '' // Clear transport phone when city changes
      }));
      
      if (value.trim().length >= 1) {
        // Calculate dropdown position
        if (cityInputRef.current) {
          const rect = cityInputRef.current.getBoundingClientRect();
          setCityDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          });
        }
        setShowCityDropdown(true);
        searchCities(value);
      } else {
        setShowCityDropdown(false);
        setCitySuggestions([]);
        setCityDropdownPosition(null);
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

  // Fetch booking city number, transport name, and transport phone from transport master
  const fetchBookingCityNumber = async (cityName) => {
    if (!cityName || !cityName.trim()) {
      return;
    }

    try {
      setIsLoadingCityNumber(true);
      const response = await transportAPI.getByAddress(cityName.trim(), null, null);
      if (response.success && response.transports && response.transports.length > 0) {
        // Find the city in the addresses array and get its phone number, transport name, and transport phone
        for (const transport of response.transports) {
          if (transport.addresses && Array.isArray(transport.addresses)) {
            const cityAddress = transport.addresses.find(addr => 
              addr.city && addr.city.toLowerCase().trim() === cityName.toLowerCase().trim()
            );
            if (cityAddress && cityAddress.phoneNumber) {
              setFormData(prev => ({
                ...prev,
                bookingCityNumber: cityAddress.phoneNumber,
                transportName: transport.travels_name || transport.name || '',
                transportPhone: transport.phone_number || ''
              }));
              setCityNumberFound(true);
              setIsLoadingCityNumber(false);
              return;
            }
          }
        }
        // If no exact match found, try partial match
        for (const transport of response.transports) {
          if (transport.addresses && Array.isArray(transport.addresses)) {
            const cityAddress = transport.addresses.find(addr => 
              addr.city && addr.city.toLowerCase().trim().includes(cityName.toLowerCase().trim())
            );
            if (cityAddress && cityAddress.phoneNumber) {
              setFormData(prev => ({
                ...prev,
                bookingCityNumber: cityAddress.phoneNumber,
                transportName: transport.travels_name || transport.name || '',
                transportPhone: transport.phone_number || ''
              }));
              setCityNumberFound(true);
              setIsLoadingCityNumber(false);
              return;
            }
          }
        }
      }
      // If no phone number found, clear it
      setFormData(prev => ({
        ...prev,
        bookingCityNumber: '',
        transportName: '',
        transportPhone: ''
      }));
      setCityNumberFound(false);
    } catch (err) {
      console.error('Error fetching booking city number:', err);
      setCityNumberFound(false);
    } finally {
      setIsLoadingCityNumber(false);
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
    setCityDropdownPosition(null);
    // Fetch phone number, transport name, and transport phone for selected city
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

  // Auto-fetch customer details when phone/ID is entered
  useEffect(() => {
    const fetchCustomerByPhoneOrId = async () => {
      // Only proceed if phone/ID is entered (at least 4 characters) and customer name is not already set
      if (!formData.phone.trim() || formData.phone.trim().length < 4 || formData.customer.trim()) {
        setCustomerVerifiedByPhone(false);
        return;
      }

      setIsFetchingCustomerByPhone(true);
      
      try {
        // Search by phone or unique ID
        const searchResponse = await customersAPI.search(formData.phone.trim());
        
        if (searchResponse.success && searchResponse.customers && searchResponse.customers.length > 0) {
          // Find exact match by phone or unique ID
          const phoneOrId = formData.phone.trim();
          const matchingCustomer = searchResponse.customers.find(c => 
            c.phone === phoneOrId || 
            c.customer_unique_id?.toUpperCase() === phoneOrId.toUpperCase()
          );
          
          // If exact match found, use it; otherwise use first result
          const customer = matchingCustomer || searchResponse.customers[0];
          
          if (customer) {
            setCustomerVerifiedByPhone(true);
            setSelectedCustomer(customer);
            // Auto-fill all customer details
            setFormData(prev => ({
              ...prev,
              customer: customer.full_name || '',
              phone: customer.phone || prev.phone,
              address: customer.address || '',
              city: customer.city || '',
              area: customer.state || '',
              state: customer.state || '',
              pincode: customer.pincode || ''
            }));
            
            // Trigger transport fetch if city/state available
            if (customer.city || customer.state) {
              try {
                setIsLoadingTransports(true);
                const transportResponse = await transportAPI.getByAddress(
                  customer.city || null,
                  customer.state || null,
                  null
                );
                if (transportResponse.success) {
                  setMatchingTransports(transportResponse.transports || []);
                }
              } catch (err) {
                console.error('Error fetching transports:', err);
              } finally {
                setIsLoadingTransports(false);
              }
            }
          } else {
            setCustomerVerifiedByPhone(false);
          }
        } else {
          setCustomerVerifiedByPhone(false);
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        setCustomerVerifiedByPhone(false);
      } finally {
        setIsFetchingCustomerByPhone(false);
      }
    };

    // Debounce the check
    const timer = setTimeout(() => {
      fetchCustomerByPhoneOrId();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.phone]);

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
      area: customer.state || '',
      state: customer.state || '',
      pincode: customer.pincode || ''
    }));
    setShowCustomerDropdown(false);
    setCustomerSuggestions([]);
    setCustomerDropdownPosition(null);

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

  // Close customer and city dropdowns when clicking outside and update positions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerInputRef.current && 
        !customerInputRef.current.contains(event.target) &&
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false);
        setCustomerDropdownPosition(null);
      }
      
      if (
        cityInputRef.current && 
        !cityInputRef.current.contains(event.target) &&
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target)
      ) {
        setShowCityDropdown(false);
        setCityDropdownPosition(null);
      }
    };

    // Update dropdown positions on scroll/resize
    const handleScroll = () => {
      if (customerInputRef.current && showCustomerDropdown) {
        const rect = customerInputRef.current.getBoundingClientRect();
        setCustomerDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
      if (cityInputRef.current && showCityDropdown) {
        const rect = cityInputRef.current.getBoundingClientRect();
        setCityDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showCustomerDropdown, showCityDropdown]);

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

  // Auto-fetch booking city phone number when bookingToCity changes
  useEffect(() => {
    // Only fetch if city name is entered (at least 2 characters)
    if (!formData.bookingToCity || formData.bookingToCity.trim().length < 2) {
      setCityNumberFound(false);
      setFormData(prev => ({
        ...prev,
        bookingCityNumber: ''
      }));
      return;
    }

    // Don't fetch if user is still typing (wait for them to finish)
    const timer = setTimeout(async () => {
      await fetchBookingCityNumber(formData.bookingToCity);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.bookingToCity]);

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
        state: formData.state,
        pincode: formData.pincode,
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
                            onFocus={(e) => {
                              // Calculate dropdown position on focus
                              const rect = e.target.getBoundingClientRect();
                              setCustomerDropdownPosition({
                                top: rect.bottom + 4,
                                left: rect.left,
                                width: rect.width
                              });
                              if (formData.customer.trim().length >= 2) {
                                setShowCustomerDropdown(true);
                                searchCustomers(formData.customer);
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
                        {showCustomerDropdown && customerSuggestions.length > 0 && customerDropdownPosition && createPortal(
                          <div 
                            ref={customerDropdownRef}
                            style={{
                              position: 'fixed',
                              top: `${customerDropdownPosition.top}px`,
                              left: `${customerDropdownPosition.left}px`,
                              width: `${customerDropdownPosition.width}px`,
                              backgroundColor: '#fff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              zIndex: 99999,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              marginTop: '0'
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {customerSuggestions.map((customer, index) => (
                              <div
                                key={index}
                                onClick={() => handleCustomerSelect(customer)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  borderBottom: index < customerSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                  background: '#fff',
                                  color: '#333'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.background = '#fff'}
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
                          </div>,
                          document.body
                        )}
                      </div>

                      <div className="form-group">
                      <label htmlFor="phone">Customer Phone Number or Customer ID</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                        <i className="fas fa-phone input-icon"></i>
                          <input
                          type="text"
                          id="phone"
                          name="phone"
                            className="form-input"
                          placeholder="Enter phone number or Customer ID (e.g., C-1234)"
                          value={formData.phone}
                            onChange={handleInputChange}
                          required
                          style={{
                            paddingRight: customerVerifiedByPhone || isFetchingCustomerByPhone ? '40px' : '18px',
                            borderColor: customerVerifiedByPhone ? '#28a745' : undefined
                          }}
                          />
                          {isFetchingCustomerByPhone && (
                            <i className="fas fa-spinner fa-spin" style={{ 
                              position: 'absolute', 
                              right: '12px', 
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#666' 
                            }}></i>
                          )}
                          {!isFetchingCustomerByPhone && customerVerifiedByPhone && (
                            <i className="fas fa-check-circle" style={{ 
                              position: 'absolute', 
                              right: '12px', 
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#28a745' 
                            }}></i>
                          )}
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
                          onFocus={(e) => {
                            // Calculate dropdown position on focus
                            const rect = e.target.getBoundingClientRect();
                            setCityDropdownPosition({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width
                            });
                            if (formData.bookingToCity.trim().length >= 1) {
                              setShowCityDropdown(true);
                              searchCities(formData.bookingToCity);
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
                      {showCityDropdown && citySuggestions.length > 0 && cityDropdownPosition && createPortal(
                        <div 
                          ref={cityDropdownRef}
                          style={{
                            position: 'fixed',
                            top: `${cityDropdownPosition.top}px`,
                            left: `${cityDropdownPosition.left}px`,
                            width: `${cityDropdownPosition.width}px`,
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 99999,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            marginTop: '0'
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {isLoadingCities ? (
                            <div style={{ padding: '12px 16px', textAlign: 'center', color: '#666' }}>
                              <i className="fas fa-spinner fa-spin"></i> Searching...
                            </div>
                          ) : (
                            citySuggestions.map((city, index) => (
                              <div
                                key={index}
                                onClick={() => handleCitySelect(city)}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  borderBottom: index < citySuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                  background: '#fff',
                                  color: '#333'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.background = '#fff'}
                              >
                                {city}
                              </div>
                            ))
                          )}
                        </div>,
                        document.body
                      )}
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                      <label htmlFor="bookingCityNumber">Booking City Number</label>
                      <div className="input-wrapper" style={{ position: 'relative' }}>
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="bookingCityNumber"
                          name="bookingCityNumber"
                          className="form-input"
                          placeholder="Auto-fetched from transport master"
                          value={formData.bookingCityNumber}
                          readOnly
                          style={{
                            background: '#f5f5f5',
                            paddingRight: isLoadingCityNumber || cityNumberFound ? '40px' : '18px',
                            borderColor: cityNumberFound ? '#28a745' : undefined
                          }}
                        />
                        {isLoadingCityNumber && (
                          <i className="fas fa-spinner fa-spin" style={{ 
                            position: 'absolute', 
                            right: '12px', 
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#666' 
                          }}></i>
                        )}
                        {!isLoadingCityNumber && cityNumberFound && formData.bookingCityNumber && (
                          <i className="fas fa-check-circle" style={{ 
                            position: 'absolute', 
                            right: '12px', 
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#28a745' 
                          }}></i>
                        )}
                      </div>
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


                <Toast message={error} type="error" onClose={() => setError('')} />
                <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

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

