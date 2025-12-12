import React, { useState } from 'react';
import { customersAPI, productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddCustomer = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    email: '',
    itemCode: '',
    quantity: '',
    mrp: '',
    sellRate: '',
    discount: '',
    paymentMode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });
  const [productStock, setProductStock] = useState(null); // Store available stock

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('customers');
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

  const handleProducts = () => {
    if (onNavigate) {
      onNavigate('products');
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
      onNavigate('customers');
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
    
    // Reset product stock if item code changes
    if (name === 'itemCode') {
      setProductStock(null);
    }
  };

  const handleItemCodeKeyPress = async (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.preventDefault();
      e.stopPropagation();
      const itemCode = formData.itemCode.trim();
      if (itemCode) {
        await fetchProductByItemCode(itemCode);
      } else {
        setError('Please enter an item code');
      }
    }
  };

  const fetchProductByItemCode = async (itemCode) => {
    if (!itemCode || !itemCode.trim()) {
      setError('Please enter a valid item code');
      return;
    }
    
    setIsFetchingProduct(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const response = await productsAPI.getByItemCode(itemCode.trim());
      
      if (response.success && response.product) {
        const product = response.product;
        // Handle both snake_case and camelCase field names from database
        const mrp = product.mrp || '';
        const discount = product.discount || '0';
        const sellRate = product.sell_rate || product.sellRate || '';
        const availableStock = product.current_quantity || product.currentQuantity || 0;
        
        setFormData(prev => ({
          ...prev,
          mrp: mrp ? String(mrp) : '',
          discount: discount ? String(discount) : '0',
          sellRate: sellRate ? String(sellRate) : ''
        }));
        
        // Store available stock for validation
        setProductStock(parseInt(availableStock));
        
        setSuccessMessage(`Product details fetched successfully! MRP, Discount, and Sell Rate have been auto-filled. Available stock: ${availableStock}`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setError('Product not found with this item code');
        setProductStock(null);
        // Clear pricing fields if product not found
        setFormData(prev => ({
          ...prev,
          mrp: '',
          discount: '',
          sellRate: ''
        }));
      }
    } catch (err) {
      console.error('Fetch product error:', err);
      setError(err.message || 'Product not found with this item code. Please check the item code and try again.');
      // Clear pricing fields if product not found
      setFormData(prev => ({
        ...prev,
        mrp: '',
        discount: '',
        sellRate: ''
      }));
      setProductStock(null);
    } finally {
      setIsFetchingProduct(false);
    }
  };

  const submitCustomer = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Validate stock availability if item code and quantity are provided
    if (formData.itemCode && formData.quantity) {
      const requestedQuantity = parseInt(formData.quantity) || 0;
      if (requestedQuantity > 0 && productStock !== null) {
        if (requestedQuantity > productStock) {
          setError(`Insufficient stock! Available: ${productStock}, Requested: ${requestedQuantity}`);
          setIsLoading(false);
          return;
        }
      }
    }

    try {
      const response = await customersAPI.create({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        itemCode: formData.itemCode,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        sellRate: formData.sellRate ? parseFloat(formData.sellRate) : null,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        paymentMode: formData.paymentMode
      });

      if (response.success) {
        // Use backend message if available, otherwise default message
        const message = response.message || 'Save changes are done';
        setSuccessMessage(message);
        // Update product stock if quantity was purchased
        if (formData.itemCode && formData.quantity && productStock !== null) {
          const purchasedQty = parseInt(formData.quantity) || 0;
          setProductStock(Math.max(0, productStock - purchasedQty));
        }
        // Clear success message and navigate after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create customer. Please try again.');
      console.error('Create customer error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitCustomer,
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
          <span>Managers</span>
        </div>
        <div className="nav-item" onClick={handleProducts}>
          <div className="nav-icon">
            <i className="fas fa-box"></i>
          </div>
          <span>Products</span>
        </div>
        <div className="nav-item" onClick={handleHome}>
          <div className="nav-icon">
            <i className="fas fa-store"></i>
          </div>
          <span>Stores</span>
        </div>
        <div className="nav-item" onClick={handleHome}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item active" onClick={handleCustomers}>
          <div className="nav-icon">
            <i className="fas fa-user-friends"></i>
          </div>
          <span>Customers</span>
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
              <h1 className="page-title">Add Customer</h1>
              <p className="page-subtitle">Create a new customer for this store.</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            {/* Photo Upload */}
            <div className="photo-upload-section">
              <div className="photo-placeholder">
                <i className="fas fa-camera"></i>
              </div>
              <button type="button" className="upload-photo-btn">
                <i className="fas fa-camera"></i>
                <span>Upload photo</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Customer Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Customer details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="fullName">Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-input"
                        placeholder="Enter full name."
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Contact number</label>
                      <div className="input-wrapper">
                        <i className="fas fa-phone input-icon"></i>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="form-input"
                          placeholder="Enter contact number."
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
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="form-section">
                  <h3 className="section-title">Address</h3>
                  
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <div className="input-wrapper">
                      <i className="fas fa-map-marker-alt input-icon"></i>
                      <textarea
                        id="address"
                        name="address"
                        className="form-input textarea-input"
                        placeholder="Street, area, city&#10;State, pincode"
                        rows="2"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Product Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Product details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="itemCode">Item code {isFetchingProduct && <span style={{ color: '#dc3545', fontSize: '12px' }}>(Fetching...)</span>}</label>
                      <div className="input-wrapper">
                        <i className="fas fa-barcode input-icon"></i>
                        <input
                          type="text"
                          id="itemCode"
                          name="itemCode"
                          className="form-input"
                          placeholder="Enter item code and press Enter"
                          value={formData.itemCode}
                          onChange={handleInputChange}
                          onKeyDown={handleItemCodeKeyPress}
                          disabled={isFetchingProduct}
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="quantity">
                        Quantity
                        {productStock !== null && (
                          <span style={{ 
                            marginLeft: '8px', 
                            fontSize: '12px', 
                            fontWeight: 'normal',
                            color: productStock > 0 ? '#28a745' : '#dc3545'
                          }}>
                            (Available: {productStock})
                          </span>
                        )}
                      </label>
                      <div className="input-wrapper">
                        <i className="fas fa-cubes input-icon"></i>
                        <input
                          type="number"
                          id="quantity"
                          name="quantity"
                          className="form-input"
                          placeholder="Enter quantity."
                          value={formData.quantity}
                          onChange={handleInputChange}
                          min="0"
                          max={productStock !== null ? productStock : undefined}
                        />
                      </div>
                      {productStock !== null && formData.quantity && parseInt(formData.quantity) > productStock && (
                        <div style={{ 
                          marginTop: '4px', 
                          fontSize: '12px', 
                          color: '#dc3545' 
                        }}>
                          <i className="fas fa-exclamation-triangle"></i> Insufficient stock! Available: {productStock}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="mrp">MRP</label>
                      <div className="input-wrapper">
                        <i className="fas fa-rupee-sign input-icon"></i>
                        <input
                          type="number"
                          id="mrp"
                          name="mrp"
                          className="form-input"
                          placeholder="Enter MRP."
                          value={formData.mrp}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="sellRate">Sell rate</label>
                      <div className="input-wrapper">
                        <i className="fas fa-tag input-icon"></i>
                        <input
                          type="number"
                          id="sellRate"
                          name="sellRate"
                          className="form-input"
                          placeholder="Enter sell rate."
                          value={formData.sellRate}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="discount">Discount</label>
                      <div className="input-wrapper">
                        <i className="fas fa-percent input-icon"></i>
                        <input
                          type="number"
                          id="discount"
                          name="discount"
                          className="form-input"
                          placeholder="Enter discount."
                          value={formData.discount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="paymentMode">Payment mode</label>
                      <div className="input-wrapper">
                        <i className="fas fa-credit-card input-icon"></i>
                        <select
                          id="paymentMode"
                          name="paymentMode"
                          className="form-input"
                          value={formData.paymentMode}
                          onChange={handleInputChange}
                        >
                          <option value="">Select payment mode.</option>
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
                </div>

                {/* Warning Message */}
                <p className="form-warning">
                  Make sure all customer details are correct before saving.
                </p>

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
                    {isLoading ? 'Creating...' : 'Create Customer'}
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

export default AddCustomer;

