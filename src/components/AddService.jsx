import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { productsAPI, staffAPI, servicesAPI, customersAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import './addUser.css';

const AddService = ({ onBack, onCancel, onNavigate, userRole = 'admin' }) => {
  // Get tomorrow's date in YYYY-MM-DD format (minimum date for service)
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    warrantyStatus: '',
    itemCode: '',
    category: '',
    productName: '',
    product: '',
    brandName: '',
    serialNumber: '',
    serviceDate: '',
    handlerId: '',
    handlerName: '',
    handlerPhone: '',
    productComplaint: '',
    amountEstimated: '',
    estimatedDate: ''
  });
  const [handlers, setHandlers] = useState([]);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [minServiceDate] = useState(getTomorrowDate());
  const [isFetchingCustomer, setIsFetchingCustomer] = useState(false);
  const [customerVerified, setCustomerVerified] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const customerInputRef = useRef(null);
  const customerDropdownRef = useRef(null);
  const [customerDropdownPosition, setCustomerDropdownPosition] = useState(null);

  // Fetch handlers (staff with is_handler = true)
  const fetchHandlers = async () => {
    try {
      const response = await staffAPI.getAll();
      if (response.success) {
        const handlerList = response.staff
          .filter(staff => staff.is_handler === true)
          .map(staff => ({
            id: staff.id,
            name: staff.full_name,
            phone: staff.phone || ''
          }));
        setHandlers(handlerList);
      }
    } catch (err) {
      console.error('Error fetching handlers:', err);
    }
  };

  useEffect(() => {
    fetchHandlers();
    
    // Refresh handlers when page becomes visible (user navigates back to this page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchHandlers();
      }
    };
    
    // Refresh handlers when window gains focus
    const handleFocus = () => {
      fetchHandlers();
    };
    
    // Listen for staff update events
    const handleStaffUpdate = () => {
      fetchHandlers();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('staffUpdated', handleStaffUpdate);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('staffUpdated', handleStaffUpdate);
    };
  }, []);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('services');
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
      onNavigate('services');
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Reset customer verification when phone changes
    if (name === 'customerPhone') {
      setCustomerVerified(false);
    }
  };

  // Auto-fetch customer details when phone/ID is entered
  useEffect(() => {
    const fetchCustomerByPhoneOrId = async () => {
      // Only proceed if phone/ID is entered (at least 4 characters)
      if (!formData.customerPhone.trim() || formData.customerPhone.trim().length < 4) {
        setCustomerVerified(false);
        return;
      }

      setIsFetchingCustomer(true);
      
      try {
        // Search by phone or unique ID
        const searchResponse = await customersAPI.search(formData.customerPhone.trim());
        
        if (searchResponse.success && searchResponse.customers && searchResponse.customers.length > 0) {
          // Find exact match by phone or unique ID
          const phoneOrId = formData.customerPhone.trim();
          const matchingCustomer = searchResponse.customers.find(c => 
            c.phone === phoneOrId || 
            c.customer_unique_id?.toUpperCase() === phoneOrId.toUpperCase()
          );
          
          // If exact match found, use it; otherwise use first result
          const customer = matchingCustomer || searchResponse.customers[0];
          
          if (customer) {
            setCustomerVerified(true);
            // Auto-fill customer name
            setFormData(prev => ({
              ...prev,
              customerName: customer.full_name || prev.customerName
            }));
          } else {
            setCustomerVerified(false);
          }
        } else {
          setCustomerVerified(false);
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        setCustomerVerified(false);
      } finally {
        setIsFetchingCustomer(false);
      }
    };

    // Debounce the check
    const timer = setTimeout(() => {
      fetchCustomerByPhoneOrId();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.customerPhone]);

  // Search customers when customer name changes
  useEffect(() => {
    const searchCustomers = async () => {
      const searchTerm = formData.customerName.trim();
      if (!searchTerm || searchTerm.length < 2) {
        setCustomerSuggestions([]);
        setShowCustomerDropdown(false);
        return;
      }

      setIsLoadingCustomers(true);
      try {
        const response = await customersAPI.search(searchTerm);
        if (response.success && response.customers) {
          setCustomerSuggestions(response.customers.slice(0, 10)); // Limit to 10 results
          setShowCustomerDropdown(true);
        } else {
          setCustomerSuggestions([]);
          setShowCustomerDropdown(false);
        }
      } catch (err) {
        console.error('Error searching customers:', err);
        setCustomerSuggestions([]);
        setShowCustomerDropdown(false);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    const timer = setTimeout(() => {
      searchCustomers();
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.customerName]);

  // Update customer dropdown position
  useEffect(() => {
    const updatePosition = () => {
      if (customerInputRef.current && showCustomerDropdown) {
        const rect = customerInputRef.current.getBoundingClientRect();
        setCustomerDropdownPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    };

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    updatePosition();

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [showCustomerDropdown]);

  // Close dropdown when clicking outside
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle item code change and fetch product details
  const handleItemCodeChange = async (e) => {
    const itemCode = e.target.value;
    setFormData(prev => ({
      ...prev,
      itemCode: itemCode
    }));

    if (itemCode && itemCode.trim() !== '') {
      setIsFetchingProduct(true);
      setError('');
      try {
        const response = await productsAPI.getByItemCode(itemCode.trim());
        if (response.success && response.product) {
          const product = response.product;
          setFormData(prev => ({
            ...prev,
            itemCode: itemCode.trim(),
            category: product.category || '',
            productName: product.product_name || '',
            brandName: product.brand_name || product.supplier_name || '',
            serialNumber: product.serial_number || product.sku_code || ''
          }));
        } else {
          setError('Product not found with this item code');
          setFormData(prev => ({
            ...prev,
            category: '',
            brandName: '',
            productName: '',
            serialNumber: ''
          }));
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Product not found with this item code');
        setFormData(prev => ({
          ...prev,
          category: '',
          brandName: '',
          productName: '',
          serialNumber: ''
        }));
      } finally {
        setIsFetchingProduct(false);
      }
    } else {
      // Clear fields if item code is empty
      setFormData(prev => ({
        ...prev,
        category: '',
        brandName: '',
        productName: '',
        serialNumber: ''
      }));
    }
  };

  // Handle handler name change and fetch phone
  const handleHandlerChange = (e) => {
    const handlerId = e.target.value;
    if (handlerId) {
      const selectedHandler = handlers.find(h => h.id === parseInt(handlerId));
      if (selectedHandler) {
        console.log('Handler selected - ID:', handlerId, 'Name:', selectedHandler.name);
        setFormData(prev => ({
          ...prev,
          handlerId: handlerId,
          handlerName: selectedHandler.name
        }));
      } else {
        console.warn('Handler not found for ID:', handlerId);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        handlerId: '',
        handlerName: ''
      }));
    }
  };

  const submitService = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const createdBy = userData.username || userData.email || 'system';

      const serviceData = {
        customerName: formData.customerName,
        warranty: formData.warrantyStatus === 'Warranty',
        unwarranty: formData.warrantyStatus === 'Unwarranty',
        productName: formData.productName || formData.product || null,
        brandName: formData.brandName || null,
        serialNumber: formData.serialNumber || null,
        serviceDate: formData.estimatedDate || formData.serviceDate,
        handlerId: formData.handlerId ? parseInt(formData.handlerId) : null,
        handlerName: formData.handlerName || null,
        handlerPhone: null,
        productComplaint: formData.productComplaint || null,
        amountEstimated: formData.amountEstimated ? parseFloat(formData.amountEstimated) : null,
        estimatedDate: formData.estimatedDate || null,
        createdBy: createdBy
      };
      
      console.log('Creating service with handler - ID:', serviceData.handlerId, 'Name:', serviceData.handlerName);
      
      const response = await servicesAPI.create(serviceData);

      if (response.success) {
        setSuccessMessage('Service created successfully');
        // Dispatch event to notify Services page to refresh
        window.dispatchEvent(new CustomEvent('serviceCreated'));
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      } else {
        setError(response.error || 'Failed to create service. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create service. Please try again.');
      console.error('Create service error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to create this service?',
      onConfirm: submitService,
    });
  };

  return (
    <>
      {/* Left Sidebar Navigation */}
        <div className="add-user-container">
          {/* Header */}
          <header className="add-user-header">
            <button className="back-btn" onClick={handleBack}>
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="header-content">
              <h1 className="page-title">Create Service</h1>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
              {/* First Row: Customer Name, Phone Number, Warranty, Item Code (Warranty) or Product (Unwarranty) */}
              <div className="form-grid four-col">
                <div className="form-group">
                  <label htmlFor="customerName">Customer Name *</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <i className="fas fa-user input-icon"></i>
                    <input
                      ref={customerInputRef}
                      type="text"
                      id="customerName"
                      name="customerName"
                      className="form-input"
                      placeholder="Type customer name to search..."
                      value={formData.customerName}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (formData.customerName.trim().length > 0 && customerSuggestions.length > 0) {
                          setShowCustomerDropdown(true);
                        }
                      }}
                      required
                      autoComplete="off"
                    />
                    {isLoadingCustomers && (
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
                {/* Customer Dropdown using Portal */}
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
                        key={customer.id || index}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            customerName: customer.full_name || customer.name || '',
                            customerPhone: customer.phone || customer.customer_phone || prev.customerPhone
                          }));
                          setShowCustomerDropdown(false);
                          setCustomerVerified(true);
                        }}
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
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                          {customer.full_name || customer.name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {customer.phone || customer.customer_phone || ''} {customer.customer_unique_id ? `(${customer.customer_unique_id})` : ''}
                        </div>
                      </div>
                    ))}
                  </div>,
                  document.body
                )}

                <div className="form-group">
                  <label htmlFor="customerPhone">Phone Number or Customer ID</label>
                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <i className="fas fa-phone input-icon"></i>
                    <input
                      type="text"
                      id="customerPhone"
                      name="customerPhone"
                      className="form-input"
                      placeholder="Enter phone number or Customer ID (e.g., C-1234)"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      style={{
                        paddingRight: customerVerified || isFetchingCustomer ? '40px' : '18px',
                        borderColor: customerVerified ? '#28a745' : undefined
                      }}
                    />
                    {isFetchingCustomer && (
                      <i className="fas fa-spinner fa-spin" style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#666' 
                      }}></i>
                    )}
                    {!isFetchingCustomer && customerVerified && (
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
                  <label htmlFor="warrantyStatus">Warranty *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-shield-alt input-icon"></i>
                    <select
                      id="warrantyStatus"
                      name="warrantyStatus"
                      className="form-input"
                      value={formData.warrantyStatus}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Clear fields when warranty status changes
                        if (e.target.value === 'Warranty') {
                          setFormData(prev => ({
                            ...prev,
                            warrantyStatus: e.target.value,
                            product: '',
                            productComplaint: '',
                            estimatedDate: ''
                          }));
                        } else if (e.target.value === 'Unwarranty') {
                          setFormData(prev => ({
                            ...prev,
                            warrantyStatus: e.target.value,
                            itemCode: '',
                            category: '',
                            productName: '',
                            brandName: '',
                            serialNumber: '',
                            handlerId: '',
                            handlerName: ''
                          }));
                        }
                      }}
                      required
                      style={{ paddingLeft: '50px', appearance: 'auto', cursor: 'pointer' }}
                    >
                      <option value="">Select warranty status</option>
                      <option value="Warranty">Warranty</option>
                      <option value="Unwarranty">Unwarranty</option>
                    </select>
                    <i className="fas fa-chevron-down dropdown-icon"></i>
                  </div>
                </div>

                {formData.warrantyStatus === 'Warranty' && (
                  <div className="form-group">
                    <label htmlFor="productName">Product Name</label>
                    <div className="input-wrapper">
                      <i className="fas fa-box input-icon"></i>
                      <input
                        type="text"
                        id="productName"
                        name="productName"
                        className="form-input"
                        placeholder="Enter product name"
                        value={formData.productName}
                        onChange={handleInputChange}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {formData.warrantyStatus === 'Unwarranty' && (
                  <div className="form-group">
                    <label htmlFor="product">Product *</label>
                    <div className="input-wrapper">
                      <i className="fas fa-box input-icon"></i>
                      <input
                        type="text"
                        id="product"
                        name="product"
                        className="form-input"
                        placeholder="Enter product name"
                        value={formData.product}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Conditional Fields based on Warranty Status */}
              {formData.warrantyStatus === 'Warranty' && (
                <div className="form-grid four-col" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="serialNumber">Serial Number</label>
                    <div className="input-wrapper">
                      <i className="fas fa-hashtag input-icon"></i>
                      <input
                        type="text"
                        id="serialNumber"
                        name="serialNumber"
                        className="form-input"
                        placeholder="Enter serial number"
                        value={formData.serialNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="productComplaint">Product Complaint</label>
                    <div className="input-wrapper">
                      <i className="fas fa-comment-alt input-icon"></i>
                      <input
                        type="text"
                        id="productComplaint"
                        name="productComplaint"
                        className="form-input"
                        placeholder="Enter product complaint"
                        value={formData.productComplaint}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="amountEstimated">Amount Estimated</label>
                    <div className="input-wrapper">
                      <i className="fas fa-rupee-sign input-icon"></i>
                      <input
                        type="number"
                        id="amountEstimated"
                        name="amountEstimated"
                        className="form-input"
                        placeholder="Enter estimated amount"
                        value={formData.amountEstimated}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="handlerName">Handler Name</label>
                    <div className="input-wrapper">
                      <i className="fas fa-user-tie input-icon"></i>
                      <select
                        id="handlerName"
                        name="handlerName"
                        className="form-input"
                        value={formData.handlerId}
                        onChange={handleHandlerChange}
                        style={{ paddingLeft: '50px', appearance: 'auto', cursor: 'pointer' }}
                      >
                        <option value="">Select handler</option>
                        {handlers.map((handler) => (
                          <option key={handler.id} value={handler.id}>
                            {handler.name}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-chevron-down dropdown-icon"></i>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="estimatedDate">Estimate Date</label>
                    <div className="input-wrapper">
                      <i className="fas fa-calendar input-icon"></i>
                      <input
                        type="date"
                        id="estimatedDate"
                        name="estimatedDate"
                        className="form-input"
                        value={formData.estimatedDate}
                        onChange={handleInputChange}
                        min={minServiceDate}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.warrantyStatus === 'Unwarranty' && (
                <div className="form-grid four-col" style={{ marginTop: '12px' }}>
                  <div className="form-group">
                    <label htmlFor="productComplaint">Product Complaint *</label>
                    <div className="input-wrapper">
                      <i className="fas fa-comment-alt input-icon"></i>
                      <input
                        type="text"
                        id="productComplaint"
                        name="productComplaint"
                        className="form-input"
                        placeholder="Enter product complaint"
                        value={formData.productComplaint}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="amountEstimated">Amount Estimated *</label>
                    <div className="input-wrapper">
                      <i className="fas fa-rupee-sign input-icon"></i>
                      <input
                        type="number"
                        id="amountEstimated"
                        name="amountEstimated"
                        className="form-input"
                        placeholder="Enter estimated amount"
                        value={formData.amountEstimated}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="estimatedDate">Estimated Date *</label>
                    <div className="input-wrapper">
                      <i className="fas fa-calendar input-icon"></i>
                      <input
                        type="date"
                        id="estimatedDate"
                        name="estimatedDate"
                        className="form-input"
                        value={formData.estimatedDate}
                        onChange={handleInputChange}
                        min={minServiceDate}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}


              <Toast message={error} type="error" onClose={() => setError('')} />
              <Toast message={successMessage} type="success" onClose={() => setSuccessMessage('')} />

              {/* Action Buttons */}
              <div className="form-actions">
                <button type="submit" className="create-user-btn" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Service'}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCancel}>
                  Cancel and go back
                </button>
              </div>
            </form>
          </main>
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
    </>
  );
};

export default AddService;

