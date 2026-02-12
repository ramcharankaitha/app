import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { transportAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';

const AddTransport = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  const [formData, setFormData] = useState({
    travelsName: '',
    phoneNumber1: '',
    phoneNumber2: '',
    address: '',
    cities: Array(10).fill(null).map((_, index) => ({
      id: index + 1,
      city: '',
      phoneNumber: ''
    }))
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const isSubmittingRef = useRef(false);
  
  // City autocomplete states
  const [citySuggestions, setCitySuggestions] = useState({});
  const [showCityDropdown, setShowCityDropdown] = useState({});
  const [isLoadingCities, setIsLoadingCities] = useState({});
  const [dropdownPositions, setDropdownPositions] = useState({});
  const cityDropdownRefs = useRef({});
  const cityInputRefs = useRef({});

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('transport');
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
      onNavigate('transport');
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
  };

  // Search cities from database
  const searchCities = async (searchTerm, cityIndex) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setCitySuggestions(prev => ({ ...prev, [cityIndex]: [] }));
      setShowCityDropdown(prev => ({ ...prev, [cityIndex]: false }));
      return;
    }

    try {
      setIsLoadingCities(prev => ({ ...prev, [cityIndex]: true }));
      const response = await transportAPI.getCities(searchTerm);
      if (response.success) {
        setCitySuggestions(prev => ({ ...prev, [cityIndex]: response.cities || [] }));
        setShowCityDropdown(prev => ({ ...prev, [cityIndex]: true }));
      }
    } catch (err) {
      console.error('Error searching cities:', err);
      setCitySuggestions(prev => ({ ...prev, [cityIndex]: [] }));
    } finally {
      setIsLoadingCities(prev => ({ ...prev, [cityIndex]: false }));
    }
  };

  // Handle city selection from dropdown
  const handleCitySelect = (city, index) => {
    // Check for duplicate cities (case-insensitive)
    const isDuplicate = formData.cities.some((c, i) => 
      i !== index && c.city && c.city.toLowerCase().trim() === city.toLowerCase().trim()
    );
    
    if (isDuplicate) {
      setError(`City "${city}" is already entered in another field. Please use a different city.`);
      setShowCityDropdown(prev => ({ ...prev, [index]: false }));
      setCitySuggestions(prev => ({ ...prev, [index]: [] }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.map((c, i) => 
        i === index ? { ...c, city: city } : c
      )
    }));
    setShowCityDropdown(prev => ({ ...prev, [index]: false }));
    setCitySuggestions(prev => ({ ...prev, [index]: [] }));
    setError(''); // Clear any previous errors
  };

  const handleCityChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cities: prev.cities.map((city, i) => 
        i === index ? { ...city, [field]: value } : city
      )
    }));
    
    // If city field is being changed, search for cities and check for duplicates
    if (field === 'city') {
      // Calculate dropdown position
      const inputElement = cityInputRefs.current[index];
      if (inputElement) {
        const rect = inputElement.getBoundingClientRect();
        setDropdownPositions(prev => ({
          ...prev,
          [index]: {
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          }
        }));
      }
      
      // Check for duplicate cities (case-insensitive) as user types
      const trimmedValue = value.trim().toLowerCase();
      if (trimmedValue) {
        const isDuplicate = formData.cities.some((c, i) => 
          i !== index && c.city && c.city.toLowerCase().trim() === trimmedValue
        );
        if (isDuplicate) {
          setError(`City "${value.trim()}" is already entered in another field.`);
        } else {
          setError(''); // Clear error if not duplicate
        }
      } else {
        setError(''); // Clear error if field is empty
      }
      searchCities(value, index);
    }
  };

  // Close city dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(cityDropdownRefs.current).forEach(cityIndex => {
        const dropdownRef = cityDropdownRefs.current[cityIndex];
        const inputRef = cityInputRefs.current[cityIndex];
        if (dropdownRef && !dropdownRef.contains(event.target) && 
            inputRef && !inputRef.contains(event.target)) {
          setShowCityDropdown(prev => ({ ...prev, [cityIndex]: false }));
        }
      });
    };
    // Update dropdown positions on scroll/resize
    const handleScroll = () => {
      Object.keys(cityInputRefs.current).forEach(cityIndex => {
        const inputElement = cityInputRefs.current[cityIndex];
        if (inputElement && showCityDropdown[cityIndex]) {
          const rect = inputElement.getBoundingClientRect();
          setDropdownPositions(prev => ({
            ...prev,
            [cityIndex]: {
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width
            }
          }));
        }
      });
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [showCityDropdown]);

  const submitTransport = async () => {
    // Prevent double submission
    if (isSubmittingRef.current || isLoading) {
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Validate all 10 cities are filled
      const emptyCities = formData.cities.filter(city => 
        !city.city || !city.city.trim() || !city.phoneNumber || !city.phoneNumber.trim()
      );

      if (emptyCities.length > 0) {
        setError('All 10 cities and their phone numbers are required.');
        setIsLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      // Check for duplicate cities (case-insensitive)
      const cityNames = formData.cities
        .map(c => c.city ? c.city.trim().toLowerCase() : '')
        .filter(name => name.length > 0);
      const uniqueCities = new Set(cityNames);
      
      if (cityNames.length !== uniqueCities.size) {
        const duplicates = cityNames.filter((city, index) => cityNames.indexOf(city) !== index);
        const duplicateNames = [...new Set(duplicates)].map(dup => {
          const found = formData.cities.find(c => c.city && c.city.toLowerCase().trim() === dup);
          return found ? found.city : dup;
        });
        setError(`Duplicate cities found: ${duplicateNames.join(', ')}. Please use different cities.`);
        setIsLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      // Prepare addresses array
      const addresses = formData.cities.map(city => ({
        city: city.city.trim(),
        phoneNumber: city.phoneNumber.trim()
      }));

      const response = await transportAPI.create({
        travelsName: formData.travelsName,
        phoneNumber1: formData.phoneNumber1,
        phoneNumber2: formData.phoneNumber2,
        address: formData.address,
        addresses: addresses,
        userRole: userRole || 'staff'
      });

      if (response.success) {
        localStorage.setItem('transportSuccessMessage', 'Transport record created successfully!');
        handleCancel();
        return;
      }
    } catch (err) {
      setError(err.message || 'Failed to create transport record. Please try again.');
      console.error('Create transport error:', err);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevent opening confirm dialog if already submitting
    if (isLoading || isSubmittingRef.current) {
      return;
    }
    
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitTransport,
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
        <div className="nav-item active" onClick={() => onNavigate && onNavigate('masterMenu')}>
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
              <h1 className="page-title">Add Transport</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form add-transport-form" noValidate>
                <div className="form-section">
                  {/* Row 1: Transport Name, Phone Number 1, Phone Number 2, Address */}
                  <div className="form-grid four-col">
                    <div className="form-group">
                      <label htmlFor="travelsName">Transport Name <span style={{ color: '#dc3545' }}>*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-building input-icon"></i>
                        <input
                          type="text"
                          id="travelsName"
                          name="travelsName"
                          className="form-input"
                          placeholder="Enter transport name"
                          value={formData.travelsName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phoneNumber1">Phone Number 1 <span style={{ color: '#dc3545' }}>*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phoneNumber1"
                          name="phoneNumber1"
                          className="form-input"
                          placeholder="Enter phone number 1"
                          value={formData.phoneNumber1}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phoneNumber2">Phone Number 2 <span style={{ color: '#dc3545' }}>*</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phoneNumber2"
                          name="phoneNumber2"
                          className="form-input"
                          placeholder="Enter phone number 2"
                          value={formData.phoneNumber2}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="address">Address <span style={{ color: '#dc3545' }}>*</span></label>
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
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cities Section - 10 rows, each with 2 fields (city and phone number) */}
                  <div className="form-section" style={{ marginTop: '8px', marginBottom: '0' }}>
                    <div className="cities-scrollable-container" style={{ 
                      maxHeight: '400px', 
                      overflowY: 'auto', 
                      overflowX: 'hidden',
                      paddingRight: '8px',
                      marginTop: '8px'
                    }}>
                      {Array.from({ length: 10 }, (_, cityIndex) => (
                        <div key={cityIndex} className="form-grid two-col" style={{ marginBottom: cityIndex === 9 ? '0' : '8px' }}>
                          <div className="form-group" style={{ position: 'relative' }}>
                            <label htmlFor={`city${cityIndex + 1}`}>
                              City {cityIndex + 1} <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <div className="input-wrapper" ref={el => cityInputRefs.current[cityIndex] = el}>
                              <i className="fas fa-city input-icon"></i>
                              <input
                                type="text"
                                id={`city${cityIndex + 1}`}
                                className="form-input"
                                placeholder={`Enter city ${cityIndex + 1}`}
                                value={formData.cities[cityIndex].city}
                                onChange={(e) => handleCityChange(cityIndex, 'city', e.target.value)}
                                onFocus={(e) => {
                                  // Calculate dropdown position on focus
                                  const rect = e.target.getBoundingClientRect();
                                  setDropdownPositions(prev => ({
                                    ...prev,
                                    [cityIndex]: {
                                      top: rect.bottom + 4,
                                      left: rect.left,
                                      width: rect.width
                                    }
                                  }));
                                  if (formData.cities[cityIndex].city) {
                                    searchCities(formData.cities[cityIndex].city, cityIndex);
                                  }
                                }}
                                onScroll={() => {
                                  // Update position on scroll
                                  const inputElement = cityInputRefs.current[cityIndex];
                                  if (inputElement) {
                                    const rect = inputElement.getBoundingClientRect();
                                    setDropdownPositions(prev => ({
                                      ...prev,
                                      [cityIndex]: {
                                        top: rect.bottom + 4,
                                        left: rect.left,
                                        width: rect.width
                                      }
                                    }));
                                  }
                                }}
                                required
                              />
                            </div>
                            {showCityDropdown[cityIndex] && citySuggestions[cityIndex] && citySuggestions[cityIndex].length > 0 && dropdownPositions[cityIndex] && createPortal(
                              <div 
                                ref={el => cityDropdownRefs.current[cityIndex] = el}
                                style={{
                                  position: 'fixed',
                                  top: `${dropdownPositions[cityIndex].top}px`,
                                  left: `${dropdownPositions[cityIndex].left}px`,
                                  width: `${dropdownPositions[cityIndex].width}px`,
                                  background: '#fff',
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
                                {isLoadingCities[cityIndex] ? (
                                  <div style={{ padding: '12px 16px', textAlign: 'center', color: '#666' }}>
                                    <i className="fas fa-spinner fa-spin"></i> Searching...
                                  </div>
                                ) : (
                                  citySuggestions[cityIndex].map((city, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => handleCitySelect(city, cityIndex)}
                                      style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderBottom: idx < citySuggestions[cityIndex].length - 1 ? '1px solid #f0f0f0' : 'none',
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

                          <div className="form-group">
                            <label htmlFor={`cityPhone${cityIndex + 1}`}>
                              City {cityIndex + 1} Phone Number <span style={{ color: '#dc3545' }}>*</span>
                            </label>
                            <div className="input-wrapper">
                              <i className="fas fa-phone input-icon"></i>
                              <input
                                type="tel"
                                id={`cityPhone${cityIndex + 1}`}
                                className="form-input"
                                placeholder={`Enter phone number for city ${cityIndex + 1}`}
                                value={formData.cities[cityIndex].phoneNumber}
                                onChange={(e) => handleCityChange(cityIndex, 'phoneNumber', e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>


                <Toast message={error} type="error" onClose={() => setError('')} />

                {/* Action Buttons */}
                <div className="form-actions">
                  <button type="submit" className="create-user-btn" disabled={isLoading || isSubmittingRef.current}>
                    {isLoading ? 'Creating...' : 'Create Transport Record'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel} disabled={isLoading}>
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
          if (confirmState.onConfirm && !isLoading && !isSubmittingRef.current) {
            confirmState.onConfirm();
          }
        }}
        onCancel={() => {
          setConfirmState({ open: false, message: '', onConfirm: null });
        }}
      />
    </div>
  );
};

export default AddTransport;

