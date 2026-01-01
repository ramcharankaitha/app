import React, { useState, useEffect } from 'react';
import { productsAPI, staffAPI, servicesAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
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
    estimatedDate: ''
  });
  const [handlers, setHandlers] = useState([]);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [minServiceDate] = useState(getTomorrowDate());

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
  };


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
        setFormData(prev => ({
          ...prev,
          handlerId: handlerId,
          handlerName: selectedHandler.name
        }));
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

      const response = await servicesAPI.create({
        customerName: formData.customerName,
        warranty: formData.warrantyStatus === 'Warranty',
        unwarranty: formData.warrantyStatus === 'Unwarranty',
        itemCode: formData.itemCode || null,
        brandName: formData.brandName || null,
        productName: formData.productName || formData.product || null,
        serialNumber: formData.serialNumber || null,
        serviceDate: formData.estimatedDate || formData.serviceDate,
        handlerId: formData.handlerId ? parseInt(formData.handlerId) : null,
        handlerName: formData.handlerName || null,
        handlerPhone: null,
        productComplaint: formData.productComplaint || null,
        estimatedDate: formData.estimatedDate || null,
        createdBy: createdBy
      });

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
        {userRole !== 'staff' && (
          <div className="nav-item" onClick={handleStaff}>
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
              <h1 className="page-title">Create Service</h1>
              <p className="page-subtitle">Add a new service to the system.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
              {/* First Row: Customer Name, Phone Number, Warranty, Item Code (Warranty) or Product (Unwarranty) */}
              <div className="form-grid four-col">
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

                <div className="form-group">
                  <label htmlFor="customerPhone">Phone Number</label>
                  <div className="input-wrapper">
                    <i className="fas fa-phone input-icon"></i>
                    <input
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      className="form-input"
                      placeholder="Enter phone number"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                    />
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
                    <label htmlFor="itemCode">Item Code *</label>
                    <div className="input-wrapper">
                      <i className="fas fa-barcode input-icon"></i>
                      <input
                        type="text"
                        id="itemCode"
                        name="itemCode"
                        className="form-input"
                        placeholder="Enter item code"
                        value={formData.itemCode}
                        onChange={handleItemCodeChange}
                        required
                        disabled={isFetchingProduct}
                      />
                      {isFetchingProduct && (
                        <i className="fas fa-spinner fa-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}></i>
                      )}
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
                    <label htmlFor="serialNumber">Serial Number *</label>
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
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="handlerName">Handler Name *</label>
                    <div className="input-wrapper">
                      <i className="fas fa-user-tie input-icon"></i>
                      <select
                        id="handlerName"
                        name="handlerName"
                        className="form-input"
                        value={formData.handlerId}
                        onChange={handleHandlerChange}
                        required
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
                    <label htmlFor="estimatedDate">Estimate Date *</label>
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
                  {isLoading ? 'Creating...' : 'Create Service'}
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

export default AddService;

