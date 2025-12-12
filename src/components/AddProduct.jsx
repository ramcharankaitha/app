import React, { useState } from 'react';
import { productsAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

const AddProduct = ({ onBack, onCancel, onNavigate }) => {
  const [formData, setFormData] = useState({
    productName: '',
    itemCode: '',
    skuCode: '',
    minQuantity: '',
    currentQuantity: '',
    supplierName: '',
    category: '',
    mrp: '',
    discount: '',
    sellRate: '',
    image: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmState, setConfirmState] = useState({ open: false, message: '', onConfirm: null });

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('products');
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
      onNavigate('products');
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

  const calculateSellRate = () => {
    const mrp = parseFloat(formData.mrp);
    const discount = parseFloat(formData.discount) || 0;
    
    if (mrp && mrp > 0) {
      // Calculate: Sell Rate = MRP - (MRP * discount / 100)
      const discountAmount = (mrp * discount) / 100;
      const sellRate = mrp - discountAmount;
      
      setFormData(prev => ({
        ...prev,
        sellRate: sellRate.toFixed(2)
      }));
    }
  };

  const handlePricingKeyPress = (e, fieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (fieldName === 'mrp' || fieldName === 'discount') {
        // If MRP or discount is entered, calculate sell rate
        if (formData.mrp && formData.discount) {
          calculateSellRate();
        } else if (fieldName === 'mrp' && formData.mrp) {
          // If only MRP is entered, set sell rate = MRP (no discount)
          setFormData(prev => ({
            ...prev,
            sellRate: parseFloat(prev.mrp).toFixed(2)
          }));
        }
      }
    }
  };

  const submitProduct = async () => {
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await productsAPI.create({
        productName: formData.productName,
        itemCode: formData.itemCode,
        skuCode: formData.skuCode,
        minimumQuantity: parseInt(formData.minQuantity) || 0,
        currentQuantity: parseInt(formData.currentQuantity) || 0,
        supplierName: formData.supplierName,
        category: formData.category,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        sellRate: formData.sellRate ? parseFloat(formData.sellRate) : null
      });

      if (response.success) {
        setSuccessMessage('Save changes are done');
        // Clear success message and navigate after 2 seconds
        setTimeout(() => {
          setSuccessMessage('');
          handleCancel();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create product. Please try again.');
      console.error('Create product error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmState({
      open: true,
      message: 'Are you sure you want to submit?',
      onConfirm: submitProduct,
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
        <div className="nav-item active" onClick={handleProducts}>
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
        <div className="nav-item" onClick={handleStaff}>
          <div className="nav-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <span>Staff</span>
        </div>
        <div className="nav-item" onClick={handleCustomers}>
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
              <h1 className="page-title">Add New Product</h1>
              <p className="page-subtitle">Create an item for your store</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="add-user-content">
            <form onSubmit={handleSubmit} className="add-user-form">
                {/* Product Details Section */} 
                <div className="form-section">
                  <h3 className="section-title">Product details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="productName">Product Name</label>
                      <div className="input-wrapper">
                        <i className="fas fa-tag input-icon"></i>
                        <input
                          type="text"
                          id="productName"
                          name="productName"
                          className="form-input"
                          placeholder="e.g., Classic Basmati Rice"
                          value={formData.productName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="itemCode">Item Code</label>
                      <div className="input-wrapper">
                        <i className="fas fa-barcode input-icon"></i>
                        <input
                          type="text"
                          id="itemCode"
                          name="itemCode"
                          className="form-input"
                          placeholder="e.g., ITM-0983"
                          value={formData.itemCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="skuCode">SKU Code</label>
                      <div className="input-wrapper">
                        <i className="fas fa-boxes input-icon"></i>
                        <input
                          type="text"
                          id="skuCode"
                          name="skuCode"
                          className="form-input"
                          placeholder="e.g., SKU-44355"
                          value={formData.skuCode}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="minQuantity">Minimum quantity</label>
                      <div className="input-wrapper">
                        <i className="fas fa-sort-amount-up input-icon"></i>
                        <input
                          type="number"
                          id="minQuantity"
                          name="minQuantity"
                          className="form-input"
                          placeholder="e.g., 50 units"
                          value={formData.minQuantity}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="currentQuantity">Current quantity</label>
                      <div className="input-wrapper">
                        <i className="fas fa-cubes input-icon"></i>
                        <input
                          type="number"
                          id="currentQuantity"
                          name="currentQuantity"
                          className="form-input"
                          placeholder="e.g., 100 units"
                          value={formData.currentQuantity}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="supplierName">Supplier Name</label>
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
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="category">Category</label>
                      <div className="input-wrapper">
                        <i className="fas fa-th-large input-icon"></i>
                        <select
                          id="category"
                          name="category"
                          className="form-input"
                          value={formData.category}
                          onChange={handleInputChange}
                        >
                          <option value="">Select category</option>
                          <option value="Category 1">Category 1</option>
                          <option value="Category 2">Category 2</option>
                          <option value="Category 3">Category 3</option>
                          <option value="Category 4">Category 4</option>
                          <option value="Category 5">Category 5</option>
                        </select>
                        <i className="fas fa-chevron-down dropdown-icon"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Details Section */}
                <div className="form-section">
                  <h3 className="section-title">Pricing details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="mrp">MRP</label>
                      <div className="input-wrapper">
                        <i className="fas fa-rupee-sign input-icon"></i>
                        <input
                          type="number"
                          id="mrp"
                          name="mrp"
                          className="form-input"
                          placeholder="Enter MRP and press Enter"
                          value={formData.mrp}
                          onChange={handleInputChange}
                          onKeyPress={(e) => handlePricingKeyPress(e, 'mrp')}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="discount">Discount (%)</label>
                      <div className="input-wrapper">
                        <i className="fas fa-percent input-icon"></i>
                        <input
                          type="number"
                          id="discount"
                          name="discount"
                          className="form-input"
                          placeholder="Enter discount % and press Enter"
                          value={formData.discount}
                          onChange={handleInputChange}
                          onKeyPress={(e) => handlePricingKeyPress(e, 'discount')}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="sellRate">Sell rate <span style={{ fontSize: '11px', color: '#666', fontWeight: 'normal' }}>(Auto-calculated)</span></label>
                      <div className="input-wrapper">
                        <i className="fas fa-tag input-icon"></i>
                        <input
                          type="number"
                          id="sellRate"
                          name="sellRate"
                          className="form-input"
                          placeholder="Auto-calculated from MRP & discount"
                          value={formData.sellRate}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Upload Section */}
                <div className="form-section">
                  <h3 className="section-title">Product image (optional)</h3>
                  <div className="upload-placeholder">
                    <i className="fas fa-plus"></i>
                    <span>Tap to upload image</span>
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
                    {isLoading ? 'Adding...' : 'Add Product'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancel
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

export default AddProduct;

